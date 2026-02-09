/**
 * Password Policy Configuration
 * سياسة كلمات المرور
 */
export const PASSWORD_POLICY = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '@$!%*?&#^()_+-=[]{}|;:,.<>',
    preventCommonPasswords: true,
    preventUserInfo: true, // Don't allow name/email in password
    expiryDays: 90, // Force password change every 90 days
    preventReuse: 5, // Can't reuse last 5 passwords
    lockoutThreshold: 5, // Lock after 5 failed attempts
    lockoutDurationMinutes: 15, // Lock for 15 minutes
};

/**
 * Common weak passwords to block
 */
export const COMMON_PASSWORDS = [
    'password',
    'password1',
    'password123',
    'Password1',
    'Password123',
    '123456',
    '12345678',
    '123456789',
    '1234567890',
    'qwerty',
    'qwerty123',
    'abc123',
    'admin',
    'admin123',
    'welcome',
    'welcome1',
    'letmein',
    'password!',
    'pass123',
    'changeme',
    'temp123',
    'test123',
    'user123',
    'login123',
    'master',
    'master123',
    'dragon',
    'monkey',
    'shadow',
    'sunshine',
    'princess',
    'football',
    'baseball',
    'iloveyou',
    'trustno1',
    'whatever',
    '111111',
    '000000',
    'football1',
    'baseball1',
    'مرحبا123',
    'محامي123',
    'وثيق123',
];
