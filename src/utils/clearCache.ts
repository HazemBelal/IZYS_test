// src/utils/clearCache.ts
export const clearUserCache = async () => {
    try {
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
  
      // Clear service worker cache if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
  
      // Clear IndexedDB if needed
      if ('indexedDB' in window) {
        await new Promise((resolve) => {
          const req = indexedDB.deleteDatabase('localforage');
          req.onsuccess = resolve;
          req.onerror = resolve;
        });
      }
  
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  };