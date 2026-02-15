import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../../theme/colors';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: string;
    color: string;
    onPress?: () => void;
}

export function StatCard({ title, value, icon, color, onPress }: StatCardProps) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Surface style={styles.card} elevation={1}>
                <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                    <Icon name={icon} size={20} color={color} />
                </View>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.title}>{title}</Text>
            </Surface>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 14,
        backgroundColor: colors.white,
        minWidth: 0,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    value: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'right',
        marginBottom: 2,
    },
    title: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'right',
    },
});
