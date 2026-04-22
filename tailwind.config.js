/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0908',
          surface1: '#141211',
          surface2: '#1C1918',
          surface3: '#252220',
        },
        heat: {
          amber: '#FFAA33',
          orange: '#FF4D00',
          red: '#FF1744',
          glow: 'rgba(255, 77, 0, 0.35)',
        },
        success: '#00E676',
        warning: '#FFB300',
        danger: '#FF1744',
        text: {
          primary: '#FAFAF9',
          secondary: '#A8A29E',
          tertiary: '#78716C',
          muted: '#44403C',
        },
      },
      fontFamily: {
        display: ['Big Shoulders Display', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderColor: {
        subtle: 'rgba(250, 250, 249, 0.06)',
        strong: 'rgba(250, 250, 249, 0.12)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backgroundImage: {
        'heat-gradient': 'linear-gradient(135deg, #FFAA33 0%, #FF4D00 50%, #FF1744 100%)',
        'heat-radial': 'radial-gradient(ellipse at top, #1a0f0c 0%, #0A0908 50%)',
      },
      boxShadow: {
        'heat-glow': '0 4px 20px rgba(255, 77, 0, 0.35)',
        'heat-strong': '0 4px 28px rgba(255, 77, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
