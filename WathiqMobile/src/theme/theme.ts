import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { colors } from './colors';

export const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: colors.primary,
        primaryContainer: colors.primaryBg,
        secondary: colors.secondary,
        secondaryContainer: 'rgba(139, 92, 246, 0.08)',
        background: colors.background,
        surface: colors.surface,
        surfaceVariant: colors.surfaceAlt,
        error: colors.error,
        errorContainer: colors.errorBg,
        onPrimary: colors.white,
        onSecondary: colors.white,
        onBackground: colors.text,
        onSurface: colors.text,
        onSurfaceVariant: colors.textSecondary,
        outline: colors.border,
        outlineVariant: colors.borderLight,
    },
    roundness: 12,
};

export type AppTheme = typeof theme;
