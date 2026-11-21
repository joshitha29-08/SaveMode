import { useState } from 'react';
import { Redirect } from 'expo-router';
import { Button, ScrollView, Switch, Text, View } from 'react-native';

import ConfirmSheet from '../components/ui/ConfirmSheet';
import EmptyState from '../components/ui/EmptyState';
import InlineError from '../components/ui/InlineError';
import LoadingState from '../components/ui/LoadingState';
import OfflineBanner from '../components/ui/OfflineBanner';
import Toast from '../components/ui/Toast';
import { useAppTheme } from '../lib/theme';

export default function ComponentTest() {
  // D3-PROD-GUARD: This page is for development only.
  // In production builds, redirect to 404 so the route is not exposed.
  if (!__DEV__) {
    return <Redirect href="/+not-found" />;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isDark, setThemeMode } = useAppTheme();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [showOffline, setShowOffline] = useState(true);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [showConfirm, setShowConfirm] = useState(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [showToast, setShowToast] = useState(false);

  const textColor = isDark ? '#FFFFFF' : '#222222';

  return (
    <ScrollView
      style={{
        flex: 1,
        padding: 20,
        backgroundColor: isDark ? '#121212' : '#FFFFFF',
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: textColor,
          marginBottom: 20,
        }}
      >
        WPT 201 - A UI Components
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ color: textColor }}>
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </Text>
        <Switch
          value={isDark}
          onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
        />
      </View>

      <Text style={{ color: textColor, marginTop: 20 }}>
        C01 - Offline Banner
      </Text>
      <OfflineBanner visible={showOffline} />
      <Button
        title="Toggle Offline"
        onPress={() => setShowOffline(!showOffline)}
      />

      <Text style={{ color: textColor, marginTop: 20 }}>C02 - Empty State</Text>
      <EmptyState onAddSource={() => setShowToast(true)} />

      <Text style={{ color: textColor, marginTop: 20 }}>
        C03 - Inline Error - All Variants
      </Text>

      <InlineError
        variant="error"
        message="Something went wrong. Please try again."
        onRetry={() => setShowToast(true)}
      />

      <InlineError
        variant="warning"
        message="This account starts below zero."
      />

      <InlineError variant="info" message="Connect to the internet to save." />

      <InlineError variant="success" message="Changes saved successfully." />

      <Text style={{ color: textColor, marginTop: 20 }}>
        C04 - Loading State
      </Text>
      <LoadingState spinnerSize="small" onRetry={() => setShowToast(true)} />
      <LoadingState spinnerSize="large" onRetry={() => setShowToast(true)} />

      <Text style={{ color: textColor, marginTop: 20 }}>
        C05 - Confirm Sheet
      </Text>
      <Button title="Open Confirm Sheet" onPress={() => setShowConfirm(true)} />
      <ConfirmSheet
        visible={showConfirm}
        onKeepEditing={() => setShowConfirm(false)}
        onDiscard={() => setShowConfirm(false)}
      />

      <Text style={{ color: textColor, marginTop: 20 }}>C06 - Toast</Text>
      <Button title="Show Toast" onPress={() => setShowToast(true)} />
      <Toast
        visible={showToast}
        message="Changes saved"
        onUndo={() => setShowToast(false)}
        onDismiss={() => setShowToast(false)}
      />
    </ScrollView>
  );
}
