import React, { useState } from 'react';
import {
    View, StyleSheet, ScrollView, TouchableOpacity, Alert,
    KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { Text, TextInput, Surface, SegmentedButtons, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DocumentPicker from 'react-native-document-picker';
import { clientsApi } from '../../api/clients';
import { colors } from '../../theme/colors';
import apiService from '../../services/api.service';

const REP_DOC_TYPES = [
    { value: '', label: 'اختر نوع المستند...' },
    { value: 'COMMERCIAL_REG', label: 'السجل التجاري' },
    { value: 'ARTICLES_OF_ASSOC', label: 'عقد التأسيس' },
    { value: 'AUTH_LETTER', label: 'خطاب تفويض' },
    { value: 'POWER_OF_ATTORNEY', label: 'وكالة' },
];

export function CreateClientScreen({ navigation, route }: any) {
    const editClient = route.params?.client;
    const isEdit = !!editClient;
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        name: editClient?.name || '',
        clientType: editClient?.clientType || 'INDIVIDUAL',
        notes: editClient?.notes || '',
        // Individual
        nationalId: editClient?.nationalId || '',
        nationalIdDoc: editClient?.nationalIdDoc || '',
        phone: editClient?.phone || '',
        email: editClient?.email || '',
        // Company
        brandName: editClient?.brandName || '',
        unifiedNumber: editClient?.unifiedNumber || '',
        commercialReg: editClient?.commercialReg || '',
        commercialRegDoc: editClient?.commercialRegDoc || '',
        nationalAddressDoc: editClient?.nationalAddressDoc || '',
        // Rep
        repName: editClient?.repName || '',
        repIdentity: editClient?.repIdentity || '',
        repIdentityDoc: editClient?.repIdentityDoc || '',
        repPhone: editClient?.repPhone || '',
        repEmail: editClient?.repEmail || '',
        repDocType: editClient?.repDocType || '',
        repDoc: editClient?.repDoc || '',
    });

    const [uploadingField, setUploadingField] = useState<string | null>(null);

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
        // Clean empty optional fields
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(form)) {
            if (value !== '') cleaned[key] = value;
        }
        // Map clientType to lowercase for backend
        if (cleaned.clientType === 'INDIVIDUAL') {
            cleaned.clientType = 'individual';
        } else if (cleaned.clientType === 'COMPANY') {
            cleaned.clientType = 'company';
        }
        mutation.mutate(cleaned);
    };

    const updateField = (key: string, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleDocUpload = async (fieldName: string) => {
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
            });

            const file = result[0];
            if (!file) return;

            setUploadingField(fieldName);

            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.type || 'application/pdf',
                name: file.name || 'document',
            } as any);

            const res: any = await apiService.upload('/uploads/document', formData);
            const url = res?.data?.url || res?.url;
            if (url) {
                updateField(fieldName, url);
                Alert.alert('تم', 'تم رفع الملف بنجاح');
            }
        } catch (err: any) {
            if (!DocumentPicker.isCancel(err)) {
                Alert.alert('خطأ', 'فشل رفع الملف');
            }
        } finally {
            setUploadingField(null);
        }
    };

    const DocUploadButton = ({ label, fieldName, required = false }: { label: string; fieldName: string; required?: boolean }) => {
        const value = (form as any)[fieldName];
        const isUploading = uploadingField === fieldName;

        return (
            <View style={styles.docUpload}>
                <Text style={styles.docLabel}>{label} {required ? '*' : ''}</Text>
                <View style={styles.docRow}>
                    <TouchableOpacity
                        style={[styles.docBtn, isUploading && styles.docBtnDisabled]}
                        onPress={() => handleDocUpload(fieldName)}
                        disabled={isUploading}
                    >
                        <Icon name={isUploading ? 'loader' : 'upload'} size={16} color={colors.primary} />
                        <Text style={styles.docBtnText}>
                            {isUploading ? 'جاري الرفع...' : 'رفع ملف'}
                        </Text>
                    </TouchableOpacity>
                    {value ? (
                        <TouchableOpacity
                            style={styles.docDone}
                            onPress={() => Linking.openURL(value)}
                        >
                            <Icon name="check-circle" size={16} color="#10B981" />
                            <Text style={styles.docDoneText}>تم الرفع</Text>
                        </TouchableOpacity>
                    ) : required ? (
                        <Text style={styles.docRequired}>مطلوب</Text>
                    ) : null}
                </View>
            </View>
        );
    };

    const isCompany = form.clientType === 'COMPANY';

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

                {/* ===== INDIVIDUAL ===== */}
                {!isCompany && (
                    <>
                        <Surface style={styles.section} elevation={1}>
                            <Text style={styles.sectionTitle}>بيانات الفرد</Text>

                            <TextInput
                                label="الاسم الكامل *"
                                value={form.name}
                                onChangeText={(v) => updateField('name', v)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={colors.borderLight}
                                activeOutlineColor={colors.primary}
                                left={<TextInput.Icon icon="account" />}
                            />

                            <TextInput
                                label="رقم الهوية"
                                value={form.nationalId}
                                onChangeText={(v) => updateField('nationalId', v)}
                                mode="outlined"
                                style={styles.input}
                                keyboardType="numeric"
                                outlineColor={colors.borderLight}
                                activeOutlineColor={colors.primary}
                                left={<TextInput.Icon icon="card-account-details" />}
                            />

                            <DocUploadButton label="مستند الهوية" fieldName="nationalIdDoc" />

                            <Divider style={styles.divider} />

                            <TextInput
                                label="رقم الجوال"
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
                        </Surface>
                    </>
                )}

                {/* ===== COMPANY ===== */}
                {isCompany && (
                    <>
                        {/* Company Info */}
                        <Surface style={styles.section} elevation={1}>
                            <View style={styles.sectionHeader}>
                                <Icon name="briefcase" size={18} color={colors.primary} />
                                <Text style={styles.sectionTitle}>بيانات المنشأة</Text>
                            </View>

                            <TextInput
                                label="اسم الشركة *"
                                value={form.name}
                                onChangeText={(v) => updateField('name', v)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={colors.borderLight}
                                activeOutlineColor={colors.primary}
                                left={<TextInput.Icon icon="domain" />}
                            />

                            <TextInput
                                label="العلامة التجارية (اختياري)"
                                value={form.brandName}
                                onChangeText={(v) => updateField('brandName', v)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={colors.borderLight}
                                activeOutlineColor={colors.primary}
                                left={<TextInput.Icon icon="tag" />}
                            />

                            <TextInput
                                label="الرقم الموحد"
                                value={form.unifiedNumber}
                                onChangeText={(v) => updateField('unifiedNumber', v)}
                                mode="outlined"
                                style={styles.input}
                                keyboardType="numeric"
                                outlineColor={colors.borderLight}
                                activeOutlineColor={colors.primary}
                                left={<TextInput.Icon icon="identifier" />}
                            />

                            <TextInput
                                label="رقم السجل التجاري"
                                value={form.commercialReg}
                                onChangeText={(v) => updateField('commercialReg', v)}
                                mode="outlined"
                                style={styles.input}
                                keyboardType="numeric"
                                outlineColor={colors.borderLight}
                                activeOutlineColor={colors.primary}
                                left={<TextInput.Icon icon="file-document" />}
                            />

                            <DocUploadButton label="مستند السجل التجاري" fieldName="commercialRegDoc" />

                            <Divider style={styles.divider} />

                            <DocUploadButton label="العنوان الوطني (مستند)" fieldName="nationalAddressDoc" required />
                        </Surface>

                        {/* Representative Info */}
                        <Surface style={styles.section} elevation={1}>
                            <View style={styles.sectionHeader}>
                                <Icon name="user" size={18} color={colors.primary} />
                                <Text style={styles.sectionTitle}>معلومات ممثل الشركة</Text>
                            </View>

                            <TextInput
                                label="اسم الممثل"
                                value={form.repName}
                                onChangeText={(v) => updateField('repName', v)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={colors.borderLight}
                                activeOutlineColor={colors.primary}
                                left={<TextInput.Icon icon="account" />}
                            />

                            <TextInput
                                label="رقم هوية الممثل"
                                value={form.repIdentity}
                                onChangeText={(v) => updateField('repIdentity', v)}
                                mode="outlined"
                                style={styles.input}
                                keyboardType="numeric"
                                outlineColor={colors.borderLight}
                                activeOutlineColor={colors.primary}
                                left={<TextInput.Icon icon="card-account-details" />}
                            />

                            <DocUploadButton label="مستند هوية الممثل" fieldName="repIdentityDoc" />

                            <Divider style={styles.divider} />

                            <TextInput
                                label="رقم جوال الممثل"
                                value={form.repPhone}
                                onChangeText={(v) => updateField('repPhone', v)}
                                mode="outlined"
                                style={styles.input}
                                keyboardType="phone-pad"
                                outlineColor={colors.borderLight}
                                activeOutlineColor={colors.primary}
                                left={<TextInput.Icon icon="phone" />}
                            />

                            <TextInput
                                label="البريد الإلكتروني للممثل"
                                value={form.repEmail}
                                onChangeText={(v) => updateField('repEmail', v)}
                                mode="outlined"
                                style={styles.input}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                outlineColor={colors.borderLight}
                                activeOutlineColor={colors.primary}
                                left={<TextInput.Icon icon="email" />}
                            />

                            <Divider style={styles.divider} />

                            {/* Rep Doc Type Selector */}
                            <Text style={styles.fieldLabel}>نوع مستند التمثيل</Text>
                            <View style={styles.chipRow}>
                                {REP_DOC_TYPES.filter(t => t.value !== '').map(opt => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[
                                            styles.chip,
                                            form.repDocType === opt.value && styles.chipActive,
                                        ]}
                                        onPress={() => updateField('repDocType', opt.value)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            form.repDocType === opt.value && styles.chipTextActive,
                                        ]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <DocUploadButton label="مستند التمثيل" fieldName="repDoc" />
                        </Surface>
                    </>
                )}

                {/* Notes */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionTitle}>ملاحظات (اختياري)</Text>
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
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
    segmented: { marginBottom: 4 },
    input: { marginBottom: 12, backgroundColor: colors.white },
    divider: { marginVertical: 12 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: colors.borderLight || '#E5E7EB',
        backgroundColor: colors.white,
    },
    chipActive: {
        backgroundColor: colors.primary, borderColor: colors.primary,
    },
    chipText: { fontSize: 13, color: colors.textSecondary },
    chipTextActive: { color: colors.white, fontWeight: '600' },
    docUpload: { marginBottom: 12 },
    docLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
    docRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    docBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 10, borderWidth: 1, borderColor: colors.primary,
        borderStyle: 'dashed',
    },
    docBtnDisabled: { opacity: 0.5 },
    docBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    docDone: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 10, backgroundColor: '#ECFDF5',
    },
    docDoneText: { fontSize: 12, color: '#10B981', fontWeight: '600' },
    docRequired: { fontSize: 11, color: '#EF4444' },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.primary, borderRadius: 14,
        paddingVertical: 15, gap: 8, marginTop: 8,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
