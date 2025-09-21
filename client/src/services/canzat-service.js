// Canzat service for dynamic canzat loading
import { apiRequest } from './base-service';

/**
 * Fetch all available canzat items from the canzat folder
 * This automatically includes any new JSON files added to /public/canzat/
 */
export async function getAvailableCanzat() {
  try {
    const response = await fetch('/api/canzat', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch canzat items: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load canzat items');
    }

    return result;
  } catch (error) {
    console.error('Error fetching canzat items:', error);
    throw error;
  }
}

/**
 * Fetch a specific canzat item by ID
 */
export async function getCanzatById(canzatId) {
  try {
    const canzatItems = await getAvailableCanzat();
    const canzatItem = canzatItems.data.find(c => c.id === canzatId);
    
    if (!canzatItem) {
      throw new Error(`Canzat item with ID '${canzatId}' not found`);
    }

    return canzatItem;
  } catch (error) {
    console.error(`Error fetching canzat item ${canzatId}:`, error);
    throw error;
  }
}

/**
 * Load canzat JSON data
 */
export async function loadCanzatData(fileName) {
  try {
    const response = await fetch(`/canzat/${fileName}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load canzat data: ${response.status} ${response.statusText}`);
    }

    const canzatData = await response.json();
    return canzatData;
  } catch (error) {
    console.error(`Error loading canzat data from ${fileName}:`, error);
    throw error;
  }
}

/**
 * Get canzat items by category
 */
export async function getCanzatByCategory(category) {
  try {
    const canzatItems = await getAvailableCanzat();
    return {
      ...canzatItems,
      data: canzatItems.data.filter(item => item.category === category)
    };
  } catch (error) {
    console.error(`Error fetching canzat items for category ${category}:`, error);
    throw error;
  }
}

/**
 * Get premium canzat items only
 */
export async function getPremiumCanzat() {
  try {
    const canzatItems = await getAvailableCanzat();
    return {
      ...canzatItems,
      data: canzatItems.data.filter(item => item.isPremium)
    };
  } catch (error) {
    console.error('Error fetching premium canzat items:', error);
    throw error;
  }
}

/**
 * Get free canzat items only
 */
export async function getFreeCanzat() {
  try {
    const canzatItems = await getAvailableCanzat();
    return {
      ...canzatItems,
      data: canzatItems.data.filter(item => !item.isPremium)
    };
  } catch (error) {
    console.error('Error fetching free canzat items:', error);
    throw error;
  }
}
