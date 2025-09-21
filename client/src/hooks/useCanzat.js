import { useState, useEffect, useRef, useCallback } from 'react';
import { getAvailableCanzat } from '@/services/canzat-service';

/**
 * Hook for managing dynamic canzat items
 * Automatically loads canzat from /public/canzat/ folder
 * Refreshes canzat when returning to the page
 */
export function useCanzat() {
  const [canzatItems, setCanzatItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mountedRef = useRef(false);

  const loadCanzat = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getAvailableCanzat();
      setCanzatItems(result.data || []);
      setLastUpdated(Date.now());
      
    } catch (err) {
      console.error('Failed to load canzat items:', err);
      setError(err.message);
      // Fallback to empty array if loading fails
      setCanzatItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load canzat on mount and when page becomes visible again
  useEffect(() => {
    loadCanzat();
    mountedRef.current = true;

    // Listen for page visibility changes to refresh canzat
    const handleVisibilityChange = () => {
      if (!document.hidden && mountedRef.current) {
        // Small delay to ensure any file changes are processed
        setTimeout(loadCanzat, 100);
      }
    };

    // document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      mountedRef.current = false;
    };
  }, []); // Only run once on mount

  // Get canzat items by category
  const getCanzatByCategory = (category) => {
    return canzatItems.filter(item => item.category === category);
  };

  // Get premium canzat items
  const getPremiumCanzat = () => {
    return canzatItems.filter(item => item.isPremium);
  };

  // Get free canzat items
  const getFreeCanzat = () => {
    return canzatItems.filter(item => !item.isPremium);
  };

  // Get canzat item by ID
  const getCanzatById = (id) => {
    return canzatItems.find(item => item.id === id);
  };

  // Get all unique categories
  const getCategories = () => {
    const categories = [...new Set(canzatItems.map(item => item.category))];
    return categories.sort();
  };

  // Refresh canzat items manually
  const refreshCanzat = useCallback(() => {
    return loadCanzat();
  }, [loadCanzat]);

  return {
    canzatItems,
    loading,
    error,
    lastUpdated,
    getCanzatByCategory,
    getPremiumCanzat,
    getFreeCanzat,
    getCanzatById,
    getCategories,
    refreshCanzat,
    count: canzatItems.length
  };
}
