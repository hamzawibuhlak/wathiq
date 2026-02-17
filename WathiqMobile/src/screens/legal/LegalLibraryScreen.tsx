import React from 'react';
import {
    View, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Text, Surface, Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../../theme/colors';

const sections = [
    {
        title: 'الأنظمة واللوائح',
        icon: 'book',
        description: 'الأنظمة واللوائح السعودية والعربية',
        screen: 'Regulations',
    },
    {
        title: 'السوابق القضائية',
        icon: 'archive',
        description: 'أحكام المحاكم والسوابق القضائية',
        screen: 'Precedents',
    },
    {
        title: 'المصطلحات القانونية',
        icon: 'book-open',
        description: 'معجم المصطلحات القانونية',
        screen: 'Glossary',
    },
    {
        title: 'المفضلة',
        icon: 'bookmark',
        description: 'المحتوى المحفوظ في المفضلة',
        screen: 'Bookmarks',
    },
];

export function LegalLibraryScreen({ navigation }: any) {
    const [search, setSearch] = React.useState('');

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Searchbar
                placeholder="ابحث في المكتبة القانونية..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchbar}
                inputStyle={styles.searchInput}
            />

            <View style={styles.grid}>
                {sections.map((section) => (
                    <TouchableOpacity
                        key={section.title}
                        style={styles.cardWrapper}
                        onPress={() => {
                            // Navigate to sub-screen when available
                        }}
                    >
                        <Surface style={styles.card} elevation={2}>
                            <View style={styles.cardIcon}>
                                <Icon name={section.icon} size={28} color={colors.primary} />
                            </View>
                            <Text style={styles.cardTitle}>{section.title}</Text>
                            <Text style={styles.cardDesc}>{section.description}</Text>
                        </Surface>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Quick Action */}
            <TouchableOpacity
                style={styles.aiButton}
                onPress={() => navigation?.navigate?.('LegalSearch')}
            >
                <Icon name="zap" size={20} color={colors.white} />
                <Text style={styles.aiButtonText}>البحث الذكي بالذكاء الاصطناعي</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 80 },
    searchbar: { borderRadius: 12, elevation: 1, backgroundColor: colors.white, marginBottom: 20 },
    searchInput: { fontSize: 14 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    cardWrapper: { width: '48%', marginBottom: 14 },
    card: {
        borderRadius: 16, padding: 20,
        backgroundColor: colors.white, alignItems: 'center',
    },
    cardIcon: {
        width: 56, height: 56, borderRadius: 16,
        backgroundColor: colors.primaryLight || '#EEF0FF',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    cardTitle: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 4 },
    cardDesc: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
    aiButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.primary, borderRadius: 14,
        paddingVertical: 14, marginTop: 10, gap: 8,
    },
    aiButtonText: { fontSize: 15, fontWeight: '600', color: colors.white },
});
