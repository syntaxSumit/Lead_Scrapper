/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base:     '#07130e', // Deep obsidian forest
        surface:  '#0d221a', // Rich dark pine surface
        surface2: '#122c22', // Elevated forest container
        surface3: '#18382c', // Active item / pill surface
        border:   '#1b3e31', // Subtle moss/emerald border
        forest: {
          950: '#05100b',
          900: '#071610',
          850: '#0a1d15',
          800: '#0d241b',
          700: '#133527',
          600: '#1b4735',
          500: '#26634a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'fade-in':   'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
      },
    },
  },
  plugins: [],
};
