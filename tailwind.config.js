/** @type {import('tailwindcss').Config} */
// Tokens repris de la « Charte UI/UX & Couleurs - IT ».
// Les tokens `solar` et `ok-ink` viennent du gabarit CRM (Block.tsx) : la charte
// ne fournit ni couleur de 3e série catégorielle, ni encre verte lisible sur blanc.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#0EA3B4', // accent principal
          deep: '#13A3AC',    // début de dégradé
          ink: '#0B7880',     // texte / liens sur blanc (AA)
          soft: '#E3F4F6',    // fond d'accent doux
        },
        green: {
          DEFAULT: '#3CAE68', // succès / fin de dégradé
          bright: '#60B830',  // aplat vert
          ink: '#0D7A3C',     // encre verte lisible sur blanc (AA)
          soft: '#EAF8EF',
        },
        solar: {
          DEFAULT: '#F59E0B', // 3e série catégorielle (batterie physique)
          ink: '#D97706',
          soft: '#FEF5E6',
        },
        ink: '#0F1729',
        muted: '#5B6472',
        line: '#E6EAEF',
        surface: '#FFFFFF',
        canvas: '#F6F8FA',
        rail: '#EEF1F4', // rail du segmented control
        amber: { DEFAULT: '#B45309', soft: '#FEF3C7', line: '#FCE8B2' },
        danger: { DEFAULT: '#B91C1C', soft: '#FEF2F2', line: '#FBD0D0' },
        info: { DEFAULT: '#1D4ED8', soft: '#EFF4FF', line: '#CBDBFF' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        control: '10px',
      },
      boxShadow: {
        focus: '0 0 0 3px rgba(14,163,180,.30)',
        card: '0 1px 2px rgba(15,23,41,.04), 0 1px 3px rgba(15,23,41,.04)',
      },
      backgroundImage: {
        brand: 'linear-gradient(90deg, #13A3AC 0%, #3CAE68 100%)',
      },
    },
  },
  plugins: [],
};
