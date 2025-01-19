# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
# hack-a-lot

## Design System

### Color Palette

The application uses a carefully selected color palette that reflects the Sisu brand identity:

#### Primary Colors

- **Sisu Blue** (`#4AABE1`)
  - Primary brand color
  - Used for main CTAs, interactive elements, and brand accents
  - Variants:
    - Light: `#7BC4EA` - Used for gradients and hover states
    - Dark: `#3588B3` - Used for hover states and text contrast

- **Sisu Yellow** (`#F7B32B`)
  - Secondary brand color
  - Used for accents and highlighting important elements
  - Provides contrast against the blue palette

#### Status Colors

- **Sisu Green** (`#4CAF50`)
  - Success states
  - Active status indicators
  - Positive feedback

- **Sisu Red** (`#FF6B6B`)
  - Error states
  - Warning messages
  - Critical information

### Color Usage Guidelines

1. **Buttons & Interactive Elements**
   - Primary actions: `sisu-blue`
   - Hover states: `sisu-blue-dark`
   - Disabled states: Use opacity reduction

2. **Text**
   - Primary text: `text-gray-900`
   - Secondary text: `text-gray-700`
   - Tertiary text: `text-gray-500`
   - On dark backgrounds: `text-white` or `text-gray-100`

3. **Backgrounds**
   - Main background: `bg-white` or `bg-gray-50`
   - Gradient sections: `from-sisu-blue-light to-sisu-blue-dark`
   - Accent sections: Use brand colors with appropriate opacity

4. **Status Indicators**
   - Success/Active: `sisu-green`
   - Error/Warning: `sisu-red`
   - Info: `sisu-blue`
