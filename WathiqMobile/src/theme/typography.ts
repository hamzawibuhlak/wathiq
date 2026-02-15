import { Platform } from 'react-native';

// Arabic-first font configuration
const fontFamily = Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
});

export const typography = {
    fontFamily,

    sizes: {
        xs: 11,
        sm: 13,
        md: 15,
        lg: 17,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
    },

    weights: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};
