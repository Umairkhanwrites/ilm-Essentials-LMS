/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ============================================
      // ILM ESSENTIALS — Custom Design Tokens
      // Inspired by ilmessentials.pk branding
      // ============================================
      colors: {
        // Primary Brand — Deep Islamic Emerald
        primary: {
          50:  '#E8F5EE',
          100: '#C6E7D3',
          200: '#9DD6B5',
          300: '#6EC294',
          400: '#47B27A',
          500: '#1A7A4E',
          600: '#186E46',
          700: '#155E3D',
          800: '#114D33',
          900: '#0A3D2E',
          950: '#062A1F',
        },
        // Accent — Warm Gold (scholarly, premium)
        gold: {
          50:  '#FDF8EB',
          100: '#FAF0D1',
          200: '#F5E1A3',
          300: '#EFD075',
          400: '#D4B96A',
          500: '#C8A951',
          600: '#B5933B',
          700: '#9A7B2F',
          800: '#7E6424',
          900: '#634E1C',
        },
        // Background — Warm Sand tones
        sand: {
          50:  '#FAF8F5',
          100: '#F3EFE8',
          200: '#E8E0D4',
          300: '#D6CCBC',
          400: '#C0B29E',
        },
        // Dark tones for text
        ink: {
          900: '#1A1A2E',
          800: '#2D2D3F',
          700: '#3D3D50',
          600: '#4A4A5A',
          500: '#62627A',
          400: '#9CA3AF',
          300: '#C5C9D4',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      // Spacing and sizing extensions
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 40px -10px rgba(10, 61, 46, 0.15)',
        'glow': '0 0 20px rgba(200, 169, 81, 0.3)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
      },

    },
  },
  plugins: [],
}
