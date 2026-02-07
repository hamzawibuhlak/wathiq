import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSmtpSettingsDto {
    @ApiProperty({ example: 'smtp.hostinger.com', description: 'SMTP Server Host' })
    @IsOptional()
    @IsString()
    smtpHost?: string;

    @ApiProperty({ example: 587, description: 'SMTP Port (587 for TLS, 465 for SSL)' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(65535)
    smtpPort?: number;

    @ApiProperty({ example: 'info@example.com', description: 'SMTP Username' })
    @IsOptional()
    @IsString()
    smtpUser?: string;

    @ApiProperty({ example: 'password123', description: 'SMTP Password' })
    @IsOptional()
    @IsString()
    smtpPass?: string;

    @ApiProperty({ example: 'noreply@example.com', description: 'From Email Address' })
    @IsOptional()
    @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
    smtpFrom?: string;

    @ApiProperty({ example: 'مكتب المحاماة', description: 'From Name' })
    @IsOptional()
    @IsString()
    smtpFromName?: string;

    @ApiProperty({ example: false, description: 'Use SSL (true for port 465)' })
    @IsOptional()
    @IsBoolean()
    smtpSecure?: boolean;

    @ApiProperty({ example: true, description: 'Enable SMTP' })
    @IsOptional()
    @IsBoolean()
    smtpEnabled?: boolean;
}

export class TestEmailDto {
    @ApiProperty({ example: 'test@example.com', description: 'Email to send test to' })
    @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
    testEmail: string;
}
