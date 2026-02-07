export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hangar: {
          primary: 'var(--hangar-primary)',
          accent: 'var(--hangar-accent)',
          silver: 'var(--hangar-silver)',
          bg: 'var(--hangar-bg)',
          surface: 'var(--hangar-surface)',
          panel: 'var(--hangar-panel)',
          text: 'var(--hangar-text)',
          muted: 'var(--hangar-muted)',
          cyan: 'var(--hangar-cyan)',
          purple: 'var(--hangar-purple)',
          green: 'var(--hangar-green)',
          red: 'var(--hangar-red)',
          orange: 'var(--hangar-orange)',
          slate: 'var(--hangar-slate)'
        }
      }
    }
  },
  plugins: []
};
