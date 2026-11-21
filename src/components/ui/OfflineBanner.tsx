import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '../../i18n';
import { useTheme } from '../../theme/theme-context';

type OfflineBannerProps = {
  visible: boolean;
};

export default function OfflineBanner({ visible }: OfflineBannerProps) {
  // D3: Use theme warning token and computed background from theme colors.
  const { colors, resolvedMode } = useTheme();
  const isDark = resolvedMode === 'dark';

  if (!visible) return null;

  // warning token: light='#854F0B' (brown-amber), dark='#EF9F27' (amber).
  // Background: a tinted surface derived from warning hue.
  const bannerBg = isDark ? '#3D3218' : '#FFF1CC';
  const textColor = colors.warning;

  return (
    <View
      style={[styles.container, { backgroundColor: bannerBg }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <MaterialCommunityIcons
        name="wifi-off"
        size={18}
        color={textColor}
        accessible={false}
      />

      <Text style={[styles.message, { color: textColor }]}>
        {t('info.offline')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderRadius: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
});
