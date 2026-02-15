import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

// ═══════════════════════════════════════════════════════════
// Date Formatters
// ═══════════════════════════════════════════════════════════

export const formatDate = (dateStr: string): string => {
    try {
        const date = parseISO(dateStr);
        if (isToday(date)) return 'اليوم';
        if (isTomorrow(date)) return 'غداً';
        if (isYesterday(date)) return 'أمس';
        return format(date, 'dd MMM yyyy', { locale: ar });
    } catch {
        return dateStr;
    }
};

export const formatTime = (dateStr: string): string => {
    try {
        return format(parseISO(dateStr), 'hh:mm a');
    } catch {
        return '';
    }
};

export const formatDateTime = (dateStr: string): string => {
    return `${formatDate(dateStr)} ${formatTime(dateStr)}`.trim();
};

// ═══════════════════════════════════════════════════════════
// Number / Currency Formatters
// ═══════════════════════════════════════════════════════════

export const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString('ar-SA')} ر.س`;
};

export const formatNumber = (num: number): string => {
    return num.toLocaleString('ar-SA');
};

// ═══════════════════════════════════════════════════════════
// File Size
// ═══════════════════════════════════════════════════════════

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// ═══════════════════════════════════════════════════════════
// Text Helpers
// ═══════════════════════════════════════════════════════════

export const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map(w => w.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};
