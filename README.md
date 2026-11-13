# SaveMode

Save Mode is a privacy-focused personal expense management application built with Expo, React Native and TypeScript. Runs on Android 9+ and iOS 16.4+.

## Prerequisites

- Node.js LTS
- Git
- Visual Studio Code or another code editor
- Expo Go for testing on a compatible Android device

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/joshitha29-08/SaveMode.git
cd SaveMode
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create your local environment file:

Windows:

```powershell
Copy-Item .env.example .env
```

Mac/Linux:

```bash
cp .env.example .env
```

Configure the Supabase values using the instructions below.

Never commit `.env` or expose secret keys.

## Running the application

### Web

```bash
npm run web
```

Open the URL printed in the terminal. The default Expo web URL is usually:

`http://localhost:8081`

### Android

1. Install Expo Go on your compatible Android device.
2. Connect your computer and phone to the same Wi-Fi network.
3. Run:

```bash
npm start
```

4. Scan the terminal QR code using Expo Go.
5. Wait for the application to load.

If the default port is busy, use the port displayed by Expo.

## Development checks

Run these checks before submitting changes:

```bash
npm run typecheck
npm test -- --runInBand
npm run lint
npm run format:check
```

To format project files:

```bash
npm run format
```

## Project structure

| Folder | Responsibility |
| --- | --- |
| `src/app` | Expo Router screens and navigation |
| `src/components` | Shared UI components |
| `src/constants` | App constants |
| `src/data` | Data access and backend integration |
| `src/features` | Feature-specific functionality |
| `src/hooks` | Shared React hooks |
| `src/i18n` | Localization resources |
| `src/lib` | Shared helpers, session and routing |
| `src/theme` | Colours, typography, spacing and radius tokens |
| `src/types` | TypeScript types |
| `src/__tests__` | Tests |
| `supabase` | Database scripts and configuration |
| `plugins` | Expo plugins |
| `docs` | Project documentation |
| `.github` | Repository workflows and templates |

## Theme system

SaveMode supports three theme modes:

- **System:** follows the operating system or browser appearance.
- **Light:** forces the light theme.
- **Dark:** forces the dark theme.

Theme preferences are persisted locally using AsyncStorage.

Shared text should use the `AppText` component from `src/components/AppText.tsx`. Use the design tokens in `src/theme` instead of hardcoding colours, typography, spacing or corner radii in screens.

See `src/theme/README.md` for implementation guidance.

The current palette is provisional until the official Design Pack v1.0 is available for verification.

## Supabase configuration

SaveMode uses Supabase for backend and database functionality.

### Getting access

1. Request access to the SaveMode Supabase project from the project administrator.
2. Open the Supabase Dashboard.
3. Locate the project's API settings.
4. Obtain the approved Project URL and public client key.
5. Add them to your local `.env` file.

### Environment variables

Use the variable names defined in `.env.example`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Security guidelines

- Never commit `.env`.
- Never expose Supabase Secret Keys or `service_role` keys in client code.
- Keep `.env.example` limited to placeholder values.
- Use only the approved public client key in the application.

## Documentation

Each major project folder contains a README describing its responsibility.

Project-specific requirements, architecture decisions and handover information belong in `docs`.
