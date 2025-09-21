"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Upload, Refresh, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fontManager } from "@/utils/font-manager";

/**
 * Enhanced Font Picker Component
 * Shows categorized fonts with search, recent usage, and custom font support
 */
export function FontPicker({ value, onValueChange, className }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [fontFamilies, setFontFamilies] = useState([]);
  const [categorizedFonts, setCategorizedFonts] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize fonts on component mount
  useEffect(() => {
    const initializeFonts = async () => {
      setIsLoading(true);
      try {
        const families = await fontManager.initialize();
        setFontFamilies(families);
        setCategorizedFonts(fontManager.getCategorizedFonts());
      } catch (error) {
        console.error('Failed to initialize fonts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeFonts();
  }, []);

  // Filter fonts based on search query
  const filteredFonts = useMemo(() => {
    if (!searchQuery.trim()) {
      return categorizedFonts;
    }

    const filtered = fontManager.searchFonts(searchQuery);
    return {
      search: filtered
    };
  }, [searchQuery, categorizedFonts]);

  // Handle font selection
  const handleFontSelect = async (fontFamily) => {
    try {
      // Load the font if needed
      await fontManager.loadFont(fontFamily);
      
      // Add to recent usage
      fontManager.addToRecent(fontFamily);
      
      // Update categorized fonts to reflect recent usage
      setCategorizedFonts(fontManager.getCategorizedFonts());
      
      // Call the parent handler
      onValueChange?.(fontFamily);
    } catch (error) {
      console.error('Failed to select font:', error);
    }
  };

  // Refresh custom fonts
  const handleRefreshFonts = async () => {
    setIsRefreshing(true);
    try {
      await fontManager.refreshCustomFonts();
      setFontFamilies(fontManager.getFontFamilies());
      setCategorizedFonts(fontManager.getCategorizedFonts());
    } catch (error) {
      console.error('Failed to refresh fonts:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Render font item
  const renderFontItem = (fontFamily) => {
    const isSelected = value === fontFamily;
    const fontInfo = fontManager.getFontInfo(fontFamily);
    const previewText = fontManager.getFontPreviewText(fontFamily);

    return (
      <div
        key={fontFamily}
        onClick={() => handleFontSelect(fontFamily)}
        className={`
          p-3 cursor-pointer rounded-lg border transition-all duration-200 
          hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm
          ${isSelected 
            ? 'border-blue-500 bg-blue-100 shadow-md' 
            : 'border-slate-200 bg-white'
          }
        `}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">
              {fontFamily}
            </span>
            {fontInfo?.category && (
              <Badge 
                variant="outline" 
                className={`text-xs px-1.5 py-0.5 ${
                  fontInfo.category === 'custom' ? 'border-purple-300 text-purple-700' :
                  'border-gray-300 text-gray-700'
                }`}
              >
                {fontInfo.category}
              </Badge>
            )}
          </div>
          {isSelected && (
            <Star className="h-4 w-4 text-blue-500 fill-current" />
          )}
        </div>
        <div 
          className="text-slate-600 text-sm"
          style={{ fontFamily: fontFamily }}
        >
          {previewText}
        </div>
      </div>
    );
  };

  // Render font category
  const renderFontCategory = (categoryName, fonts) => {
    if (!fonts || fonts.length === 0) return null;

    const categoryLabels = {
      recent: "Recently Used",
      system: "System Fonts", 
      custom: "Custom Fonts",
      search: "Search Results"
    };

    return (
      <div key={categoryName} className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            {categoryLabels[categoryName] || categoryName}
          </h4>
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {fonts.length}
          </span>
        </div>
        <div className="grid gap-2">
          {fonts.map(renderFontItem)}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-sm text-slate-600">Loading fonts...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with search and actions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fonts..."
              className="pl-10 h-10 border-slate-200 focus:border-blue-300"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshFonts}
            disabled={isRefreshing}
            className="h-10 border-slate-200 hover:border-blue-300"
          >
            <Refresh className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>{fontFamilies.length} fonts available</span>
          <Separator orientation="vertical" className="h-3" />
          <span>Drop TTF/OTF files in /public/fonts/</span>
        </div>
      </div>

      {/* Font list */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          {Object.entries(filteredFonts).map(([category, fonts]) => 
            renderFontCategory(category, fonts)
          )}
          
          {Object.keys(filteredFonts).length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">No fonts found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Instructions for adding fonts */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-600 mb-2">
          <strong>Add Custom Fonts:</strong>
        </p>
        <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
          <li>Place TTF, OTF, WOFF, or WOFF2 files in <code className="bg-slate-200 px-1 rounded">/public/fonts/</code></li>
          <li>Click the refresh button to scan for new fonts</li>
          <li>Custom fonts will appear in the "Custom Fonts" section</li>
        </ol>
      </div>
    </div>
  );
}