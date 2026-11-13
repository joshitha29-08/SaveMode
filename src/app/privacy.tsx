import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '../constants/colors';

const sections = [
  {
    title: '1. Introduction',
    body: 'Welcome to SaveMode! SaveMode is a personal expense management application that helps users manage their income, expenses and financial records. We respect your privacy and are committed to protecting your personal information.',
  },
  {
    title: '2. Information We Collect',
    body: 'We collect only the information needed to provide our services: your name, email address, and financial entries such as income, expenses and transactions that you manually enter.',
  },
  {
    title: '3. How We Use Your Information',
    body: 'We use your information to create and manage your account, display your income and expenses, maintain your financial records, and provide app features and services.',
  },
  {
    title: '4. Data Storage and Security',
    body: 'Your information is stored using Supabase, with the database hosted in Mumbai, India. Your personal financial information is accessible only to you through your account. Appropriate security measures are used to protect your information.',
  },
  {
    title: '5. Third-Party Services',
    body: 'SaveMode uses third-party services for database storage, web hosting and email services. SaveMode does not support Google or Apple sign-in in version 1.0.',
  },
  {
    title: '6. Data Retention',
    body: 'We keep your information until you delete your account. Once your account is deleted, your associated personal information will be deleted according to our deletion process.',
  },
  {
    title: '7. App Permissions',
    body: 'SaveMode requests only the permissions needed for features you choose to use. If you turn on reminders, the app may request notification permission so it can send reminders. If you turn on App Lock, the app may request Face ID permission on iOS or biometric authentication on supported devices. We explain the reason before requesting these permissions. SaveMode does not request SMS, contacts, location, camera, storage or phone permissions, and does not read SMS messages or notifications.',
  },
  {
    title: '8. No Money Transfers or Advertisements',
    body: 'SaveMode is an expense management application. We do not transfer money or access bank accounts to move money. We do not display advertisements or use advertising trackers. Financial entries are manually entered by users.',
  },
  {
    title: '9. Account Deletion',
    body: 'You can request deletion of your SaveMode account using the account deletion option in the application. If you need assistance, contact us at contactus@whitepixeltechnologies.in. Account deletion permanently removes your account and associated information according to the deletion process.',
  },
  {
    title: '10. Changes to This Privacy Policy',
    body: 'We may update this Privacy Policy when necessary. Any changes will be published on this page with an updated date.',
  },
  {
    title: '11. Contact Us',
    body: 'If you have questions, concerns or a grievance about this Privacy Policy, contact White Pixel Technologies at contactus@whitepixeltechnologies.in.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Privacy Policy', headerShown: true }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.updated}>Last Updated: 11 November 2026</Text>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.heading}>{section.title}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
        <Text style={styles.email}>Email: contactus@whitepixeltechnologies.in</Text>
        <Text style={styles.company}>Company: White Pixel Technologies</Text>
        <Text style={styles.review}>Draft for WPT approval and legal review before launch.</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: Colors.primary, fontSize: 26, fontWeight: '700', marginBottom: 8 },
  updated: { color: '#666666', fontSize: 13, marginBottom: 22 },
  section: { marginBottom: 20 },
  heading: { color: '#171717', fontSize: 17, fontWeight: '700', marginBottom: 7 },
  body: { color: '#444444', fontSize: 15, lineHeight: 23 },
  email: { color: '#333333', fontSize: 15, marginTop: 4 },
  company: { color: '#333333', fontSize: 15, marginTop: 6 },
  review: { color: '#777777', fontSize: 12, lineHeight: 18, marginTop: 18 },
});
