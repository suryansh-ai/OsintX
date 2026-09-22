/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Student - Restricted Field Investigation (cold blue/cyan)
        student: {
          primary: '#06b6d4',
          secondary: '#0891b2',
          accent: '#22d3ee',
          glow: '#67e8f9',
          dark: '#083344',
          darker: '#042f2e',
          bg: '#0c1222',
          surface: '#0f172a',
        },
        // Normal User - Open Investigation Workspace (dark neutral/amber)
        user: {
          primary: '#f59e0b',
          secondary: '#d97706',
          accent: '#fbbf24',
          glow: '#fcd34d',
          dark: '#292524',
          darker: '#1c1917',
          bg: '#0f0d0a',
          surface: '#1c1917',
        },
        // Cyber base colors
        cyber: {
          black: '#030712',
          darker: '#0a0a0f',
          dark: '#111827',
          gray: '#1f2937',
          steel: '#374151',
        },
        // Status colors
        status: {
          success: '#22c55e',
          warning: '#eab308',
          danger: '#ef4444',
          info: '#3b82f6',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'data-stream': 'data-stream 1.5s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'typing': 'typing 2s steps(40, end)',
        'radar': 'radar 2s linear infinite',
        'signal-pulse': 'signal-pulse 1.5s ease-out infinite',
        'glitch': 'glitch 0.3s ease-in-out',
        'boot-up': 'boot-up 0.5s ease-out forwards',
        'reveal': 'reveal 0.8s ease-out forwards',
        'drain': 'drain 1s ease-in-out',
        'sweep': 'sweep 2s ease-in-out infinite',
        'particle': 'particle 3s linear infinite',
        'cinematic-open': 'cinematic-open 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'flicker': 'flicker 0.15s infinite',
        'matrix': 'matrix 20s linear infinite',
        'shimmer': 'shimmer 1.2s linear infinite',
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px var(--glow-color, rgba(6, 182, 212, 0.3))' },
          '50%': { boxShadow: '0 0 50px var(--glow-color, rgba(6, 182, 212, 0.6))' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'data-stream': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'typing': {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        'radar': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'signal-pulse': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        'glitch': {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        'boot-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'reveal': {
          '0%': { clipPath: 'inset(0 100% 0 0)' },
          '100%': { clipPath: 'inset(0 0 0 0)' },
        },
        'drain': {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
        'sweep': {
          '0%, 100%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' },
        },
        'particle': {
          '0%': { transform: 'translateY(100vh) scale(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100vh) scale(1)', opacity: '0' },
        },
        'cinematic-open': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'matrix': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 1000%' },
        },
        'shimmer': {
          '0%': { left: '-10%' },
          '100%': { left: '110%' },
        },
        'fadeIn': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)',
        'radar-gradient': 'conic-gradient(from 0deg, transparent 0deg, var(--radar-color, rgba(6, 182, 212, 0.3)) 30deg, transparent 60deg)',
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
      backdropBlur: {
        xs: '2px'
      }
    },
  },
  plugins: [],
}
