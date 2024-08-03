import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
      'reno-sand': {
        '50': '#f9f6ed',
        '100': '#f2e9cf',
        '200': '#e6d3a2',
        '300': '#d7b56d',
        '400': '#ca9945',
        '500': '#bb8537',
        '600': '#a0682d',
        '700': '#814d27',
        '800': '#6c4127',
        '900': '#5d3726',
        '950': '#361c12',
      },
      'moon-mist': {
        '50': '#f4f5f1',
        '100': '#e7e7da',
        '200': '#d8d9c6',
        '300': '#b4b58f',
        '400': '#9f9d70',
        '500': '#908d62',
        '600': '#7b7553',
        '700': '#645d44',
        '800': '#564e3d',
        '900': '#4b4438',
        '950': '#2a251e',
      },
      'coffee': {
        '50': '#f4f4f2',
        '100': '#e4e3dd',
        '200': '#ccc8bc',
        '300': '#aea896',
        '400': '#978e78',
        '500': '#887e6a',
        '600': '#726758',
        '700': '#5e544a',
        '800': '#514942',
        '900': '#48403b',
        '950': '#282220',
      },
    }
    },
    
  },
  plugins: [],
};
export default config;
