import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Surface, Text, SegmentedButtons } from 'react-native-paper';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { casesApi } from '../../api/cases';
import { colors } from '../../theme/colors';

const CASE_TYPES = [
    { value: 'CRIMINAL', label: 'جنائية' },
    { value: 'CIVIL', label: 'مدنية' },
    { value: 'COMMERCIAL', label: 'تجارية' },
    { value: 'LABOR', label: 'عمالية' },
    { value: 'FAMILY', label: 'أحوال شخصية' },
    { value: 'ADMINISTRATIVE', label: 'إدارية' },
];

export function CreateCaseScreen({ navigation }: any) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [caseNumber, setCaseNumber] = useState('');
    const [caseType, setCaseType] = useState('CIVIL');
    const [court, setCourt] = useState('');
    const [description, setDescription] = useState('');
    const [clientName, setClientName] = useState('');
    const [opponentName, setOpponentName] = useState('');

    const createMutation = useMutation({
        mutationFn: (data: any) => casesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
            Alert.alert('تم', 'تم إنشاء القضية بنجاح', [
                { text: 'حسناً', onPress: () => navigation.goBack() },
            ]);
        },
        onError: (error: any) => {
            Alert.alert('خطأ', error?.message || 'حدث خطأ في إنشاء القضية');
        },
    });

    const handleSubmit = () => {
        if (!title.trim()) {
            Alert.alert('خطأ', 'يرجى إدخال عنوان القضية');
            return;
        }

        createMutation.mutate({
            title: title.trim(),
            caseNumber: caseNumber.trim() || undefined,
            caseType,
            court: court.trim() || undefined,
            description: description.trim() || undefined,
            clientName: clientName.trim() || undefined,
            opponentName: opponentName.trim() || undefined,
        });
    };

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <Surface style={styles.card} elevation={1}>
                <Text style={styles.sectionTitle}>معلومات القضية</Text>

                <TextInput
                    label="عنوان القضية *"
                    value={title}
                    onChangeText={setTitle}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                />

                <TextInput
                    label="رقم القضية"
                    value={caseNumber}
                    onChangeText={setCaseNumber}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    placeholder="اختياري"
                />

                <Text style={styles.label}>نوع القضية</Text>
                <View style={styles.typeGrid}>
                    {CASE_TYPES.map((type) => (
                        <Button
                            key={type.value}
                            mode={caseType === type.value ? 'contained' : 'outlined'}
                            onPress={() => setCaseType(type.value)}
                            style={styles.typeBtn}
                            labelStyle={styles.typeBtnLabel}
                            buttonColor={caseType === type.value ? colors.primary : undefined}
                            textColor={caseType === type.value ? '#fff' : colors.text}
                            compact
                        >
                            {type.label}
                        </Button>
                    ))}
                </View>

                <TextInput
                    label="المحكمة"
                    value={court}
                    onChangeText={setCourt}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                />
            </Surface>

            <Surface style={styles.card} elevation={1}>
                <Text style={styles.sectionTitle}>الأطراف</Text>

                <TextInput
                    label="اسم الموكل"
                    value={clientName}
                    onChangeText={setClientName}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                />

                <TextInput
                    label="اسم الخصم"
                    value={opponentName}
                    onChangeText={setOpponentName}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                />
            </Surface>

            <Surface style={styles.card} elevation={1}>
                <Text style={styles.sectionTitle}>الوصف</Text>

                <TextInput
                    label="وصف القضية"
                    value={description}
                    onChangeText={setDescription}
                    mode="outlined"
                    style={styles.input}
                    multiline
                    numberOfLines={4}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                />
            </Surface>

            <Button
                mode="contained"
                onPress={handleSubmit}
                loading={createMutation.isPending}
                disabled={createMutation.isPending}
                style={styles.submitBtn}
                buttonColor={colors.primary}
                contentStyle={{ paddingVertical: 6 }}
            >
                إنشاء القضية
            </Button>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    card: { margin: 16, marginBottom: 0, padding: 20, borderRadius: 16, backgroundColor: colors.white },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
    input: { marginBottom: 12, backgroundColor: colors.white },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeBtn: { borderRadius: 8 },
    typeBtnLabel: { fontSize: 12 },
    submitBtn: { marginHorizontal: 16, marginTop: 20, borderRadius: 12 },
});
