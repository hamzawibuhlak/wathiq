/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            // Arabic-friendly fonts
            fontFamily: {
                sans: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
                cairo: ['Cairo', 'sans-serif'],
                tajawal: ['Tajawal', 'sans-serif'],
            },
            // Custom colors for Watheeq
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                // Watheeq brand colors (royal blue #2E75B6)
                watheeq: {
                    50: '#e8f1fa',
                    100: '#c5d9f0',
                    200: '#9ebfe5',
                    300: '#77a5d9',
                    400: '#5991d0',
                    500: '#2E75B6',
                    600: '#2766a2',
                    700: '#1f548a',
                    800: '#174272',
                    900: '#0f305a',
                    950: '#081e3c',
                },
                gold: {
                    DEFAULT: 'hsl(var(--gold))',
                    foreground: 'hsl(var(--gold-foreground))',
                    50: '#faf3db',
                    100: '#f5e7b7',
                    200: '#eed890',
                    300: '#e6c96a',
                    400: '#ddbf4e',
                    500: '#D4AF37',
                    600: '#b99630',
                    700: '#9d7d28',
                    800: '#816420',
                    900: '#654b18',
                },
                success: {
                    DEFAULT: '#16A34A',
                    foreground: '#ffffff',
                },
                warning: {
                    DEFAULT: '#f59e0b',
                    foreground: '#ffffff',
                },
                info: {
                    DEFAULT: '#3b82f6',
                    foreground: '#ffffff',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                'slide-in-from-right': {
                    from: { transform: 'translateX(100%)' },
                    to: { transform: 'translateX(0)' },
                },
                'slide-out-to-right': {
                    from: { transform: 'translateX(0)' },
                    to: { transform: 'translateX(100%)' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'fade-out': {
                    from: { opacity: '1' },
                    to: { opacity: '0' },
                },
                'spin-slow': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'slide-in': 'slide-in-from-right 0.3s ease-out',
                'slide-out': 'slide-out-to-right 0.3s ease-out',
                'fade-in': 'fade-in 0.2s ease-out',
                'fade-out': 'fade-out 0.2s ease-out',
                'spin-slow': 'spin-slow 2s linear infinite',
            },
            // RTL support
            spacing: {
                'safe-top': 'env(safe-area-inset-top)',
                'safe-bottom': 'env(safe-area-inset-bottom)',
                'safe-left': 'env(safe-area-inset-left)',
                'safe-right': 'env(safe-area-inset-right)',
            },
        },
    },
    plugins: [
        require('tailwindcss-animate'),
    ],
};
