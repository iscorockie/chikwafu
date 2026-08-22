/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      opacity: { 4: '.04', 6: '.06', 8: '.08', 12: '.12', 15: '.15', 18: '.18', 22: '.22', 35: '.35', 45: '.45', 65: '.65', 85: '.85' },
      colors: {
        ink: { DEFAULT: '#14110F', 700: '#2A2521', 500: '#5B534C', 300: '#9A9089' },
        cream: { DEFAULT: '#F7F4EF', 200: '#EFEAE2', 300: '#E3DCD1' },
        copper: { DEFAULT: '#B4643A', 600: '#9C5330', dark: '#7E4326', light: '#E8C4AC' },
        moss: '#2F4F43',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20,17,15,.04), 0 12px 32px -12px rgba(20,17,15,.12)',
        lift: '0 2px 6px rgba(20,17,15,.06), 0 24px 48px -16px rgba(20,17,15,.22)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'none' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-up': 'fade-up .7s cubic-bezier(.22,1,.36,1) both',
        marquee: 'marquee 32s linear infinite',
      },
    },
  },
  plugins: [],
}
