import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Surface } from 'react-native-paper';
import { colors } from '../../theme/colors';

export function ChangePasswordScreen({ navigation }: any) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSave = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('خطأ', 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('خطأ', 'كلمة المرور الجديدة غير متطابقة');
            return;
        }

        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            Alert.alert('تم', 'تم تغيير كلمة المرور بنجاح', [
                { text: 'حسناً', onPress: () => navigation.goBack() },
            ]);
        }, 1000);
    };

    return (
        <ScrollView style={styles.container}>
            <Surface style={styles.card} elevation={1}>
                <TextInput
                    label="كلمة المرور الحالية"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    mode="outlined"
                    style={styles.input}
                    secureTextEntry={!showCurrent}
                    right={<TextInput.Icon icon={showCurrent ? 'eye-off' : 'eye'} onPress={() => setShowCurrent(!showCurrent)} />}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                />

                <TextInput
                    label="كلمة المرور الجديدة"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    mode="outlined"
                    style={styles.input}
                    secureTextEntry={!showNew}
                    right={<TextInput.Icon icon={showNew ? 'eye-off' : 'eye'} onPress={() => setShowNew(!showNew)} />}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                />

                <TextInput
                    label="تأكيد كلمة المرور الجديدة"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    mode="outlined"
                    style={styles.input}
                    secureTextEntry={!showConfirm}
                    right={<TextInput.Icon icon={showConfirm ? 'eye-off' : 'eye'} onPress={() => setShowConfirm(!showConfirm)} />}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                />

                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                    style={styles.saveBtn}
                    buttonColor={colors.primary}
                >
                    تغيير كلمة المرور
                </Button>
            </Surface>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    card: { margin: 16, padding: 20, borderRadius: 16, backgroundColor: colors.white },
    input: { marginBottom: 16, backgroundColor: colors.white },
    saveBtn: { marginTop: 8, borderRadius: 10, paddingVertical: 4 },
});
