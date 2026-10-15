/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: '#0B0D10',
        panel: '#12151A',
        raised: '#191D24',
        edge: '#292E37',
        ink: '#F5F5F7',
        mute: '#A0A7B4',
        lime: { DEFAULT: '#B7F36B', deep: '#99D84C' },
        electric: '#5B8CFF',
        violet: '#A78BFA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: { xl2: '1rem' },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,0.35)',
        pop: '0 16px 48px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};
