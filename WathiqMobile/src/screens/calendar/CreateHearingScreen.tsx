import React, { useState } from 'react';
import {
    View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, TextInput, Surface, SegmentedButtons } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hearingsApi } from '../../api/hearings';
import { colors } from '../../theme/colors';

export function CreateHearingScreen({ navigation, route }: any) {
    const preselectedCaseId = route.params?.caseId;
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        title: '',
        date: '',
        time: '',
        court: '',
        courtRoom: '',
        caseId: preselectedCaseId || '',
        notes: '',
        status: 'SCHEDULED',
    });

    const mutation = useMutation({
        mutationFn: (data: any) => hearingsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hearings'] });
            Alert.alert('تم بنجاح', 'تم إضافة الجلسة بنجاح');
            navigation.goBack();
        },
        onError: (err: any) => {
            Alert.alert('خطأ', err?.response?.data?.message || 'حدث خطأ أثناء الحفظ');
        },
    });

    const handleSubmit = () => {
        if (!form.title.trim()) {
            Alert.alert('تنبيه', 'الرجاء إدخال عنوان الجلسة');
            return;
        }
        if (!form.date.trim()) {
            Alert.alert('تنبيه', 'الرجاء إدخال تاريخ الجلسة');
            return;
        }
        mutation.mutate(form);
    };

    const updateField = (key: string, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {/* Basic Info */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>معلومات الجلسة</Text>

                    <TextInput
                        label="عنوان الجلسة *"
                        value={form.title}
                        onChangeText={(v) => updateField('title', v)}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={colors.borderLight}
                        activeOutlineColor={colors.primary}
                        left={<TextInput.Icon icon="gavel" />}
                    />

                    <TextInput
                        label="التاريخ * (YYYY-MM-DD)"
                        value={form.date}
                        onChangeText={(v) => updateField('date', v)}
                        mode="outlined"
                        style={styles.input}
                        placeholder="2026-02-20"
                        outlineColor={colors.borderLight}
                        activeOutlineColor={colors.primary}
                        left={<TextInput.Icon icon="calendar" />}
                    />

                    <TextInput
                        label="الوقت (HH:MM)"
                        value={form.time}
                        onChangeText={(v) => updateField('time', v)}
                        mode="outlined"
                        style={styles.input}
                        placeholder="09:30"
                        outlineColor={colors.borderLight}
                        activeOutlineColor={colors.primary}
                        left={<TextInput.Icon icon="clock-outline" />}
                    />
                </Surface>

                {/* Location */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>الموقع</Text>

                    <TextInput
                        label="المحكمة"
                        value={form.court}
                        onChangeText={(v) => updateField('court', v)}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={colors.borderLight}
                        activeOutlineColor={colors.primary}
                        left={<TextInput.Icon icon="map-marker" />}
                    />

                    <TextInput
                        label="القاعة"
                        value={form.courtRoom}
                        onChangeText={(v) => updateField('courtRoom', v)}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={colors.borderLight}
                        activeOutlineColor={colors.primary}
                        left={<TextInput.Icon icon="home" />}
                    />
                </Surface>

                {/* Case ID */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>ربط بقضية</Text>
                    <TextInput
                        label="معرف القضية"
                        value={form.caseId}
                        onChangeText={(v) => updateField('caseId', v)}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={colors.borderLight}
                        activeOutlineColor={colors.primary}
                        left={<TextInput.Icon icon="briefcase" />}
                    />
                </Surface>

                {/* Notes */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>ملاحظات</Text>
                    <TextInput
                        value={form.notes}
                        onChangeText={(v) => updateField('notes', v)}
                        mode="outlined"
                        style={[styles.input, { minHeight: 100 }]}
                        multiline
                        numberOfLines={4}
                        outlineColor={colors.borderLight}
                        activeOutlineColor={colors.primary}
                        placeholder="ملاحظات إضافية..."
                    />
                </Surface>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitBtn, mutation.isPending && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={mutation.isPending}
                >
                    <Icon name="plus" size={20} color={colors.white} />
                    <Text style={styles.submitText}>
                        {mutation.isPending ? 'جاري الحفظ...' : 'إضافة الجلسة'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    section: {
        borderRadius: 16, padding: 16,
        backgroundColor: colors.white, marginBottom: 16,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
    input: { marginBottom: 12, backgroundColor: colors.white },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.primary, borderRadius: 14,
        paddingVertical: 15, gap: 8, marginTop: 8,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
