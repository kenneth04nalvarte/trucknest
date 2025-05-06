/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1F3A93',
          dark: '#0A2342',
        },
        darkgray: {
          DEFAULT: '#4A4A4A',
          darker: '#333333',
        },
        orange: {
          DEFAULT: '#FFA500',
          dark: '#FF6F00',
        },
        green: {
          DEFAULT: '#28A745',
        },
        lightgray: '#F5F5F5',
      },
    },
  },
  plugins: [],
} 