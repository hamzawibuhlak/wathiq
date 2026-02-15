// Fix react-native-paper TS2786: 'Text' cannot be used as a JSX component.
// This is a known issue between react-native-paper and React Native 0.76 type definitions.
// The fix is to augment the module to correct the return type.

import React from 'react';

declare module 'react-native-paper' {
    // Re-export Text with corrected JSX return type
    export const Text: React.FC<any>;
    export const Surface: React.FC<any>;
    export const Searchbar: React.FC<any>;
    export const Chip: React.FC<any>;
    export const FAB: React.FC<any>;
    export const TextInput: React.FC<any> & {
        Icon: React.FC<any>;
    };
    export const Button: React.FC<any>;
    export const HelperText: React.FC<any>;
    export const Avatar: {
        Text: React.FC<any>;
        Image: React.FC<any>;
    };
    export const Card: React.FC<any> & {
        Title: React.FC<any>;
        Content: React.FC<any>;
        Actions: React.FC<any>;
    };
    export const Divider: React.FC<any>;
    export const ActivityIndicator: React.FC<any>;
    export const PaperProvider: React.FC<any>;
    export const MD3LightTheme: any;
    export function configureFonts(config?: any): any;
}
