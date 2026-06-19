/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xs: '420px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px'
    },
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-elev': 'var(--bg-elev)',
        fg: 'var(--fg)',
        'fg-soft': 'var(--fg-soft)',
        muted: 'var(--muted)',
        'muted-2': 'var(--muted-2)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-fg': 'var(--accent-fg)',
        violet: 'var(--violet)',
        cyan: 'var(--cyan)',
        magenta: 'var(--magenta)',
        lime: 'var(--lime)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)'
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)']
      },
      fontSize: {
        '2xs': 'var(--text-2xs)',
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
        display: 'var(--text-display)'
      },
      letterSpacing: {
        tightest: '-0.045em',
        tighter: '-0.03em',
        snug: '-0.015em',
        caps: '0.16em'
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        pill: 'var(--radius-pill)'
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        glow: 'var(--shadow-glow)',
        inset: 'var(--shadow-inset)'
      },
      backdropBlur: {
        xs: '6px', sm: '12px', md: '20px', lg: '40px', xl: '80px', '2xl': '140px'
      },
      transitionTimingFunction: {
        'out-expo': 'var(--ease-out-expo)',
        'out-quart': 'var(--ease-out-quart)',
        'in-out-quart': 'var(--ease-in-out-quart)',
        spring: 'var(--ease-spring)'
      },
      transitionDuration: {
        instant: '80ms', fast: '160ms', normal: '260ms',
        slow: '480ms', cinematic: '1200ms'
      },
      backgroundImage: {
        'grad-accent': 'var(--grad-accent)',
        'grad-aurora': 'var(--grad-aurora)',
        'grad-mesh': 'var(--grad-mesh)',
        'grad-shine': 'var(--grad-shine)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
