import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1d4ed8',
          dark: '#1e40af',
          light: '#60a5fa'
        }
      },
      boxShadow: {
        soft: '0 20px 45px -15px rgba(30, 64, 175, 0.35)'
      }
    }
  },
  plugins: [],
};

export default config;
