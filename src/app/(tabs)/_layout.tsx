import { Feather } from '@expo/vector-icons';
import { Slot, usePathname, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationText } from '../../constants/navigation';
import { useTheme } from '../../theme/theme-context';

const places = [
  { label: NavigationText.home, path: '/home', icon: 'home' as const },
  {
    label: NavigationText.transactions,
    path: '/transactions',
    icon: 'list' as const,
  },
  {
    label: NavigationText.sources,
    path: '/sources',
    icon: 'credit-card' as const,
  },
  {
    label: NavigationText.settings,
    path: '/settings',
    icon: 'settings' as const,
  },
];

function NavigationLink({
  label,
  path,
  icon,
  active,
  vertical = false,
  mutedColor,
  activeColor,
}: {
  label: string;
  path: string;
  icon: ComponentProps<typeof Feather>['name'];
  active: boolean;
  vertical?: boolean;
  mutedColor: string;
  activeColor: string;
}) {
  const color = active ? activeColor : mutedColor;
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => {
        router.push(path as never);
      }}
      style={StyleSheet.flatten([
        styles.navLink,
        vertical ? styles.verticalLink : undefined,
      ])}
    >
      <Feather name={icon} size={20} color={color} />
      <Text style={StyleSheet.flatten([styles.navLabel, { color }])}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { colors } = useTheme();
  const desktop = width >= 1024;
  const background = colors.background;
  const foreground = colors.text;
  const mutedColor = colors.textMuted;
  const border = colors.border;
  const showAdd = pathname === '/home' || pathname === '/transactions';

  return (
    <View
      style={StyleSheet.flatten([
        styles.screen,
        { backgroundColor: background },
      ])}
    >
      {desktop && (
        <View
          style={StyleSheet.flatten([
            styles.sidebar,
            { borderRightColor: border },
          ])}
        >
          <Text
            style={StyleSheet.flatten([styles.brand, { color: foreground }])}
          >
            {NavigationText.appName}
          </Text>

          {places.map((place) => (
            <NavigationLink
              key={place.path}
              {...place}
              vertical
              mutedColor={mutedColor}
              activeColor={colors.primary}
              active={pathname === place.path}
            />
          ))}
        </View>
      )}

      <View style={styles.main}>
        {desktop && showAdd && (
          <View
            style={StyleSheet.flatten([
              styles.header,
              { borderBottomColor: border },
            ])}
          >
            {showAdd && (
              <Pressable
                accessibilityRole="button"
                style={StyleSheet.flatten([
                  styles.addButton,
                  { backgroundColor: colors.primary },
                ])}
              >
                <Feather name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.addButtonText}>
                  {NavigationText.addTransaction}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          <View style={styles.contentWidth}>
            <Slot />
          </View>
        </ScrollView>

        {!desktop && (
          <View
            style={StyleSheet.flatten([
              styles.bottomBar,
              {
                backgroundColor: background,
                borderTopColor: border,
                paddingBottom: Math.max(insets.bottom, 8),
              },
            ])}
          >
            <NavigationLink
              {...places[0]}
              mutedColor={mutedColor}
              activeColor={colors.primary}
              active={pathname === places[0].path}
            />
            <NavigationLink
              {...places[1]}
              mutedColor={mutedColor}
              activeColor={colors.primary}
              active={pathname === places[1].path}
            />

            {showAdd && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={NavigationText.addTransaction}
                style={StyleSheet.flatten([
                  styles.plusButton,
                  { backgroundColor: colors.primary, borderColor: background },
                ])}
              >
                <Feather name="plus" size={26} color="#FFFFFF" />
              </Pressable>
            )}

            <NavigationLink
              {...places[2]}
              mutedColor={mutedColor}
              activeColor={colors.primary}
              active={pathname === places[2].path}
            />
            <NavigationLink
              {...places[3]}
              mutedColor={mutedColor}
              activeColor={colors.primary}
              active={pathname === places[3].path}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 224,
    borderRightWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 12,
  },
  brand: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    minHeight: 72,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  addButton: {
    position: 'absolute',
    right: 24,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  contentWidth: {
    width: '100%',
    maxWidth: 1200,
    flex: 1,
  },
  bottomBar: {
    minHeight: 68,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  navLink: {
    minWidth: 56,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  verticalLink: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
    paddingHorizontal: 12,
  },
  navLabel: {
    fontSize: 11,
  },
  plusButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    borderWidth: 4,
  },
});
