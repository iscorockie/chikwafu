/** @type {import('tailwindcss').Config} */
// Palette + type lifted from the live chikwafu.com design system.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      opacity: { 4: '.04', 6: '.06', 8: '.08', 12: '.12', 15: '.15', 18: '.18', 22: '.22', 35: '.35', 45: '.45', 65: '.65', 85: '.85' },
      colors: {
        bg: { DEFAULT: '#0a0a0f', 2: '#111118', 3: '#18181f' },
        card: '#1c1c25',
        accent: { DEFAULT: '#00e5a0', 2: '#00c488', dim: 'rgba(0,229,160,.12)' },
        text: { DEFAULT: '#f0f0f5', muted: '#8888a0', dim: '#555568' },
        line: 'hsla(0,0%,100%,.08)',
        danger: '#ff4d4d',
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '14px', sm: '8px', xl: '14px', '2xl': '18px', '3xl': '24px' },
      boxShadow: {
        soft: '0 4px 24px rgba(0,0,0,.4)',
        lift: '0 16px 48px rgba(0,0,0,.6)',
        glow: '0 0 0 1px rgba(0,229,160,.25), 0 12px 40px -12px rgba(0,229,160,.35)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'none' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: .35 } },
      },
      animation: {
        'fade-up': 'fade-up .7s cubic-bezier(.22,1,.36,1) both',
        marquee: 'marquee 32s linear infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
