import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Link } from 'expo-router';

export default function DeleteAccount() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Delete Your Account</Text>

        <Text style={styles.description}>
          If you want to delete your account, please follow the steps below.
        </Text>

        <Text style={styles.heading}>Steps to Delete Your Account</Text>
        <Text style={styles.text}>
          1. Log in to your account.{'\\n'}
          2. Go to Settings.{'\\n'}
          3. Select Delete Account.{'\\n'}
          4. Confirm your account deletion.
        </Text>

        <Text style={styles.heading}>What Information Will Be Deleted?</Text>
        <Text style={styles.text}>
          {'•'} Your transactions{'\\n'}
          {'•'} Your data sources{'\\n'}
          {'•'} Your saved tags{'\\n'}
          {'•'} Your account settings
        </Text>

        <Text style={styles.heading}>Need to Log In?</Text>
        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Log In</Text>
          </Pressable>
        </Link>

        <Text style={styles.date}>Last Updated: 11 November 2026</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F5FA',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 25,
    borderRadius: 12,
  },
  title: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#2456A6',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    lineHeight: 24,
  },
  heading: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#2456A6',
    marginTop: 20,
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#444',
    lineHeight: 30,
  },
  button: {
    backgroundColor: '#2456A6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  date: {
    color: '#888',
    fontSize: 13,
    marginTop: 25,
    textAlign: 'center',
  },
});
