/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--surface-3) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-dim': 'rgb(var(--ink-dim) / <alpha-value>)',
        'ink-faint': 'rgb(var(--ink-faint) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        arc: 'rgb(var(--arc) / <alpha-value>)',
        amber: 'rgb(var(--amber) / <alpha-value>)',
        good: 'rgb(var(--good) / <alpha-value>)',
        bad: 'rgb(var(--bad) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['Inter var', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Cascadia Mono', 'Consolas', 'monospace']
      },
      borderRadius: { xl2: '14px' },
      boxShadow: {
        panel: '0 1px 0 rgb(255 255 255 / 0.04) inset, 0 18px 40px -22px rgb(0 0 0 / 0.7)',
        lift: '0 20px 50px -28px rgb(0 0 0 / 0.85)'
      },
      transitionTimingFunction: { snap: 'cubic-bezier(0.22, 0.8, 0.3, 1)' }
    }
  },
  plugins: []
};
