# SaveMode

SaveMode is a privacy-focused personal expense management application.

## How to Run

You need Node.js (LTS version), Git and a code editor such as VS Code.

### Set up (once)

1. Clone the repository and open the folder:

        git clone https://github.com/joshitha29-08/SaveMode.git
        cd SaveMode

2. Install the packages:

        npm install

3. Create your own .env file from the example, then fill in the values (see Supabase Configuration below). Never commit .env.

    Windows:

        copy .env.example .env

    Mac or Linux:

        cp .env.example .env

### Run on web

1. Start the web app:

        npm run web

2. Wait until the terminal shows "Web Bundled". The browser opens by itself. If it does not, open http://localhost:8081 (use the port the terminal shows if it is different).
3. Press Ctrl + C in the terminal to stop.

### Run on Android

1. Use an Android phone with Android 9 or later. Install the Expo Go app from the Play Store.
2. Connect the phone and the computer to the same Wi-Fi network.
3. Start the app:

        npx expo start

4. Open Expo Go on the phone, tap "Scan QR code", and scan the QR code shown in the terminal.
5. Wait for the app to load on the phone.
6. Press Ctrl + C in the terminal to stop.

### Checks before you push

        npm run typecheck
        npm test

## Folder Overview

- src/app - screens and navigation (Expo Router)
- src/components - shared screen pieces
- src/constants - fixed values such as colours
- src/features - code for each app feature
- src/data - code that reads and writes Supabase data
- src/hooks - reusable logic
- src/lib - shared helper code
- src/i18n - the shared text file (en.json)
- src/theme - colours, fonts and spacing
- src/types - TypeScript types
- assets - icons, splash and images
- supabase - database scripts
- plugins - custom Expo plugins
- docs - project documents

Most folders have their own README that says what the folder is for.

## Supabase Configuration

SaveMode uses Supabase for its backend and database.

### How to Get Supabase Keys

1. Ask the WPT project administrator to grant you access to the SaveMode Supabase project using your individual account.
2. Open the Supabase Dashboard and select the SaveMode project.
3. Get the Project URL and Public Key from the project's API settings.
4. Create a local .env file in the project root, using .env.example as a reference.
5. Add the Project URL and Public Key to your local .env file.

### Environment Variables

Add the following variables to your local .env file:

- EXPO_PUBLIC_SUPABASE_URL — Your Supabase Project URL.
- EXPO_PUBLIC_SUPABASE_ANON_KEY — Your Supabase public client key.

Use the variable names specified in .env.example.

### Security Guidelines

- Never commit the .env file or actual keys to GitHub.
- Never use the Supabase Secret Key or service_role key in the client application.
- Keep .env.example limited to placeholder values.
- Use only the approved public client key in the application.
