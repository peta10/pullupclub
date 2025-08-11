// Utility script to clear IndexedDB data for performance testing
// Run this in the browser console to clear all IndexedDB data

console.log('Clearing IndexedDB data...');

// Clear all IndexedDB databases
const clearIndexedDB = async () => {
  try {
    // Get all database names
    const databases = await window.indexedDB.databases();
    
    for (const db of databases) {
      if (db.name) {
        console.log(`Deleting database: ${db.name}`);
        await window.indexedDB.deleteDatabase(db.name);
      }
    }
    
    console.log('✅ All IndexedDB data cleared successfully!');
    console.log('💡 Refresh the page and test performance in incognito mode for accurate scores.');
  } catch (error) {
    console.error('❌ Error clearing IndexedDB:', error);
  }
};

// Clear localStorage and sessionStorage as well
const clearStorage = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Local and session storage cleared');
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
};

// Clear everything
const clearAll = () => {
  clearStorage();
  clearIndexedDB();
};

// Auto-run if this script is executed
if (typeof window !== 'undefined') {
  clearAll();
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clearIndexedDB, clearStorage, clearAll };
}
