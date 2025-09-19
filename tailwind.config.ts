import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/flowbite-react/lib/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f4fb',
          100: '#cce9f7',
          200: '#99d3ef',
          300: '#66bde7',
          400: '#33a7df',
          500: '#007fba', // Couleur primaire principale
          600: '#006699',
          700: '#004d73',
          800: '#00334d',
          900: '#001a26',
        },
        secondary: {
          50: '#f5e6f0',
          100: '#ebcce1',
          200: '#d799c3',
          300: '#c366a5',
          400: '#af3387',
          500: '#7f2360', // Couleur secondaire principale
          600: '#661c4d',
          700: '#4c153a',
          800: '#330e26',
          900: '#190713',
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['var(--font-rubik)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      animation: {
        fadeInUp: 'fadeInUp 0.8s ease-out forwards',
        gradientShift: 'gradientShift 6s ease infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 8s ease infinite',
      },
    },
  },
  plugins: [],
};

export default config;