# SaveMode

SaveMode is a privacy-focused personal expense management application.

## How to Run

1. Clone the repository:
   git clone https://github.com/joshitha29-08/SaveMode.git
2. Open the project folder:
     cd Savemode

## Folder Overview
web/ – Web application files
mobile/ – Mobile application files
shared/ – Shared resources
db/ – Database-related files
docs/ – Project documentation


## Supabase Configuration

SaveMode uses Supabase for its backend and database.

### How to Get Supabase Keys

1. Ask the WPT project administrator to grant you access to the SaveMode Supabase project using your individual account.
2. Open the Supabase Dashboard and select the SaveMode project.
3. Get the Project URL and Public Key from the project's API settings.
4. Create a local .env file in the project root, using .env.example as a reference.
5. Add the Project URL and Public Key to your local .env file.

### Environment Variables

Add the following variables to your local .env file:

- EXPO_PUBLIC_SUPABASE_URL — Your Supabase Project URL.
- EXPO_PUBLIC_SUPABASE_ANON_KEY — Your Supabase public client key.

Use the variable names specified in .env.example.

### Security Guidelines

- Never commit the .env file or actual keys to GitHub.
- Never use the Supabase Secret Key or service_role key in the client application.
- Keep .env.example limited to placeholder values.
- Use only the approved public client key in the application.
