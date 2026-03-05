import React, { useState } from 'react';
import {
    View, StyleSheet, ScrollView, Image, TouchableOpacity,
    Linking, Alert, Dimensions, ActivityIndicator,
} from 'react-native';
import { Text, Surface, Button, Divider, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { WebView } from 'react-native-webview';
import { colors } from '../../theme/colors';
import { formatDate } from '../../utils/formatters';
import { API_BASE_URL } from '../../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FILE_TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    pdf: { icon: 'file-text', color: '#EF4444', label: 'PDF' },
    doc: { icon: 'file-text', color: '#2563EB', label: 'Word' },
    docx: { icon: 'file-text', color: '#2563EB', label: 'Word' },
    xls: { icon: 'grid', color: '#10B981', label: 'Excel' },
    xlsx: { icon: 'grid', color: '#10B981', label: 'Excel' },
    png: { icon: 'image', color: '#8B5CF6', label: 'صورة' },
    jpg: { icon: 'image', color: '#8B5CF6', label: 'صورة' },
    jpeg: { icon: 'image', color: '#8B5CF6', label: 'صورة' },
    gif: { icon: 'image', color: '#8B5CF6', label: 'صورة' },
    default: { icon: 'file', color: '#6B7280', label: 'ملف' },
};

function getFileExtension(filename: string): string {
    return (filename || '').split('.').pop()?.toLowerCase() || '';
}

function isImageFile(filename: string): boolean {
    const ext = getFileExtension(filename);
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext);
}

function isPreviewableFile(filename: string): boolean {
    const ext = getFileExtension(filename);
    return ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext);
}

export function DocumentViewerScreen({ route, navigation }: any) {
    const { document } = route.params || {};
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    if (!document) {
        return (
            <View style={styles.centered}>
                <Icon name="alert-circle" size={48} color={colors.textMuted} />
                <Text style={styles.errorText}>لا يوجد مستند</Text>
            </View>
        );
    }

    const fileName = document.fileName || document.name || document.title || 'مستند';
    const ext = getFileExtension(fileName);
    const fileConfig = FILE_TYPE_CONFIG[ext] || FILE_TYPE_CONFIG.default;
    const isImage = isImageFile(fileName);
    const canPreview = isPreviewableFile(fileName);
    const fileSize = document.fileSize || document.size;

    // Construct preview URL from the document ID via the backend API
    const previewUrl = document.id ? `${API_BASE_URL}/documents/${document.id}/preview` : '';
    const downloadUrl = document.id ? `${API_BASE_URL}/documents/${document.id}/download` : '';

    const handleOpenPreview = () => {
        if (!previewUrl) {
            Alert.alert('خطأ', 'لا يوجد رابط للمعاينة');
            return;
        }
        Linking.openURL(previewUrl).catch(() => {
            Alert.alert('خطأ', 'لا يمكن فتح الملف');
        });
    };

    const handleDownload = () => {
        if (!downloadUrl) {
            Alert.alert('خطأ', 'لا يوجد رابط للتحميل');
            return;
        }
        Linking.openURL(downloadUrl).catch(() => {
            Alert.alert('خطأ', 'لا يمكن تحميل الملف');
        });
    };

    const formatFileSize = (bytes: number) => {
        if (!bytes) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* File Preview */}
            <Surface style={styles.previewCard} elevation={2}>
                {isImage && previewUrl ? (
                    <View style={styles.imageContainer}>
                        {imageLoading && (
                            <View style={styles.imageLoader}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={styles.loadingText}>جاري تحميل الصورة...</Text>
                            </View>
                        )}
                        <Image
                            source={{ uri: previewUrl }}
                            style={[styles.previewImage, imageError && { display: 'none' }]}
                            resizeMode="contain"
                            onLoadStart={() => setImageLoading(true)}
                            onLoadEnd={() => setImageLoading(false)}
                            onError={() => {
                                setImageError(true);
                                setImageLoading(false);
                            }}
                        />
                        {imageError && (
                            <View style={styles.errorPreview}>
                                <Icon name="image" size={48} color={colors.textMuted} />
                                <Text style={styles.errorPreviewText}>تعذر تحميل الصورة</Text>
                            </View>
                        )}
                    </View>
                ) : canPreview && previewUrl ? (
                    <View style={styles.webviewContainer}>
                        <WebView
                            source={{ uri: previewUrl }}
                            style={styles.webview}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <View style={styles.webviewLoader}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={styles.loadingText}>جاري تحميل الملف...</Text>
                                </View>
                            )}
                            onError={() => setImageError(true)}
                            scalesPageToFit={true}
                        />
                    </View>
                ) : (
                    <TouchableOpacity style={styles.filePreview} onPress={handleOpenPreview}>
                        <View style={[styles.bigIcon, { backgroundColor: `${fileConfig.color}15` }]}>
                            <Icon name={fileConfig.icon} size={48} color={fileConfig.color} />
                        </View>
                        <Text style={styles.fileTypeName}>{fileConfig.label}</Text>
                        <Text style={styles.fileExtension}>.{ext || '?'}</Text>
                        <Text style={styles.tapHint}>اضغط لفتح الملف في المتصفح</Text>
                    </TouchableOpacity>
                )}
            </Surface>

            {/* File Name */}
            <Surface style={styles.infoCard} elevation={1}>
                <Text style={styles.fileName}>{fileName}</Text>
                <View style={styles.badges}>
                    <Chip
                        style={[styles.badge, { backgroundColor: `${fileConfig.color}15` }]}
                        textStyle={[styles.badgeText, { color: fileConfig.color }]}
                        icon={() => <Icon name={fileConfig.icon} size={12} color={fileConfig.color} />}
                    >
                        {fileConfig.label}
                    </Chip>
                    {document.documentType && (
                        <Chip style={styles.badge} textStyle={styles.badgeText}>
                            {document.documentType}
                        </Chip>
                    )}
                </View>
            </Surface>

            {/* File Details */}
            <Surface style={styles.infoCard} elevation={1}>
                <Text style={styles.sectionTitle}>تفاصيل الملف</Text>
                <Divider style={styles.divider} />

                <DetailRow icon="calendar" label="تاريخ الإنشاء" value={document.createdAt ? formatDate(document.createdAt) : '—'} />
                <DetailRow icon="edit" label="آخر تعديل" value={document.updatedAt ? formatDate(document.updatedAt) : '—'} />
                <DetailRow icon="hard-drive" label="حجم الملف" value={formatFileSize(fileSize)} />
                <DetailRow icon="briefcase" label="القضية" value={document.case?.title || 'بدون قضية'} />
                {document.caseNumber && <DetailRow icon="hash" label="رقم القضية" value={document.caseNumber} />}
                {document.uploadedBy && <DetailRow icon="user" label="رفع بواسطة" value={document.uploadedBy?.name || document.uploadedBy} />}
                {document.description && <DetailRow icon="align-left" label="الوصف" value={document.description} />}
            </Surface>

            {/* Actions */}
            <View style={styles.actions}>
                <Button
                    mode="contained"
                    onPress={handleOpenPreview}
                    icon="eye"
                    style={styles.actionBtn}
                    buttonColor={colors.primary}
                    contentStyle={{ paddingVertical: 6 }}
                >
                    معاينة الملف
                </Button>
                <Button
                    mode="outlined"
                    onPress={handleDownload}
                    icon="download"
                    style={styles.actionBtn}
                    textColor={colors.primary}
                    contentStyle={{ paddingVertical: 6 }}
                >
                    تحميل الملف
                </Button>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
                <Icon name={icon} size={14} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    errorText: { fontSize: 16, color: colors.textMuted, marginTop: 12 },
    previewCard: {
        borderRadius: 16, overflow: 'hidden',
        backgroundColor: colors.white, marginBottom: 12,
    },
    imageContainer: { minHeight: 250 },
    previewImage: { width: '100%', height: 300 },
    imageLoader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    loadingText: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
    errorPreview: { height: 200, alignItems: 'center', justifyContent: 'center' },
    errorPreviewText: { fontSize: 14, color: colors.textMuted, marginTop: 8 },
    webviewContainer: { height: 400, borderRadius: 16, overflow: 'hidden' },
    webview: { flex: 1 },
    webviewLoader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
    filePreview: {
        height: 200, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#F9FAFB',
    },
    bigIcon: {
        width: 96, height: 96, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
    },
    fileTypeName: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12 },
    fileExtension: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    tapHint: { fontSize: 12, color: colors.primary, marginTop: 12, fontWeight: '500' },
    infoCard: {
        borderRadius: 16, padding: 16,
        backgroundColor: colors.white, marginBottom: 12,
    },
    fileName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
    badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    badge: { height: 28, backgroundColor: colors.primaryLight || '#EEF0FF' },
    badgeText: { fontSize: 11 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
    divider: { marginVertical: 10 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
    detailIcon: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: colors.primaryLight || '#EEF0FF',
        alignItems: 'center', justifyContent: 'center',
    },
    detailContent: { flex: 1 },
    detailLabel: { fontSize: 11, color: colors.textSecondary },
    detailValue: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 1 },
    actions: { gap: 10 },
    actionBtn: { borderRadius: 12 },
    noUrlBox: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: 16,
    },
    noUrlText: { fontSize: 14, color: colors.textMuted },
});
