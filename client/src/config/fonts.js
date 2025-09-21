"use client";

/**
 * Font Configuration and Management
 * Handles both system fonts and custom font files
 */

// System fonts that are available on most devices
export const systemFonts = [
  "Arial",
  "Helvetica",
  "Times New Roman", 
  "Courier New",
  "Georgia",
  "Verdana",
  "Impact",
  "Comic Sans MS",
];

// Google Fonts - removed to avoid loading issues
export const googleFonts = [];

// Custom fonts loaded from /public/fonts/
export let customFonts = [];

// Font categories for better organization
export const fontCategories = {
  system: "System Fonts",
  custom: "Custom Fonts",
  recent: "Recently Used"
};

// Font file extensions we support
export const supportedFontExtensions = ['.ttf', '.otf', '.woff', '.woff2'];

/**
 * Scan and load custom fonts from /public/fonts/
 */
export async function loadCustomFonts() {
  try {
    const response = await fetch('/api/fonts/scan');
    if (response.ok) {
      const fonts = await response.json();
      customFonts = fonts;
      return fonts;
    }
  } catch (error) {
    console.warn('Could not load custom fonts via API, falling back to manual detection');
  }

  // Fallback: try to detect fonts manually
  return detectCustomFonts();
}

/**
 * Detect custom fonts by trying to load known font files
 */
async function detectCustomFonts() {
  const detectedFonts = [];
  
  // Try to load existing font file
  try {
    const existingFont = await checkFontFile('BitcountGridDouble-VariableFont_CRSV,ELSH,ELXP,slnt,wght.ttf');
    if (existingFont) {
      detectedFonts.push({
        name: 'Bitcount Grid Double',
        family: 'BitcountGridDouble',
        file: 'BitcountGridDouble-VariableFont_CRSV,ELSH,ELXP,slnt,wght.ttf',
        type: 'variable',
        category: 'custom'
      });
    }
  } catch (error) {
    console.log('Existing font not found or accessible');
  }

  customFonts = detectedFonts;
  return detectedFonts;
}

/**
 * Check if a font file exists and is loadable
 */
async function checkFontFile(filename) {
  try {
    const response = await fetch(`/fonts/${filename}`, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Load a custom font via CSS
 */
export function loadFontCSS(fontConfig) {
  if (typeof document === 'undefined') return;

  const fontId = `font-${fontConfig.family.replace(/\s+/g, '-').toLowerCase()}`;
  
  // Check if already loaded
  if (document.getElementById(fontId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = fontId;
  
  const fontFace = `
    @font-face {
      font-family: '${fontConfig.family}';
      src: url('/fonts/${fontConfig.file}') format('${getFontFormat(fontConfig.file)}');
      font-display: swap;
      font-weight: ${fontConfig.weight || 'normal'};
      font-style: ${fontConfig.style || 'normal'};
    }
  `;
  
  style.textContent = fontFace;
  document.head.appendChild(style);
}

/**
 * Get font format from file extension
 */
function getFontFormat(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'woff2': return 'woff2';
    case 'woff': return 'woff';
    case 'ttf': return 'truetype';
    case 'otf': return 'opentype';
    default: return 'truetype';
  }
}

/**
 * Load Google Fonts via CSS - disabled to avoid loading issues
 */
export function loadGoogleFonts() {
  // Disabled - Google fonts removed to avoid loading issues
  return;
}

/**
 * Get all available fonts grouped by category
 */
export function getAllFonts() {
  return {
    [fontCategories.system]: systemFonts.map(name => ({
      name,
      family: name,
      category: 'system'
    })),
    [fontCategories.custom]: customFonts.map(font => ({
      name: font.name,
      family: font.family,
      category: 'custom'
    }))
  };
}

/**
 * Get flat list of all font families
 */
export function getAllFontFamilies() {
  const allFonts = [];
  
  // Add system fonts
  allFonts.push(...systemFonts);
  
  // Add custom fonts
  allFonts.push(...customFonts.map(font => font.family));
  
  return allFonts;
}

/**
 * Initialize font system
 */
export async function initializeFonts() {
  // Load custom fonts only
  const customs = await loadCustomFonts();
  
  // Load CSS for custom fonts
  customs.forEach(font => {
    loadFontCSS(font);
  });
  
  return getAllFontFamilies();
}