// core.js – IndexedDB with stable fallback
const STORAGE_KEY = 'gamespace_data';
const THEME_KEY = 'gamespace_dark';
const COLLECTION_KEY = 'gamespace_collections';
const API_KEY = 'gamespace_api';
const CUSTOM_CSS_KEY = 'gamespace_custom_css';
const CUSTOM_JS_KEY = 'gamespace_custom_js';
const CUSTOM_HTML_KEY = 'gamespace_custom_html';
const COLOR_THEME_KEY = 'gamespace_color_theme';
const THEME_SLIDER_KEY = 'gamespace_theme_slider';
const TEXT_COLOR_KEY = 'gamespace_text_color';

const DB_NAME = 'GameSpaceDB';
const DB_VERSION = 1;

let db;
window.dbReady = false; // Will always become true

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.warn('IndexedDB failed to open. Using localStorage.');
      // IMPORTANT: Resolve anyway so the app doesn't break!
      resolve(null); 
    };
    
    request.onsuccess = () => {
      db = request.result;
      console.log('✅ IndexedDB connected');
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('games')) {
        db.createObjectStore('games', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('collections')) {
        db.createObjectStore('collections', { keyPath: 'id' });
      }
    };
  });
}

async function loadFromDB(storeName) {
  if (!db) return []; // If DB failed, return empty array
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function saveToDB(storeName, data) {
  if (!db) return; // If DB failed, skip saving to it
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    data.forEach(item => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let games = [];
let collections = [];

async function loadData() {
  try {
    const dbInstance = await openDB();
    if (dbInstance) {
      games = await loadFromDB('games');
      collections = await loadFromDB('collections');
      console.log(`✅ Loaded ${games.length} games and ${collections.length} collections from IndexedDB`);
    } else {
      throw new Error('DB not available');
    }
  } catch (error) {
    console.warn('⚠️ Using localStorage fallback for data.');
    // Always ensure localStorage data is loaded
    games = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    collections = JSON.parse(localStorage.getItem(COLLECTION_KEY) || '[]');
  }

  // ALWAYS set these global variables
  window.games = games;
  window.collections = collections;
  
  // ALWAYS mark as ready and dispatch event
  window.dbReady = true;
  window.dispatchEvent(new Event('dbReady'));
  console.log('✅ App data ready (dbReady = true)');
}

// Start loading immediately
loadData();

// ============================================================
//  EXPORT SAVE FUNCTIONS
// ============================================================
window.save = async function() {
  try {
    if (db) await saveToDB('games', games);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  }
};

window.saveCollections = async function() {
  try {
    if (db) await saveToDB('collections', collections);
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collections));
  } catch (error) {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collections));
  }
};

window.deleteGame = async function(id) {
  try {
    if (db) {
      const tx = db.transaction('games', 'readwrite');
      const store = tx.objectStore('games');
      store.delete(id);
      await new Promise((resolve) => { tx.oncomplete = resolve; });
    }
    games = games.filter(g => g.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch (error) {
    console.error(error);
  }
};

window.deleteCollection = async function(id) {
  try {
    if (db) {
      const tx = db.transaction('collections', 'readwrite');
      const store = tx.objectStore('collections');
      store.delete(id);
      await new Promise((resolve) => { tx.oncomplete = resolve; });
    }
    collections = collections.filter(c => c.id !== id);
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collections));
  } catch (error) {
    console.error(error);
  }
};

console.log('core.js (IndexedDB) loaded');