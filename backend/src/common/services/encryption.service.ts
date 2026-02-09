import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';

/**
 * Encryption Service
 * تشفير البيانات الحساسة باستخدام AES-256
 */
@Injectable()
export class EncryptionService {
    private readonly encryptionKey: string;
    private readonly algorithm = 'aes-256-gcm';

    constructor(private config: ConfigService) {
        this.encryptionKey = this.config.get<string>('ENCRYPTION_KEY') || this.generateDefaultKey();
        if (!this.config.get<string>('ENCRYPTION_KEY')) {
            console.warn('⚠️ ENCRYPTION_KEY not set in environment. Using generated key (NOT FOR PRODUCTION!)');
        }
    }

    /**
     * Generate a default key for development (NOT FOR PRODUCTION)
     */
    private generateDefaultKey(): string {
        return 'development-encryption-key-32ch';
    }

    /**
     * Encrypt a string using AES-256-GCM (Node.js native)
     */
    encrypt(data: string): string {
        if (!data) return data;

        const iv = randomBytes(16);
        const key = scryptSync(this.encryptionKey, 'salt', 32);
        const cipher = createCipheriv(this.algorithm, key, iv);

        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Return IV:AuthTag:EncryptedData
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    /**
     * Decrypt a string encrypted with AES-256-GCM
     */
    decrypt(encryptedData: string): string {
        if (!encryptedData) return encryptedData;

        try {
            const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

            if (!ivHex || !authTagHex || !encrypted) {
                // Not encrypted data, return as-is
                return encryptedData;
            }

            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            const key = scryptSync(this.encryptionKey, 'salt', 32);

            const decipher = createDecipheriv(this.algorithm, key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch {
            // If decryption fails, return original (might not be encrypted)
            return encryptedData;
        }
    }

    /**
     * Simple AES encryption using CryptoJS (for simpler use cases)
     */
    encryptSimple(data: string): string {
        if (!data) return data;
        return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
    }

    /**
     * Simple AES decryption using CryptoJS
     */
    decryptSimple(encryptedData: string): string {
        if (!encryptedData) return encryptedData;
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch {
            return encryptedData;
        }
    }

    /**
     * Encrypt an object (JSON)
     */
    encryptObject(obj: any): string {
        const jsonString = JSON.stringify(obj);
        return this.encrypt(jsonString);
    }

    /**
     * Decrypt an object (JSON)
     */
    decryptObject<T>(encryptedData: string): T | null {
        try {
            const jsonString = this.decrypt(encryptedData);
            return JSON.parse(jsonString);
        } catch {
            return null;
        }
    }

    /**
     * Hash data using SHA-256 (one-way)
     */
    hash(data: string): string {
        return CryptoJS.SHA256(data).toString();
    }

    /**
     * Hash with salt for extra security
     */
    hashWithSalt(data: string, salt?: string): string {
        const actualSalt = salt || randomBytes(16).toString('hex');
        const hash = CryptoJS.SHA256(data + actualSalt).toString();
        return `${actualSalt}:${hash}`;
    }

    /**
     * Verify hashed data with salt
     */
    verifyHash(data: string, hashedWithSalt: string): boolean {
        const [salt, hash] = hashedWithSalt.split(':');
        if (!salt || !hash) return false;
        const newHash = CryptoJS.SHA256(data + salt).toString();
        return hash === newHash;
    }

    /**
     * Generate a random token
     */
    generateToken(length = 32): string {
        return randomBytes(length).toString('hex');
    }

    /**
     * Mask sensitive data for display (show first/last few chars)
     */
    maskSensitiveData(data: string, showFirst = 3, showLast = 3): string {
        if (!data || data.length <= showFirst + showLast) {
            return '*'.repeat(data?.length || 0);
        }
        const first = data.substring(0, showFirst);
        const last = data.substring(data.length - showLast);
        const middle = '*'.repeat(data.length - showFirst - showLast);
        return `${first}${middle}${last}`;
    }
}
