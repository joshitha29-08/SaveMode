import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { t } from '../../i18n';
import { useTheme } from '../../theme/theme-context';

type LoadingStateProps = {
  onRetry?: () => void;
  spinnerSize?: 'small' | 'large';
};

export default function LoadingState({
  onRetry,
  spinnerSize = 'large',
}: LoadingStateProps) {
  const { colors } = useTheme();
  const [isSlow, setIsSlow] = useState(false);

  const textColor = colors.text;
  const skeletonColor = colors.surfaceSecondary;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSlow(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={t('loading.label')}
    >
      <ActivityIndicator size={spinnerSize} color={colors.primary} />

      <View style={[styles.skeleton, { backgroundColor: skeletonColor }]} />
      <View
        style={[
          styles.skeleton,
          { backgroundColor: skeletonColor, opacity: 0.7 },
        ]}
      />

      {isSlow && (
        <View style={styles.slowContainer}>
          <Text
            style={[styles.message, { color: textColor }]}
            accessibilityLiveRegion="polite"
          >
            {t('loading.slow')}
          </Text>

          {onRetry && (
            <Pressable
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel={t('action.retry')}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>{t('action.retry')}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    alignItems: 'center',
  },
  skeleton: {
    height: 72,
    width: '100%',
    borderRadius: 12,
  },
  slowContainer: {
    alignItems: 'center',
    gap: 12,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  retryText: {
    color: '#0F6E56',
    fontSize: 14,
    fontWeight: '600',
  },
});
