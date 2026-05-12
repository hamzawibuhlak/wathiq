import { IsBoolean, IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateCompanySettingsDto {
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsString() nameEn?: string;
    @IsOptional() @IsEmail() email?: string;
    @IsOptional() @IsString() phone?: string;
    @IsOptional() @IsString() address?: string;
    @IsOptional() @IsString() city?: string;
    @IsOptional() @IsString() licenseNumber?: string;
    @IsOptional() @IsString() taxNumber?: string;
    @IsOptional() @IsString() commercialReg?: string;
    @IsOptional() @IsString() website?: string;
    @IsOptional() @IsString() logo?: string;
    @IsOptional() @IsString() letterheadUrl?: string;

    @IsOptional() @IsString() smtpHost?: string;
    @IsOptional() @IsInt() smtpPort?: number;
    @IsOptional() @IsString() smtpUser?: string;
    @IsOptional() @IsString() smtpPass?: string;
    @IsOptional() @IsString() smtpFrom?: string;
    @IsOptional() @IsString() smtpFromName?: string;
    @IsOptional() @IsBoolean() smtpSecure?: boolean;
    @IsOptional() @IsBoolean() smtpEnabled?: boolean;

    @IsOptional() @IsString() whatsappAccessToken?: string;
    @IsOptional() @IsString() whatsappPhoneNumberId?: string;
    @IsOptional() @IsString() whatsappBusinessId?: string;
    @IsOptional() @IsString() whatsappWebhookToken?: string;
    @IsOptional() @IsBoolean() whatsappEnabled?: boolean;
}
