async function initialize() {
    try {
        await window.appDB.initDB();
        window.appState = await window.appDB.loadFullState();
        
        // Make variables global since logic.js expects them
        window.currentCategory = "all";
        window.currentLetter = "a";
        window.lastSeenWordIds = {};
        window.animationTimer = null;
        window.audioContext = null;
        window.gameMode = 'single';
        window.keyboardLocked = false;
        
        // Initial setup from logic.js
        if (typeof showHomeView === 'function') showHomeView();
        if (typeof applyConfiguration === 'function') applyConfiguration();
        if (typeof renderCategoryButtons === 'function') renderCategoryButtons();
        if (typeof renderVirtualKeyboard === 'function') renderVirtualKeyboard();
        
        if (window.appState.words && window.appState.words.length > 0) {
            if (typeof playLetter === 'function') playLetter(window.currentLetter);
        } else {
            if (typeof showMissingLetter === 'function') showMissingLetter(window.currentLetter);
        }
    } catch (error) {
        console.error("Initialization failed:", error);
        if (typeof showToast === 'function') showToast("Failed to load application data.");
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initialize();
});

