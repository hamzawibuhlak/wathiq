export const DEFAULT_THEME = {
    primaryColor: '#c49353',
    secondaryColor: '#423e3f',
    tertiaryColor: '#e1ded9',
    fontArabic: 'Almarai',
    fontEnglish: 'Inter',
};

export const ARABIC_FONTS = [
    'Almarai',
    'Cairo',
    'Tajawal',
    'Noto Sans Arabic',
    'IBM Plex Sans Arabic',
    'Readex Pro',
    'Markazi Text',
    'Amiri',
];

export const ENGLISH_FONTS = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Poppins',
    'Montserrat',
    'Nunito',
    'Source Sans 3',
];

export function hexToHsl(hex: string): string {
    const m = hex.trim().replace('#', '');
    const full = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const loadedFonts = new Set<string>();

export function ensureGoogleFont(family: string) {
    if (!family || loadedFonts.has(family)) return;
    loadedFonts.add(family);
    const id = `gf-${family.replace(/\s+/g, '-')}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;600;700;800&display=swap`;
    document.head.appendChild(link);
}

export function applyTheme(theme: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
    tertiaryColor?: string | null;
    fontArabic?: string | null;
    fontEnglish?: string | null;
}) {
    const root = document.documentElement;
    const primary = theme.primaryColor || DEFAULT_THEME.primaryColor;
    const secondary = theme.secondaryColor || DEFAULT_THEME.secondaryColor;
    const tertiary = theme.tertiaryColor || DEFAULT_THEME.tertiaryColor;
    const fontAr = theme.fontArabic || DEFAULT_THEME.fontArabic;
    const fontEn = theme.fontEnglish || DEFAULT_THEME.fontEnglish;

    root.style.setProperty('--primary', hexToHsl(primary));
    root.style.setProperty('--gold', hexToHsl(primary));
    root.style.setProperty('--ring', hexToHsl(primary));
    root.style.setProperty('--secondary', hexToHsl(tertiary));
    root.style.setProperty('--secondary-foreground', hexToHsl(secondary));
    root.style.setProperty('--foreground', hexToHsl(secondary));

    ensureGoogleFont(fontAr);
    ensureGoogleFont(fontEn);
    document.body.style.fontFamily = `'${fontAr}', '${fontEn}', system-ui, sans-serif`;
}
