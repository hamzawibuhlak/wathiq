import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Searchbar, Text, Surface, Chip, Card, Button, ActivityIndicator } from 'react-native-paper';
import { useMutation } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Feather';
import { legalApi } from '../../api/legal';
import { colors } from '../../theme/colors';

export function LegalSearchScreen() {
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState<'keyword' | 'ai'>('keyword');

    const searchMutation = useMutation({
        mutationFn: (q: string) =>
            mode === 'keyword' ? legalApi.keywordSearch(q) : legalApi.askAI(q),
    });

    const handleSearch = () => {
        if (query.trim()) searchMutation.mutate(query);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Icon name="book-open" size={24} color={colors.primary} />
                </View>
                <Text style={styles.headerTitle}>البحث القانوني</Text>
                <Text style={styles.headerSubtitle}>ابحث في الأنظمة واللوائح السعودية</Text>
            </View>

            {/* Mode Toggle */}
            <View style={styles.modeToggle}>
                <Chip
                    selected={mode === 'keyword'}
                    onPress={() => setMode('keyword')}
                    style={[styles.modeChip, mode === 'keyword' && styles.activeChip]}
                    textStyle={mode === 'keyword' ? styles.activeChipText : styles.chipText}
                    icon={mode === 'keyword' ? 'magnify' : undefined}
                >
                    بحث بالكلمات
                </Chip>
                <Chip
                    selected={mode === 'ai'}
                    onPress={() => setMode('ai')}
                    style={[styles.modeChip, mode === 'ai' && styles.activeChip]}
                    textStyle={mode === 'ai' ? styles.activeChipText : styles.chipText}
                    icon={mode === 'ai' ? 'robot' : undefined}
                >
                    الذكاء الاصطناعي
                </Chip>
            </View>

            {/* Search Bar */}
            <Searchbar
                placeholder={mode === 'keyword' ? 'ابحث عن مادة قانونية...' : 'اسأل سؤالاً قانونياً...'}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                style={styles.searchbar}
                inputStyle={{ fontSize: 14 }}
            />

            {/* Results */}
            <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
                {searchMutation.isPending && (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>
                            {mode === 'ai' ? 'جاري تحليل سؤالك...' : 'جاري البحث...'}
                        </Text>
                    </View>
                )}

                {/* AI Answer */}
                {mode === 'ai' && searchMutation.data?.answer && (
                    <Surface style={styles.aiCard} elevation={2}>
                        <View style={styles.aiHeader}>
                            <Icon name="cpu" size={18} color="#8B5CF6" />
                            <Text style={styles.aiHeaderText}>الإجابة القانونية</Text>
                            {searchMutation.data?.provider && (
                                <View style={styles.providerBadge}>
                                    <Text style={styles.providerText}>{searchMutation.data.provider}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.aiAnswer}>{searchMutation.data.answer}</Text>

                        {searchMutation.data.citations?.length > 0 && (
                            <View style={styles.citations}>
                                <Text style={styles.citationsTitle}>المراجع:</Text>
                                {searchMutation.data.citations.map((citation: any, i: number) => (
                                    <Text key={i} style={styles.citationItem}>
                                        • {citation.articleNumber} — {citation.legalSystem}
                                    </Text>
                                ))}
                            </View>
                        )}
                    </Surface>
                )}

                {/* Keyword Results */}
                {searchMutation.data?.results?.map((result: any, index: number) => (
                    <Surface key={result.id || index} style={styles.resultCard} elevation={1}>
                        <View style={styles.resultHeader}>
                            <View style={styles.articleBadge}>
                                <Text style={styles.articleText}>{result.articleNumber}</Text>
                            </View>
                            <Text style={styles.systemName} numberOfLines={1}>{result.legalSystem}</Text>
                        </View>
                        <Text style={styles.resultText} numberOfLines={4}>{result.text}</Text>
                    </Surface>
                ))}

                {searchMutation.isSuccess && !searchMutation.data?.results?.length && mode === 'keyword' && (
                    <View style={styles.noResults}>
                        <Icon name="search" size={40} color={colors.textMuted} />
                        <Text style={styles.noResultsText}>لا توجد نتائج</Text>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { alignItems: 'center', paddingTop: 20, paddingBottom: 12 },
    headerIcon: {
        width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primaryBg,
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    headerSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    modeToggle: {
        flexDirection: 'row', justifyContent: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 8,
    },
    modeChip: { flex: 1 },
    activeChip: { backgroundColor: colors.primary },
    chipText: { color: colors.textSecondary, fontSize: 13 },
    activeChipText: { color: colors.white, fontSize: 13 },
    searchbar: {
        marginHorizontal: 16, marginBottom: 12, borderRadius: 12,
        backgroundColor: colors.white, elevation: 1,
    },
    results: { flex: 1, paddingHorizontal: 16 },
    loading: { alignItems: 'center', padding: 40, gap: 12 },
    loadingText: { fontSize: 14, color: colors.textSecondary },
    aiCard: {
        padding: 16, borderRadius: 16, backgroundColor: '#FAF5FF',
        borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)', marginBottom: 12,
    },
    aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    aiHeaderText: { fontSize: 15, fontWeight: '600', color: '#7C3AED', flex: 1 },
    providerBadge: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    },
    providerText: { fontSize: 11, color: '#7C3AED' },
    aiAnswer: { fontSize: 15, color: colors.text, lineHeight: 26 },
    citations: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(139, 92, 246, 0.15)' },
    citationsTitle: { fontSize: 13, fontWeight: '600', color: '#7C3AED', marginBottom: 6 },
    citationItem: { fontSize: 13, color: colors.textSecondary, marginBottom: 3 },
    resultCard: { padding: 14, borderRadius: 12, backgroundColor: colors.white, marginBottom: 10 },
    resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    articleBadge: { backgroundColor: colors.primaryBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    articleText: { fontSize: 12, fontWeight: '600', color: colors.primary },
    systemName: { fontSize: 12, color: colors.textMuted, flex: 1 },
    resultText: { fontSize: 14, color: colors.text, lineHeight: 22 },
    noResults: { alignItems: 'center', padding: 40, gap: 12 },
    noResultsText: { fontSize: 15, color: colors.textMuted },
});
