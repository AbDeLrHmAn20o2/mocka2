import { useState, useEffect, useRef, useCallback } from 'react';
import { getAvailableTemplates } from '@/services/template-service';

/**
 * Hook for managing dynamic templates
 * Automatically loads templates from /public/examples/ folder
 * Refreshes templates when returning to the page
 */
export function useTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mountedRef = useRef(false);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getAvailableTemplates();
      setTemplates(result.data || []);
      setLastUpdated(Date.now());
      
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError(err.message);
      // Fallback to empty array if loading fails
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load templates on mount and when page becomes visible again
  useEffect(() => {
    loadTemplates();
    mountedRef.current = true;

    // Listen for page visibility changes to refresh templates
    const handleVisibilityChange = () => {
      if (!document.hidden && mountedRef.current) {
        // Small delay to ensure any file changes are processed
        setTimeout(loadTemplates, 100);
      }
    };

    // document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      mountedRef.current = false;
    };
  }, []); // Only run once on mount

  // Get templates by category
  const getTemplatesByCategory = (category) => {
    return templates.filter(template => template.category === category);
  };

  // Get premium templates
  const getPremiumTemplates = () => {
    return templates.filter(template => template.isPremium);
  };

  // Get free templates
  const getFreeTemplates = () => {
    return templates.filter(template => !template.isPremium);
  };

  // Get template by ID
  const getTemplateById = (id) => {
    return templates.find(template => template.id === id);
  };

  // Get all unique categories
  const getCategories = () => {
    const categories = [...new Set(templates.map(template => template.category))];
    return categories.sort();
  };

  return {
    templates,
    loading,
    error,
    lastUpdated,
    getTemplatesByCategory,
    getPremiumTemplates,
    getFreeTemplates,
    getTemplateById,
    getCategories,
    count: templates.length
  };
}
