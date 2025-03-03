import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],

    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: [
                    'Inter',
                    ...defaultTheme.fontFamily.sans
                ],
                display: [
                    'Bricolage Grotesque',
                    ...defaultTheme.fontFamily.serif
                ]
            },
            borderRadius: {
                // lg: 'var(--radius)',
                // md: 'calc(var(--radius) - 2px)',
                // sm: 'calc(var(--radius) - 4px)',
                none: '0',
                sm: '0.125rem',
                DEFAULT: '0.25rem',
                DEFAULT: '4px',
                md: '0.375rem',
                lg: '0.5rem',
                xl: '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
                full: '9999px',
                large: '12px',
            },
            // colors: {
            //     background: 'hsl(var(--background))',
            //     foreground: 'hsl(var(--foreground))',
            //     card: {
            //         DEFAULT: 'hsl(var(--card))',
            //         foreground: 'hsl(var(--card-foreground))'
            //     },
            //     popover: {
            //         DEFAULT: 'hsl(var(--popover))',
            //         foreground: 'hsl(var(--popover-foreground))'
            //     },
            //     primary: {
            //         DEFAULT: 'hsl(var(--primary))',
            //         foreground: 'hsl(var(--primary-foreground))'
            //     },
            //     secondary: {
            //         DEFAULT: 'hsl(var(--secondary))',
            //         foreground: 'hsl(var(--secondary-foreground))'
            //     },
            //     muted: {
            //         DEFAULT: 'hsl(var(--muted))',
            //         foreground: 'hsl(var(--muted-foreground))'
            //     },
            //     accent: {
            //         DEFAULT: 'hsl(var(--accent))',
            //         foreground: 'hsl(var(--accent-foreground))'
            //     },
            //     destructive: {
            //         DEFAULT: 'hsl(var(--destructive))',
            //         foreground: 'hsl(var(--destructive-foreground))'
            //     },
            //     border: 'hsl(var(--border))',
            //     input: 'hsl(var(--input))',
            //     ring: 'hsl(var(--ring))',
            //     chart: {
            //         '1': 'hsl(var(--chart-1))',
            //         '2': 'hsl(var(--chart-2))',
            //         '3': 'hsl(var(--chart-3))',
            //         '4': 'hsl(var(--chart-4))',
            //         '5': 'hsl(var(--chart-5))'
            //     }
            // },
            /* Primitives - Mode 1 */
            colors: {
                border: 'hsl(var(--border))',
                "neutral-0": "rgba(254, 254, 254, 1)",
                "neutral-50": "rgba(250, 250, 250, 1)",
                "neutral-100": "rgba(245, 245, 245, 1)",
                "neutral-200": "rgba(229, 229, 229, 1)",
                "neutral-300": "rgba(212, 212, 212, 1)",
                "neutral-400": "rgba(163, 163, 163, 1)",
                "neutral-500": "rgba(115, 115, 115, 1)",
                "neutral-600": "rgba(82, 82, 82, 1)",
                "neutral-700": "rgba(64, 64, 64, 1)",
                "neutral-800": "rgba(38, 38, 38, 1)",
                "neutral-900": "rgba(23, 23, 23, 1)",
                "neutral-950": "rgba(10, 10, 10, 1)",
                "base-black": "rgba(11, 12, 12, 1)",
                "base-white": "rgba(250, 249, 249, 1)",
                "base-transparent": "rgba(255, 255, 255, 0)",
                "utilities---lightbox": "rgba(23, 23, 23, 0.699999988079071)"
              },
            spacing: {   
                "breakpoint-xs": "480px",
                "breakpoint-sm": "640px",
                "breakpoint-md": "768px",
                "breakpoint-lg": "1024px",
                "breakpoint-xl": "1280px",
                "breakpoint-2xl": "1440px",
                "breakpoint-3xl": "1536px",
                "border-radius-full": "9999px",
                "container-xs": "var(--breakpoint-xs)",
                "container-sm": "var(--breakpoint-sm)",
                "container-md": "var(--breakpoint-md)",
                "container-lg": "var(--breakpoint-lg)",
                "container-xl": "var(--breakpoint-xl)",
                "container-2xl": "var(--breakpoint-2xl)",
                "container-3xl": "var(--breakpoint-3xl)",
                "icon-size-xs": "14px",
                "icon-size-md": "18px",
                "icon-size-base": "20px",
                "icon-size-lg": "24px",
                // "button-size-xs": "24px",
                // "button-size-sm": "32px",
                // "button-size-md": "40px",
                // "button-size-lg": "48px",
                // "button-size-xl": "56px",
            },
              
        }
    },

    // plugins: [forms, require("tailwindcss-animate")],
    plugins: [
        forms,
        require("tailwindcss-animate"),
        function ({ addUtilities }) {
            addUtilities({
                // Define a custom utility class
                '.button': {
                    '@apply inline-flex items-center justify-center gap-2 whitespace-nowrap rounded px-4 py-0 transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0': {},
                },
                '.button-size-xs': {
                    '@apply h-8 uppercase px-3': {},
                },
                '.button-size-sm': {
                    '@apply h-9 uppercase px-3': {},
                },
                '.button-size-md': {
                     '@apply h-10 uppercase px-4': {},
                },
                '.button-size-lg': {
                    '@apply h-12 uppercase px-5': {},
                },
                '.button-size-xl': {
                    '@apply h-14 uppercase px-6': {},
                },
                '.button-primary': {
                    '@apply bg-neutral-900 text-neutral-0 hover:bg-neutral-800': {},
                },
                '.card-shadow': {
                    '@apply shadow-lg p-4 rounded-lg bg-white': {},
                },
            });
        },
    ],
};
