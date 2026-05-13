import { useEffect, useState } from 'react';
import { Palette, Save, RotateCcw, Type, Sun, Moon } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Label } from '@/components/ui';
import { useFirmSettings, useUpdateFirmSettings } from '@/hooks/use-settings';
import { DEFAULT_THEME, ARABIC_FONTS, ENGLISH_FONTS, applyTheme, ensureGoogleFont, applyThemeMode, getThemeMode, type ThemeMode } from '@/lib/theme';

type ThemeState = {
    primaryColor: string;
    secondaryColor: string;
    tertiaryColor: string;
    fontArabic: string;
    fontEnglish: string;
};

const COLOR_FIELDS: { key: keyof ThemeState; label: string; hint: string }[] = [
    { key: 'primaryColor', label: 'اللون الأساسي', hint: 'يستخدم في الأزرار والعناصر النشطة والشعار' },
    { key: 'secondaryColor', label: 'اللون الثانوي', hint: 'يستخدم في النصوص الداكنة والحدود' },
    { key: 'tertiaryColor', label: 'اللون الثالث', hint: 'يستخدم في الخلفيات الفاتحة' },
];

export function ThemePage() {
    const { data: firmData, isLoading } = useFirmSettings();
    const updateMutation = useUpdateFirmSettings();
    const firm = firmData?.data;

    const [mode, setMode] = useState<ThemeMode>(getThemeMode());

    const toggleMode = (next: ThemeMode) => {
        setMode(next);
        applyThemeMode(next);
    };

    const [state, setState] = useState<ThemeState>({
        primaryColor: DEFAULT_THEME.primaryColor,
        secondaryColor: DEFAULT_THEME.secondaryColor,
        tertiaryColor: DEFAULT_THEME.tertiaryColor,
        fontArabic: DEFAULT_THEME.fontArabic,
        fontEnglish: DEFAULT_THEME.fontEnglish,
    });

    useEffect(() => {
        if (!firm) return;
        setState({
            primaryColor: firm.primaryColor || DEFAULT_THEME.primaryColor,
            secondaryColor: firm.secondaryColor || DEFAULT_THEME.secondaryColor,
            tertiaryColor: firm.tertiaryColor || DEFAULT_THEME.tertiaryColor,
            fontArabic: firm.fontArabic || DEFAULT_THEME.fontArabic,
            fontEnglish: firm.fontEnglish || DEFAULT_THEME.fontEnglish,
        });
    }, [firm?.primaryColor, firm?.secondaryColor, firm?.tertiaryColor, firm?.fontArabic, firm?.fontEnglish]);

    const update = <K extends keyof ThemeState>(key: K, value: ThemeState[K]) => {
        const next = { ...state, [key]: value };
        setState(next);
        applyTheme(next);
    };

    const handleSave = () => updateMutation.mutate(state);
    const handleReset = () => {
        setState(DEFAULT_THEME);
        applyTheme(DEFAULT_THEME);
    };

    if (isLoading) {
        return <div className="p-6 animate-pulse h-64 bg-muted rounded-xl" />;
    }

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {mode === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        وضع العرض
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={mode === 'light' ? 'default' : 'outline'}
                            onClick={() => toggleMode('light')}
                        >
                            <Sun className="w-4 h-4 ml-2" />
                            فاتح
                        </Button>
                        <Button
                            type="button"
                            variant={mode === 'dark' ? 'default' : 'outline'}
                            onClick={() => toggleMode('dark')}
                        >
                            <Moon className="w-4 h-4 ml-2" />
                            داكن
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">يُحفظ التفضيل في هذا المتصفح فقط.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        الألوان
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    {COLOR_FIELDS.map(({ key, label, hint }) => (
                        <div key={key} className="grid grid-cols-1 md:grid-cols-[200px_140px_1fr] gap-3 items-center">
                            <div>
                                <Label className="block">{label}</Label>
                                <p className="text-xs text-muted-foreground mt-1">{hint}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={state[key] as string}
                                    onChange={(e) => update(key, e.target.value)}
                                    className="w-12 h-10 rounded border border-input cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={state[key] as string}
                                    onChange={(e) => update(key, e.target.value)}
                                    dir="ltr"
                                    className="flex-1 h-10 px-3 rounded border border-input bg-background text-sm font-mono"
                                />
                            </div>
                            <div
                                className="h-10 rounded border border-input flex items-center justify-center text-xs text-white font-medium"
                                style={{ backgroundColor: state[key] as string }}
                            >
                                معاينة
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Type className="w-5 h-5" />
                        الخطوط
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>الخط العربي</Label>
                            <select
                                value={state.fontArabic}
                                onChange={(e) => {
                                    ensureGoogleFont(e.target.value);
                                    update('fontArabic', e.target.value);
                                }}
                                className="w-full h-10 px-3 rounded border border-input bg-background text-sm"
                            >
                                {ARABIC_FONTS.map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                            <div
                                className="border rounded-lg p-4 bg-muted/30"
                                style={{ fontFamily: `'${state.fontArabic}', sans-serif` }}
                            >
                                <p className="text-2xl font-bold mb-1">شركة وسم الثقة للمحاماة</p>
                                <p className="text-sm text-muted-foreground">نموذج نص بالخط العربي المختار</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>الخط الإنجليزي</Label>
                            <select
                                value={state.fontEnglish}
                                onChange={(e) => {
                                    ensureGoogleFont(e.target.value);
                                    update('fontEnglish', e.target.value);
                                }}
                                className="w-full h-10 px-3 rounded border border-input bg-background text-sm"
                            >
                                {ENGLISH_FONTS.map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                            <div
                                className="border rounded-lg p-4 bg-muted/30"
                                style={{ fontFamily: `'${state.fontEnglish}', sans-serif` }}
                                dir="ltr"
                            >
                                <p className="text-2xl font-bold mb-1">Wasm Altheeqa Law Firm</p>
                                <p className="text-sm text-muted-foreground">Sample text in the selected English font</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center pt-2">
                <Button type="button" variant="outline" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 ml-2" />
                    استرجاع الافتراضي
                </Button>
                <Button type="button" onClick={handleSave} isLoading={updateMutation.isPending}>
                    <Save className="w-4 h-4 ml-2" />
                    حفظ التغييرات
                </Button>
            </div>
        </div>
    );
}

export default ThemePage;
