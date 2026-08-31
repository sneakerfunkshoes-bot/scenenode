/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#050505',
          50: '#0a0a0a',
          100: '#0f0f0f',
          200: '#141414',
          300: '#1a1a1a',
          400: '#222222',
        },
        silver: {
          DEFAULT: '#E2E8F0',
          muted: '#94A3B8',
          dim: '#64748B',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-jakarta)', 'sans-serif'],
        body: ['var(--font-jakarta)', 'sans-serif'],
        mono: ['var(--font-jakarta)', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.55)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatCard1: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotateZ(0deg)' },
          '50%': { transform: 'translate3d(0, -8px, 10px) rotateZ(1deg)' },
        },
        floatCard2: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotateZ(0deg)' },
          '50%': { transform: 'translate3d(0, -10px, 12px) rotateZ(-1deg)' },
        },
        floatCard3: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotateZ(0deg)' },
          '50%': { transform: 'translate3d(0, -6px, 8px) rotateZ(0.8deg)' },
        },
        floatCard4: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotateZ(0deg)' },
          '50%': { transform: 'translate3d(0, -9px, 11px) rotateZ(-0.8deg)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'mini-1': 'floatCard1 5s ease-in-out infinite',
        'mini-2': 'floatCard2 6s ease-in-out infinite 0.5s',
        'mini-3': 'floatCard3 5.5s ease-in-out infinite 1s',
        'mini-4': 'floatCard4 6.5s ease-in-out infinite 1.5s',
        'spin-slow': 'spin 6s linear infinite',
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-black',
    'bg-zinc-950',
    'bg-zinc-900',
    'backdrop-blur-md',
    'bg-clip-text',
    'text-transparent',
  ],
};
