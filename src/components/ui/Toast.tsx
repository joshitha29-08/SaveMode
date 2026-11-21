import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { t } from '../../i18n';
import { useTheme } from '../../theme/theme-context';

type ToastProps = {
  visible: boolean;
  message?: string;
  onUndo?: () => void;
  onDismiss?: () => void;
};

export default function Toast({
  visible,
  message,
  onUndo,
  onDismiss,
}: ToastProps) {
  // D3: Use theme tokens. Toast uses an inverted surface for contrast.
  // In light mode: dark surface (#2C2C2A) with light text (#E8E6DF).
  // In dark mode: a slightly lighter surface for distinction.
  const { colors, resolvedMode } = useTheme();
  const isDark = resolvedMode === 'dark';

  // Toast background: inverted so it stands out against page background.
  const toastBg = isDark ? '#3A3A37' : colors.text;
  const toastText = isDark ? colors.text : colors.onPrimary;

  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      return;
    }

    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    const duration = onUndo ? 5000 : 3000;

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onDismiss?.();
        }
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, opacity, onDismiss, onUndo]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          backgroundColor: toastBg,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.message, { color: toastText }]}>
        {message ?? t('toast.saved')}
      </Text>

      {onUndo && (
        <Pressable
          onPress={onUndo}
          accessibilityRole="button"
          accessibilityLabel={t('toast.undo')}
          style={styles.undoButton}
        >
          <Text style={[styles.undoText, { color: colors.primary }]}>
            {t('toast.undo')}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    elevation: 5,
  },
  message: {
    fontSize: 14,
    flex: 1,
  },
  undoButton: {
    padding: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  undoText: {
    fontWeight: '700',
  },
});
