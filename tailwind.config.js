/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./{app,components,libs,pages,hooks}/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          rose: '#E88BA8',
          blush: '#F6E6E8',
          berry: '#C95D7B',
          lavender: '#DCC9D6',
          ivory: '#FFF9F7',
          cocoa: '#5B4B4B',
          /** Semantic aliases used across components */
          espresso: '#C95D7B',
          nude: '#F6E6E8',
          champagne: '#E88BA8',
          mauve: '#DCC9D6',
          cream: '#FFF9F7',
          DEFAULT: '#E88BA8',
          light: '#F6E6E8',
          dark: '#5B4B4B',
          accent: '#C95D7B',
        },
      },
      letterSpacing: {
        'widest-lg': '0.2em',
        'widest-xl': '0.3em',
      },
/* Add shadow-glass utilities to tailwind config */
      boxShadow: {
        luxury: '0 10px 40px -10px rgba(232, 139, 168, 0.12)',
        'luxury-lg': '0 20px 60px -15px rgba(201, 93, 123, 0.14)',
        soft: '0 8px 30px -12px rgba(220, 201, 214, 0.45)',
        wellness: '0 4px 24px -4px rgba(91, 75, 75, 0.06)',
        glass: '0 8px 32px -4px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.15)',
        'glass-strong': '0 16px 40px -8px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.3)',
        'glass-hover': '0 24px 60px -12px rgba(201, 93, 123, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 0 40px rgba(255, 255, 255, 0.5)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 100%)',
        'glass-gradient-strong': 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.3) 100%)',
      },
      transitionDuration: {
        luxury: '500ms',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
};
