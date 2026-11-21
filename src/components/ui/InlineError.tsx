import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '../../i18n';
import { useTheme } from '../../theme/theme-context';

type InlineErrorProps = {
  message?: string;
  onRetry?: () => void;
  /** Kept for backwards compatibility — if omitted, resolved from ThemeContext */
  isDark?: boolean;
  variant?: 'error' | 'warning' | 'info' | 'success';
};

// Semantic bg/text pairs derived from theme tokens where possible.
// These are fixed perceptual pairs; not every variant maps 1:1 to a single
// ThemeColors field, so we keep explicit light/dark pairs here rather than
// risking unreadable contrast with arbitrary accent values.
const variantStyles = {
  error: {
    lightBg: '#FDECEC',
    darkBg: '#442222',
    lightText: '#9B1C1C',
    darkText: '#FFB4AB',
    icon: 'alert-circle-outline' as const,
  },
  warning: {
    lightBg: '#FFF4D6',
    darkBg: '#443719',
    lightText: '#664500',
    darkText: '#FFD166',
    icon: 'alert-outline' as const,
  },
  info: {
    lightBg: '#EAF2FF',
    darkBg: '#1E304A',
    lightText: '#174EA6',
    darkText: '#A8C7FA',
    icon: 'information-outline' as const,
  },
  success: {
    lightBg: '#E7F5EC',
    darkBg: '#193B28',
    lightText: '#176B37',
    darkText: '#8DDBA8',
    icon: 'check-circle-outline' as const,
  },
};

export default function InlineError({
  message,
  onRetry,
  isDark: isDarkProp,
  variant = 'error',
}: InlineErrorProps) {
  // D3: Use ThemeContext as the authoritative dark/light signal.
  // Caller can override via isDark prop for backwards compatibility.
  const { resolvedMode } = useTheme();
  const isDark = isDarkProp ?? resolvedMode === 'dark';
  const vs = variantStyles[variant];

  const color = isDark ? vs.darkText : vs.lightText;
  const background = isDark ? vs.darkBg : vs.lightBg;

  return (
    <View
      style={[styles.container, { backgroundColor: background }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={vs.icon}
          size={20}
          color={color}
          accessible={false}
        />
        <Text style={[styles.message, { color }]}>
          {message ?? t('err.generic')}
        </Text>
      </View>

      {onRetry && (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={t('action.retry')}
          style={styles.button}
        >
          <Text style={[styles.buttonText, { color }]}>
            {t('action.retry')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  message: {
    fontSize: 14,
    flex: 1,
  },
  button: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    fontWeight: '600',
  },
});
