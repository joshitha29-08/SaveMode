# Shared Components

This folder contains reusable UI components used across SaveMode screens.

## Current shared component

### AppText

`AppText.tsx` wraps React Native Text and applies the project's Inter typography.

Import it using:

```tsx
import Text from '../../components/AppText';
```

Adjust the relative import path according to the component's location.

Use `AppText` for visible application text instead of importing React Native Text directly in screens.

## Component guidelines

- Keep components reusable and focused.
- Prefer theme tokens for colours and typography.
- Support readable text and accessible controls.
- Avoid duplicating screen-specific functionality.
- Document component props when adding shared components.

Other shared UI components can be added here as the application grows.

**Owner:** To be confirmed (Tech Arch 4).
