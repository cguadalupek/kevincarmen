import type { Config } from 'tailwindcss';

const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Los colores de las categorías (MAIN_CATEGORY_COLORS) viven en src/lib.
    // Sin este glob Tailwind no genera esas clases y los badges salen sin color.
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: withOpacity('--background'),
        foreground: withOpacity('--foreground'),
        primary: {
          DEFAULT: withOpacity('--primary'),
          foreground: withOpacity('--primary-foreground'),
        },
        accent: {
          DEFAULT: withOpacity('--accent'),
          foreground: withOpacity('--accent-foreground'),
        },
        muted: {
          DEFAULT: withOpacity('--muted'),
          foreground: withOpacity('--muted-foreground'),
        },
        border: withOpacity('--border'),
        card: {
          DEFAULT: withOpacity('--card'),
          foreground: withOpacity('--card-foreground'),
        },
        ring: withOpacity('--ring'),
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        glow: 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { opacity: '0.4' },
          '100%': { opacity: '0.8' },
        },
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgb(var(--border) / 0.5) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--border) / 0.5) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      backgroundSize: {
        grid: '64px 64px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
