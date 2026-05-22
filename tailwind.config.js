/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./{app,components,libs,pages,hooks}/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          espresso: '#8A6A58',
          nude: '#EDE3D7',
          champagne: '#C8A46A',
          mauve: '#A6A089',
          rose: '#A6A089',
          cream: '#FAF7F2',
          cocoa: '#4A403B',
          DEFAULT: '#8A6A58',
          light: '#EDE3D7',
          dark: '#4A403B',
          accent: '#C8A46A',
        },
      },
      letterSpacing: {
        'widest-lg': '0.2em',
        'widest-xl': '0.3em',
      },
      boxShadow: {
        luxury: '0 10px 40px -10px rgba(138, 106, 88, 0.08)',
        'luxury-lg': '0 20px 60px -15px rgba(138, 106, 88, 0.12)',
        soft: '0 8px 30px -12px rgba(166, 160, 137, 0.25)',
      },
      transitionDuration: {
        luxury: '500ms',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        shimmer: 'shimmer 3s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
