# SaveMode Theme System

This folder contains the shared design tokens and theme configuration used throughout SaveMode.

## Theme modes

SaveMode supports three user-selectable modes:

| Mode   | Behavior                                           |
| ------ | -------------------------------------------------- |
| System | Follows the operating system or browser appearance |
| Light  | Always uses the light palette                      |
| Dark   | Always uses the dark palette                       |

The selected preference is persisted using AsyncStorage.

Implementation: `theme-context.tsx`

## Theme files

| File                | Responsibility                                       |
| ------------------- | ---------------------------------------------------- |
| `colors.ts`         | Brand colours and light/dark semantic colours        |
| `tag-colors.ts`     | 16 named tag colours for both modes                  |
| `typography.ts`     | Inter font families, sizes, weights and line heights |
| `spacing.ts`        | Shared spacing values                                |
| `radius.ts`         | Shared corner radius values                          |
| `theme-context.tsx` | Theme state, persistence and `useTheme()`            |
| `index.ts`          | Public theme exports                                 |

## Using theme colours

Use `useTheme()` inside components rendered within `ThemeProvider`.

```tsx
import { useTheme } from '../../theme/theme-context';

export default function ExampleScreen() {
  const { colors, mode, resolvedMode, setMode } = useTheme();

  return (
    // Use colors.background, colors.text,
    // colors.primary and other semantic tokens.
    null
  );
}
```

Use `setMode('system')`, `setMode('light')` or `setMode('dark')` to change the selected mode.

`resolvedMode` indicates the actual light or dark palette currently in use.

## Using typography

Use the shared typography definitions:

```tsx
import { typography } from '../../theme/typography';

const titleStyle = {
  fontFamily: typography.fontFamily.bold,
  fontSize: typography.fontSize.xxl,
  lineHeight: typography.lineHeight.xxl,
};
```

For ordinary screen text, use the shared `AppText` component:

```tsx
import Text from '../../components/AppText';
```

Inter font files are loaded in the root application layout.

## Using spacing and radius

```tsx
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';

const styles = {
  padding: spacing.lg,
  borderRadius: radius.medium,
};
```

## Tag colours

Use `tagColors` from `useTheme()` for mode-aware tag backgrounds.

The available named colours are:

Red, Orange, Amber, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Blue, Indigo, Violet, Purple, Pink and Rose.

## Development rules

- Use semantic theme colours in screens and components.
- Do not hardcode hexadecimal colours in screen files.
- Use shared typography, spacing and radius tokens.
- Make sure text remains readable in both modes.
- Check inputs, borders, icons and surfaces in both modes.
- Preserve System, Light and Dark behavior.
- Avoid creating separate colour values inside individual screens.

Raw colour values should be maintained in the theme token files.

## Theme preview

The theme preview route is:

`/theme-preview`

It displays the light and dark palettes, tag colours, typography, spacing and radius values.

## Design Pack status

The official Design Pack v1.0 was not present in the project documentation when this README was updated.

The brand colours currently documented by the project are:

- Teal: `#0F6E56`
- Gold: `#854F0B`

Other palette values are provisional implementation values and must be verified against the approved Design Pack before claiming exact design compliance.

**Owner:** To be confirmed (Tech Arch 4).
