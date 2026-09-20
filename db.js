const DB_NAME = 'AlphabetAdventureDB';
const DB_VERSION = 1;

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
    }
};
