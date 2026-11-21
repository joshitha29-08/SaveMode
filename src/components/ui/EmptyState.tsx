import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '../../i18n';
import { useTheme } from '../../theme/theme-context';

export type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap | React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  /** Backwards compatibility with existing callers */
  onAddSource?: () => void;
};

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  onAddSource,
}: EmptyStateProps) {
  const { colors } = useTheme();

  const handleAction = onAction ?? onAddSource;
  const resolvedActionLabel =
    actionLabel ?? (onAddSource ? t('action.add.source') : undefined);
  const resolvedTitle = title ?? t('empty.state.sources');

  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    const iconName = typeof icon === 'string' ? icon : 'bank-outline';
    return (
      <MaterialCommunityIcons
        name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
        size={44}
        color={colors.textSecondary}
        accessible={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderIcon()}

      <Text style={[styles.title, { color: colors.text }]}>
        {resolvedTitle}
      </Text>

      {description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      ) : null}

      {handleAction && resolvedActionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={resolvedActionLabel}
          onPress={handleAction}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            {resolvedActionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  button: {
    backgroundColor: '#2457C5',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
