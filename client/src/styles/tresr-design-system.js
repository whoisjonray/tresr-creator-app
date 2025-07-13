// TRESR Design System
// Based on TRESR.com dashboard design patterns

export const colors = {
  // Primary Brand Colors
  brand: '#F6CB46',         // Yellow/Gold - Main brand color
  neonPink: '#F82F57',      // Bright pink - Accent/CTA
  neonCoral: '#FE507E',     // Coral pink
  neonPeach: '#FFB724',     // Orange/Peach
  highlight: '#F6CB46',     // Same as brand
  
  // Neutral Colors
  textBlack: '#080F20',     // Very dark blue-black
  offBlack: '#2B2E2E',      // Softer black
  offWhite: '#FDFDFD',      // Almost white
  gray: '#E7E7E7',          // Light gray
  lightGray: '#F4F4FD',     // Very light blue-tinted gray
  darkGray: '#757575',      // Medium gray
  bodyGray: '#B9B9B9',      // Body text gray
  bodyDarkGray: '#807E7E',  // Darker body text
  
  // Special Colors
  avaxRed: '#FF394A',       // Avalanche network red
  shopPay: '#5A31F4',       // Shop Pay purple
  accentOrange: '#E68A36',  // Orange accent
  accentAqua: '#36C6E6',    // Aqua accent
  darkBackground: '#080f20', // Dark mode background
  bgLightBlue: 'rgb(246, 247, 254)', // Light blue background
  
  // UI States
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
};

export const typography = {
  fontFamily: {
    sans: '"Montserrat", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    jost: '"Jost", ui-sans-serif, system-ui',
    lato: '"Lato", ui-sans-serif, system-ui',
    yakin: '"Yakin", serif' // Custom display font
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.5rem',     // 24px
    '2xl': '2.25rem', // 36px
    '3xl': '3.375rem', // 54px
    '4xl': '4.625rem', // 74px
    '5xl': '6.875rem'  // 110px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },
  
  letterSpacing: {
    tight: '-0.03em',
    normal: '0',
    wide: '0.02em'
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75
  }
};

export const spacing = {
  // 4px-based spacing scale
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
  40: '160px',
  
  // Special spacing
  overlap: '20px',
  section: '1256px',
  outerSection: 'max(50vw - 628px, 128px)',
  outerSectionEdge: 'max(50vw - 628px, 32px)'
};

export const borderRadius = {
  none: '0',
  xs: '2px',
  sm: '4px',
  DEFAULT: '8px',
  md: '8px',
  lg: '15px',
  xl: '20px',
  '2xl': '32px',
  full: '9999px'
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0px 0px 4px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
  none: 'none'
};

export const transitions = {
  fast: '150ms ease-out',
  DEFAULT: '200ms ease-out',
  slow: '300ms ease-out'
};

// Component-specific styles
export const components = {
  button: {
    primary: {
      background: colors.brand,
      color: colors.textBlack,
      border: `2px solid ${colors.brand}`,
      borderRadius: borderRadius['2xl'],
      padding: `${spacing[2]} ${spacing[6]}`,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      fontFamily: typography.fontFamily.jost,
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.wide,
      transition: transitions.DEFAULT,
      cursor: 'pointer',
      height: '44px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
      '&:hover': {
        borderColor: colors.accentOrange,
        transform: 'translateY(1px)'
      },
      '&:active': {
        transform: 'translateY(2px)'
      }
    },
    
    secondary: {
      background: 'transparent',
      color: colors.brand,
      border: `2px solid ${colors.brand}`,
      borderRadius: borderRadius['2xl'],
      padding: `${spacing[2]} ${spacing[6]}`,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      fontFamily: typography.fontFamily.jost,
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.wide,
      transition: transitions.DEFAULT,
      cursor: 'pointer',
      height: '44px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
      '&:hover': {
        background: colors.brand,
        color: colors.textBlack
      }
    },
    
    ghost: {
      background: 'transparent',
      color: colors.darkGray,
      border: 'none',
      padding: `${spacing[2]} ${spacing[4]}`,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      transition: transitions.DEFAULT,
      cursor: 'pointer',
      borderRadius: borderRadius.md,
      '&:hover': {
        background: 'rgba(0, 0, 0, 0.05)',
        color: colors.textBlack
      }
    }
  },
  
  input: {
    base: {
      width: '100%',
      padding: `${spacing[3]} ${spacing[4]}`,
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.sans,
      color: colors.textBlack,
      background: colors.offWhite,
      border: `1px solid ${colors.gray}`,
      borderRadius: borderRadius.md,
      transition: transitions.DEFAULT,
      outline: 'none',
      '&:focus': {
        borderColor: colors.neonPink,
        boxShadow: `0 0 0 3px rgba(248, 47, 87, 0.1)`
      },
      '&:disabled': {
        background: colors.lightGray,
        color: colors.bodyGray,
        cursor: 'not-allowed'
      }
    }
  },
  
  card: {
    base: {
      background: colors.offWhite,
      borderRadius: borderRadius.lg,
      boxShadow: shadows.DEFAULT,
      padding: spacing[6],
      transition: transitions.DEFAULT,
      '&:hover': {
        boxShadow: shadows.lg
      }
    }
  },
  
  sidebar: {
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing[3],
      padding: `${spacing[2]} ${spacing[2]}`,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.bodyDarkGray,
      textDecoration: 'none',
      borderRadius: borderRadius.md,
      transition: transitions.fast,
      position: 'relative',
      '&:hover': {
        background: 'rgba(8, 15, 32, 0.05)',
        color: colors.textBlack
      },
      '&.active': {
        background: 'rgba(8, 15, 32, 0.05)',
        color: colors.textBlack,
        fontWeight: typography.fontWeight.semibold,
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '2px',
          height: '60%',
          background: colors.textBlack,
          borderRadius: borderRadius.full
        }
      }
    }
  }
};

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  section: '1600px',
  xxl: '1900px',
  xxxl: '2200px'
};

// Layout constants
export const layout = {
  headerHeight: {
    sm: '70px',
    lg: '100px'
  },
  maxWidth: {
    container: '1256px',
    section: '1600px'
  },
  sidebar: {
    width: '260px',
    collapsedWidth: '64px'
  }
};

// Logo URLs from Cloudinary
export const logos = {
  // Diamond icons
  diamond: {
    black: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752432386/tresr-logos/diamond/diamond-black.png.png',
    white: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752432391/tresr-logos/diamond/diamond-white.png.png',
    gold: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752432389/tresr-logos/diamond/diamond-gold.png.png'
  },
  
  // Horizontal logos
  horizontal: {
    black: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752432394/tresr-logos/horizontal/horizontal-black.png.png',
    white: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752432397/tresr-logos/horizontal/horizontal-white.png.png',
    whiteGold: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752432399/tresr-logos/horizontal/horizontal-white-gold.png.png'
  },
  
  // Vertical logos
  vertical: {
    black: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752432401/tresr-logos/vertical/vertical-black.png.png',
    white: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752432403/tresr-logos/vertical/vertical-white.png.png',
    goldWhite: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752432405/tresr-logos/vertical/vertical-gold-white.png.png'
  },
  
  // Text only
  text: {
    black: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752432414/tresr-logos/text/text-black.png.png',
    white: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752432417/tresr-logos/text/text-white.png.png'
  },
  
  // Patch badges
  patch: {
    black: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752432407/tresr-logos/patch/patch-black.png.png',
    color: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752432408/tresr-logos/patch/patch-color.png.png',
    white: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752432410/tresr-logos/patch/patch-white.png.png'
  }
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  components,
  breakpoints,
  layout,
  logos
};