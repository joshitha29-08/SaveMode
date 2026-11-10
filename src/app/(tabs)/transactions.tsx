
import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '../../constants/colors';
import {
  Source,
  Transaction,
  TransactionType,
  useSession,
} from '../../lib/session';

const transactionTypes: {
  label: string;
  value: TransactionType;
}[] = [
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
  { label: 'Transfer', value: 'transfer' },
  { label: 'Adjustment', value: 'adjustment' },
];

const today = () => new Date().toISOString().slice(0, 10);

const formatMoney = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const typeLabel: Record<TransactionType, string> = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
  adjustment: 'Adjustment',
};

export default function Transactions() {
  const sources = useSession((state) => state.sources);
  const transactions = useSession((state) => state.transactions);
  const addTransaction = useSession(
    (state) => state.addTransaction,
  );

  const [selectedType, setSelectedType] =
    useState<TransactionType>('expense');

  const [date, setDate] = useState(today());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [tag, setTag] = useState('');

  const [sourceId, setSourceId] = useState('');
  const [fromSourceId, setFromSourceId] = useState('');
  const [toSourceId, setToSourceId] = useState('');

  const [formVisible, setFormVisible] = useState(false);

  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => b.date.localeCompare(a.date),
      ),
    [transactions],
  );

  const showMessage = (message: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.alert(message);
      }
    } else {
      Alert.alert('SaveMode', message);
    }
  };

  const resetForm = () => {
    setDate(today());
    setDescription('');
    setAmount('');
    setTag('');
    setSourceId('');
    setFromSourceId('');
    setToSourceId('');
    setSelectedType('expense');
    setFormVisible(false);
  };

  const handleTypeChange = (type: TransactionType) => {
    setSelectedType(type);
    setSourceId('');
    setFromSourceId('');
    setToSourceId('');
  };

  const getSourceName = (id?: string) => {
    if (!id) return 'Unknown source';

    return (
      sources.find((source) => source.id === id)?.name ??
      'Unknown source'
    );
  };

  const saveTransaction = () => {
    const numericAmount = Number(amount);

    if (!date.trim()) {
      showMessage('Please enter a transaction date.');
      return;
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(date))
    ) {
      showMessage('Enter the date in YYYY-MM-DD format.');
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      showMessage('Please enter a valid amount greater than zero.');
      return;
    }

    if (!tag.trim()) {
      showMessage('Please enter a transaction tag.');
      return;
    }

    if (sources.length === 0) {
      showMessage('Please add a source before creating a transaction.');
      return;
    }

    if (selectedType === 'transfer') {
      if (!fromSourceId || !toSourceId) {
        showMessage('Please select both transfer sources.');
        return;
      }

      if (fromSourceId === toSourceId) {
        showMessage('Choose two different sources for a transfer.');
        return;
      }

      addTransaction({
        type: 'transfer',
        date,
        description: description.trim(),
        amount: numericAmount,
        tag: tag.trim(),
        fromSourceId,
        toSourceId,
      });
    } else {
      if (!sourceId) {
        showMessage('Please select a source.');
        return;
      }

      addTransaction({
        type: selectedType,
        date,
        description: description.trim(),
        amount: numericAmount,
        tag: tag.trim(),
        sourceId,
      });
    }

    showMessage('Transaction saved successfully.');
    resetForm();
  };

  const renderSourceOption = (
    source: Source,
    selected: boolean,
    onPress: () => void,
  ) => (
    <Pressable
      key={source.id}
      onPress={onPress}
      style={[
        styles.sourceOption,
        selected && styles.selectedSource,
      ]}
    >
      <Text
        style={[
          styles.sourceOptionText,
          selected && styles.selectedSourceText,
        ]}
      >
        {source.name}
      </Text>

      <Text style={styles.sourceOptionType}>
        {source.type.replace('_', ' ')}
      </Text>
    </Pressable>
  );

  const renderTransaction = (transaction: Transaction) => {
    let sourceDescription = '';

    if (transaction.type === 'transfer') {
      sourceDescription =
        `${getSourceName(transaction.fromSourceId)} → ` +
        getSourceName(transaction.toSourceId);
    } else {
      sourceDescription = getSourceName(transaction.sourceId);
    }

    return (
      <View key={transaction.id} style={styles.transactionCard}>
        <View style={styles.transactionTop}>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>
              {transaction.description?.trim() ||
                typeLabel[transaction.type]}
            </Text>

            <Text style={styles.transactionMeta}>
              {transaction.date} · {transaction.tag}
            </Text>

            <Text style={styles.transactionSource}>
              {sourceDescription}
            </Text>
          </View>

          <View style={styles.transactionAmountContainer}>
            <Text
              style={[
                styles.transactionAmount,
                transaction.type === 'income' &&
                  styles.incomeAmount,
                transaction.type === 'expense' &&
                  styles.expenseAmount,
              ]}
            >
              {transaction.type === 'income' ? '+' : ''}
              {formatMoney(transaction.amount)}
            </Text>

            <Text style={styles.transactionType}>
              {typeLabel[transaction.type]}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.heading}>Transactions</Text>
            <Text style={styles.subtitle}>
              Track your income and expenses
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() => setFormVisible(!formVisible)}
          >
            <Text style={styles.addButtonText}>
              {formVisible ? 'Close' : '+ Add'}
            </Text>
          </Pressable>
        </View>

        {formVisible && (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              New transaction
            </Text>

            <Text style={styles.label}>Transaction type</Text>

            <View style={styles.typeOptions}>
              {transactionTypes.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => handleTypeChange(item.value)}
                  style={[
                    styles.typeOption,
                    selectedType === item.value &&
                      styles.selectedType,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      selectedType === item.value &&
                        styles.selectedTypeText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>

            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2026-11-10"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Amount (₹)</Text>

            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="Enter amount"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Description (optional)</Text>

            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="What is this transaction for?"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Tag</Text>

            <TextInput
              style={styles.input}
              value={tag}
              onChangeText={setTag}
              placeholder="e.g. Food, Salary, Shopping"
              placeholderTextColor="#999"
            />

            {selectedType === 'transfer' ? (
              <>
                <Text style={styles.label}>From source</Text>

                {sources.map((source) =>
                  renderSourceOption(
                    source,
                    fromSourceId === source.id,
                    () => setFromSourceId(source.id),
                  ),
                )}

                <Text style={styles.label}>To source</Text>

                {sources.map((source) =>
                  renderSourceOption(
                    source,
                    toSourceId === source.id,
                    () => setToSourceId(source.id),
                  ),
                )}
              </>
            ) : (
              <>
                <Text style={styles.label}>Select source</Text>

                {sources.map((source) =>
                  renderSourceOption(
                    source,
                    sourceId === source.id,
                    () => setSourceId(source.id),
                  ),
                )}
              </>
            )}

            <Pressable
              style={styles.saveButton}
              onPress={saveTransaction}
            >
              <Text style={styles.saveButtonText}>
                Save transaction
              </Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={resetForm}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>
            Recent transactions
          </Text>

          <Text style={styles.countText}>
            {transactions.length} total
          </Text>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No transactions yet
            </Text>

            <Text style={styles.emptyDescription}>
              Add your first income, expense or transfer to get started.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={() => setFormVisible(true)}
            >
              <Text style={styles.addButtonText}>
                + Add transaction
              </Text>
            </Pressable>
          </View>
        ) : (
          sortedTransactions.map(renderTransaction)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F7',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 850,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#202B27',
  },
  subtitle: {
    fontSize: 14,
    color: '#747C78',
    marginTop: 5,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 9,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202B27',
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#394740',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DCE3DE',
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    color: '#202B27',
    backgroundColor: '#FFFFFF',
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    borderWidth: 1,
    borderColor: '#DCE3DE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 9,
  },
  selectedType: {
    borderColor: Colors.primary,
    backgroundColor: '#EAF3EF',
  },
  typeOptionText: {
    color: '#394740',
    fontSize: 13,
  },
  selectedTypeText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  sourceOption: {
    borderWidth: 1,
    borderColor: '#DCE3DE',
    borderRadius: 9,
    padding: 12,
    marginBottom: 8,
  },
  selectedSource: {
    borderColor: Colors.primary,
    backgroundColor: '#EAF3EF',
  },
  sourceOptionText: {
    color: '#26342E',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedSourceText: {
    color: Colors.primary,
  },
  sourceOptionType: {
    color: '#747C78',
    fontSize: 11,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 9,
    alignItems: 'center',
    padding: 14,
    marginTop: 22,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 13,
    marginTop: 5,
  },
  cancelText: {
    color: '#747C78',
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  countText: {
    fontSize: 13,
    color: '#747C78',
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  transactionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202B27',
  },
  transactionMeta: {
    fontSize: 12,
    color: '#747C78',
    marginTop: 5,
  },
  transactionSource: {
    fontSize: 12,
    color: '#747C78',
    marginTop: 5,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#26342E',
  },
  incomeAmount: {
    color: '#16834A',
  },
  expenseAmount: {
    color: '#C0392B',
  },
  transactionType: {
    fontSize: 11,
    color: '#747C78',
    marginTop: 5,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202B27',
  },
  emptyDescription: {
    fontSize: 13,
    color: '#747C78',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 18,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 9,
  },
});
