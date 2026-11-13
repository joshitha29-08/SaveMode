Delete Account Public Page (Expo Router / React Native)

Files:
- delete-account.tsx: Add this file to your project's src/app folder.

Route:
- With the file at src/app/delete-account.tsx, the route is /delete-account.

Before running:
1. Check that your login screen really has the route /(auth)/login.
2. If it is different, update the Link href in delete-account.tsx.
3. Start your Expo project with: npx expo start

Important:
This is the public information page only. It does not perform account deletion.
Connect the real deletion flow/backend separately. To satisfy a public web URL
requirement, configure and deploy the web build so /delete-account is reachable
without signing in.
