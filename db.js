const DB_NAME = 'AlphabetAdventureDB';
const DB_VERSION = 2;

window.appDB = {
    db: null,

    initDB: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('words')) {
                    db.createObjectStore('words', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('categories')) {
                    db.createObjectStore('categories', { autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('stories')) {
                    db.createObjectStore('stories', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('config')) {
                    db.createObjectStore('config', { keyPath: 'id' });
                }
                // v2: persistent image cache (base64 data URLs keyed by word id)
                if (!db.objectStoreNames.contains('imageCache')) {
                    db.createObjectStore('imageCache', { keyPath: 'id' });
                }
            };

            request.onsuccess = async (event) => {
                this.db = event.target.result;
                
                // Check if seeded
                const isSeeded = await this.checkIfSeeded();
                if (!isSeeded) {
                    await this.seedFromJSON();
                }
                
                resolve();
            };

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };
        });
    },

    checkIfSeeded: function() {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['config'], 'readonly');
            const store = transaction.objectStore('config');
            const request = store.get('main');
            
            request.onsuccess = () => {
                resolve(!!request.result);
            };
            request.onerror = () => {
                resolve(false);
            };
        });
    },

    seedFromJSON: async function() {
        try {
            // Make path robust for GitHub Pages when trailing slash might be missing
            let baseUrl = window.location.href;
            if (baseUrl.endsWith('.html')) {
                baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
            } else if (!baseUrl.endsWith('/')) {
                baseUrl += '/';
            }
            const jsonUrl = new URL('alphabet-adventure-backup4.json', baseUrl).href;
            const response = await fetch(jsonUrl);
            if (!response.ok) throw new Error("Could not fetch seed JSON");
            const data = await response.json();
            
            await this.saveFullState(data);
            console.log("Database seeded successfully.");
        } catch (error) {
            console.error("Error seeding database:", error);
        }
    },

    loadFullState: function() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['words', 'categories', 'stories', 'config'], 'readonly');
            
            const state = {
                words: [],
                categories: [],
                stories: [],
                config: {}
            };
            
            let completed = 0;
            const checkDone = () => {
                completed++;
                if (completed === 4) {
                    state.categories = state.categories.map(c => c.name);
                    resolve(state);
                }
            };

            const wordStore = transaction.objectStore('words');
            wordStore.getAll().onsuccess = (e) => { state.words = e.target.result; checkDone(); };

            const catStore = transaction.objectStore('categories');
            catStore.getAll().onsuccess = (e) => { state.categories = e.target.result; checkDone(); };

            const storyStore = transaction.objectStore('stories');
            storyStore.getAll().onsuccess = (e) => { state.stories = e.target.result; checkDone(); };

            const configStore = transaction.objectStore('config');
            configStore.get('main').onsuccess = (e) => { 
                if (e.target.result) {
                    state.config = e.target.result.data;
                }
                checkDone(); 
            };
            
            transaction.onerror = (e) => reject(e.target.error);
        });
    },

    saveFullState: function(state) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['words', 'categories', 'stories', 'config'], 'readwrite');
            
            const wordStore = transaction.objectStore('words');
            wordStore.clear();
            state.words.forEach(w => wordStore.put(w));
            
            const catStore = transaction.objectStore('categories');
            catStore.clear();
            state.categories.forEach(c => catStore.put({name: c}));
            
            const storyStore = transaction.objectStore('stories');
            storyStore.clear();
            if (state.stories) {
                state.stories.forEach(s => storyStore.put(s));
            } else {
                storyStore.put({ id: "default-story-1", title: "Journey to the River", wordIds: [] });
            }
            
            const configStore = transaction.objectStore('config');
            configStore.put({ id: 'main', data: state.config });
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject(e.target.error);
        });
    },

    // Retrieve a base64 data URL from the imageCache store
    getCachedImage: function(wordId) {
        return new Promise((resolve) => {
            if (!this.db) { resolve(null); return; }
            try {
                const tx = this.db.transaction(['imageCache'], 'readonly');
                const req = tx.objectStore('imageCache').get(wordId);
                req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
                req.onerror = () => resolve(null);
            } catch(e) { resolve(null); }
        });
    },

    // Store a base64 data URL in the imageCache store
    setCachedImage: function(wordId, dataUrl) {
        if (!this.db) return;
        try {
            const tx = this.db.transaction(['imageCache'], 'readwrite');
            tx.objectStore('imageCache').put({ id: wordId, dataUrl });
        } catch(e) { /* silent – cache miss is fine */ }
    },

    // Count how many images are stored in IDB imageCache
    getAllCachedImagesCount: function() {
        return new Promise((resolve) => {
            if (!this.db) { resolve(0); return; }
            try {
                const tx = this.db.transaction(['imageCache'], 'readonly');
                const req = tx.objectStore('imageCache').count();
                req.onsuccess = () => resolve(req.result || 0);
                req.onerror = () => resolve(0);
            } catch(e) { resolve(0); }
        });
    }
};

// Global helper: retrieve base64 data URL from IDB, or fetch & cache it to IDB if missing
window.getOrFetchWordImage = async function(word) {
    if (!word) return null;
    const wordId = typeof word === 'string' ? word : word.id;
    const wordObj = typeof word === 'string' 
        ? (window.appState && window.appState.words ? window.appState.words.find(w => w.id === word) || {} : {}) 
        : word;
    const rawUrl = wordObj.imageUrl || wordObj.url || '';

    // 1. Check IDB cache first
    if (wordId && window.appDB) {
        try {
            const cached = await window.appDB.getCachedImage(wordId);
            if (cached && cached.startsWith('data:image')) return cached;
        } catch(e) {}
    }

    if (!rawUrl || rawUrl === 'undefined' || rawUrl.endsWith('/')) {
        return null;
    }

    // 2. If rawUrl is already a base64 Data URL, save to IDB and return
    if (rawUrl.startsWith('data:')) {
        if (wordId && window.appDB) window.appDB.setCachedImage(wordId, rawUrl);
        return rawUrl;
    }

    // 3. Try fetching from network with CORS proxy fallbacks
    const urlsToTry = [
        rawUrl,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(rawUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(rawUrl)}`
    ];

    for (let u of urlsToTry) {
        try {
            const resp = await fetch(u, { mode: 'cors' });
            if (resp.ok) {
                const blob = await resp.blob();
                const dataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(blob);
                });
                if (dataUrl && dataUrl.startsWith('data:image')) {
                    if (wordId && window.appDB) window.appDB.setCachedImage(wordId, dataUrl);
                    return dataUrl;
                }
            }
        } catch(e) {}
    }

    // 4. Try Canvas export fallback
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width || 200;
                canvas.height = img.naturalHeight || img.height || 200;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                if (wordId && window.appDB) window.appDB.setCachedImage(wordId, dataUrl);
                resolve(dataUrl);
            } catch(err) {
                resolve(rawUrl);
            }
        };
        img.onerror = () => resolve(rawUrl);
        img.src = rawUrl;
    });
};

