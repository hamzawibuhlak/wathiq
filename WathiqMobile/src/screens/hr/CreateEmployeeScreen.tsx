import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Surface, Text } from 'react-native-paper';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { colors } from '../../theme/colors';

const DEPARTMENTS = ['القانوني', 'المحاسبة', 'الإداري', 'تقنية المعلومات', 'التسويق'];

export function CreateEmployeeScreen({ navigation }: any) {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [position, setPosition] = useState('');
    const [department, setDepartment] = useState('');
    const [salary, setSalary] = useState('');

    const mutation = useMutation({
        mutationFn: (data: any) => apiService.post('/hr/employees', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
            queryClient.invalidateQueries({ queryKey: ['hr-stats'] });
            Alert.alert('تم', 'تم إضافة الموظف بنجاح', [
                { text: 'حسناً', onPress: () => navigation.goBack() },
            ]);
        },
        onError: () => Alert.alert('خطأ', 'حدث خطأ في إضافة الموظف'),
    });

    const handleSubmit = () => {
        if (!name.trim()) {
            Alert.alert('خطأ', 'يرجى إدخال اسم الموظف');
            return;
        }
        mutation.mutate({
            name: name.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            position: position.trim() || undefined,
            department: department.trim() || undefined,
            salary: salary ? parseFloat(salary) : undefined,
            status: 'ACTIVE',
        });
    };

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <Surface style={styles.card} elevation={1}>
                <Text style={styles.sectionTitle}>معلومات الموظف</Text>
                <TextInput label="الاسم الكامل *" value={name} onChangeText={setName}
                    mode="outlined" style={styles.input} outlineColor={colors.border} activeOutlineColor={colors.primary} />
                <TextInput label="البريد الإلكتروني" value={email} onChangeText={setEmail}
                    mode="outlined" style={styles.input} keyboardType="email-address"
                    outlineColor={colors.border} activeOutlineColor={colors.primary} />
                <TextInput label="رقم الهاتف" value={phone} onChangeText={setPhone}
                    mode="outlined" style={styles.input} keyboardType="phone-pad"
                    outlineColor={colors.border} activeOutlineColor={colors.primary} />
                <TextInput label="المسمى الوظيفي" value={position} onChangeText={setPosition}
                    mode="outlined" style={styles.input} outlineColor={colors.border} activeOutlineColor={colors.primary} />
                <TextInput label="القسم" value={department} onChangeText={setDepartment}
                    mode="outlined" style={styles.input} outlineColor={colors.border} activeOutlineColor={colors.primary} />
                <TextInput label="الراتب (ر.س)" value={salary} onChangeText={setSalary}
                    mode="outlined" style={styles.input} keyboardType="numeric"
                    outlineColor={colors.border} activeOutlineColor={colors.primary} />
            </Surface>
            <Button mode="contained" onPress={handleSubmit} loading={mutation.isPending}
                disabled={mutation.isPending} style={styles.submitBtn} buttonColor={colors.primary}
                contentStyle={{ paddingVertical: 6 }}>
                إضافة الموظف
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
