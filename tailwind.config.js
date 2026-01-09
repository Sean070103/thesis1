/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode specific colors
        'light-bg': '#f8fafc',
        'light-card': '#ffffff',
        'light-border': '#e2e8f0',
        'light-text': '#1e293b',
        'light-text-secondary': '#64748b',
      },
    },
  },
  plugins: [],
}





