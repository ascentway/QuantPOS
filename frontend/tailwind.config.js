/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        manrope:    ['Inter', 'sans-serif'],
        cabin:      ['Inter', 'sans-serif'],
        instrument: ['Inter', 'sans-serif'],
        inter:      ['Inter', 'sans-serif'],
      },
      colors: {
        // Revenue-Grade Automation tokens
        primary:         '#5757f8',   // Electric Violet
        'primary-hover': '#6c6cf8',
        'dark-bg':       '#111118',   // Midnight Ink (true base)
        'dark-surface':  '#16161f',   // Elevated card surface
        'dark-sidebar':  '#0e0e1a',   // Deepest sidebar
        'brand-purple':  '#7b39fc',   // Legacy landing page purple
        'secondary-dark':'#2b2344',
      },
      borderRadius: {
        'card':    '12px',
        'card-sm': '8px',
        'card-xs': '6px',
      },
      boxShadow: {
        'soft':    '0 4px 20px -2px rgba(0, 0, 0, 0.3)',
        'violet':  '0 4px 20px -4px rgba(87, 87, 248, 0.35)',
        'glow':    '0 0 40px -8px rgba(87, 87, 248, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
