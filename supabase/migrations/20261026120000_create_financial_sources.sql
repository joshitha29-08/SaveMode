-- STEP 1 — Table, columns, basic checks, Rule 3 (type-specific checks)
create table public.financial_sources (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  type            text not null,
  name            text not null,
  opening_amount  numeric(14,2) not null,
  current_amount  numeric(14,2) not null default 0,
  credit_limit    numeric(14,2),
  is_archived     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- allowed types (wallet is a later feature)
  constraint fs_type_valid check (type in ('bank', 'cash', 'card')),

  -- name: 1–30 characters after trimming spaces
  constraint fs_name_length check (char_length(btrim(name)) between 1 and 30),

  -- Rule 3: cash and card opening amount must be >= 0; bank may be negative
  constraint fs_cash_opening_nonneg check (type <> 'cash' or opening_amount >= 0),
  constraint fs_card_opening_nonneg check (type <> 'card' or opening_amount >= 0),

  -- Rule 3: card needs a limit > 0; bank/cash must not have one
  -- (no check on current_amount vs limit: over-limit is allowed)
  constraint fs_card_limit_required check (
    type <> 'card' or (credit_limit is not null and credit_limit > 0)
  ),
  constraint fs_limit_only_for_card check (type = 'card' or credit_limit is null),

  -- lets user_settings.last_source_id use a same-user foreign key later
  constraint fs_id_user_unique unique (id, user_id)
);

-- STEP 2 — Rule 1: unique name per user, case-insensitive, archived included
create unique index financial_sources_user_name_uniq
  on public.financial_sources (user_id, lower(name));

create index financial_sources_user_idx
  on public.financial_sources (user_id);

-- STEP 3 — Rule 4 (max 50) + start balance on insert
create or replace function public.fs_before_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- serialize concurrent inserts for the same user
  perform pg_advisory_xact_lock(hashtextextended('financial_sources:' || new.user_id::text, 0));

  if (select count(*) from public.financial_sources where user_id = new.user_id) >= 50 then
    raise exception 'Maximum of 50 financial sources reached'
      using errcode = 'check_violation';
  end if;

  -- balance starts at opening amount; client-supplied value is ignored
  new.current_amount := new.opening_amount;
  return new;
end;
$$;

create trigger trg_fs_before_insert
  before insert on public.financial_sources
  for each row execute function public.fs_before_insert();

-- STEP 4 — Rule 2 (type immutable) + Rule 5 (balance protection) + updated_at
create or replace function public.fs_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.type is distinct from old.type then
    raise exception 'Source type cannot be changed'
      using errcode = 'check_violation';
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'Source owner cannot be changed'
      using errcode = 'check_violation';
  end if;

  -- Normal app roles cannot touch the balance.
  -- The balance engine must be a SECURITY DEFINER function (runs as owner),
  -- so current_user will not be 'authenticated' or 'anon' inside it.
  if new.current_amount is distinct from old.current_amount
     and current_user in ('authenticated', 'anon') then
    raise exception 'current_amount can only be changed by the balance engine'
      using errcode = 'insufficient_privilege';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_fs_before_update
  before update on public.financial_sources
  for each row execute function public.fs_before_update();

-- STEP 5 — Security: each user sees and edits only their own sources
alter table public.financial_sources enable row level security;

create policy fs_select_own on public.financial_sources
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy fs_insert_own on public.financial_sources
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy fs_update_own on public.financial_sources
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy fs_delete_own on public.financial_sources
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Rule 6 (deletion restricted) is added in the transactions migration:
--   source_id    uuid not null references public.financial_sources(id) on delete restrict
--   to_source_id uuid          references public.financial_sources(id) on delete restrict