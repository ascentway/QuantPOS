/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'dm-serif': ['"DM Serif Display"', 'serif'],   /* Brand display font  matches logo */
        manrope: ['Inter', 'sans-serif'],
        cabin: ['Inter', 'sans-serif'],
        instrument: ['"DM Serif Display"', 'serif'],   /* Alias  existing font-instrument → DM Serif */
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        // Semantic variables mapped to index.css
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        sidebar: 'var(--sidebar)',
        card2: 'var(--card2)',
        theme: 'var(--border)',
        'theme-strong': 'var(--border-strong)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-subtle': 'var(--accent-subtle)',
        success: 'var(--success)',
        'success-bg': 'var(--success-bg)',
        warning: 'var(--warning)',
        'warning-bg': 'var(--warning-bg)',
        danger: 'var(--danger)',
        'danger-bg': 'var(--danger-bg)',
        info: 'var(--info)',
        'info-bg': 'var(--info-bg)',

        // Legacy tokens
        primary: 'var(--accent)',
        'primary-hover': 'var(--accent-hover)',
        'dark-bg': 'var(--bg)',
        'dark-surface': 'var(--surface)',
        'dark-sidebar': 'var(--sidebar)',
        'brand-teal': 'var(--accent)',
        'brand-navy': '#0C206D',
        'brand-mint': '#00F5D4',
        'secondary-dark': 'var(--card2)',
      },
      borderRadius: {
        'card': '12px',
        'card-sm': '8px',
        'card-xs': '6px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.3)',
        'teal': '0 4px 20px -4px rgba(0, 164, 164, 0.35)',
        'glow': '0 0 40px -8px rgba(0, 164, 164, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
