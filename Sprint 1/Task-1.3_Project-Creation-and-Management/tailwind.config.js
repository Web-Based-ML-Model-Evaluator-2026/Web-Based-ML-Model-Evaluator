/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#000000',
          panel: '#111111',
          border: '#333333',
          textPrimary: '#ffffff',
          textSecondary: '#a1a1aa'
        },
        light: {
          bg: '#f8fafc',
          panel: '#ffffff',
          border: '#e2e8f0',
          textPrimary: '#0f172a',
          textSecondary: '#64748b'
        },
        primary: '#2563eb',
      }
    },
  },
  plugins: [],
}