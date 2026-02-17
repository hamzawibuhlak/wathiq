import React, { useState } from 'react';
import {
    View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, TextInput, Surface, SegmentedButtons } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../../api/clients';
import { colors } from '../../theme/colors';

export function CreateClientScreen({ navigation, route }: any) {
    const editClient = route.params?.client;
    const isEdit = !!editClient;
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        name: editClient?.name || '',
        email: editClient?.email || '',
        phone: editClient?.phone || '',
        nationalId: editClient?.nationalId || editClient?.idNumber || '',
        address: editClient?.address || '',
        clientType: editClient?.clientType || 'INDIVIDUAL',
        notes: editClient?.notes || '',
    });

    const mutation = useMutation({
        mutationFn: (data: any) =>
            isEdit ? clientsApi.update(editClient.id, data) : clientsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            if (isEdit) queryClient.invalidateQueries({ queryKey: ['client', editClient.id] });
            Alert.alert('تم بنجاح', isEdit ? 'تم تحديث بيانات العميل' : 'تم إضافة العميل بنجاح');
            navigation.goBack();
        },
        onError: (err: any) => {
            Alert.alert('خطأ', err?.response?.data?.message || 'حدث خطأ أثناء الحفظ');
        },
    });

    const handleSubmit = () => {
        if (!form.name.trim()) {
            Alert.alert('تنبيه', 'الرجاء إدخال اسم العميل');
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
                {/* Client Type */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>نوع العميل</Text>
                    <SegmentedButtons
                        value={form.clientType}
                        onValueChange={(v) => updateField('clientType', v)}
                        buttons={[
                            { value: 'INDIVIDUAL', label: 'فرد', icon: 'account' },
                            { value: 'COMPANY', label: 'شركة', icon: 'domain' },
                        ]}
                        style={styles.segmented}
                    />
                </Surface>

                {/* Basic Info */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>

                    <TextInput
                        label="اسم العميل *"
                        value={form.name}
                        onChangeText={(v) => updateField('name', v)}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={colors.borderLight}
                        activeOutlineColor={colors.primary}
                        left={<TextInput.Icon icon="account" />}
                    />

                    <TextInput
                        label="البريد الإلكتروني"
                        value={form.email}
                        onChangeText={(v) => updateField('email', v)}
                        mode="outlined"
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        outlineColor={colors.borderLight}
                        activeOutlineColor={colors.primary}
                        left={<TextInput.Icon icon="email" />}
                    />

                    <TextInput
                        label="رقم الهاتف"
                        value={form.phone}
                        onChangeText={(v) => updateField('phone', v)}
                        mode="outlined"
                        style={styles.input}
                        keyboardType="phone-pad"
                        outlineColor={colors.borderLight}
                        activeOutlineColor={colors.primary}
                        left={<TextInput.Icon icon="phone" />}
                    />

                    <TextInput
                        label="رقم الهوية / السجل التجاري"
                        value={form.nationalId}
                        onChangeText={(v) => updateField('nationalId', v)}
                        mode="outlined"
                        style={styles.input}
                        keyboardType="numeric"
                        outlineColor={colors.borderLight}
                        activeOutlineColor={colors.primary}
                        left={<TextInput.Icon icon="card-account-details" />}
                    />

                    <TextInput
                        label="العنوان"
                        value={form.address}
                        onChangeText={(v) => updateField('address', v)}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={colors.borderLight}
                        activeOutlineColor={colors.primary}
                        left={<TextInput.Icon icon="map-marker" />}
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
                        placeholder="أضف ملاحظات حول العميل..."
                    />
                </Surface>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitBtn, mutation.isPending && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={mutation.isPending}
                >
                    <Icon name={isEdit ? 'check' : 'plus'} size={20} color={colors.white} />
                    <Text style={styles.submitText}>
                        {mutation.isPending ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة العميل'}
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
    segmented: { marginBottom: 4 },
    input: { marginBottom: 12, backgroundColor: colors.white },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.primary, borderRadius: 14,
        paddingVertical: 15, gap: 8, marginTop: 8,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
