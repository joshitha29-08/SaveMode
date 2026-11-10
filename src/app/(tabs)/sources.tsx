
import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
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
  SourceType,
  useSession,
} from '../../lib/session';

const MAX_SOURCES = 50;

const DELETE_BLOCKED_MESSAGE =
  "This source has transactions, so it can't be deleted.";

const formatMoney = (amount: number) =>
  `\u20B9${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const sourceLabels: Record<SourceType, string> = {
  bank: 'Bank Account',
  cash: 'Cash',
  wallet: 'Digital Wallet',
  credit_card: 'Credit Card',
};

const sourceIcons: Record<SourceType, string> = {
  bank: '\u{1F3E6}',
  cash: '\u{1F4B5}',
  wallet: '\u{1F45B}',
  credit_card: '\u{1F4B3}',
};

type FormState = {
  name: string;
  type: SourceType;
  openingBalance: string;
  creditLimit: string;
  outstanding: string;
};

const emptyForm: FormState = {
  name: '',
  type: 'bank',
  openingBalance: '0',
  creditLimit: '0',
  outstanding: '0',
};

export default function Sources() {
  const sources = useSession((state) => state.sources);
  const addSource = useSession((state) => state.addSource);
  const updateSource = useSession((state) => state.updateSource);
  const deleteSource = useSession((state) => state.deleteSource);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSource, setEditingSource] =
    useState<Source | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteErrorSourceId, setDeleteErrorSourceId] =
    useState<string | null>(null);

  const totals = useMemo(() => {
    const bankAndCash = sources
      .filter((item) => item.type !== 'credit_card')
      .reduce(
        (sum, item) => sum + item.openingBalance,
        0,
      );

    const outstanding = sources
      .filter((item) => item.type === 'credit_card')
      .reduce(
        (sum, item) => sum + item.outstanding,
        0,
      );

    return { bankAndCash, outstanding };
  }, [sources]);

  const showMessage = (message: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.alert(message);
      }
    } else {
      Alert.alert('SaveMode', message);
    }
  };

  const openAddModal = () => {
    setEditingSource(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEditModal = (source: Source) => {
    setEditingSource(source);

    setForm({
      name: source.name,
      type: source.type,
      openingBalance: String(source.openingBalance),
      creditLimit: String(source.creditLimit),
      outstanding: String(source.outstanding),
    });

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingSource(null);
    setForm(emptyForm);
  };

  const updateField = (
    field: keyof FormState,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveSource = () => {
    const name = form.name.trim();

    if (!editingSource && sources.length >= MAX_SOURCES) {
      showMessage(
        "You've reached the maximum of 50 sources.",
      );
      return;
    }

    if (!name) {
      showMessage('Please enter a source name.');
      return;
    }

    const duplicate = sources.some(
      (item) =>
        item.name.toLowerCase() === name.toLowerCase() &&
        item.id !== editingSource?.id,
    );

    if (duplicate) {
      showMessage(
        'A source with this name already exists.',
      );
      return;
    }

    const openingBalance = Number(form.openingBalance);
    const creditLimit = Number(form.creditLimit);
    const outstanding = Number(form.outstanding);

    if (
      !Number.isFinite(openingBalance) ||
      !Number.isFinite(creditLimit) ||
      !Number.isFinite(outstanding) ||
      openingBalance < 0 ||
      creditLimit < 0 ||
      outstanding < 0
    ) {
      showMessage(
        'Please enter valid non-negative amounts.',
      );
      return;
    }

    if (
      form.type === 'credit_card' &&
      (creditLimit <= 0 || outstanding > creditLimit)
    ) {
      showMessage(
        'Enter a valid credit limit. Outstanding cannot exceed the credit limit.',
      );
      return;
    }

    const sourceData = {
      name,
      type: editingSource
        ? editingSource.type
        : form.type,
      openingBalance:
        form.type === 'credit_card' ? 0 : openingBalance,
      creditLimit:
        form.type === 'credit_card' ? creditLimit : 0,
      outstanding:
        form.type === 'credit_card' ? outstanding : 0,
    };

    if (editingSource) {
      updateSource(editingSource.id, sourceData);
    } else {
      addSource(sourceData);
    }

    closeModal();
  };

  const performDelete = (source: Source) => {
    const deleted = deleteSource(source.id);

    if (!deleted) {
      setDeleteErrorSourceId(source.id);
      return;
    }

    setDeleteErrorSourceId(null);
  };

  const confirmDelete = (source: Source) => {
    setDeleteErrorSourceId(null);

    const message = `Delete "${source.name}"?`;

    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm(message)
      ) {
        performDelete(source);
      }

      return;
    }

    Alert.alert('Delete source', message, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => performDelete(source),
      },
    ]);
  };

  const renderAmountField = (
    label: string,
    field: keyof FormState,
    value: string,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) =>
          updateField(field, text)
        }
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor="#999"
      />
    </View>
  );

  const renderSource = (source: Source) => {
    const isCard = source.type === 'credit_card';
    const hasDeleteError =
      deleteErrorSourceId === source.id;

    return (
      <View key={source.id} style={styles.sourceCard}>
        <View style={styles.sourceTop}>
          <View style={styles.sourceIdentity}>
            <View style={styles.iconBox}>
              <Text style={styles.sourceIcon}>
                {sourceIcons[source.type]}
              </Text>
            </View>

            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName}>
                {source.name}
              </Text>

              <Text style={styles.sourceType}>
                {sourceLabels[source.type]}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => openEditModal(source)}
              style={styles.actionButton}
            >
              <Text style={styles.editText}>Edit</Text>
            </Pressable>

            <Pressable
              onPress={() => confirmDelete(source)}
              style={styles.actionButton}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sourceDivider} />

        {isCard ? (
          <>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>
                Credit limit
              </Text>
              <Text style={styles.amountValue}>
                {formatMoney(source.creditLimit)}
              </Text>
            </View>

            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>
                Outstanding
              </Text>
              <Text style={styles.amountValue}>
                {formatMoney(source.outstanding)}
              </Text>
            </View>

            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>
                Available credit
              </Text>
              <Text style={styles.availableValue}>
                {formatMoney(
                  source.creditLimit - source.outstanding,
                )}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>
              Opening balance
            </Text>

            <Text style={styles.amountValue}>
              {formatMoney(source.openingBalance)}
            </Text>
          </View>
        )}

        {hasDeleteError && (
          <View style={styles.deleteErrorBox}>
            <Text style={styles.deleteErrorText}>
              {DELETE_BLOCKED_MESSAGE}
            </Text>
          </View>
        )}
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
            <Text style={styles.heading}>My Sources</Text>
            <Text style={styles.subtitle}>
              Manage your money in one place
            </Text>
          </View>

          <Pressable
            style={[
              styles.addButton,
              sources.length >= MAX_SOURCES &&
                styles.disabledButton,
            ]}
            onPress={openAddModal}
            disabled={sources.length >= MAX_SOURCES}
          >
            <Text style={styles.addButtonText}>
              + Add
            </Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            Total opening balance
          </Text>

          <Text style={styles.summaryAmount}>
            {formatMoney(totals.bankAndCash)}
          </Text>

          <View style={styles.summaryDivider} />

          <Text style={styles.summaryLabel}>
            Total card outstanding
          </Text>

          <Text style={styles.outstandingAmount}>
            {formatMoney(totals.outstanding)}
          </Text>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>
            Your accounts
          </Text>

          <Text style={styles.countText}>
            {sources.length} / {MAX_SOURCES} sources
          </Text>
        </View>

        {sources.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              {sourceIcons.bank}
            </Text>

            <Text style={styles.emptyTitle}>
              No sources yet
            </Text>

            <Text style={styles.emptyDescription}>
              Add where your money is: a bank account, cash,
              or a card.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={openAddModal}
            >
              <Text style={styles.addButtonText}>
                + Add your first source
              </Text>
            </Pressable>
          </View>
        ) : (
          sources.map(renderSource)
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingSource
                    ? 'Edit source'
                    : 'Add source'}
                </Text>

                <Pressable onPress={closeModal}>
                  <Text style={styles.closeText}>
                    {'\u2715'}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.label}>
                Source name
              </Text>

              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(value) =>
                  updateField('name', value)
                }
                placeholder="e.g. SBI Savings"
                placeholderTextColor="#999"
              />

              <Text
                style={[styles.label, styles.typeLabel]}
              >
                Source type
              </Text>

              <View style={styles.typeOptions}>
                {(
                  ['bank', 'cash', 'credit_card'] as SourceType[]
                ).map((type) => (
                  <Pressable
                    key={type}
                    disabled={!!editingSource}
                    onPress={() =>
                      updateField('type', type)
                    }
                    style={[
                      styles.typeOption,
                      form.type === type &&
                        styles.selectedType,
                      !!editingSource && {
                        opacity: 0.65,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        form.type === type &&
                          styles.selectedTypeText,
                      ]}
                    >
                      {sourceIcons[type]} {sourceLabels[type]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {form.type === 'credit_card' ? (
                <>
                  {renderAmountField(
                    `Credit limit (${'\u20B9'})`,
                    'creditLimit',
                    form.creditLimit,
                  )}

                  {renderAmountField(
                    `Current outstanding (${'\u20B9'})`,
                    'outstanding',
                    form.outstanding,
                  )}
                </>
              ) : (
                renderAmountField(
                  `Opening balance (${'\u20B9'})`,
                  'openingBalance',
                  form.openingBalance,
                )
              )}

              <Pressable
                style={styles.saveButton}
                onPress={saveSource}
              >
                <Text style={styles.saveButtonText}>
                  {editingSource
                    ? 'Save changes'
                    : 'Add source'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  disabledButton: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    padding: 22,
    borderRadius: 15,
    marginBottom: 26,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#D8EAE4',
  },
  summaryAmount: {
    fontSize: 27,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 5,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#FFFFFF40',
    marginVertical: 16,
  },
  outstandingAmount: {
    fontSize: 21,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 5,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202B27',
  },
  countText: {
    fontSize: 13,
    color: '#747C78',
  },
  sourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 17,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  sourceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  sourceIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 11,
    backgroundColor: '#EAF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceIcon: {
    fontSize: 22,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202B27',
  },
  sourceType: {
    fontSize: 12,
    color: '#747C78',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 5,
  },
  actionButton: {
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  editText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  deleteText: {
    color: '#C0392B',
    fontWeight: '600',
    fontSize: 13,
  },
  sourceDivider: {
    height: 1,
    backgroundColor: '#EDF0EE',
    marginVertical: 14,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  amountLabel: {
    fontSize: 13,
    color: '#747C78',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#26342E',
  },
  availableValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  deleteErrorBox: {
    marginTop: 14,
    padding: 11,
    borderRadius: 8,
    backgroundColor: '#FCEDEC',
    borderWidth: 1,
    borderColor: '#F2C7C3',
  },
  deleteErrorText: {
    color: '#A93226',
    fontSize: 13,
    lineHeight: 19,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  emptyIcon: {
    fontSize: 38,
    marginBottom: 12,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 22,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#202B27',
  },
  closeText: {
    fontSize: 21,
    color: '#747C78',
    padding: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#394740',
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
    marginBottom: 17,
    backgroundColor: '#FFFFFF',
  },
  typeLabel: {
    marginTop: 3,
  },
  typeOptions: {
    gap: 8,
    marginBottom: 20,
  },
  typeOption: {
    borderWidth: 1,
    borderColor: '#DCE3DE',
    padding: 12,
    borderRadius: 9,
  },
  selectedType: {
    borderColor: Colors.primary,
    backgroundColor: '#EAF3EF',
  },
  typeOptionText: {
    color: '#394740',
    fontSize: 14,
  },
  selectedTypeText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  field: {
    marginBottom: 3,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 9,
    alignItems: 'center',
    padding: 14,
    marginTop: 8,
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
});
