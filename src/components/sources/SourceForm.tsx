import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Switch,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../lib/theme';
import { useSafeSave } from '../../lib/useSafeSave';
import { useSession } from '../../lib/session';
import { supabase } from '../../lib/supabase';
import { generateUUID } from '../../lib/uuid';
import { t } from '../../i18n';
import { formatAmount, cleanPastedAmount } from '../../lib/money';
import ConfirmSheet from '../ui/ConfirmSheet';
import InlineError from '../ui/InlineError';
import { Colors } from '../../constants/colors';

const MAX_SOURCES = 50;

export type SourceType = 'bank' | 'cash' | 'card';

export type SourceItem = {
  id: string;
  type: SourceType;
  name: string;
  opening_amount: number;
  current_amount: number;
  credit_limit: number | null;
  is_archived: boolean;
  has_transactions?: boolean;
};

const createSourceSchema = (
  existingSources: { id?: string; name: string }[],
  currentId?: string,
) =>
  z.object({
    type: z.enum(['bank', 'cash', 'card']),
    name: z
      .string()
      .trim()
      .min(1, 'Please enter a source name.')
      .max(30, 'Source name cannot exceed 30 characters.')
      .refine(
        (val) => {
          const lower = val.trim().toLowerCase();
          return !existingSources.some(
            (s) => s.id !== currentId && s.name.trim().toLowerCase() === lower,
          );
        },
        { message: t('err.name.duplicate.source') },
      ),
    openingAmount: z.string().min(1, t('err.amount.invalid')),
    isOverdrawn: z.boolean(),
    creditLimit: z.string().optional(),
  });

type FormValues = {
  type: SourceType;
  name: string;
  openingAmount: string;
  isOverdrawn: boolean;
  creditLimit?: string;
};

type SourceFormProps = {
  initialSource?: SourceItem | null;
  existingSources: { id?: string; name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
};

export default function SourceForm({
  initialSource,
  existingSources,
  onSuccess,
  onCancel,
}: SourceFormProps) {
  const isEditing = !!initialSource;
  const { isDark } = useAppTheme();
  const { currencyCode } = useSession();
  const { save, isSaving, isOnline, errorMessage, clearError } = useSafeSave();

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [formError, setFormError] = useState('');

  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const subtextColor = isDark ? '#A1A1AA' : '#64748B';
  const cardColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const inputBorder = isDark ? '#3F3F46' : '#CBD5E1';
  const inputBg = isDark ? '#27272A' : '#F8FAFC';

  const defaultValues: FormValues = useMemo(() => {
    if (initialSource) {
      const isBankOverdrawn =
        initialSource.type === 'bank' && initialSource.opening_amount < 0;
      return {
        type: initialSource.type,
        name: initialSource.name,
        openingAmount: String(Math.abs(initialSource.opening_amount)),
        isOverdrawn: isBankOverdrawn,
        creditLimit:
          initialSource.credit_limit !== null
            ? String(initialSource.credit_limit)
            : '',
      };
    }
    return {
      type: 'bank',
      name: '',
      openingAmount: '0',
      isOverdrawn: false,
      creditLimit: '',
    };
  }, [initialSource]);

  const schema = useMemo(
    () => createSourceSchema(existingSources, initialSource?.id),
    [existingSources, initialSource?.id],
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  const selectedType = useWatch({ control, name: 'type' });
  const watchedName = useWatch({ control, name: 'name' });
  const watchedOpening = useWatch({ control, name: 'openingAmount' });
  const watchedOverdrawn = useWatch({ control, name: 'isOverdrawn' });
  const watchedCreditLimit = useWatch({ control, name: 'creditLimit' });

  const helperExample =
    selectedType === 'bank'
      ? 'e.g. SBI Savings, HDFC Salary'
      : selectedType === 'card'
        ? 'e.g. ICICI Amazon Pay card'
        : 'e.g. Wallet cash';

  const handleAmountInput = (
    val: string,
    field: 'openingAmount' | 'creditLimit',
  ) => {
    clearError();
    setFormError('');

    // Check if pasted with symbols or codes
    if (/[₹$,a-zA-Z]/.test(val)) {
      const cleaned = cleanPastedAmount(val, currencyCode);
      if (cleaned !== null) {
        setValue(field, cleaned, { shouldValidate: true, shouldDirty: true });
        return;
      }
    }

    if (/^\d*\.?\d{0,2}$/.test(val) || val === '') {
      setValue(field, val, { shouldValidate: true, shouldDirty: true });
    }
  };

  const onSubmit = async (values: FormValues) => {
    setFormError('');
    clearError();

    // Custom validations per PRD
    const parsedAmount = Number(values.openingAmount);
    if (!Number.isFinite(parsedAmount)) {
      setFormError(t('err.amount.invalid'));
      return;
    }

    if (parsedAmount > 999999999.99) {
      setFormError(t('err.amount.max'));
      return;
    }

    if (values.type === 'cash' && parsedAmount < 0) {
      setFormError(t('err.cash.negative'));
      return;
    }

    let finalOpening = parsedAmount;
    if (values.type === 'bank' && values.isOverdrawn && parsedAmount > 0) {
      finalOpening = -parsedAmount;
    }

    let finalCreditLimit: number | null = null;
    if (values.type === 'card') {
      const parsedLimit = Number(values.creditLimit);
      if (
        !values.creditLimit ||
        !Number.isFinite(parsedLimit) ||
        parsedLimit <= 0
      ) {
        setFormError(t('err.limit.zero'));
        return;
      }
      if (parsedLimit > 999999999.99) {
        setFormError(t('err.amount.max'));
        return;
      }
      finalCreditLimit = parsedLimit;
    }

    // Check 50-source limit on add
    if (!isEditing && existingSources.length >= MAX_SOURCES) {
      setFormError(t('info.limit.sources'));
      return;
    }

    const success = await save(async () => {
      if (isEditing && initialSource) {
        const { error } = await supabase
          .from('financial_sources')
          .update({
            name: values.name.trim(),
            opening_amount: finalOpening,
            credit_limit: finalCreditLimit,
          })
          .eq('id', initialSource.id);

        return error;
      }

      const newId = generateUUID();
      const { error } = await supabase.from('financial_sources').insert({
        id: newId,
        type: values.type,
        name: values.name.trim(),
        opening_amount: finalOpening,
        credit_limit: finalCreditLimit,
      });

      return error;
    });

    if (success) {
      onSuccess();
    }
  };

  const handleCancelPress = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onCancel();
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.heading, { color: textColor }]}>
          {isEditing ? 'Edit Source' : 'Add Source'}
        </Text>

        {/* Read-only Current Balance at top when Editing (SRC-13) */}
        {isEditing && initialSource && (
          <View
            style={[
              styles.currentBalanceCard,
              { backgroundColor: isDark ? '#27272A' : '#F1F5F9' },
            ]}
          >
            <Text style={[styles.currentBalanceLabel, { color: subtextColor }]}>
              {initialSource.type === 'card'
                ? 'Current Outstanding (read-only)'
                : 'Current Balance (read-only)'}
            </Text>
            <Text
              style={[
                styles.currentBalanceValue,
                {
                  color:
                    initialSource.current_amount < 0
                      ? '#DC2626'
                      : Colors.primary,
                },
              ]}
            >
              {formatAmount(initialSource.current_amount, currencyCode)}
            </Text>
          </View>
        )}

        {/* Source Type Selector (SRC-01, SRC-13) */}
        <Text style={[styles.label, { color: textColor }]}>Source type</Text>
        {isEditing ? (
          <View style={styles.lockedTypeContainer}>
            <Text style={[styles.lockedTypeText, { color: textColor }]}>
              {selectedType === 'bank'
                ? 'Bank account'
                : selectedType === 'card'
                  ? 'Credit card'
                  : 'Cash'}
            </Text>
            <Text style={[styles.helperText, { color: subtextColor }]}>
              To change type, add a new source.
            </Text>
          </View>
        ) : (
          <View style={styles.typeSelector}>
            {(
              [
                { key: 'bank', label: 'Bank account', icon: 'bank' },
                { key: 'cash', label: 'Cash', icon: 'cash' },
                {
                  key: 'card',
                  label: 'Credit card',
                  icon: 'credit-card-outline',
                },
              ] as const
            ).map((item) => {
              const isSelected = selectedType === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => {
                    setValue('type', item.key, { shouldDirty: true });
                    clearError();
                    setFormError('');
                  }}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: isSelected ? Colors.primary : inputBg,
                      borderColor: isSelected ? Colors.primary : inputBorder,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={item.label}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={18}
                    color={isSelected ? '#FFFFFF' : textColor}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: isSelected ? '#FFFFFF' : textColor },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Source Name Field */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: textColor }]}>
              Source name
            </Text>
            {watchedName?.length >= 24 && (
              <Text style={[styles.counter, { color: subtextColor }]}>
                {watchedName.length}/30
              </Text>
            )}
          </View>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={(val) => {
                  onChange(val);
                  clearError();
                  setFormError('');
                }}
                maxLength={30}
                placeholder="Enter source name"
                placeholderTextColor={subtextColor}
                style={[
                  styles.input,
                  {
                    color: textColor,
                    borderColor: errors.name ? '#DC2626' : inputBorder,
                    backgroundColor: inputBg,
                  },
                ]}
                accessibilityLabel="Source name"
              />
            )}
          />
          <Text style={[styles.helperText, { color: subtextColor }]}>
            {helperExample}
          </Text>
          {errors.name && (
            <Text style={styles.fieldError}>{errors.name.message}</Text>
          )}
        </View>

        {/* Opening Balance / Outstanding Field */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>
            {isEditing
              ? selectedType === 'card'
                ? 'Opening outstanding (when added)'
                : 'Opening balance (when added)'
              : selectedType === 'card'
                ? 'Current outstanding'
                : 'Opening balance'}
          </Text>

          <Controller
            control={control}
            name="openingAmount"
            render={({ field: { value } }) => (
              <TextInput
                value={value}
                onChangeText={(val) => handleAmountInput(val, 'openingAmount')}
                placeholder="0.00"
                placeholderTextColor={subtextColor}
                keyboardType="decimal-pad"
                style={[
                  styles.input,
                  {
                    color: textColor,
                    borderColor: errors.openingAmount ? '#DC2626' : inputBorder,
                    backgroundColor: inputBg,
                  },
                ]}
                accessibilityLabel="Opening balance"
              />
            )}
          />

          {isEditing && (
            <Text style={[styles.helperText, { color: subtextColor }]}>
              Changing this updates the current balance by the same amount.
            </Text>
          )}

          {/* Overdrawn toggle for Bank Account (SRC-19) */}
          {selectedType === 'bank' && (
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: textColor }]}>
                This account is overdrawn
              </Text>
              <Controller
                control={control}
                name="isOverdrawn"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: inputBorder, true: Colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                )}
              />
            </View>
          )}

          {selectedType === 'bank' &&
            (watchedOverdrawn || Number(watchedOpening) < 0) && (
              <View style={styles.warningBox}>
                <InlineError
                  message={t('warn.bank.starts.negative')}
                  variant="warning"
                  isDark={isDark}
                />
              </View>
            )}

          {errors.openingAmount && (
            <Text style={styles.fieldError}>
              {errors.openingAmount.message}
            </Text>
          )}
        </View>

        {/* Credit Limit Field (Cards Only) */}
        {selectedType === 'card' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>
              Credit limit
            </Text>
            <Controller
              control={control}
              name="creditLimit"
              render={({ field: { value } }) => (
                <TextInput
                  value={value ?? ''}
                  onChangeText={(val) => handleAmountInput(val, 'creditLimit')}
                  placeholder="e.g. 50000"
                  placeholderTextColor={subtextColor}
                  keyboardType="decimal-pad"
                  style={[
                    styles.input,
                    {
                      color: textColor,
                      borderColor: errors.creditLimit ? '#DC2626' : inputBorder,
                      backgroundColor: inputBg,
                    },
                  ]}
                  accessibilityLabel="Credit limit"
                />
              )}
            />

            {/* Warning if credit limit below outstanding (SRC-15) */}
            {Number(watchedCreditLimit) > 0 &&
              Number(watchedOpening) > Number(watchedCreditLimit) && (
                <View style={styles.warningBox}>
                  <InlineError
                    message={t('warn.outstanding.over.limit')}
                    variant="warning"
                    isDark={isDark}
                  />
                </View>
              )}

            {errors.creditLimit && (
              <Text style={styles.fieldError}>
                {errors.creditLimit.message}
              </Text>
            )}
          </View>
        )}

        {/* Top general error box */}
        {(!!formError || !!errorMessage) && (
          <View style={styles.errorBox}>
            <InlineError
              message={formError || errorMessage}
              variant="error"
              isDark={isDark}
            />
          </View>
        )}

        {!isOnline && (
          <Text style={styles.offlineHint}>{t('info.offline.save')}</Text>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={!isOnline || isSaving}
            style={[
              styles.saveButton,
              { backgroundColor: Colors.primary },
              (!isOnline || isSaving) && styles.disabledButton,
            ]}
            accessibilityRole="button"
            accessibilityLabel={isEditing ? 'Update source' : 'Save source'}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update Source' : 'Save Source'}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleCancelPress}
            style={[styles.cancelButton, { borderColor: inputBorder }]}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={[styles.cancelButtonText, { color: textColor }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Discard Changes Confirm Sheet (G-FRM-06) */}
      <ConfirmSheet
        visible={showDiscardConfirm}
        title={t('confirm.discard.title')}
        cancelLabel={t('confirm.discard.keep')}
        confirmLabel={t('confirm.discard.discard')}
        onKeepEditing={() => setShowDiscardConfirm(false)}
        onDiscard={() => {
          setShowDiscardConfirm(false);
          onCancel();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  currentBalanceCard: {
    padding: 14,
    borderRadius: 10,
    gap: 4,
  },
  currentBalanceLabel: {
    fontSize: 13,
  },
  currentBalanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  lockedTypeContainer: {
    gap: 4,
  },
  lockedTypeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  counter: {
    fontSize: 12,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
  },
  fieldError: {
    color: '#DC2626',
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  warningBox: {
    marginTop: 6,
  },
  errorBox: {
    marginTop: 4,
  },
  offlineHint: {
    color: '#D97706',
    fontSize: 13,
    textAlign: 'center',
  },
  actionRow: {
    gap: 10,
    marginTop: 8,
  },
  saveButton: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    height: 46,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
