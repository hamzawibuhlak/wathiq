import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { colors } from '../../theme/colors';

interface LoadingSpinnerProps {
    message?: string;
    fullScreen?: boolean;
}

export function LoadingSpinner({ message = 'جاري التحميل...', fullScreen = true }: LoadingSpinnerProps) {
    if (!fullScreen) {
        return (
            <View style={styles.inline}>
                <ActivityIndicator size="small" color={colors.primary} />
                {message ? <Text style={styles.inlineText}>{message}</Text> : null}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.text}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    text: {
        marginTop: 16,
        fontSize: 14,
        color: colors.textSecondary,
    },
    inline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 10,
    },
    inlineText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
});
