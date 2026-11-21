import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { t } from '../../i18n';
import { useTheme } from '../../theme/theme-context';

type ConfirmSheetProps = {
  visible: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  loading?: boolean;
  confirmDisabled?: boolean;
  variant?: 'destructive' | 'primary';
};

export default function ConfirmSheet({
  visible,
  onKeepEditing,
  onDiscard,
  title,
  description,
  cancelLabel,
  confirmLabel,
  loading = false,
  confirmDisabled = false,
  variant = 'destructive',
}: ConfirmSheetProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { colors } = useTheme();

  const backgroundColor = colors.surface;
  const textColor = colors.text;
  const disabled = loading || confirmDisabled;
  const confirmButtonBg = variant === 'primary' ? colors.primary : colors.error;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!loading) onKeepEditing();
      }}
    >
      <View style={[styles.overlay, isDesktop && styles.desktopOverlay]}>
        <View
          style={[
            styles.sheet,
            isDesktop && styles.desktopSheet,
            { backgroundColor },
          ]}
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          {!isDesktop && (
            <View
              style={[styles.handle, { backgroundColor: colors.border }]}
              accessible={false}
            />
          )}

          <Text style={[styles.title, { color: textColor }]}>
            {title ?? t('confirm.discard.title')}
          </Text>

          {description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {description}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={onKeepEditing}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel ?? t('confirm.discard.keep')}
              style={[styles.cancelButton, loading && styles.disabledButton]}
            >
              <Text style={[styles.cancelText, { color: colors.primary }]}>
                {cancelLabel ?? t('confirm.discard.keep')}
              </Text>
            </Pressable>

            <Pressable
              onPress={onDiscard}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel ?? t('confirm.discard.discard')}
              style={[
                styles.confirmButton,
                { backgroundColor: confirmButtonBg },
                disabled && styles.disabledButton,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmText}>
                  {confirmLabel ?? t('confirm.discard.discard')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  desktopOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 16,
  },
  desktopSheet: {
    width: '90%',
    maxWidth: 520,
    borderRadius: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    padding: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelText: {
    // D3: color is applied inline from theme token (colors.primary).
    fontWeight: '600',
  },
  confirmButton: {
    padding: 14,
    minHeight: 44,
    minWidth: 88,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.55,
  },
});
