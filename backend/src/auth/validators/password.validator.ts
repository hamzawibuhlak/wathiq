import { BadRequestException } from '@nestjs/common';
import { PASSWORD_POLICY, COMMON_PASSWORDS } from '../config/password-policy';

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';

/**
 * Password validation result
 */
export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
    strength: {
        score: number; // 0-100
        level: PasswordStrength;
        suggestions: string[];
    };
}

/**
 * Password Validator
 * Validates passwords against the security policy
 */
export class PasswordValidator {
    /**
     * Validate password against policy
     */
    static validate(
        password: string,
        userInfo?: { name?: string; email?: string }
    ): PasswordValidationResult {
        const errors: string[] = [];

        // Length checks
        if (password.length < PASSWORD_POLICY.minLength) {
            errors.push(
                `يجب أن تحتوي كلمة المرور على ${PASSWORD_POLICY.minLength} أحرف على الأقل`
            );
        }

        if (password.length > PASSWORD_POLICY.maxLength) {
            errors.push(
                `كلمة المرور طويلة جداً (الحد الأقصى ${PASSWORD_POLICY.maxLength} حرف)`
            );
        }

        // Uppercase check
        if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل (A-Z)');
        }

        // Lowercase check
        if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل (a-z)');
        }

        // Numbers check
        if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
            errors.push('يجب أن تحتوي كلمة المرور على رقم واحد على الأقل (0-9)');
        }

        // Special characters check
        if (PASSWORD_POLICY.requireSpecialChars) {
            const specialRegex = new RegExp(
                `[${PASSWORD_POLICY.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`
            );
            if (!specialRegex.test(password)) {
                errors.push(
                    `يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل (${PASSWORD_POLICY.specialChars.substring(0, 10)}...)`
                );
            }
        }

        // Common passwords check
        if (PASSWORD_POLICY.preventCommonPasswords) {
            const lowerPassword = password.toLowerCase();
            const isCommon = COMMON_PASSWORDS.some(
                (common) => lowerPassword === common.toLowerCase()
            );
            if (isCommon) {
                errors.push('كلمة المرور شائعة جداً وضعيفة، استخدم كلمة مرور أقوى');
            }
        }

        // User info in password check
        if (PASSWORD_POLICY.preventUserInfo && userInfo) {
            const lowerPassword = password.toLowerCase();

            // Check name
            if (userInfo.name) {
                const nameParts = userInfo.name.toLowerCase().split(/\s+/);
                for (const part of nameParts) {
                    if (part.length > 3 && lowerPassword.includes(part)) {
                        errors.push('يجب ألا تحتوي كلمة المرور على اسمك');
                        break;
                    }
                }
            }

            // Check email
            if (userInfo.email) {
                const emailPart = userInfo.email.split('@')[0].toLowerCase();
                if (emailPart.length > 3 && lowerPassword.includes(emailPart)) {
                    errors.push('يجب ألا تحتوي كلمة المرور على بريدك الإلكتروني');
                }
            }
        }

        // Calculate strength
        const strength = this.calculateStrength(password);

        return {
            isValid: errors.length === 0,
            errors,
            strength,
        };
    }

    /**
     * Validate and throw if invalid
     */
    static validateOrThrow(
        password: string,
        userInfo?: { name?: string; email?: string }
    ): void {
        const result = this.validate(password, userInfo);
        if (!result.isValid) {
            throw new BadRequestException({
                message: 'كلمة المرور لا تتوافق مع سياسة الأمان',
                errors: result.errors,
            });
        }
    }

    /**
     * Calculate password strength score
     */
    static calculateStrength(password: string): {
        score: number;
        level: PasswordStrength;
        suggestions: string[];
    } {
        let score = 0;
        const suggestions: string[] = [];

        // Length scoring (up to 30 points)
        if (password.length >= 8) score += 10;
        if (password.length >= 12) score += 10;
        if (password.length >= 16) score += 10;
        else suggestions.push('استخدم 16 حرف أو أكثر للأمان الأفضل');

        // Character variety (up to 45 points)
        if (/[a-z]/.test(password)) score += 10;
        else suggestions.push('أضف أحرف صغيرة (a-z)');

        if (/[A-Z]/.test(password)) score += 10;
        else suggestions.push('أضف أحرف كبيرة (A-Z)');

        if (/\d/.test(password)) score += 10;
        else suggestions.push('أضف أرقام (0-9)');

        if (/[^a-zA-Z\d]/.test(password)) score += 15;
        else suggestions.push('أضف رموز خاصة (!@#$%^&*)');

        // Complexity patterns (up to 20 points)
        const multipleUppercase = (password.match(/[A-Z]/g) || []).length >= 2;
        const multipleNumbers = (password.match(/\d/g) || []).length >= 2;
        const multipleSpecial = (password.match(/[^a-zA-Z\d]/g) || []).length >= 2;

        if (multipleUppercase) score += 5;
        if (multipleNumbers) score += 5;
        if (multipleSpecial) score += 10;

        // Penalties (up to -20 points)
        // Repeated characters (aaa, 111)
        if (/(.)\1{2,}/.test(password)) {
            score -= 10;
            suggestions.push('تجنب تكرار الأحرف (مثل aaa أو 111)');
        }

        // Sequential numbers (123, 456, 789)
        if (/012|123|234|345|456|567|678|789|890/.test(password)) {
            score -= 10;
            suggestions.push('تجنب الأرقام المتتالية (مثل 123 أو 456)');
        }

        // Sequential letters
        const sequentialLetters = /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i;
        if (sequentialLetters.test(password)) {
            score -= 5;
            suggestions.push('تجنب الأحرف المتتالية (مثل abc أو xyz)');
        }

        // Ensure score is between 0 and 100
        score = Math.max(0, Math.min(100, score));

        // Determine level
        let level: PasswordStrength;
        if (score < 25) level = 'weak';
        else if (score < 45) level = 'fair';
        else if (score < 65) level = 'good';
        else if (score < 85) level = 'strong';
        else level = 'very_strong';

        return { score, level, suggestions: suggestions.slice(0, 3) };
    }

    /**
     * Get password policy for display
     */
    static getPolicy() {
        return {
            minLength: PASSWORD_POLICY.minLength,
            maxLength: PASSWORD_POLICY.maxLength,
            requireUppercase: PASSWORD_POLICY.requireUppercase,
            requireLowercase: PASSWORD_POLICY.requireLowercase,
            requireNumbers: PASSWORD_POLICY.requireNumbers,
            requireSpecialChars: PASSWORD_POLICY.requireSpecialChars,
            expiryDays: PASSWORD_POLICY.expiryDays,
            lockoutThreshold: PASSWORD_POLICY.lockoutThreshold,
        };
    }
}
