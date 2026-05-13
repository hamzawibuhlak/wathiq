import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    cn,
    formatCurrency,
    formatDate,
    formatRelativeTime,
    getInitials,
    truncate,
    isEmpty,
    generateId,
    debounce,
} from '@/lib/utils';

describe('cn', () => {
    it('دمج classes بدون تعارض', () => {
        expect(cn('px-2', 'py-2')).toBe('px-2 py-2');
    });

    it('يُلغي الـ class المتعارض ويحتفظ بالأحدث', () => {
        expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('يتجاهل القيم الفارغة', () => {
        expect(cn('px-2', undefined, null, false, '')).toBe('px-2');
    });
});

describe('formatCurrency', () => {
    it('يُنسّق المبلغ بالريال السعودي', () => {
        const result = formatCurrency(1500);
        // الـ locale ar-SA يستخدم أرقاماً عربية-هندية (١٬٥٠٠) ورمز ر.س.
        expect(result).toMatch(/١٬٥٠٠|1[,،٬]500/);
        expect(result).toMatch(/ر\.س|sar|﷼/i);
    });

    it('يتعامل مع صفر', () => {
        const result = formatCurrency(0);
        expect(result).toBeTruthy();
    });

    it('يتعامل مع الكسور', () => {
        const result = formatCurrency(99.5);
        // الرقم يظهر بأرقام عربية-هندية أو لاتينية حسب بيئة الاختبار
        expect(result).toMatch(/٩٩|99/);
    });
});

describe('formatDate', () => {
    it('يُنسّق التاريخ بالعربية', () => {
        const date = new Date('2024-01-15');
        const result = formatDate(date);
        expect(result).toMatch(/يناير|١٥|2024/);
    });

    it('يقبل string كمدخل', () => {
        const result = formatDate('2024-06-01');
        expect(result).toBeTruthy();
    });
});

describe('formatRelativeTime', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-06-01T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('يُعرض "الآن" للفارق الأقل من دقيقة', () => {
        const date = new Date('2024-06-01T11:59:45Z');
        expect(formatRelativeTime(date)).toBe('الآن');
    });

    it('يُعرض دقائق للفارق أقل من ساعة', () => {
        const date = new Date('2024-06-01T11:55:00Z');
        const result = formatRelativeTime(date);
        expect(result).toContain('دقيقة');
    });

    it('يُعرض ساعات للفارق أقل من يوم', () => {
        const date = new Date('2024-06-01T09:00:00Z');
        const result = formatRelativeTime(date);
        expect(result).toContain('ساعة');
    });

    it('يُعرض أيام للفارق أقل من أسبوع', () => {
        const date = new Date('2024-05-29T12:00:00Z');
        const result = formatRelativeTime(date);
        expect(result).toContain('يوم');
    });
});

describe('getInitials', () => {
    it('يستخرج الحرف الأول من كل كلمة', () => {
        expect(getInitials('أحمد محمد')).toBe('أم');
    });

    it('يُحوّل للأحرف الكبيرة في الإنجليزية', () => {
        expect(getInitials('Ahmed Mohamed')).toBe('AM');
    });

    it('يقتصر على حرفين', () => {
        expect(getInitials('أحمد محمد علي')).toBe('أم');
    });

    it('يتعامل مع اسم واحد', () => {
        expect(getInitials('محمد')).toBe('م');
    });
});

describe('truncate', () => {
    it('يقطع النص الطويل', () => {
        const result = truncate('نص طويل جداً لا يتسع في المساحة', 10);
        expect(result).toHaveLength(13);
        expect(result.endsWith('...')).toBe(true);
    });

    it('لا يقطع النص الأقصر من الحد', () => {
        const text = 'نص قصير';
        expect(truncate(text, 20)).toBe(text);
    });

    it('لا يقطع النص المساوي للحد تماماً', () => {
        const text = 'نص';
        expect(truncate(text, 2)).toBe(text);
    });
});

describe('isEmpty', () => {
    it('يُعيد true للكائن الفارغ', () => {
        expect(isEmpty({})).toBe(true);
    });

    it('يُعيد false للكائن غير الفارغ', () => {
        expect(isEmpty({ key: 'value' })).toBe(false);
    });
});

describe('generateId', () => {
    it('يُنتج معرّف غير فارغ', () => {
        expect(generateId()).toBeTruthy();
    });

    it('كل معرّف فريد', () => {
        const ids = new Set(Array.from({ length: 100 }, generateId));
        expect(ids.size).toBe(100);
    });
});

describe('debounce', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('يُأخّر تنفيذ الدالة', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 200);

        debounced();
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(200);
        expect(fn).toHaveBeenCalledOnce();
    });

    it('ينفّذ مرة واحدة عند الاستدعاء المتكرر', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 200);

        debounced();
        debounced();
        debounced();
        vi.advanceTimersByTime(200);

        expect(fn).toHaveBeenCalledOnce();
    });
});
