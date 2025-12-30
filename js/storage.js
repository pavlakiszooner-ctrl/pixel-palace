// LocalStorage utility module for managing high scores and preferences
const StorageManager = (function() {
  'use strict';

  const STORAGE_KEY = 'pixelPalaceArcade';

  /**
   * Get all stored data
   */
  const getData = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return {};
    }
  };

  /**
   * Save data to storage
   */
  const saveData = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error writing to localStorage:', e);
      return false;
    }
  };

  /**
   * Get high score
   */
  const getHighScore = () => {
    const data = getData();
    return data.highScore || 0;
  };

  /**
   * Update high score if new score is higher
   */
  const updateHighScore = (score) => {
    const currentHigh = getHighScore();
    if (score > currentHigh) {
      const data = getData();
      data.highScore = score;
      data.highScoreDate = new Date().toISOString();
      saveData(data);
      return true; // New high score!
    }
    return false;
  };

  /**
   * Get user preferences
   */
  const getPreference = (key, defaultValue = null) => {
    const data = getData();
    return data.preferences?.[key] ?? defaultValue;
  };

  /**
   * Set user preference
   */
  const setPreference = (key, value) => {
    const data = getData();
    if (!data.preferences) data.preferences = {};
    data.preferences[key] = value;
    return saveData(data);
  };

  /**
   * Clear all stored data
   */
  const clearAll = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('Error clearing localStorage:', e);
      return false;
    }
  };

  // Public API
  return {
    getHighScore,
    updateHighScore,
    getPreference,
    setPreference,
    clearAll
  };
})();
