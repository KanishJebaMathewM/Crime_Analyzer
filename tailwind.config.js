/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
<<<<<<< HEAD
<<<<<<< HEAD
    extend: {
      colors: {
        ibm: {
          // IBM Color Palette
          navy: '#1e1e2f',
          darkNavy: '#16161d',
          blue: '#0f62fe',
          blueDark: '#0043ce',
          blueLight: '#4589ff',
          red: '#e74c3c',
          redDark: '#c0392b',
          redLight: '#ff6b6b',
          gray: {
            50: '#cfd8dc',
            100: '#b0bec5',
            200: '#90a4ae',
            300: '#78909c',
            400: '#607d8b',
            500: '#546e7a',
            600: '#455a64',
            700: '#37474f',
            800: '#263238',
            900: '#1c2526'
          },
          white: '#ffffff',
          lightGray: '#cfd8dc'
        }
      },
      fontFamily: {
        ibm: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace']
      },
      boxShadow: {
        'ibm-soft': '0 2px 4px rgba(15, 98, 254, 0.1), 0 1px 2px rgba(15, 98, 254, 0.06)',
        'ibm-medium': '0 4px 6px rgba(15, 98, 254, 0.1), 0 2px 4px rgba(15, 98, 254, 0.06)',
        'ibm-strong': '0 10px 15px rgba(15, 98, 254, 0.1), 0 4px 6px rgba(15, 98, 254, 0.05)',
        'ibm-card': '0 1px 3px rgba(30, 30, 47, 0.3), 0 1px 2px rgba(30, 30, 47, 0.2)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      backgroundImage: {
        'ibm-gradient': 'linear-gradient(135deg, #1e1e2f 0%, #16161d 50%, #0f62fe 100%)',
        'blue-gradient': 'linear-gradient(135deg, #0f62fe 0%, #0043ce 50%, #002d9c 100%)',
        'red-gradient': 'linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #a93226 100%)',
        'gray-gradient': 'linear-gradient(135deg, #cfd8dc 0%, #90a4ae 50%, #607d8b 100%)'
      }
    },
=======
    extend: {},
>>>>>>> 7808bf108315d31264bc9e46c82ffb3c7a1a125e
=======
    extend: {},
>>>>>>> 7808bf108315d31264bc9e46c82ffb3c7a1a125e
  },
  plugins: [],
};
