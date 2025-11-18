import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#38A169',
          light: '#48BB78',
          dark: '#2F855A',
        },
        secondary: {
          DEFAULT: '#EDE4CC',
          light: '#F5F0E8',
          dark: '#E2D5B7',
        },
        accent: {
          DEFAULT: '#FFC300',
          light: '#FFD233',
          dark: '#E6B000',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#EF4444',
          dark: '#B91C1C',
        },
        dark: {
          DEFAULT: '#1F2937',
          light: '#374151',
          dark: '#111827',
        },
        light: {
          DEFAULT: '#F7F7F7',
          light: '#FAFAFA',
          dark: '#F3F4F6',
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;