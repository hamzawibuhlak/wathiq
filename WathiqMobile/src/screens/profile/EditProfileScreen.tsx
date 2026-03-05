import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Surface, Avatar } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { getInitials } from '../../utils/formatters';

export function EditProfileScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        // Simulate save
        setTimeout(() => {
            setSaving(false);
            Alert.alert('تم', 'تم حفظ التغييرات بنجاح', [
                { text: 'حسناً', onPress: () => navigation.goBack() },
            ]);
        }, 1000);
    };

    return (
        <ScrollView style={styles.container}>
            <Surface style={styles.card} elevation={1}>
                <View style={styles.avatarSection}>
                    <Avatar.Text
                        size={80}
                        label={getInitials(name || '؟')}
                        style={{ backgroundColor: colors.primary }}
                    />
                </View>

                <TextInput
                    label="الاسم الكامل"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                />

                <TextInput
                    label="البريد الإلكتروني"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    disabled
                />

                <TextInput
                    label="رقم الجوال"
                    value={phone}
                    onChangeText={setPhone}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="phone-pad"
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    placeholder="05xxxxxxxx"
                />

                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                    style={styles.saveBtn}
                    buttonColor={colors.primary}
                >
                    حفظ التغييرات
                </Button>
            </Surface>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    card: { margin: 16, padding: 20, borderRadius: 16, backgroundColor: colors.white },
    avatarSection: { alignItems: 'center', marginBottom: 24 },
    input: { marginBottom: 16, backgroundColor: colors.white },
    saveBtn: { marginTop: 8, borderRadius: 10, paddingVertical: 4 },
});
