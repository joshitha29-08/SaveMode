import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useSafeSave } from '../../lib/useSafeSave';
import { useAppTheme } from '../../lib/theme';
import { useSession } from '../../lib/session';
import { t } from '../../i18n';
import { formatAmount } from '../../lib/money';
import OfflineBanner from '../../components/ui/OfflineBanner';
import EmptyState from '../../components/ui/EmptyState';
import Toast from '../../components/ui/Toast';
import ConfirmSheet from '../../components/ui/ConfirmSheet';
import { ErrorBox } from '../../components/ui/ErrorBox';
import SourceForm, {
  type SourceItem,
  type SourceType,
} from '../../components/sources/SourceForm';
import { Colors } from '../../constants/colors';

type SourceTotals = {
  bankCashTotal: number;
  cardOutstandingTotal: number;
};

export default function SourcesScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { currencyCode } = useSession();
  const { isOnline, isSaving, save } = useSafeSave();

  const [sources, setSources] = useState<SourceItem[]>([]);
  const [totals, setTotals] = useState<SourceTotals>({
    bankCashTotal: 0,
    cardOutstandingTotal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listError, setListError] = useState('');

  // Form mode (Add / Edit)
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState<SourceItem | null>(null);

  // Archive collapse state (ARC-02)
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  // Restore confirm
  const [sourceToRestore, setSourceToRestore] = useState<SourceItem | null>(
    null,
  );

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const subtextColor = isDark ? '#A1A1AA' : '#64748B';
  const cardColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const backgroundColor = isDark ? '#121212' : '#F8FAFC';
  const borderColor = isDark ? '#27272A' : '#E2E8F0';

  const fetchSourcesData = useCallback(async () => {
    setListError('');
    try {
      // 1. Fetch sources with stats (E6)
      const { data: sourcesData, error: sourcesError } =
        await supabase.rpc('sources_with_stats');

      let fetchedSources: SourceItem[] = [];
      if (sourcesError) {
        // Fallback to table query if RPC is not present
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('financial_sources')
          .select(
            'id, type, name, opening_amount, current_amount, credit_limit, is_archived',
          )
          .order('name');

        if (fallbackError) {
          setListError(t('err.generic'));
          return;
        }
        fetchedSources = (fallbackData ?? []).map((s) => ({
          ...s,
          has_transactions: false,
        })) as SourceItem[];
      } else {
        fetchedSources = (sourcesData ?? []) as SourceItem[];
      }

      setSources(fetchedSources);

      // 2. Fetch source totals (E6, SRC-08)
      const { data: totalsData, error: totalsError } =
        await supabase.rpc('source_totals');

      if (totalsError || !totalsData || totalsData.length === 0) {
        // D10: Prohibit client-side totals fallback. On DB failure, set listError
        setListError(t('err.generic'));
        return;
      }

      const row = totalsData[0];
      setTotals({
        bankCashTotal: Number(row.bank_cash_total ?? 0),
        cardOutstandingTotal: Number(row.card_outstanding_total ?? 0),
      });
    } catch {
      setListError(t('err.generic'));
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await fetchSourcesData();
    setIsLoading(false);
  }, [fetchSourcesData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchSourcesData();
    setIsRefreshing(false);
  }, [fetchSourcesData]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await fetchSourcesData();
      if (isMounted) {
        setIsLoading(false);
      }
    };
    void init();
    return () => {
      isMounted = false;
    };
  }, [fetchSourcesData]);

  // Group active sources (SRC-06): 1. Bank accounts, 2. Cash, 3. Credit cards; alphabetical by name
  const activeSources = useMemo(
    () => sources.filter((s) => !s.is_archived),
    [sources],
  );
  const archivedSources = useMemo(
    () => sources.filter((s) => s.is_archived),
    [sources],
  );

  const bankAccounts = useMemo(
    () =>
      activeSources
        .filter((s) => s.type === 'bank')
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        ),
    [activeSources],
  );

  const cashSources = useMemo(
    () =>
      activeSources
        .filter((s) => s.type === 'cash')
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        ),
    [activeSources],
  );

  const creditCards = useMemo(
    () =>
      activeSources
        .filter((s) => s.type === 'card')
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        ),
    [activeSources],
  );

  const handleOpenAdd = () => {
    setEditingSource(null);
    setShowForm(true);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingSource(null);
    setToastMessage(t('toast.saved'));
    setShowToast(true);
    await loadData();
  };

  const handleRestoreSource = async () => {
    if (!sourceToRestore || !isOnline || isSaving) return;

    const success = await save(async () => {
      const { error } = await supabase
        .from('financial_sources')
        .update({ is_archived: false })
        .eq('id', sourceToRestore.id);
      return error;
    });

    if (success) {
      setSourceToRestore(null);
      setToastMessage('Source restored');
      setShowToast(true);
      await loadData();
    }
  };

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'bank':
        return 'bank';
      case 'card':
        return 'credit-card-outline';
      case 'cash':
      default:
        return 'cash';
    }
  };

  const renderSourceRow = (source: SourceItem) => {
    const isCard = source.type === 'card';
    const outstanding = source.current_amount;
    const limit = source.credit_limit ?? 0;
    const availableCredit = limit - outstanding;
    const isOverLimit = isCard && limit > 0 && outstanding > limit;
    const isCreditBalance = isCard && outstanding < 0;
    const isBelowZero = !isCard && source.current_amount < 0;

    const usagePercent =
      isCard && limit > 0
        ? Math.min(100, Math.max(0, (outstanding / limit) * 100))
        : 0;

    return (
      <Pressable
        key={source.id}
        onPress={() => router.push(`/sources/${source.id}` as any)}
        style={[styles.sourceCard, { backgroundColor: cardColor, borderColor }]}
        accessibilityRole="button"
        accessibilityLabel={`${source.name}, ${source.type}`}
      >
        <View style={styles.sourceTopRow}>
          <View style={styles.sourceLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isDark ? '#27272A' : '#E8F5F1' },
              ]}
            >
              <MaterialCommunityIcons
                name={getSourceIcon(source.type) as any}
                size={22}
                color={Colors.primary}
              />
            </View>
            <View style={styles.nameContainer}>
              <Text style={[styles.sourceName, { color: textColor }]}>
                {source.name}
              </Text>
            </View>
          </View>

          {/* Amount on Right */}
          <View style={styles.amountContainer}>
            {!isCard ? (
              <Text
                style={[
                  styles.balanceAmount,
                  { color: isBelowZero ? '#DC2626' : textColor },
                ]}
              >
                {formatAmount(source.current_amount, currencyCode)}
              </Text>
            ) : (
              <View style={styles.cardAmountCol}>
                <Text
                  style={[
                    styles.cardOutstandingText,
                    { color: isCreditBalance ? '#16A34A' : textColor },
                  ]}
                >
                  Outstanding{' '}
                  {formatAmount(outstanding, currencyCode, {
                    hideZeroPaise: true,
                  })}
                </Text>
                <Text
                  style={[styles.cardAvailableText, { color: subtextColor }]}
                >
                  Available{' '}
                  {formatAmount(availableCredit, currencyCode, {
                    hideZeroPaise: true,
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Thin Usage Bar for Credit Cards (SRC-07) */}
        {isCard && limit > 0 && (
          <View
            style={[
              styles.usageBarTrack,
              { backgroundColor: isDark ? '#3F3F46' : '#E2E8F0' },
            ]}
          >
            <View
              style={[
                styles.usageBarFill,
                {
                  width: `${usagePercent}%`,
                  backgroundColor: isOverLimit ? '#DC2626' : Colors.primary,
                },
              ]}
            />
          </View>
        )}

        {/* Warning Labels (SRC-09) */}
        {isBelowZero && (
          <View style={styles.warningRow}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={15}
              color="#DC2626"
            />
            <Text style={styles.warningText}>Below zero</Text>
          </View>
        )}

        {isOverLimit && (
          <View style={styles.warningRow}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={15}
              color="#DC2626"
            />
            <Text style={styles.warningText}>
              Over limit by{' '}
              {formatAmount(outstanding - limit, currencyCode, {
                hideZeroPaise: true,
              })}
            </Text>
          </View>
        )}

        {isCreditBalance && (
          <View style={[styles.warningRow, styles.creditBalanceRow]}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={15}
              color="#16A34A"
            />
            <Text style={styles.creditBalanceText}>
              Credit balance{' '}
              {formatAmount(Math.abs(outstanding), currencyCode, {
                hideZeroPaise: true,
              })}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  if (showForm) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor }]}
        contentContainerStyle={styles.content}
      >
        <OfflineBanner visible={!isOnline} />
        <SourceForm
          initialSource={editingSource}
          existingSources={sources}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingSource(null);
          }}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      <OfflineBanner visible={!isOnline} />

      {/* Header */}
      <View style={styles.topHeader}>
        <Text style={[styles.pageTitle, { color: textColor }]}>Sources</Text>
      </View>

      {/* Two Separate Totals at the Top (SRC-08) */}
      <View style={styles.totalsContainer}>
        <View
          style={[
            styles.totalCard,
            { backgroundColor: cardColor, borderColor },
          ]}
        >
          <Text style={[styles.totalLabel, { color: subtextColor }]}>
            Total Balance
          </Text>
          <Text style={[styles.totalAmount, { color: Colors.primary }]}>
            {formatAmount(totals.bankCashTotal, currencyCode)}
          </Text>
        </View>

        <View
          style={[
            styles.totalCard,
            { backgroundColor: cardColor, borderColor },
          ]}
        >
          <Text style={[styles.totalLabel, { color: subtextColor }]}>
            Total Card Outstanding
          </Text>
          <Text style={[styles.totalAmount, { color: textColor }]}>
            {formatAmount(totals.cardOutstandingTotal, currencyCode)}
          </Text>
        </View>
      </View>

      {/* Error state (D10) */}
      {!!listError && (
        <ErrorBox message={listError} onRetry={loadData} isDark={isDark} />
      )}

      {/* Loading state */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : activeSources.length === 0 ? (
        /* Empty State */
        <EmptyState onAddSource={handleOpenAdd} />
      ) : (
        /* Grouped Active Sources: 1. Bank Accounts, 2. Cash, 3. Credit Cards (SRC-06) */
        <View style={styles.groupsContainer}>
          {bankAccounts.length > 0 && (
            <View style={styles.groupSection}>
              <Text style={[styles.groupTitle, { color: subtextColor }]}>
                Bank Accounts ({bankAccounts.length})
              </Text>
              {bankAccounts.map(renderSourceRow)}
            </View>
          )}

          {cashSources.length > 0 && (
            <View style={styles.groupSection}>
              <Text style={[styles.groupTitle, { color: subtextColor }]}>
                Cash ({cashSources.length})
              </Text>
              {cashSources.map(renderSourceRow)}
            </View>
          )}

          {creditCards.length > 0 && (
            <View style={styles.groupSection}>
              <Text style={[styles.groupTitle, { color: subtextColor }]}>
                Credit Cards ({creditCards.length})
              </Text>
              {creditCards.map(renderSourceRow)}
            </View>
          )}

          {/* Dashed "Add source" Card at End of List (Task 10 Requirement) */}
          <Pressable
            onPress={handleOpenAdd}
            style={[
              styles.dashedAddCard,
              { borderColor: isDark ? '#3F3F46' : '#94A3B8' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add source"
          >
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={22}
              color={Colors.primary}
            />
            <Text style={[styles.dashedAddText, { color: Colors.primary }]}>
              Add source
            </Text>
          </Pressable>
        </View>
      )}

      {/* Archived Sources Collapsible Section (ARC-02) */}
      {archivedSources.length > 0 && (
        <View style={styles.archivedSection}>
          <Pressable
            onPress={() => setArchivedExpanded((prev) => !prev)}
            style={styles.archivedToggle}
            accessibilityRole="button"
            accessibilityLabel={`Archived sources (${archivedSources.length})`}
          >
            <Text style={[styles.archivedTitle, { color: subtextColor }]}>
              Archived ({archivedSources.length})
            </Text>
            <MaterialCommunityIcons
              name={archivedExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={subtextColor}
            />
          </Pressable>

          {archivedExpanded && (
            <View style={styles.archivedList}>
              {archivedSources.map((source) => (
                <View
                  key={source.id}
                  style={[
                    styles.archivedCard,
                    { backgroundColor: cardColor, borderColor },
                  ]}
                >
                  <View style={styles.sourceLeft}>
                    <MaterialCommunityIcons
                      name={getSourceIcon(source.type) as any}
                      size={20}
                      color={subtextColor}
                    />
                    <Text style={[styles.archivedName, { color: textColor }]}>
                      {source.name}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setSourceToRestore(source)}
                    style={[styles.restoreBtn, { borderColor: Colors.primary }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Restore ${source.name}`}
                  >
                    <Text
                      style={[styles.restoreBtnText, { color: Colors.primary }]}
                    >
                      Restore
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Toast */}
      <Toast
        visible={showToast}
        message={toastMessage}
        onDismiss={() => setShowToast(false)}
      />

      {/* Restore Confirmation Sheet */}
      {sourceToRestore && (
        <ConfirmSheet
          visible={!!sourceToRestore}
          title={`Restore '${sourceToRestore.name}'?`}
          cancelLabel="Cancel"
          confirmLabel="Restore"
          onKeepEditing={() => setSourceToRestore(null)}
          onDiscard={handleRestoreSource}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
    paddingBottom: 72,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  totalsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  totalCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  groupsContainer: {
    gap: 20,
  },
  groupSection: {
    gap: 10,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  sourceCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  sourceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    flex: 1,
  },
  sourceName: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardAmountCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  cardOutstandingText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardAvailableText: {
    fontSize: 13,
  },
  usageBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDECEC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  warningText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  creditBalanceRow: {
    backgroundColor: '#E7F5EC',
  },
  creditBalanceText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '600',
  },
  dashedAddCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  dashedAddText: {
    fontSize: 16,
    fontWeight: '700',
  },
  archivedSection: {
    marginTop: 10,
    gap: 10,
  },
  archivedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  archivedTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  archivedList: {
    gap: 8,
  },
  archivedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  archivedName: {
    fontSize: 15,
    fontWeight: '600',
  },
  restoreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  restoreBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
