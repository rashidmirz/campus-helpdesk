/** @type {import('tailwindcss').Config} */
const rgb = (v) => `rgb(var(${v}) / <alpha-value>)`;
const scale = (n) => Object.fromEntries([50,100,200,300,400,500,600,700,800,900].map(s => [s, rgb(`--${n}-${s}`)]));

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        accent: { ...scale('ac'), DEFAULT: rgb('--ac'), hover: rgb('--ac-hover'), soft: rgb('--ac-soft'), softfg: rgb('--ac-soft-fg'), on: rgb('--ac-on') },
        app: rgb('--app'),
        surface: { DEFAULT: rgb('--surface'), 2: rgb('--surface-2'), 3: rgb('--surface-3') },
        line: { DEFAULT: rgb('--line'), strong: rgb('--line-strong') },
        ink: { DEFAULT: rgb('--ink'), 2: rgb('--ink-2'), 3: rgb('--ink-3') },
        ok: { DEFAULT: rgb('--ok'), soft: rgb('--ok-soft'), fg: rgb('--ok-fg') },
        warn: { DEFAULT: rgb('--warn'), soft: rgb('--warn-soft'), fg: rgb('--warn-fg') },
        bad: { DEFAULT: rgb('--bad'), soft: rgb('--bad-soft'), fg: rgb('--bad-fg') },
        info: { DEFAULT: rgb('--info'), soft: rgb('--info-soft'), fg: rgb('--info-fg') },
        violet: { DEFAULT: rgb('--vio'), soft: rgb('--vio-soft'), fg: rgb('--vio-fg') },
        sb: { bg: rgb('--sb-bg'), fg: rgb('--sb-fg'), dim: rgb('--sb-dim'), line: rgb('--sb-line'), hover: rgb('--sb-hover'), active: rgb('--sb-active'), activefg: rgb('--sb-active-fg') },
      },
      borderRadius: {
        sm: 'var(--r-sm)', DEFAULT: 'var(--r-md)', md: 'var(--r-md)', lg: 'var(--r-lg)', xl: 'var(--r-xl)', '2xl': 'var(--r-2xl)',
      },
      fontFamily: {
        sans: ['var(--font-body)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / 0.05), 0 0 0 1px rgb(var(--line) / 1)',
        pop: '0 12px 32px -8px rgb(var(--shadow) / 0.22), 0 0 0 1px rgb(var(--line) / 1)',
        focus: '0 0 0 3px rgb(var(--ac) / 0.28)',
      },
      keyframes: {
        pop: { from: { opacity: 0, transform: 'translateY(6px) scale(.98)' }, to: { opacity: 1, transform: 'none' } },
        fade: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(100%)' }, to: { opacity: 1, transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        draw: { from: { strokeDashoffset: 'var(--len)' }, to: { strokeDashoffset: 0 } },
        ping2: { '75%,100%': { transform: 'scale(2.2)', opacity: 0 } },
      },
      animation: {
        pop: 'pop .16s ease-out both',
        fade: 'fade .15s ease-out both',
        slideIn: 'slideIn .22s cubic-bezier(.2,.8,.2,1) both',
        slideUp: 'slideUp .22s cubic-bezier(.2,.8,.2,1) both',
        shimmer: 'shimmer 1.4s infinite',
        draw: 'draw .9s ease-out both',
        ping2: 'ping2 1.8s cubic-bezier(0,0,.2,1) infinite',
      },
    },
  },
  plugins: [],
};
