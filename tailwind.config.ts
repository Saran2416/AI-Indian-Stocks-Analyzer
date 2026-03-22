import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c3d66',
        },
      },
      backdropFilter: {
        none: 'none',
        sm: 'blur(4px)',
        DEFAULT: 'blur(12px)',
        md: 'blur(16px)',
        lg: 'blur(20px)',
      },
      backgroundColor: {
        glassmorphism: 'rgba(17, 25, 40, 0.75)',
        'glassmorphism-light': 'rgba(255, 255, 255, 0.1)',
      },
      borderColor: {
        glassmorphism: 'rgba(255, 255, 255, 0.2)',
      },
    },
  },
  plugins: [],
}
export default config
