import { FontSize } from "@/types/buddy"

// Font size mapping for Tailwind CSS classes
export const fontSizeMap: Record<FontSize, {
  text: string
  heading: string
  description: string
}> = {
  tiny: {
    text: "text-xs",
    heading: "text-sm",
    description: "text-xs"
  },
  small: {
    text: "text-sm", 
    heading: "text-base",
    description: "text-xs"
  },
  medium: {
    text: "text-base",
    heading: "text-lg", 
    description: "text-sm"
  },
  large: {
    text: "text-lg",
    heading: "text-xl",
    description: "text-base"
  },
  huge: {
    text: "text-xl",
    heading: "text-2xl",
    description: "text-lg"
  },
  massive: {
    text: "text-2xl",
    heading: "text-3xl",
    description: "text-xl"
  }
}

/**
 * Get font size classes for different text elements
 */
export function getFontSizeClasses(fontSize: FontSize) {
  return fontSizeMap[fontSize] || fontSizeMap.large
}

/**
 * Get the main text font size class
 */
export function getMainFontSize(fontSize: FontSize): string {
  return fontSizeMap[fontSize]?.text || "text-lg"
}

/**
 * Get heading font size class
 */
export function getHeadingFontSize(fontSize: FontSize): string {
  return fontSizeMap[fontSize]?.heading || "text-xl"
}

/**
 * Get description/secondary text font size class
 */
export function getDescriptionFontSize(fontSize: FontSize): string {
  return fontSizeMap[fontSize]?.description || "text-base"
}

/**
 * Generate CSS custom properties for dynamic font sizing
 */
export function generateFontSizeCSS(fontSize: FontSize): string {
  const classes = getFontSizeClasses(fontSize)
  
  // Map Tailwind classes to CSS font-size values
  const sizeMapping = {
    'text-xs': '0.75rem',
    'text-sm': '0.875rem', 
    'text-base': '1rem',
    'text-lg': '1.125rem',
    'text-xl': '1.25rem',
    'text-2xl': '1.5rem',
    'text-3xl': '1.875rem'
  }
  
  const textSize = sizeMapping[classes.text as keyof typeof sizeMapping] || '1.125rem'
  const headingSize = sizeMapping[classes.heading as keyof typeof sizeMapping] || '1.25rem'
  const descriptionSize = sizeMapping[classes.description as keyof typeof sizeMapping] || '1rem'
  
  return `
    --font-size-text: ${textSize};
    --font-size-heading: ${headingSize};
    --font-size-description: ${descriptionSize};
  `
}