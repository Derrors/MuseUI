/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: [
    'text-indigo-600',
    'dark:text-indigo-400',
    'text-rose-600',
    'dark:text-rose-400',
    'text-emerald-600',
    'dark:text-emerald-400',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
