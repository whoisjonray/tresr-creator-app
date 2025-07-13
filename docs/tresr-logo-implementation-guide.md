# TRESR Logo Implementation Guide

## Overview
All TRESR logos have been uploaded to Cloudinary and integrated into the Creator App design system. This guide shows where and how logos are used throughout the application.

## Logo Cloudinary URLs

### Primary Logos Used in App

1. **Navigation Bar (Desktop)**
   - Logo: Horizontal Black
   - URL: `https://res.cloudinary.com/dqslerzk9/image/upload/v1752432394/tresr-logos/horizontal/horizontal-black.png.png`
   - Size: Height 40px, width auto

2. **Navigation Bar (Mobile)**
   - Logo: Diamond Gold
   - URL: `https://res.cloudinary.com/dqslerzk9/image/upload/v1752432389/tresr-logos/diamond/diamond-gold.png.png`
   - Size: Height 36px, width auto

3. **Login Page**
   - Logo: Vertical Black
   - URL: `https://res.cloudinary.com/dqslerzk9/image/upload/v1752432401/tresr-logos/vertical/vertical-black.png.png`
   - Size: Height 80px, width auto

4. **Favicon**
   - Logo: Diamond Gold (32x32)
   - URL: `https://res.cloudinary.com/dqslerzk9/image/upload/w_32,h_32/v1752432389/tresr-logos/diamond/diamond-gold.png.png`

5. **Apple Touch Icon**
   - Logo: Diamond Gold (180x180)
   - URL: `https://res.cloudinary.com/dqslerzk9/image/upload/w_180,h_180/v1752432389/tresr-logos/diamond/diamond-gold.png.png`

## Design System Integration

### 1. **Navigation Component** (`/client/src/components/Navigation.jsx`)
```jsx
import { logos } from '../styles/tresr-design-system';

// Desktop logo
<img src={logos.horizontal.black} alt="TRESR Creator" className="logo-desktop" />

// Mobile logo
<img src={logos.diamond.gold} alt="TRESR" className="logo-mobile" />
```

### 2. **Login Page** (`/client/src/pages/Login.jsx`)
```jsx
<div className="logo-container">
  <img src={logos.vertical.black} alt="TRESR" className="login-logo" />
</div>
```

### 3. **HTML Head** (`/client/index.html`)
```html
<!-- Favicon -->
<link rel="icon" type="image/png" href="https://res.cloudinary.com/dqslerzk9/image/upload/w_32,h_32/v1752432389/tresr-logos/diamond/diamond-gold.png.png" />

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" href="https://res.cloudinary.com/dqslerzk9/image/upload/w_180,h_180/v1752432389/tresr-logos/diamond/diamond-gold.png.png" />
```

## Design System File
All logo URLs are centralized in the design system file:
`/client/src/styles/tresr-design-system.js`

```javascript
export const logos = {
  diamond: {
    black: 'https://...',
    white: 'https://...',
    gold: 'https://...'
  },
  horizontal: {
    black: 'https://...',
    white: 'https://...',
    whiteGold: 'https://...'
  },
  vertical: {
    black: 'https://...',
    white: 'https://...',
    goldWhite: 'https://...'
  },
  text: {
    black: 'https://...',
    white: 'https://...'
  },
  patch: {
    black: 'https://...',
    color: 'https://...',
    white: 'https://...'
  }
};
```

## Usage Guidelines

### When to Use Each Logo Type

1. **Diamond Icon**
   - Mobile navigation
   - Favicon/app icons
   - Loading states
   - Small spaces where full logo won't fit

2. **Horizontal Logo**
   - Desktop navigation bars
   - Email headers
   - Wide banners
   - Footer logos

3. **Vertical Logo**
   - Login/signup pages
   - Centered layouts
   - Marketing pages
   - Mobile app splash screens

4. **Text Only**
   - When logo mark is already visible
   - Inline text references
   - Minimal designs

5. **Patch/Badge**
   - Special edition branding
   - Certificates
   - Achievement badges
   - Print materials

### Color Variations

- **Black**: Use on light backgrounds (#FDFDFD, #F4F4FD)
- **White**: Use on dark backgrounds (#080F20) or colored backgrounds
- **Gold/White**: Use for premium/special contexts or on medium-toned backgrounds

### Responsive Considerations

```css
/* Desktop: Show horizontal logo */
.logo-desktop {
  height: 40px;
  width: auto;
  display: block;
}

/* Mobile: Show diamond icon */
@media (max-width: 768px) {
  .logo-desktop { display: none; }
  .logo-mobile { 
    display: block;
    height: 36px;
  }
}
```

## Cloudinary Transformations

Use Cloudinary's URL transformations for different sizes:

```javascript
// Original
https://res.cloudinary.com/.../diamond-gold.png

// Resize to 64x64
https://res.cloudinary.com/.../w_64,h_64/.../diamond-gold.png

// Auto format and quality
https://res.cloudinary.com/.../f_auto,q_auto/.../diamond-gold.png

// Combined transformations
https://res.cloudinary.com/.../w_200,f_auto,q_auto/.../horizontal-black.png
```

## Future Shopify Theme Integration

When updating the Shopify theme, use these logos:

1. **Header Logo**: 
   - Desktop: `horizontal-black.png` or `horizontal-white.png` (depending on header background)
   - Mobile: `diamond-gold.png`

2. **Cart Drawer**: `diamond-gold.png` (small icon)

3. **Footer**: `horizontal-white.png` (on dark footer)

4. **Email Templates**: `horizontal-black.png`

5. **Invoice/Packing Slips**: `patch-black.png` or `patch-color.png`

## Accessibility

Always include proper alt text:
- Full logos: "TRESR" or "TRESR Creator"
- Diamond icon: "TRESR Logo"
- Context-specific: "TRESR Creator Portal", "TRESR Store", etc.