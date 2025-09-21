"use client";

import { 
  systemFonts, 
  googleFonts, 
  customFonts,
  loadCustomFonts,
  loadGoogleFonts,
  loadFontCSS,
  getAllFontFamilies,
  initializeFonts
} from "@/config/fonts";

/**
 * Font Manager - Handles font loading and management in the editor
 */
class FontManager {
  constructor() {
    this.loadedFonts = new Set();
    this.fontFamilies = [];
    this.isInitialized = false;
    this.recentFonts = this.getRecentFonts();
  }

  /**
   * Initialize the font system
   */
  async initialize() {
    if (this.isInitialized) return this.fontFamilies;

    try {
      console.log('🎨 Initializing font system...');
      
      // Initialize fonts and get all available families
      this.fontFamilies = await initializeFonts();
      
      console.log(`✅ Font system initialized with ${this.fontFamilies.length} fonts`);
      console.log('📝 Available fonts:', this.fontFamilies);
      
      this.isInitialized = true;
      return this.fontFamilies;
    } catch (error) {
      console.error('❌ Failed to initialize font system:', error);
      
      // Fallback to system fonts only
      this.fontFamilies = [...systemFonts];
      this.isInitialized = true;
      return this.fontFamilies;
    }
  }

  /**
   * Get all available font families
   */
  getFontFamilies() {
    return this.fontFamilies;
  }

  /**
   * Load a specific font if not already loaded
   */
  async loadFont(fontFamily) {
    if (this.loadedFonts.has(fontFamily)) {
      return true;
    }

    try {
      // Check if it's a custom font
      const customFont = customFonts.find(font => 
        font.family === fontFamily || font.name === fontFamily
      );

      if (customFont) {
        loadFontCSS(customFont);
        this.loadedFonts.add(fontFamily);
        console.log(`✅ Loaded custom font: ${fontFamily}`);
        return true;
      }

      // Check if it's a Google font - disabled
      // Google fonts removed to avoid loading issues

      // System font - always available
      if (systemFonts.includes(fontFamily)) {
        this.loadedFonts.add(fontFamily);
        return true;
      }

      console.warn(`⚠️ Unknown font: ${fontFamily}`);
      return false;
    } catch (error) {
      console.error(`❌ Failed to load font ${fontFamily}:`, error);
      return false;
    }
  }

  /**
   * Check if a font is available
   */
  isFontAvailable(fontFamily) {
    return this.fontFamilies.includes(fontFamily);
  }

  /**
   * Get font preview text
   */
  getFontPreviewText(fontFamily) {
    const previews = {
      'Arial': 'The quick brown fox jumps',
      'Times New Roman': 'Elegant serif typography',
      'Courier New': 'Code && Terminal Font',
      'Comic Sans MS': 'Fun & Playful Text!',
      'Impact': 'BOLD STATEMENT TEXT',
      'Helvetica': 'Clean modern design',
      'Georgia': 'Classic serif style',
      'Verdana': 'Web-optimized font'
    };

    return previews[fontFamily] || 'Sample text preview';
  }

  /**
   * Add font to recent usage
   */
  addToRecent(fontFamily) {
    this.recentFonts = this.recentFonts.filter(font => font !== fontFamily);
    this.recentFonts.unshift(fontFamily);
    this.recentFonts = this.recentFonts.slice(0, 5); // Keep only 5 recent fonts
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentFonts', JSON.stringify(this.recentFonts));
    }
  }

  /**
   * Get recent fonts from localStorage
   */
  getRecentFonts() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('recentFonts');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Get categorized fonts for the font picker
   */
  getCategorizedFonts() {
    return {
      recent: this.recentFonts.filter(font => this.fontFamilies.includes(font)),
      system: systemFonts,
      custom: customFonts.map(font => font.family)
    };
  }

  /**
   * Search fonts by name
   */
  searchFonts(query) {
    if (!query) return this.fontFamilies;
    
    const lowerQuery = query.toLowerCase();
    return this.fontFamilies.filter(font => 
      font.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Refresh custom fonts (re-scan fonts directory)
   */
  async refreshCustomFonts() {
    try {
      console.log('🔄 Refreshing custom fonts...');
      const newCustomFonts = await loadCustomFonts();
      
      // Load CSS for any new fonts
      newCustomFonts.forEach(font => {
        if (!this.loadedFonts.has(font.family)) {
          loadFontCSS(font);
        }
      });

      // Update font families list
      this.fontFamilies = getAllFontFamilies();
      
      console.log(`✅ Refreshed custom fonts: ${newCustomFonts.length} found`);
      return newCustomFonts;
    } catch (error) {
      console.error('❌ Failed to refresh custom fonts:', error);
      return [];
    }
  }

  /**
   * Get font information
   */
  getFontInfo(fontFamily) {
    // Check custom fonts
    const customFont = customFonts.find(font => 
      font.family === fontFamily || font.name === fontFamily
    );
    if (customFont) {
      return {
        ...customFont,
        category: 'custom',
        loaded: this.loadedFonts.has(fontFamily)
      };
    }

    // Check Google fonts - disabled
    // Google fonts removed to avoid loading issues

    // System font
    if (systemFonts.includes(fontFamily)) {
      return {
        name: fontFamily,
        family: fontFamily,
        category: 'system',
        loaded: true
      };
    }

    return null;
  }
}

// Export singleton instance
export const fontManager = new FontManager();

// Export for direct use
export {
  systemFonts,
  googleFonts,
  customFonts
};