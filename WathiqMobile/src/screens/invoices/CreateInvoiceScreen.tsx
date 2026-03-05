import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Surface, Text } from 'react-native-paper';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { colors } from '../../theme/colors';

export function CreateInvoiceScreen({ navigation }: any) {
    const queryClient = useQueryClient();
    const [clientName, setClientName] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');

    const mutation = useMutation({
        mutationFn: (data: any) => apiService.post('/invoices', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            Alert.alert('تم', 'تم إنشاء الفاتورة بنجاح', [
                { text: 'حسناً', onPress: () => navigation.goBack() },
            ]);
        },
        onError: () => Alert.alert('خطأ', 'حدث خطأ في إنشاء الفاتورة'),
    });

    const handleSubmit = () => {
        if (!clientName.trim() || !amount.trim()) {
            Alert.alert('خطأ', 'يرجى إدخال اسم العميل والمبلغ');
            return;
        }
        mutation.mutate({
            clientName: clientName.trim(),
            total: parseFloat(amount),
            description: description.trim() || undefined,
            dueDate: dueDate.trim() || undefined,
            status: 'DRAFT',
        });
    };

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <Surface style={styles.card} elevation={1}>
                <Text style={styles.sectionTitle}>معلومات الفاتورة</Text>
                <TextInput label="اسم العميل *" value={clientName} onChangeText={setClientName}
                    mode="outlined" style={styles.input} outlineColor={colors.border} activeOutlineColor={colors.primary} />
                <TextInput label="المبلغ (ر.س) *" value={amount} onChangeText={setAmount}
                    mode="outlined" style={styles.input} keyboardType="numeric"
                    outlineColor={colors.border} activeOutlineColor={colors.primary} />
                <TextInput label="تاريخ الاستحقاق (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate}
                    mode="outlined" style={styles.input} outlineColor={colors.border} activeOutlineColor={colors.primary} />
                <TextInput label="الوصف" value={description} onChangeText={setDescription}
                    mode="outlined" style={styles.input} multiline numberOfLines={3}
                    outlineColor={colors.border} activeOutlineColor={colors.primary} />
            </Surface>
            <Button mode="contained" onPress={handleSubmit} loading={mutation.isPending}
                disabled={mutation.isPending} style={styles.submitBtn} buttonColor={colors.primary}
                contentStyle={{ paddingVertical: 6 }}>
                إنشاء الفاتورة
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
    submitBtn: { marginHorizontal: 16, marginTop: 20, borderRadius: 12 },
});
