import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Surface, Text, Switch } from 'react-native-paper';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { colors } from '../../theme/colors';

export function CreateFormScreen({ navigation }: any) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isPublished, setIsPublished] = useState(false);

    const mutation = useMutation({
        mutationFn: (data: any) => apiService.post('/forms', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['forms'] });
            Alert.alert('تم', 'تم إنشاء النموذج بنجاح', [
                { text: 'حسناً', onPress: () => navigation.goBack() },
            ]);
        },
        onError: () => Alert.alert('خطأ', 'حدث خطأ في إنشاء النموذج'),
    });

    const handleSubmit = () => {
        if (!title.trim()) {
            Alert.alert('خطأ', 'يرجى إدخال عنوان النموذج');
            return;
        }
        mutation.mutate({
            title: title.trim(),
            description: description.trim() || undefined,
            isPublished,
            fields: [],
        });
    };

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <Surface style={styles.card} elevation={1}>
                <Text style={styles.sectionTitle}>معلومات النموذج</Text>
                <TextInput
                    label="عنوان النموذج *"
                    value={title}
                    onChangeText={setTitle}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                />
                <TextInput
                    label="وصف النموذج"
                    value={description}
                    onChangeText={setDescription}
                    mode="outlined"
                    style={styles.input}
                    multiline
                    numberOfLines={3}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                />
                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>نشر النموذج</Text>
                    <Switch
                        value={isPublished}
                        onValueChange={setIsPublished}
                        color={colors.primary}
                    />
                </View>
            </Surface>
            <Button
                mode="contained"
                onPress={handleSubmit}
                loading={mutation.isPending}
                disabled={mutation.isPending}
                style={styles.submitBtn}
                buttonColor={colors.primary}
                contentStyle={{ paddingVertical: 6 }}
            >
                إنشاء النموذج
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
    switchRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 8,
    },
    switchLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
    submitBtn: { marginHorizontal: 16, marginTop: 20, borderRadius: 12 },
});
