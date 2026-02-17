import React, { useState, useEffect } from 'react';
import {
    View, StyleSheet, KeyboardAvoidingView, Platform,
    ScrollView, Image, Alert,
} from 'react-native';
import { TextInput, Button, Text, HelperText, Surface } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';

export function LoginScreen() {
    const [tenantSlug, setTenantSlug] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { login, isLoading } = useAuthStore();

    const validate = () => {
        const e: Record<string, string> = {};
        if (!tenantSlug.trim()) e.tenant = 'يرجى إدخال رمز المكتب';
        if (!email.trim()) e.email = 'يرجى إدخال البريد الإلكتروني';
        else if (!email.includes('@')) e.email = 'بريد إلكتروني غير صحيح';
        if (!password.trim()) e.password = 'يرجى إدخال كلمة المرور';
        else if (password.length < 6) e.password = 'كلمة المرور قصيرة جداً';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        try {
            console.log('[LOGIN] Attempting login with:', { tenantSlug: tenantSlug.trim(), email: email.trim() });
            await login(tenantSlug.trim(), email.trim(), password);
            console.log('[LOGIN] Login successful!');
        } catch (error: any) {
            console.log('[LOGIN] Error:', JSON.stringify(error?.response?.data || error?.message || error, null, 2));
            console.log('[LOGIN] Status:', error?.response?.status);
            const msg = error.response?.data?.message || error?.message || 'بيانات الدخول غير صحيحة';
            Alert.alert('خطأ', typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoEmoji}>⚖️</Text>
                    </View>
                    <Text style={styles.appName}>وثيق</Text>
                    <Text style={styles.subtitle}>نظام إدارة المكاتب القانونية</Text>
                </View>

                {/* Login Form */}
                <Surface style={styles.formCard} elevation={2}>
                    <Text style={styles.formTitle}>تسجيل الدخول</Text>

                    {/* Tenant Slug */}
                    <TextInput
                        label="رمز المكتب"
                        value={tenantSlug}
                        onChangeText={setTenantSlug}
                        placeholder="مثال: al-faisal-law"
                        autoCapitalize="none"
                        error={!!errors.tenant}
                        style={styles.input}
                        mode="outlined"
                        left={<TextInput.Icon icon="domain" />}
                    />
                    {errors.tenant && <HelperText type="error">{errors.tenant}</HelperText>}

                    {/* Email */}
                    <TextInput
                        label="البريد الإلكتروني"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        error={!!errors.email}
                        style={styles.input}
                        mode="outlined"
                        left={<TextInput.Icon icon="email-outline" />}
                    />
                    {errors.email && <HelperText type="error">{errors.email}</HelperText>}

                    {/* Password */}
                    <TextInput
                        label="كلمة المرور"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        error={!!errors.password}
                        style={styles.input}
                        mode="outlined"
                        left={<TextInput.Icon icon="lock-outline" />}
                        right={
                            <TextInput.Icon
                                icon={showPassword ? 'eye-off' : 'eye'}
                                onPress={() => setShowPassword(!showPassword)}
                            />
                        }
                    />
                    {errors.password && <HelperText type="error">{errors.password}</HelperText>}

                    {/* Login Button */}
                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={isLoading}
                        disabled={isLoading}
                        style={styles.loginButton}
                        labelStyle={styles.loginButtonLabel}
                        contentStyle={styles.loginButtonContent}
                    >
                        {isLoading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                    </Button>
                </Surface>

                {/* Footer */}
                <Text style={styles.footer}>
                    © {new Date().getFullYear()} وثيق — جميع الحقوق محفوظة
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    logoEmoji: {
        fontSize: 36,
    },
    appName: {
        fontSize: 30,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    formCard: {
        padding: 24,
        borderRadius: 20,
        backgroundColor: colors.white,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 24,
    },
    input: {
        marginBottom: 4,
        backgroundColor: colors.white,
    },
    loginButton: {
        marginTop: 20,
        borderRadius: 12,
        backgroundColor: colors.primary,
    },
    loginButtonLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    loginButtonContent: {
        paddingVertical: 6,
    },
    footer: {
        textAlign: 'center',
        color: colors.textMuted,
        fontSize: 12,
        marginTop: 32,
    },
});
