/* ========================================================= DOM REFERENCES ========================================================= */ const gameView = document.getElementById("gameView"); const settingsView = document.getElementById("settingsView"); const settingsButton = document.getElementById("settingsButton"); const wordContainer = document.getElementById("wordContainer"); const imageArea = document.getElementById("imageArea"); const categoryControls = document.getElementById("categoryControls"); const currentLetterBadge = document.getElementById("currentLetterBadge"); const wordTableBody = document.getElementById("wordTableBody"); const wordSearch = document.getElementById("wordSearch"); const addWordButton = document.getElementById("addWordButton"); const wordModal = document.getElementById("wordModal"); const wordModalTitle = document.getElementById("wordModalTitle"); const closeWordModal = document.getElementById("closeWordModal"); const cancelWordButton = document.getElementById("cancelWordButton"); const wordForm = document.getElementById("wordForm"); const editingWordId = document.getElementById("editingWordId"); const wordLetter = document.getElementById("wordLetter"); const wordName = document.getElementById("wordName"); const wordCategory = document.getElementById("wordCategory"); const wordImageUrl = document.getElementById("wordImageUrl"); const wordFallback = document.getElementById("wordFallback"); const categoryList = document.getElementById("categoryList"); const newCategoryInput = document.getElementById("newCategoryInput"); const addCategoryButton = document.getElementById("addCategoryButton"); const toast = document.getElementById("toast"); /* ========================================================= PERSISTENCE ========================================================= */  function saveState() { window.appDB.saveFullState(appState); } /* ========================================================= TOAST ========================================================= */ let toastTimer = null; function showToast(message) { toast.textContent = message; toast.classList.add( "show" ); clearTimeout( toastTimer ); toastTimer = setTimeout( () => { toast.classList.remove( "show" ); }, 2500 ); } /* ========================================================= CONFIGURATION ========================================================= */ 
function applyConfiguration() { 
    document.title = appState.config.title; 
    const logoText = document.querySelector( ".logo span:last-child" );
    if (logoText) logoText.textContent = appState.config.title; 
    document.getElementById( "instruction" ).childNodes[0].textContent = appState.config.instruction + " "; 
    
    document.documentElement.style.setProperty( "--primary", appState.config.primary ); 
    document.documentElement.style.setProperty( "--secondary", appState.config.secondary ); 
    document.documentElement.style.setProperty( "--primary-dark", `color-mix(in srgb, ${appState.config.primary} 80%, black)` );
    document.documentElement.style.setProperty( "--success", `color-mix(in srgb, ${appState.config.primary} 70%, white)` );
    document.documentElement.style.setProperty( "--background", `radial-gradient(circle at center, color-mix(in srgb, ${appState.config.primary} 25%, white) 0%, color-mix(in srgb, ${appState.config.primary} 55%, white) 100%)` );

    const bgContainer = document.querySelector('.background-decoration');
    if (bgContainer) {
        bgContainer.innerHTML = '';
        const bubbleCount = appState.config.bubbleCount !== undefined ? appState.config.bubbleCount : 5;
        for (let i = 0; i < bubbleCount; i++) {
            window.spawnBubble(false);
        }
    }
} 

window.isBubbleGameActive = false;
window.bubbleGameLetterPractice = false;
window.bubbleGameTargetLetter = null;

function getBubbleDuration() {
    const speed = appState.config.bubbleSpeed || 'normal';
    if (speed === 'slow') return 18 + Math.random() * 8; // 18-26s
    if (speed === 'fast') return 8 + Math.random() * 4; // 8-12s
    if (speed === 'very-fast') return 4 + Math.random() * 3; // 4-7s
    return 12 + Math.random() * 6; // normal 12-18s
}

window.spawnBubble = function(isRespawn = false) {
    const bgContainer = document.querySelector('.background-decoration');
    if (!bgContainer) return;
    
    // Safety check so we don't spawn infinitely if not needed
    const currentBubbles = bgContainer.querySelectorAll('.bubble').length;
    const maxBubbles = appState.config.bubbleCount !== undefined ? appState.config.bubbleCount : 5;
    if (isRespawn && currentBubbles >= maxBubbles) return;
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const size = Math.floor(Math.random() * 200) + 60;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    
    if (isRespawn) {
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { // top
            bubble.style.left = `${Math.random() * 100}%`;
            bubble.style.top = `-20%`;
        } else if (edge === 1) { // right
            bubble.style.left = `120%`;
            bubble.style.top = `${Math.random() * 100}%`;
        } else if (edge === 2) { // bottom
            bubble.style.left = `${Math.random() * 100}%`;
            bubble.style.top = `120%`;
        } else { // left
            bubble.style.left = `-20%`;
            bubble.style.top = `${Math.random() * 100}%`;
        }
    } else {
        bubble.style.left = `${Math.random() * 90}%`;
        bubble.style.top = `${Math.random() * 90}%`;
    }
    
    bubble.style.animationDelay = `-${Math.random() * 12}s`;
    bubble.style.animationDuration = `${getBubbleDuration()}s`;
    
    if (window.isBubbleGameActive && window.bubbleGameLetterPractice) {
        bubble.classList.add('has-letter');
        bubble.style.fontSize = `${size * 0.5}px`;
        
        let forceTarget = false;
        if (window.bubbleGameTargetLetter) {
            const existing = Array.from(bgContainer.querySelectorAll('.bubble:not(.popped)')).some(b => b.dataset.letter === window.bubbleGameTargetLetter);
            if (!existing) forceTarget = true;
        }
        
        if ((forceTarget || Math.random() < 0.3) && window.bubbleGameTargetLetter) {
            bubble.textContent = window.bubbleGameTargetLetter;
            bubble.dataset.letter = window.bubbleGameTargetLetter;
        } else {
            const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
            bubble.textContent = randomLetter;
            bubble.dataset.letter = randomLetter;
        }
    }
    
    bgContainer.appendChild(bubble);
};

// Global listener to pop background bubbles even if they are behind other elements
document.addEventListener('click', function(e) {
    const bubbles = document.querySelectorAll('.bubble:not(.popped)');
    for (let bubble of bubbles) {
        const rect = bubble.getBoundingClientRect();
        if (rect.width === 0) continue;
        
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= rect.width / 2) {
            
            let showImageWord = null;
            
            if (window.isBubbleGameActive) {
                if (window.bubbleGameLetterPractice) {
                    const bubbleLetter = bubble.dataset.letter;
                    if (bubbleLetter === window.bubbleGameTargetLetter) {
                        const matchingWords = appState.words.filter(w => w.letter === window.bubbleGameTargetLetter);
                        if (matchingWords.length > 0) {
                            showImageWord = matchingWords[Math.floor(Math.random() * matchingWords.length)];
                        }
                        setTimeout(() => { pickNewBubbleGameLetter(); }, 1000);
                    }
                } else {
                    if (appState.words.length > 0) {
                        showImageWord = appState.words[Math.floor(Math.random() * appState.words.length)];
                    }
                }
            }
            
            bubble.classList.add('popped');
            
            if (showImageWord) {
                const img = document.createElement('img');
                img.className = 'bubble-image-popup';
                const cacheUrl = localStorage.getItem(`img_${showImageWord.id}`);
                img.src = cacheUrl || showImageWord.imageUrl || showImageWord.url;
                
                // Fallback for word.url structure differences or missing images
                if (!img.src || img.src === 'undefined' || window.location.href === img.src || img.src.endsWith('/')) {
                    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e0e0e0'/%3E%3Ctext x='50' y='50' font-family='sans-serif' font-size='40' text-anchor='middle' alignment-baseline='middle' fill='%23666'%3E%3F%3C/text%3E%3C/svg%3E";
                }
                
                img.style.left = `${e.clientX}px`;
                img.style.top = `${e.clientY}px`;
                img.style.width = `${Math.max(150, rect.width * 1.5)}px`;
                img.style.height = `${Math.max(150, rect.width * 1.5)}px`;
                
                const duration = appState.config.imagePopDuration !== undefined ? appState.config.imagePopDuration : 1.0;
                img.style.animationDuration = `${duration}s`;
                
                document.body.appendChild(img);
                
                setTimeout(() => {
                    img.remove();
                }, duration * 1000);
            }
            
            if (appState.config.soundEnabled) {
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(400 + Math.random()*200, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(800 + Math.random()*200, ctx.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.1);
                } catch(err) {}
            }
            
            setTimeout(() => { 
                bubble.remove(); 
                setTimeout(() => window.spawnBubble(true), 100);
            }, 200);
            
            break; // pop only one
        }
    }
});

/* ========================================================= FIND WORD ========================================================= */ function getWordForLetter( letter, category ) {
    let options = appState.words.filter( item => 
        item.letter === letter && 
        (category === "all" || (item.categories || []).includes(category))
    );
    
    // Fallback if no words found in the specific category
    if (options.length === 0) {
        options = appState.words.filter( item => item.letter === letter );
    }
    
    if (options.length === 0) return null;
    
    const lastId = lastSeenWordIds[letter];
    let index = 0;
    if (lastId) {
        const lastIndex = options.findIndex(item => item.id === lastId);
        if (lastIndex !== -1) {
            index = (lastIndex + 1) % options.length;
        }
    }
    
    lastSeenWordIds[letter] = options[index].id;
    return options[index];
} /* ========================================================= CATEGORY BUTTONS ========================================================= */ function renderCategoryButtons() {
    categoryControls.innerHTML = "";
    
    const allBtn = document.createElement("button");
    allBtn.className = "category-button";
    if (currentCategory === "all") {
        allBtn.classList.add("active");
    }
    allBtn.textContent = "All Categories";
    allBtn.addEventListener("pointerdown", () => {
        currentCategory = "all";
        renderCategoryButtons();
        playLetter(currentLetter);
    });
    categoryControls.appendChild(allBtn);

    appState.categories.forEach( category => { const button = document.createElement( "button" ); button.className = "category-button"; if ( category === currentCategory ) { button.classList.add( "active" ); } button.textContent = formatCategoryName( category ); button.addEventListener( "click", () => { currentCategory = category; renderCategoryButtons(); playLetter( currentLetter ); } ); categoryControls.appendChild( button ); } ); } function formatCategoryName( category ) { return category .replace( /-/g, " " ) .replace( /\b\w/g, char => char.toUpperCase() ); }

function getAllWordsForLetter( letter, category ) {
    let options = appState.words.filter( item => 
        item.letter === letter && 
        (category === "all" || (item.categories || []).includes(category))
    );
    if (options.length === 0) {
        options = appState.words.filter( item => item.letter === letter );
    }
    return options;
}

function showMultiModeGrid(allData, letter) {
    wordContainer.innerHTML = "";
    imageArea.innerHTML = "";
    clearTimeout(animationTimer);
    
    const span = document.createElement("span");
    span.className = "animated-letter first-letter";
    span.textContent = letter.toUpperCase();
    wordContainer.appendChild(span);
    
    const grid = document.createElement("div");
    grid.className = "multi-mode-grid";
    
    allData.forEach(data => {
        const card = document.createElement("div");
        card.className = "multi-mode-card";
        
        let visualHtml = "";
        if (data.imageUrl) {
            visualHtml = `<img loading="lazy" src="${escapeHtml(data.imageUrl)}" alt="${escapeHtml(data.word)}" onerror="this.style.display='none'">`;
        } else {
            visualHtml = `<div class="fallback-icon">${escapeHtml(data.fallback || "❓")}</div>`;
        }
        
        card.innerHTML = `
            ${visualHtml}
            <div style="font-weight:bold; font-family:'Fredoka', sans-serif; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(data.word)}</div>
        `;
        
        card.addEventListener("click", () => {
            showSingleImageFromMulti(data);
        });
        
        grid.appendChild(card);
    });
    
    imageArea.appendChild(grid);
}

function showSingleImageFromMulti(data) {
    clearTimeout(animationTimer);
    
    animationTimer = WordCardComponent.render(
        wordContainer,
        imageArea,
        data,
        {
            letterDelay: appState.config.letterDelay !== undefined ? appState.config.letterDelay : 180,
            imageDelay: appState.config.imageDelay !== undefined ? appState.config.imageDelay : 0,
            onLetterClick: (character) => {
                handleKeyPress(character, true);
            },
            onImageLoaded: () => playSound(data),
            onImageError: () => playSound(data)
        }
    );
}


/* ========================================================= VIEW MANAGEMENT ========================================================= */ 
var gameMode = 'single';


const homeView = document.getElementById("homeView");
const storySelectionView = document.getElementById("storySelectionView");

function showHomeView() {
    window.isBubbleGameActive = false;
    applyConfiguration(); // reset bubbles without letters
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    homeView.classList.add("active");
    document.getElementById("backHomeBtn").style.display = "none";
    document.getElementById("kidModeButton").style.display = "none";
    document.getElementById("muteBtn").style.display = "none";
    if (document.getElementById("kidModeMuteBtn")) document.getElementById("kidModeMuteBtn").style.display = "none";
}

function showGameView(mode) { 
    window.isBubbleGameActive = false;
    applyConfiguration();
    if (mode) gameMode = mode;
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    gameView.classList.add("active"); 
    document.getElementById("backHomeBtn").style.display = "inline-flex";
    document.getElementById("kidModeButton").style.display = "inline-flex";
    document.getElementById("muteBtn").style.display = "inline-flex";
    if (document.getElementById("kidModeMuteBtn")) document.getElementById("kidModeMuteBtn").style.display = "none";
    updateMuteButtonIcon();
    playLetter(currentLetter);
}

function showSettingsView() { 
    window.isBubbleGameActive = false;
    applyConfiguration();
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    settingsView.classList.add("active"); 
    document.getElementById("backHomeBtn").style.display = "inline-flex";
    document.getElementById("kidModeButton").style.display = "none";
    document.getElementById("muteBtn").style.display = "none";
    renderAllSettings(); 
} 

function showStorySelectionView() {
    window.isBubbleGameActive = false;
    applyConfiguration();
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    storySelectionView.classList.add("active");
    document.getElementById("backHomeBtn").style.display = "inline-flex";
    document.getElementById("kidModeButton").style.display = "none";
    document.getElementById("muteBtn").style.display = "none";
    renderStorySelectionGrid();
}

function renderStorySelectionGrid() {
    const grid = document.getElementById("storySelectionGrid");
    grid.innerHTML = "";
    appState.stories.forEach(story => {
        const card = document.createElement("div");
        card.className = "category-card";
        card.style.cursor = "pointer";
        card.style.textAlign = "center";
        card.innerHTML = `<h3>${story.title}</h3><p style="margin: 0; color: var(--muted);">${story.wordIds.length} words</p>`;
        card.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            playStory(story.id);
        });
        grid.appendChild(card);
    });
}

/* ========================================================= SETTINGS EVENTS ========================================================= */ 
if (document.getElementById("settingsButton")) document.getElementById("settingsButton").addEventListener("click", (e) => { e.preventDefault(); showSettingsView(); }); 


document.getElementById("homeLetterFunBtn").addEventListener("click", (e) => { e.preventDefault(); showGameView('single'); });
document.getElementById("homeWordsFunBtn").addEventListener("click", (e) => { e.preventDefault(); showGameView('multi'); });
document.getElementById("homeStoryModeBtn").addEventListener("click", (e) => {
    e.preventDefault();
    if (!appState.stories || appState.stories.length === 0) {
        showToast("Please create a story in Settings first!");
        showSettingsView();
        document.querySelector('[data-tab="stories"]').click();
        return;
    }
    showStorySelectionView();
});
document.getElementById("homeSettingsBtn").addEventListener("click", (e) => { e.preventDefault(); showSettingsView(); }); 
/* ========================================================= SETTINGS TABS ========================================================= */ 
document.querySelectorAll( ".settings-tab" ) .forEach( tab => { tab.addEventListener( "click", () => { const tabName = tab.dataset.tab; document.querySelectorAll( ".settings-tab" ) .forEach( item => item.classList.remove( "active" ) ); tab.classList.add( "active" ); document.querySelectorAll( ".settings-panel" ) .forEach( panel => panel.classList.remove( "active" ) ); document.getElementById( tabName + "Panel" ) .classList.add( "active" ); } ); } ); 
/* ========================================================= SETTINGS RENDER ========================================================= */ 
function renderAllSettings() { renderWordTable(); renderCategoryManager(); renderStoryManager(); loadConfigurationForm(); } 
/* ========================================================= WORD TABLE ========================================================= */ 
function renderWordTable() {
    const search = wordSearch.value.toLowerCase().trim();
    const filteredWords = appState.words.filter(item => {
        return (
            item.letter.toLowerCase().includes(search) ||
            item.word.toLowerCase().includes(search) ||
            (item.categories || []).some(c => c.toLowerCase().includes(search))
        );
    }).sort((a, b) => {
        const letterCompare = a.letter.localeCompare(b.letter);
        if (letterCompare !== 0) return letterCompare;
        return a.word.localeCompare(b.word);
    });

    const container = document.getElementById("wordListContainer");
    if (!container) return;
    container.innerHTML = "";

    const grouped = {};
    filteredWords.forEach(w => {
        const L = w.letter.toUpperCase();
        if (!grouped[L]) grouped[L] = [];
        grouped[L].push(w);
    });

    Object.keys(grouped).sort().forEach(letter => {
        const section = document.createElement("div");
        section.className = "letter-section";

        const header = document.createElement("div");
        header.className = "letter-header";
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.gap = "15px";

        const title = document.createElement("h2");
        title.textContent = letter;
        title.style.margin = "0";

        const addIcon = document.createElement("button");
        addIcon.className = "button button-success button-small";
        addIcon.innerHTML = `<span class="material-icons" style="font-size: 1rem; vertical-align: middle;">add</span> Add`;
        addIcon.title = "Add word for " + letter;
        addIcon.onclick = () => {
            openWordModal();
            document.getElementById("wordLetter").value = letter;
            setTimeout(() => document.getElementById("wordName").focus(), 100);
        };

        header.appendChild(title);
        header.appendChild(addIcon);
        section.appendChild(header);

        const cardsWrap = document.createElement("div");
        cardsWrap.className = "letter-cards";

        grouped[letter].forEach(item => {
            const card = document.createElement("div");
            card.className = "word-card";

            const preview = item.imageUrl 
                ? `<img class="word-card-image" loading="lazy" src="${escapeHtml(item.imageUrl)}" onerror="this.style.display='none'">` 
                : `<div class="word-card-image" style="display:flex;align-items:center;justify-content:center;font-size:2.5rem;">${escapeHtml(item.fallback)}</div>`;

            const catHtml = (item.categories || []).map(c => `<span class="category-label" style="background:#edf0f7;padding:2px 8px;border-radius:12px;font-size:0.8rem;margin-right:4px;color:var(--text);font-weight:bold;">${escapeHtml(c)}</span>`).join("");

            card.innerHTML = `
                <div class="word-card-title">${escapeHtml(item.word)}</div>
                ${preview}
                <div class="word-card-details">
                    <div><strong>Fallback:</strong> <span style="font-size:1.1rem">${escapeHtml(item.fallback)}</span></div>
                    <div><strong>Tags:</strong> ${catHtml || 'None'}</div>
                    <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:300px;">
                        <strong>URL:</strong> <a href="${escapeHtml(item.imageUrl || '#')}" target="_blank" style="color:var(--primary);text-decoration:none;">${escapeHtml(item.imageUrl || 'None')}</a>
                    </div>
                    <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:300px;">
                        <strong>Audio:</strong> <a href="${escapeHtml(item.audioUrl || '#')}" target="_blank" style="color:var(--primary);text-decoration:none;">${escapeHtml(item.audioUrl || 'None')}</a>
                    </div>
                </div>
                <div class="word-card-actions">
                    <button class="button button-secondary button-small" onclick="previewWordFromList('${item.id}')" title="Preview">
                        <span class="material-icons" style="font-size: 1.2rem; vertical-align: middle;">visibility</span>
                    </button>
                    <button class="button button-primary button-small" onclick="editWord('${item.id}')" title="Edit">
                        <span class="material-icons" style="font-size: 1.2rem; vertical-align: middle;">edit</span>
                    </button>
                    <button class="button button-danger button-small" onclick="deleteWord('${item.id}')" title="Delete">
                        <span class="material-icons" style="font-size: 1.2rem; vertical-align: middle;">delete</span>
                    </button>
                </div>
            `;
            cardsWrap.appendChild(card);
        });

        section.appendChild(cardsWrap);
        container.appendChild(section);
    });
}
 
/* =========================================================
   STORY MODE LOGIC
========================================================= */
var currentStoryEditingId = null;
var selectedStoryWordIds = [];
var activePlayingStory = null;
var currentStoryStep = 0;
var canvasZIndexCounter = 10;
var stickyMode = false;

// Zoom and Pan variables
var canvasScale = 1;
var canvasPanX = 0;
var canvasPanY = 0;
var canvasMode = 'pan'; // 'pan' or 'select'
var dockTimer = null;

function renderStoryManager() {
    const container = document.getElementById("storyListContainer");
    if (!container) return;
    container.innerHTML = "";

    if (!appState.stories || appState.stories.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 20px;">No stories created yet. Click "Create New Story" to start!</div>`;
        return;
    }

    appState.stories.forEach(story => {
        const card = document.createElement("div");
        card.className = "category-card";
        const wordCount = (story.wordIds || []).length;
        
        card.innerHTML = `
            <h3><span class="material-icons" style="font-size: 1.2rem; vertical-align: middle;">auto_stories</span> ${escapeHtml(story.title)}</h3>
            <p>${wordCount} words sequence</p>
            <div style="display: flex; gap: 8px; margin-top: 10px;">
                <button class="button button-success button-small" onclick="playStory('${story.id}')" style="flex:1;">
                    <span class="material-icons" style="font-size: 1rem; vertical-align: middle;">play_arrow</span> Play
                </button>
                <button class="button button-primary button-small" onclick="editStory('${story.id}')" title="Edit">
                    <span class="material-icons" style="font-size: 1rem; vertical-align: middle;">edit</span>
                </button>
                <button class="button button-danger button-small" onclick="deleteStory('${story.id}')" title="Delete">
                    <span class="material-icons" style="font-size: 1rem; vertical-align: middle;">delete</span>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openStoryModal(storyId = null) {
    currentStoryEditingId = storyId;
    selectedStoryWordIds = [];
    document.getElementById("storyForm").reset();
    
    if (storyId) {
        const story = appState.stories.find(s => s.id === storyId);
        if (story) {
            document.getElementById("storyModalTitle").textContent = "Edit Story";
            document.getElementById("storyNameInput").value = story.title;
            selectedStoryWordIds = [...(story.wordIds || [])];
        }
    } else {
        document.getElementById("storyModalTitle").textContent = "Create Story";
    }
    
    renderStoryBuilderWordPickers();
    renderStorySelectedPreview();
    document.getElementById("storyModal").classList.add("active");
}

function closeStoryModal() {
    document.getElementById("storyModal").classList.remove("active");
}

function renderStorySelectedPreview() {
    const previewContainer = document.getElementById("storySelectedWordsPreview");
    previewContainer.innerHTML = "";
    
    if (selectedStoryWordIds.length === 0) {
        previewContainer.innerHTML = `<span style="color: var(--muted); font-size: 0.9rem;">No words selected yet. Click words below to build your sequence.</span>`;
        return;
    }
    
    selectedStoryWordIds.forEach((wordId, index) => {
        const wordObj = appState.words.find(w => w.id === wordId);
        if (!wordObj) return;
        
        const pill = document.createElement("div");
        pill.style.cssText = "position: relative; width: 100%; height: 80px; border-radius: 8px; overflow: hidden; border: 2px solid var(--primary); display: flex; flex-direction: column; background: white; user-select: none;";
        
        let visualHtml = wordObj.imageUrl 
            ? `<img src="${escapeHtml(wordObj.imageUrl)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.outerHTML='<div style=\\'font-size: 2rem;\\'>${escapeHtml(wordObj.fallback || '❓')}</div>'">` 
            : `<div style="font-size: 2rem;">${escapeHtml(wordObj.fallback || "❓")}</div>`;

        pill.innerHTML = `
            <div style="position: absolute; top: 2px; left: 2px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; z-index: 2;">${index + 1}</div>
            <button type="button" onclick="removeWordFromStorySelection(${index})" style="position: absolute; top: 2px; right: 2px; background: rgba(255,0,0,0.7); color: white; border: none; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; z-index: 2; cursor: pointer; padding: 0;"><span class="material-icons" style="font-size: 10px;">close</span></button>
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden;">${visualHtml}</div>
            <div style="background: rgba(255,255,255,0.9); font-size: 0.75rem; text-align: center; font-weight: bold; padding: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; position: absolute; bottom: 0; width: 100%; border-top: 1px solid rgba(0,0,0,0.1);">${escapeHtml(wordObj.word)}</div>
        `;
        
        pill.draggable = true;
        pill.dataset.index = index;
        
        pill.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", index);
            e.dataTransfer.effectAllowed = "move";
            pill.style.opacity = "0.5";
        });
        
        pill.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            pill.style.borderColor = "var(--success)";
        });
        
        pill.addEventListener("dragleave", () => {
            pill.style.borderColor = "var(--primary)";
        });
        
        pill.addEventListener("drop", (e) => {
            e.preventDefault();
            const draggedIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
            if (!isNaN(draggedIndex) && draggedIndex !== index) {
                const item = selectedStoryWordIds.splice(draggedIndex, 1)[0];
                selectedStoryWordIds.splice(index, 0, item);
                renderStorySelectedPreview();
            }
        });
        
        pill.addEventListener("dragend", () => {
            pill.style.opacity = "1";
            pill.style.borderColor = "var(--primary)";
        });
        previewContainer.appendChild(pill);
    });
}

function renderStoryBuilderWordPickers() {
    const listContainer = document.getElementById("storyAvailableWordsList");
    const searchVal = (document.getElementById("storyWordSearch").value || "").toLowerCase().trim();
    listContainer.innerHTML = "";
    
    const filtered = appState.words.filter(w => w.word.toLowerCase().includes(searchVal) || w.letter.toLowerCase().includes(searchVal));
    
    filtered.forEach(w => {
        const item = document.createElement("div");
        item.style.cssText = "background: white; border: 2px solid #e1e5ee; border-radius: 10px; padding: 8px; text-align: center; cursor: pointer; transition: 0.1s;";
        item.innerHTML = `
            ${w.imageUrl ? `<img src="${escapeHtml(w.imageUrl)}" style="width: 100%; height: 60px; object-fit: cover; border-radius: 6px; margin-bottom: 4px;" onerror="this.outerHTML='<div style=\'font-size: 1.5rem;\'>${escapeHtml(w.fallback || '❓')}</div>'">` : `<div style="font-size: 1.5rem;">${escapeHtml(w.fallback || "❓")}</div>`}
            <div style="font-size: 0.85rem; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-top: 4px;">${escapeHtml(w.word)}</div>
        `;
        item.addEventListener("mouseover", () => item.style.borderColor = "var(--primary)");
        item.addEventListener("mouseout", () => item.style.borderColor = "#e1e5ee");
        item.addEventListener("click", () => {
            selectedStoryWordIds.push(w.id);
            renderStorySelectedPreview();
        });
        listContainer.appendChild(item);
    });
    
    // Add a big Create Word button at the end of the grid
    const addBtn = document.createElement("div");
    addBtn.style.cssText = "background: #f4f5fb; border: 2px dashed #a0aabf; border-radius: 10px; padding: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: 0.1s; min-height: 90px;";
    addBtn.innerHTML = `<span class="material-icons" style="font-size: 2.5rem; color: var(--primary);">add_circle</span><div style="font-size: 0.85rem; font-weight: 800; color: var(--primary); margin-top: 5px;">Create Word</div>`;
    addBtn.addEventListener("mouseover", () => addBtn.style.borderColor = "var(--primary)");
    addBtn.addEventListener("mouseout", () => addBtn.style.borderColor = "#a0aabf");
    addBtn.addEventListener("click", openWordModal);
    listContainer.appendChild(addBtn);
}

window.removeWordFromStorySelection = function(index) {
    selectedStoryWordIds.splice(index, 1);
    renderStorySelectedPreview();
};

document.getElementById("storyWordSearch").addEventListener("input", renderStoryBuilderWordPickers);
document.getElementById("addStoryButton").addEventListener("click", () => openStoryModal(null));
document.getElementById("closeStoryModal").addEventListener("click", closeStoryModal);
document.getElementById("cancelStoryBtn").addEventListener("click", closeStoryModal);

document.getElementById("storyForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("storyNameInput").value.trim();
    if (!title) {
        showToast("Please enter a story title.");
        return;
    }
    if (selectedStoryWordIds.length === 0) {
        showToast("Please select at least one word for the story.");
        return;
    }
    
    if (currentStoryEditingId) {
        const story = appState.stories.find(s => s.id === currentStoryEditingId);
        if (story) {
            story.title = title;
            story.wordIds = [...selectedStoryWordIds];
        }
    } else {
        const newStory = {
            id: crypto.randomUUID(),
            title: title,
            wordIds: [...selectedStoryWordIds]
        };
        appState.stories.push(newStory);
    }
    
    saveState();
    renderStoryManager();
    closeStoryModal();
    showToast("Story saved successfully!");
});

window.editStory = function(id) {
    openStoryModal(id);
};

window.deleteStory = function(id) {
    confirmNative("Are you sure you want to delete this story?", () => {
        appState.stories = appState.stories.filter(s => s.id !== id);
        saveState();
        renderStoryManager();
        showToast("Story deleted.");
    });
};

/* =========================================================
   STORY PLAYER, DRAGGABLE CANVAS, PAN/ZOOM & DOCKING
========================================================= */





function updateCanvasTransform() {
    document.getElementById("storyCanvasInner").style.transform = `translate(${canvasPanX}px, ${canvasPanY}px) scale(${canvasScale})`;
}

// Mouse Wheel Zoom
document.getElementById("storyCanvas").addEventListener("wheel", (e) => {
    e.preventDefault();
    const zoomAmount = e.deltaY > 0 ? 0.9 : 1.1;
    let newScale = canvasScale * zoomAmount;
    
    // Max Zoom out limit bounded by cards (Disabled)
    /*
    let maxX = 0, maxY = 0;
    document.querySelectorAll(".story-card-item").forEach(c => {
        const w = c.clientWidth * parseFloat(c.dataset.scale || 1);
        const h = c.clientHeight * parseFloat(c.dataset.scale || 1);
        maxX = Math.max(maxX, c.offsetLeft + w);
        maxY = Math.max(maxY, c.offsetTop + h);
    });
    
    const canvasEl = document.getElementById("storyCanvas");
    const minScale = Math.min(1, canvasEl.clientWidth / (maxX + 100), canvasEl.clientHeight / (maxY + 100));
    */
    const canvasEl = document.getElementById("storyCanvas");
    newScale = Math.max(0.1, Math.min(newScale, 3)); 

    const rect = canvasEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    canvasPanX = mouseX - (mouseX - canvasPanX) * (newScale / canvasScale);
    canvasPanY = mouseY - (mouseY - canvasPanY) * (newScale / canvasScale);
    
    canvasScale = newScale;
    updateCanvasTransform();
});

window.playStory = function(id) {
    const story = appState.stories.find(s => s.id === id);
    if (!story || !story.wordIds || story.wordIds.length === 0) {
        showToast("This story has no words configured!");
        return;
    }
    
    activePlayingStory = story;
    currentStoryStep = 0;
    canvasZIndexCounter = 10;
    canvasScale = 1;
    canvasPanX = 0;
    canvasPanY = 0;
    updateCanvasTransform();
    
    document.getElementById("storyPlayerTitle").textContent = story.title;
    const canvasInner = document.getElementById("storyCanvasInner");
    const selBox = document.getElementById("selectionBox");
    canvasInner.innerHTML = "";
    canvasInner.appendChild(selBox);
    
    document.getElementById("storyPlayerModal").classList.add("active");
    document.getElementById("storyPlayerModal").querySelector(".modal").classList.add("modal-fullscreen");
    updateStoryPlayerUI();
};

function updateStoryPlayerUI() {
    const total = activePlayingStory.wordIds.length;
    document.getElementById("storyStepIndicator").textContent = `${Math.min(currentStoryStep + 1, total)}/${total}`;
    
    
}

window.playNextStoryWord = function(spawnX, spawnY) {
    if (!activePlayingStory) return;
    if (currentStoryStep >= activePlayingStory.wordIds.length) return;
    
    const wordId = activePlayingStory.wordIds[currentStoryStep];
    const wordObj = appState.words.find(w => w.id === wordId);
    currentStoryStep++;
    updateStoryPlayerUI();
    
    if (wordObj) {
        spawnDraggableCard(wordObj, spawnX, spawnY);
        playSound(wordObj);
    }
};

document.getElementById("storyResetCanvasBtn").addEventListener("click", () => {
    const canvasInner = document.getElementById("storyCanvasInner");
    const selBox = document.getElementById("selectionBox");
    canvasInner.innerHTML = "";
    canvasInner.appendChild(selBox);
    currentStoryStep = 0;
    canvasZIndexCounter = 10;
    canvasScale = 1;
    canvasPanX = 0;
    canvasPanY = 0;
    updateCanvasTransform();
    updateStoryPlayerUI();
});

document.getElementById("closeStoryPlayer").addEventListener("click", () => {
    document.getElementById("storyPlayerModal").classList.remove("active");
    activePlayingStory = null;
    stopCurrentAudio();
});

function checkStickyCollisions(droppedEls) {
    const allCards = Array.from(document.querySelectorAll(".story-card-item:not(.docked-bubble)"));
    const droppedSet = new Set(droppedEls);
    const otherCards = allCards.filter(c => !droppedSet.has(c));
    
    let collidedCards = new Set();
    
    droppedEls.forEach(dEl => {
        const dRect = dEl.getBoundingClientRect();
        otherCards.forEach(oEl => {
            const oRect = oEl.getBoundingClientRect();
            if (!(oRect.left > dRect.right || oRect.right < dRect.left || oRect.top > dRect.bottom || oRect.bottom < dRect.top)) {
                collidedCards.add(oEl);
            }
        });
    });
    
    if (collidedCards.size > 0) {
        const newGroupId = "group_" + Date.now();
        let allToMerge = new Set([...droppedEls, ...collidedCards]);
        
        collidedCards.forEach(c => {
            const gId = c.dataset.groupId;
            if (gId) {
                document.querySelectorAll(`[data-group-id="${gId}"]`).forEach(sibling => allToMerge.add(sibling));
            }
        });
        
        allToMerge.forEach(c => {
            c.dataset.groupId = newGroupId;
            c.classList.add("grouped-card");
            c.dataset.tapState = "bottom"; 
        });
    }
}

function performDock(edge, movingCards) {
    const leader = movingCards[0].el;
    const cx = leader.offsetLeft;
    const cy = leader.offsetTop;
    
    movingCards.forEach(m => {
        const el = m.el;
        el.dataset.preDockLeft = el.offsetLeft - cx;
        el.dataset.preDockTop = el.offsetTop - cy;
        el.dataset.preDockScale = el.dataset.scale || 1;
        el.dataset.preDockGroup = el.dataset.groupId || "";
        
        el.classList.add("docked-bubble");
        el.style.left = cx + "px";
        el.style.top = cy + "px";
        el.dataset.isDocked = "true";
        canvasZIndexCounter++;
        el.style.zIndex = canvasZIndexCounter; 
    });
}

function spawnDraggableCard(wordObj, spawnX, spawnY) {
    const canvas = document.getElementById("storyCanvas");
    const canvasInner = document.getElementById("storyCanvasInner");
    canvasZIndexCounter++;
    
    const card = document.createElement("div");
    card.className = "story-card-item";
    
    // Flawless scaling layout without resize icon handle
    card.style.cssText = `position: absolute; background: white; border: 3px solid var(--primary); border-radius: 24px 24px 6px 24px; padding: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); display: flex; flex-direction: column; align-items: center; gap: 8px; width: 150px; z-index: ${canvasZIndexCounter}; transform-origin: top left; transform: scale(1); touch-action: none; cursor: grab; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none;`;
    card.oncontextmenu = () => false;
    if (spawnX !== undefined && spawnY !== undefined) {
        card.style.left = spawnX + "px";
        card.style.top = spawnY + "px";
    } else {
        const centerX = (canvas.clientWidth / 2 - canvasPanX) / canvasScale - 75;
        const centerY = (canvas.clientHeight / 2 - canvasPanY) / canvasScale - 80;
        card.style.left = centerX + "px";
        card.style.top = centerY + "px";
    }

    
    let visualHtml = "";
    if (wordObj.imageUrl) {
        visualHtml = `<div class="card-visual-layer" style="width: 100%; height: 90px; display: flex; align-items: center; justify-content: center; pointer-events: none;"><img src="${escapeHtml(wordObj.imageUrl)}" style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; border-radius: 8px; -webkit-touch-callout: none; pointer-events: none; user-select: none; -webkit-user-select: none;" onerror="this.style.display='none'"></div>`;
    } else {
        visualHtml = `<div class="card-visual-layer" style="font-size: 2.5rem; height: 90px; display: flex; align-items: center; justify-content: center; pointer-events: none;">${escapeHtml(wordObj.fallback || "❓")}</div>`;
    }
    
    card.innerHTML = `
        ${visualHtml}
        <div class="card-text-layer" style="font-family: 'Fredoka', sans-serif; font-weight: 800; font-size: 1rem; color: var(--text); pointer-events: none; text-align: center; line-height: 1.1;">${escapeHtml(wordObj.word)}</div>
        <div class="card-resize-handle" style="position: absolute; bottom: 0; right: 0; width: 35px; height: 35px; cursor: se-resize; z-index: 5;"></div>
    `;
    card.dataset.scale = "1";

    let isDragging = false;
    let isResizing = false;
    let isTap = true;
    let startX, startY;
    let initialScale = 1;
    let movingCards = []; 
    
    // Resize Handler Isolation
    const handle = card.querySelector(".card-resize-handle");
    handle.addEventListener("pointerdown", (e) => {
        isResizing = true;
        startX = e.clientX;
        initialScale = parseFloat(card.dataset.scale || 1);
        try { handle.setPointerCapture(e.pointerId); } catch(err) {}
        e.stopPropagation();
        e.preventDefault();
    });
    
    handle.addEventListener("pointermove", (e) => {
        if (!isResizing) return;
        const dx = (e.clientX - startX) / canvasScale;
        const newScale = Math.max(0.4, Math.min(3, initialScale + (dx / 150)));
        card.style.transform = `scale(${newScale})`;
        card.dataset.scale = newScale;
        e.stopPropagation();
    });
    
    handle.addEventListener("pointerup", (e) => {
        isResizing = false;
        try { handle.releasePointerCapture(e.pointerId); } catch(err) {}
        e.stopPropagation();
    });
    
    // Drag & Group Handler
    card.addEventListener("pointerdown", (e) => {
        try { card.setPointerCapture(e.pointerId); } catch(err) {}
        
        startX = e.clientX;
        startY = e.clientY;
        isDragging = false;
        isTap = true;
        
        card.dataset.longPressTriggered = "false";
        card.longPressTimer = setTimeout(() => {
            card.dataset.longPressTriggered = "true";
            if (card.dataset.groupId) {
                card.removeAttribute("data-group-id");
                card.classList.remove("grouped-card");
                card.dataset.tapState = "bottom";
                canvasZIndexCounter++;
                card.style.zIndex = canvasZIndexCounter;
                
                movingCards = [{ el: card, startLeft: card.offsetLeft, startTop: card.offsetTop }];
                
                card.style.transform = `scale(${(parseFloat(card.dataset.scale) || 1) * 1.1})`;
                setTimeout(() => { card.style.transform = `scale(${card.dataset.scale || 1})`; }, 200);
            }
        }, 500);
        
        movingCards = [];
        
        if (card.dataset.isDocked === "true") {
            movingCards.push({ el: card, startLeft: card.offsetLeft, startTop: card.offsetTop });
        } else {
            const groupId = card.dataset.groupId;
            if (groupId) {
                document.querySelectorAll(`[data-group-id="${groupId}"]`).forEach(el => {
                    movingCards.push({ el, startLeft: el.offsetLeft, startTop: el.offsetTop });
                });
            } else if (card.classList.contains("selected-group-card")) {
                document.querySelectorAll(".story-card-item.selected-group-card").forEach(el => {
                    movingCards.push({ el, startLeft: el.offsetLeft, startTop: el.offsetTop });
                });
            } else {
                movingCards.push({ el: card, startLeft: card.offsetLeft, startTop: card.offsetTop });
            }
        }
        
        card.style.cursor = "grabbing";
    });
    
    card.addEventListener("pointermove", (e) => {
        if (!e.buttons) return;
        
        const dx = (e.clientX - startX) / canvasScale;
        const dy = (e.clientY - startY) / canvasScale;
        
        const pixelDx = e.clientX - startX;
        const pixelDy = e.clientY - startY;
        
        if (isTap && (Math.abs(pixelDx) > 10 || Math.abs(pixelDy) > 10)) {
            isTap = false;
            isDragging = true;
            if (card.longPressTimer && card.dataset.longPressTriggered === "false") {
                clearTimeout(card.longPressTimer);
                card.longPressTimer = null;
            }
            movingCards.sort((a,b) => parseInt(a.el.style.zIndex || 0) - parseInt(b.el.style.zIndex || 0));
            movingCards.forEach(m => {
                canvasZIndexCounter++;
                m.el.style.zIndex = canvasZIndexCounter;
            });
        }
        
        if (isDragging) {
            movingCards.forEach(m => {
                m.el.style.left = (m.startLeft + dx) + "px";
                m.el.style.top = (m.startTop + dy) + "px";
            });

            // Edge glow docking check disabled for now
            /*
            if (!card.dataset.isDocked || card.dataset.isDocked === "false") {
                const canvasRect = canvas.getBoundingClientRect();
                const edgeThresh = 40;
                let edge = null;
                if (e.clientX - canvasRect.left < edgeThresh) edge = 'left';
                else if (canvasRect.right - e.clientX < edgeThresh) edge = 'right';
                else if (e.clientY - canvasRect.top < edgeThresh) edge = 'top';
                else if (canvasRect.bottom - e.clientY < edgeThresh) edge = 'bottom';

                if (edge) {
                    canvas.dataset.glow = edge;
                    if (!dockTimer) dockTimer = setTimeout(() => {
                        performDock(edge, movingCards);
                        isDragging = false; // force drop
                        canvas.dataset.glow = "";
                    }, 600);
                } else {
                    canvas.dataset.glow = "";
                    clearTimeout(dockTimer);
                    dockTimer = null;
                }
            }
            */
        }
    });
    
    card.addEventListener("pointerup", (e) => {
        if (card.longPressTimer) {
             clearTimeout(card.longPressTimer);
             card.longPressTimer = null;
        }
        try { card.releasePointerCapture(e.pointerId); } catch(err) {}
        card.style.cursor = "grab";
        
        const canvas = document.getElementById("storyCanvas");
        canvas.dataset.glow = "";
        clearTimeout(dockTimer);
        dockTimer = null;
        
        if (isTap && card.dataset.longPressTriggered === "false") {
            if (card.dataset.isDocked === "true") {
                const cx = card.offsetLeft;
                const cy = card.offsetTop;
                const siblings = Array.from(document.querySelectorAll(".docked-bubble")).filter(el => {
                    return Math.abs(el.offsetLeft - cx) < 5 && Math.abs(el.offsetTop - cy) < 5;
                });
                
                siblings.forEach(el => {
                    el.classList.remove("docked-bubble");
                    el.dataset.isDocked = "false";
                    el.style.left = (cx + parseFloat(el.dataset.preDockLeft || 0)) + "px";
                    el.style.top = (cy + parseFloat(el.dataset.preDockTop || 0)) + "px";
                    el.style.transform = `scale(${el.dataset.preDockScale || 1})`;
                });
            } else {
                canvasZIndexCounter++;
                card.style.zIndex = canvasZIndexCounter;
            }
        } else if (isDragging && card.dataset.isDocked !== "true") {
            checkStickyCollisions(movingCards.map(m => m.el));
        }
        
        isDragging = false;
        movingCards = [];
    });

    canvasInner.appendChild(card);
}

/* =========================================================
   CANVAS PAN & SELECTION BOX (GROUPING)
========================================================= */
var isCanvasDragging = false;
var isSelecting = false;
var selStartX = 0, selStartY = 0;
var panStartX = 0, panStartY = 0;
var initialPanX = 0, initialPanY = 0;

var canvasEl = document.getElementById("storyCanvas");
var selBox = document.getElementById("selectionBox");
var canvasHasPanned = false;

canvasEl.addEventListener("pointerdown", (e) => {
    if (e.target !== canvasEl && e.target.id !== "storyCanvasInner" && e.target.id !== "selectionBox") return;
    
    canvasHasPanned = false;
    isCanvasDragging = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    initialPanX = canvasPanX;
    initialPanY = canvasPanY;
    canvasEl.style.cursor = "grabbing";
});

canvasEl.addEventListener("pointermove", (e) => {
    if (isCanvasDragging) {
        const dx = e.clientX - panStartX;
        const dy = e.clientY - panStartY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            canvasHasPanned = true;
        }
        canvasPanX = initialPanX + dx;
        canvasPanY = initialPanY + dy;
        updateCanvasTransform();
    }
});

window.addEventListener("pointerup", (e) => {
    if (isCanvasDragging) {
        isCanvasDragging = false;
        canvasEl.style.cursor = "";
        
        if (!canvasHasPanned) {
            if (e.target === canvasEl || e.target.id === "storyCanvasInner" || e.target.id === "selectionBox") {
                if (typeof window.playNextStoryWord === "function") {
                    const rect = canvasEl.getBoundingClientRect();
                    const logicalX = (panStartX - rect.left - canvasPanX) / canvasScale - 75;
                    const logicalY = (panStartY - rect.top - canvasPanY) / canvasScale - 80;
                    window.playNextStoryWord(logicalX, logicalY);
                }
            }
        }
    }
    
    if (isSelecting) {
        isSelecting = false;
        selBox.style.display = "none";
    }
});

// Pinch to Zoom support for mobile
var initialPinchDist = null;
var initialPinchScale = 1;

canvasEl.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
        isSelecting = false;
        isCanvasDragging = false;
        initialPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        initialPinchScale = canvasScale;
    }
}, {passive: false});

canvasEl.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        const zoomFactor = dist / initialPinchDist;
        let newScale = initialPinchScale * zoomFactor;
        
        /*
        let maxX = 0, maxY = 0;
        document.querySelectorAll(".story-card-item").forEach(c => {
            const w = c.clientWidth * parseFloat(c.dataset.scale || 1);
            const h = c.clientHeight * parseFloat(c.dataset.scale || 1);
            maxX = Math.max(maxX, c.offsetLeft + w);
            maxY = Math.max(maxY, c.offsetTop + h);
        });
        
        const minScale = Math.min(1, canvasEl.clientWidth / (maxX + 100), canvasEl.clientHeight / (maxY + 100));
        */
        newScale = Math.max(0.1, Math.min(newScale, 3));

        const rect = canvasEl.getBoundingClientRect();
        const mouseX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
        const mouseY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;

        canvasPanX = mouseX - (mouseX - canvasPanX) * (newScale / canvasScale);
        canvasPanY = mouseY - (mouseY - canvasPanY) * (newScale / canvasScale);
        
        canvasScale = newScale;
        updateCanvasTransform();
    }
}, {passive: false});

/* =========================================================
   RECOVERED FUNCTIONS
========================================================= */

var confirmCallback = null;
function confirmNative(message, callback) {
    document.getElementById("confirmModalMessage").textContent = message;
    document.getElementById("confirmModal").classList.add("active");
    confirmCallback = callback;
}
document.getElementById("closeConfirmModal").addEventListener("click", () => {
    document.getElementById("confirmModal").classList.remove("active");
});
document.getElementById("confirmModalCancel").addEventListener("click", () => {
    document.getElementById("confirmModal").classList.remove("active");
});
document.getElementById("confirmModalConfirm").addEventListener("click", () => {
    document.getElementById("confirmModal").classList.remove("active");
    if(confirmCallback) confirmCallback();
});

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function populateWordCategoryCheckboxes() {
    const container = document.getElementById("wordCategory");
    container.innerHTML = "";
    appState.categories.forEach(category => {
        const label = document.createElement("label");
        label.className = "checkbox-item";
        label.innerHTML = `<input type="checkbox" value="${escapeHtml(category)}"><span>${escapeHtml(formatCategoryName(category))}</span>`;
        container.appendChild(label);
    });
}

function openWordModal() {
    populateWordCategoryCheckboxes();
    document.getElementById("wordForm").reset();
    document.getElementById("editingWordId").value = "";
    document.getElementById("wordModalTitle").textContent = "Add Word";
    document.getElementById("editWordView").style.display = "block";
    document.getElementById("previewWordView").style.display = "none";
    wordModal.classList.add("active");
}

function closeModal() {
    wordModal.classList.remove("active");
    if(document.getElementById("imageSearchResults")) {
        document.getElementById("imageSearchResults").style.display = "none";
    }
    stopCurrentAudio();
}

function editWord(id) {
    const word = appState.words.find(w => w.id === id);
    if(!word) return;
    populateWordCategoryCheckboxes();
    document.getElementById("editingWordId").value = word.id;
    document.getElementById("wordLetter").value = word.letter;
    document.getElementById("wordName").value = word.word;
    document.getElementById("wordFallback").value = word.fallback || "";
    document.getElementById("wordImageUrl").value = word.imageUrl || "";
    document.getElementById("wordAudioUrl").value = word.audioUrl || "";
    
    const checkboxes = document.querySelectorAll('#wordCategory input[type="checkbox"]');
    checkboxes.forEach(chk => {
        chk.checked = (word.categories || []).includes(chk.value);
    });
    
    document.getElementById("wordModalTitle").textContent = "Edit Word";
    document.getElementById("editWordView").style.display = "block";
    document.getElementById("previewWordView").style.display = "none";
    wordModal.classList.add("active");
}

function deleteWord(id) {
    confirmNative("Are you sure you want to delete this word?", () => {
        appState.words = appState.words.filter(w => w.id !== id);
        saveState();
        renderWordTable();
        renderCategoryButtons();
        showToast("Word deleted.");
    });
}

function deleteCategory(category) {
    confirmNative("Are you sure you want to delete this category?", () => {
        appState.categories = appState.categories.filter(c => c !== category);
        appState.words.forEach(w => {
            w.categories = (w.categories || []).filter(c => c !== category);
        });
        if(currentCategory === category) currentCategory = "all";
        saveState();
        renderAllSettings();
        renderCategoryButtons();
        showToast("Category deleted.");
    });
}

wordSearch.addEventListener("input", renderWordTable);

function populateCategorySelect() {

    wordCategory.innerHTML = "";
    appState.categories.forEach( category => {
        const label = document.createElement("label");
        label.className = "checkbox-item";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = category;
        const span = document.createElement("span");
        span.textContent = formatCategoryName(category);
        label.appendChild(checkbox);
        label.appendChild(span);
        wordCategory.appendChild(label);
    });
} addWordButton.addEventListener( "click", () => { openWordModal(); } ); closeWordModal.addEventListener( "click", closeModal ); cancelWordButton.addEventListener( "click", closeModal ); /* =========================================================
   IMAGE SEARCH
========================================================= */
var searchImagesBtn = document.getElementById("searchImagesBtn");
var imageSearchResults = document.getElementById("imageSearchResults");
const imageSearchComponent = new ImageSearchComponent(imageSearchResults, (finalUrl) => {
    document.getElementById("wordImageUrl").value = finalUrl;
    imageSearchResults.style.display = "none";
    showToast("High-res image selected!");
});

searchImagesBtn.addEventListener("click", async () => {
    const query = document.getElementById("wordName").value.trim();
    if (!query) {
        showToast("Please enter a word first!");
        return;
    }
    
    if (appState.config.bingSearchEnabled) {
        const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
        document.getElementById("webSearchIframe").src = searchUrl;
        document.getElementById("webSearchModal").classList.add("active");
        imageSearchResults.style.display = "none";
        return;
    }
    
    searchImagesBtn.textContent = "⏳...";
    searchImagesBtn.disabled = true;
    imageSearchResults.style.display = "grid";
    imageSearchResults.innerHTML = "<div style='grid-column: 1/-1; text-align:center; padding: 20px; color: var(--muted);'>Searching free images...</div>";
    
    await imageSearchComponent.search(query);
    
    searchImagesBtn.textContent = "🔍 Search";
    searchImagesBtn.disabled = false;
});

async function getAnimalAudioUrl(animalName) {
  const searchQuery = encodeURIComponent(`${animalName} filetype:audio`);
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${searchQuery}&format=json&origin=*`;
  
  try {
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.query && searchData.query.search.length > 0) {
      const fileTitle = searchData.query.search[0].title;
      const fileUrlReq = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
      const fileRes = await fetch(fileUrlReq);
      const fileData = await fileRes.json();
      
      const pages = fileData.query.pages;
      const pageId = Object.keys(pages)[0];
      
      if (pages[pageId].imageinfo && pages[pageId].imageinfo.length > 0) {
        return pages[pageId].imageinfo[0].url; 
      }
    }
  } catch (error) {
    console.warn("Wikimedia API request failed, falling back to TTS...");
  }

  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(animalName)}`;
}

document.getElementById("btnGoogleTTS").addEventListener("click", () => {
    const query = document.getElementById("wordName").value.trim().toLowerCase();
    if (!query) {
        showToast("Please enter a word first!");
        return;
    }
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(query)}&tl=en&client=tw-ob`;
    document.getElementById("wordAudioUrl").value = url;
    showToast("Google TTS URL populated!");
});

document.getElementById("btnWikimedia").addEventListener("click", async () => {
    const query = document.getElementById("wordName").value.trim().toLowerCase();
    if (!query) {
        showToast("Please enter a word first!");
        return;
    }
    const btn = document.getElementById("btnWikimedia");
    const originalText = btn.innerHTML;
    btn.textContent = "⏳...";
    btn.disabled = true;
    try {
        const url = await getAnimalAudioUrl(query);
        document.getElementById("wordAudioUrl").value = url;
        showToast("Wikimedia URL populated!");
    } catch (e) {
        showToast("Failed to fetch Wikimedia URL");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

document.getElementById("previewWordBtn").addEventListener("click", () => {
    const word = document.getElementById("wordName").value.trim().toUpperCase();
    const imageUrl = document.getElementById("wordImageUrl").value.trim();
    const audioUrl = document.getElementById("wordAudioUrl").value.trim();
    const fallback = document.getElementById("wordFallback").value.trim() || "❓";
    
    if (!word) {
        showToast("Please enter a word to preview.");
        return;
    }

    document.getElementById("editWordView").style.display = "none";
    document.getElementById("previewWordView").style.display = "block";
    
    const wordContainer = document.getElementById("previewWordContainer");
    const imageArea = document.getElementById("previewImageArea");
    
    const tempWordData = { word, imageUrl, fallback, audioUrl };
    WordCardComponent.render(wordContainer, imageArea, tempWordData, {
        letterDelay: 180,
        imageDelay: 0,
        onImageLoaded: () => playSound(tempWordData),
        onImageError: () => playSound(tempWordData)
    });
});

window.previewWordFromList = function(id) {
    const word = appState.words.find(w => w.id === id);
    if (!word) return;
    
    const modal = document.getElementById("standalonePreviewModal");
    const wordContainer = document.getElementById("standalonePreviewWordContainer");
    const imageArea = document.getElementById("standalonePreviewImageArea");
    
    modal.classList.add("active");
    
    WordCardComponent.render(wordContainer, imageArea, word, {
        letterDelay: 180,
        imageDelay: 0,
        onImageLoaded: () => playSound(word),
        onImageError: () => playSound(word)
    });
};

document.getElementById("closeStandalonePreviewBtn").addEventListener("click", () => {
    document.getElementById("standalonePreviewModal").classList.remove("active");
    stopCurrentAudio();
});

document.getElementById("standalonePreviewModal").addEventListener("pointerdown", (e) => {
    if (e.target.id === "standalonePreviewModal") {
        document.getElementById("standalonePreviewModal").classList.remove("active");
        stopCurrentAudio();
    }
});

document.getElementById("backToEditBtn").addEventListener("click", () => {
    document.getElementById("previewWordView").style.display = "none";
    document.getElementById("editWordView").style.display = "block";
    stopCurrentAudio();
});

document.getElementById("googleImagesBtn").addEventListener("click", () => {
    const query = document.getElementById("wordName").value.trim();
    if (!query) {
        showToast("Please enter a word first!");
        return;
    }
    
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, "_blank");
});

document.getElementById("closeWebSearchModal").addEventListener("click", () => {
    document.getElementById("webSearchModal").classList.remove("active");
    document.getElementById("webSearchIframe").src = "";
});

/* ========================================================= SAVE WORD ========================================================= */ wordForm.addEventListener( "submit", event => { event.preventDefault(); const letter = wordLetter.value .trim() .toLowerCase(); if ( !/^[a-z]$/.test( letter ) ) { showToast( "Please enter one letter from A to Z." ); return; } const newData = { letter: letter, word: wordName.value .trim() .toUpperCase(), categories: Array.from(wordCategory.querySelectorAll('input[type="checkbox"]:checked')).map(chk => chk.value), imageUrl: wordImageUrl.value .trim(), audioUrl: document.getElementById("wordAudioUrl").value.trim(), fallback: wordFallback.value .trim() || "❓" }; const existingId = editingWordId.value; if ( existingId ) { const index = appState.words.findIndex( item => item.id === existingId ); if ( index !== -1 ) { appState.words[index] = { id: existingId, ...newData }; } } else { appState.words.push({ id: crypto.randomUUID(), ...newData }); }    try { saveState(); renderWordTable(); renderCategoryButtons(); } catch(e) { console.error(e); } finally { if(typeof renderStoryBuilderWordPickers === 'function') renderStoryBuilderWordPickers(); closeModal(); showToast("Word saved!"); } } ); /* =========================================================
     COPY URL
========================================================= */
window.copyUrl = function(id) {
    const item = appState.words.find( word => word.id === id );
    if (!item) return;
    navigator.clipboard.writeText(item.imageUrl || "").then(() => {
        showToast("URL copied to clipboard!");
    }).catch(err => {
        showToast("Failed to copy URL");
    });
};

/* =========================================================
     EDIT WORD Global because buttons use onclick. ========================================================= */  /* ========================================================= DELETE WORD ========================================================= */ window.deleteWord = function(id) { const item = appState.words.find( word => word.id === id ); if (!item) { return; } const confirmed = confirm( `Delete "${item.word}"?` ); if (!confirmed) { return; } appState.words = appState.words.filter( word => word.id !== id ); saveState(); renderWordTable(); showToast( "Word deleted." ); }; /* ========================================================= CATEGORY MANAGER ========================================================= */ function renderCategoryManager() { categoryList.innerHTML = ""; appState.categories.forEach( category => { const count = appState.words.filter( word => (word.categories || []).includes(category) ) .length; const card = document.createElement( "div" ); card.className = "category-card"; card.innerHTML = ` <h3> <span class="material-icons" style="font-size: 1.2rem; vertical-align: middle;">label</span> ${escapeHtml( formatCategoryName( category ) )} </h3> <p> ${count} words </p> <button class="button button-danger button-small" onclick="deleteCategory('${escapeHtml(category)}')" > <span class="material-icons" style="font-size: 1.2rem; vertical-align: middle;">delete</span> Remove Category </button> `; categoryList.appendChild( card ); } ); } /* ========================================================= ADD CATEGORY ========================================================= */ addCategoryButton.addEventListener( "click", () => { const category = newCategoryInput.value .trim() .toLowerCase() .replace( /\s+/g, "-" ); if (!category) { showToast( "Enter a category name." ); return; } if ( appState.categories.includes( category ) ) { showToast( "That category already exists." ); return; } appState.categories.push( category ); newCategoryInput.value = ""; saveState(); renderCategoryManager(); renderCategoryButtons(); showToast( "Category added!" ); } ); /* ========================================================= DELETE CATEGORY ========================================================= */ window.deleteCategory = function(category) { const wordCount = appState.words.filter( word => (word.categories || []).includes(category) ) .length; if ( wordCount > 0 ) { showToast( "Remove or move the words first." ); return; } if ( appState.categories.length <= 1 ) { showToast( "At least one category is required." ); return; } const confirmed = confirm( `Remove category "${category}"?` ); if (!confirmed) { return; } appState.categories = appState.categories.filter( item => item !== category ); if ( currentCategory === category ) { currentCategory = appState.categories[0]; } saveState(); renderCategoryManager(); renderCategoryButtons(); showToast( "Category removed." ); }; /* ========================================================= CONFIGURATION FORM ========================================================= */ function loadConfigurationForm() { document.getElementById( "configTitle" ).value = appState.config.title; document.getElementById( "configInstruction" ).value = appState.config.instruction; 
    renderThemeSelector();
    document.getElementById( "configLetterDelay" ).value = appState.config.letterDelay; document.getElementById( "configImageDelay" ).value = appState.config.imageDelay; document.getElementById( "configSound" ).checked = appState.config.soundEnabled;
    document.getElementById( "configCustomAudio" ).checked = appState.config.customAudioEnabled !== false;
    document.getElementById( "configKidPin" ).value = appState.config.kidPin || "1234";
    document.getElementById( "configKidPinEnabled" ).checked = appState.config.kidPinEnabled !== false;
    document.getElementById( "configLockDelay" ).value = appState.config.lockDelay !== undefined ? appState.config.lockDelay : 500;
    document.getElementById( "configKeyboardListener" ).checked = appState.config.keyboardListener !== false;
    document.getElementById( "configMaxAudioDuration" ).value = appState.config.maxAudioDuration !== undefined ? appState.config.maxAudioDuration : 3;
    document.getElementById( "configBingSearch" ).checked = appState.config.bingSearchEnabled === true;
    document.getElementById( "configBubbleCount" ).value = appState.config.bubbleCount !== undefined ? appState.config.bubbleCount : 5;
    document.getElementById( "configBubbleSpeed" ).value = appState.config.bubbleSpeed || 'normal';
    document.getElementById( "configImagePopDuration" ).value = appState.config.imagePopDuration !== undefined ? appState.config.imagePopDuration : 1.0;
} document.getElementById( "saveConfigButton" ) .addEventListener( "click", () => { appState.config.title = document.getElementById( "configTitle" ) .value .trim() || "Alphabets Adventure"; appState.config.instruction = document.getElementById( "configInstruction" ) .value .trim() || "Tap on a letter to hear its sound and discover a word!"; appState.config.letterDelay = Number( document.getElementById( "configLetterDelay" ) .value ) || 600; appState.config.imageDelay = Number( document.getElementById( "configImageDelay" ) .value ) || 800; appState.config.soundEnabled = document.getElementById( "configSound" ) .checked;
    appState.config.customAudioEnabled = document.getElementById( "configCustomAudio" ).checked;
    appState.config.kidPin = document.getElementById( "configKidPin" ).value.trim() || "1234";
    appState.config.kidPinEnabled = document.getElementById( "configKidPinEnabled" ).checked;
    appState.config.lockDelay = Number( document.getElementById( "configLockDelay" ).value ) || 500;
    appState.config.keyboardListener = document.getElementById( "configKeyboardListener" ).checked;
    appState.config.maxAudioDuration = Number( document.getElementById( "configMaxAudioDuration" ).value ) || 3;
    appState.config.bingSearchEnabled = document.getElementById( "configBingSearch" ).checked;
    appState.config.bubbleCount = Number( document.getElementById( "configBubbleCount" ).value );
    appState.config.bubbleSpeed = document.getElementById( "configBubbleSpeed" ).value;
    appState.config.imagePopDuration = Number( document.getElementById( "configImagePopDuration" ).value ) || 1.0;
    saveState(); applyConfiguration(); 
    if (typeof updateMuteButtonIcon === 'function') updateMuteButtonIcon();
    showToast( "Configuration saved!" ); } );

function pickNewBubbleGameLetter() {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    window.bubbleGameTargetLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    const display = document.getElementById('bubbleTargetLetterDisplay');
    if (display) display.textContent = window.bubbleGameTargetLetter;
    // Respawn all bubbles so they get the new target letter occasionally
    applyConfiguration();
}

const practiceBtn = document.getElementById('bubbleLetterPracticeBtn');
if (practiceBtn) {
    practiceBtn.addEventListener('click', function(e) {
        window.bubbleGameLetterPractice = !window.bubbleGameLetterPractice;
        const display = document.getElementById('bubbleTargetLetterDisplay');
        if (window.bubbleGameLetterPractice) {
            practiceBtn.style.background = 'var(--primary)';
            practiceBtn.style.color = 'white';
            practiceBtn.style.borderColor = 'var(--secondary)';
            practiceBtn.style.transform = 'scale(1.1)';
            display.style.display = 'flex';
            pickNewBubbleGameLetter();
        } else {
            practiceBtn.style.background = 'white';
            practiceBtn.style.color = '#aaa';
            practiceBtn.style.borderColor = '#ddd';
            practiceBtn.style.transform = 'scale(1)';
            display.style.display = 'none';
            applyConfiguration();
        }
    });
}

function showBubbleGameView() {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const view = document.getElementById("bubbleGameView");
    if (view) view.classList.add("active");
    document.getElementById("backHomeBtn").style.display = "inline-flex";
    
    window.isBubbleGameActive = true;
    
    // Sync UI with state
    const practiceBtn = document.getElementById('bubbleLetterPracticeBtn');
    const display = document.getElementById('bubbleTargetLetterDisplay');
    if (window.bubbleGameLetterPractice) {
        if (practiceBtn) {
            practiceBtn.style.background = 'var(--primary)';
            practiceBtn.style.color = 'white';
            practiceBtn.style.borderColor = 'var(--secondary)';
            practiceBtn.style.transform = 'scale(1.1)';
        }
        if (display) display.style.display = 'flex';
        pickNewBubbleGameLetter();
    } else {
        if (practiceBtn) {
            practiceBtn.style.background = 'white';
            practiceBtn.style.color = '#aaa';
            practiceBtn.style.borderColor = '#ddd';
            practiceBtn.style.transform = 'scale(1)';
        }
        if (display) display.style.display = 'none';
        applyConfiguration(); // Refresh bubbles
    }
}

document.getElementById("btnReplaceAllAudio").addEventListener("click", () => {
    let replacedCount = 0;
    appState.words.forEach(wordObj => {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(wordObj.word.toLowerCase())}&tl=en&client=tw-ob`;
        if (wordObj.audioUrl !== url) {
            wordObj.audioUrl = url;
            replacedCount++;
        }
    });
    if (replacedCount > 0) {
        saveState();
        if (typeof renderWordTable === "function") renderWordTable();
        showToast(`Replaced audio for ${replacedCount} words!`);
    } else {
        showToast("All words already have Google TTS URLs.");
    }
});

/* ========================================================= JSON EXPORT ========================================================= */ document.getElementById( "downloadJsonButton" ) .addEventListener( "click", () => { downloadFile( JSON.stringify( appState, null, 2 ), "alphabet-adventure-backup.json", "application/json" ); showToast( "JSON backup downloaded!" ); } ); /* ========================================================= JSON IMPORT ========================================================= */ document.getElementById( "importJsonButton" ) .addEventListener( "click", () => { document.getElementById( "importJsonInput" ) .click(); } ); document.getElementById( "importJsonInput" ) .addEventListener( "change", event => { const file = event.target.files[0]; if (!file) { return; } const reader = new FileReader(); reader.onload = loadEvent => { try { const data = JSON.parse( loadEvent.target.result );
        if ( !data.words || !data.categories || !data.config ) {
            throw new Error( "Invalid file" );
        }
        if (!data.stories) {
            data.stories = structuredClone(DEFAULT_STORIES);
        }
        
        // Migration and dedup
        const migratedWords = [];
        const seenWords = new Set();
        data.words.forEach(w => {
            const wordUpper = w.word.toUpperCase();
            if (!seenWords.has(wordUpper)) {
                seenWords.add(wordUpper);
                if (typeof w.category === 'string') {
                    if (w.category === 'mixed') {
                        w.categories = [];
                    } else {
                        w.categories = [w.category];
                    }
                    delete w.category;
                }
                w.categories = (w.categories || []).filter(c => c !== 'mixed');
                migratedWords.push(w);
            }
        });
        data.words = migratedWords;

        appState = data; saveState(); renderAllSettings(); renderCategoryButtons(); applyConfiguration(); showToast( "Backup imported!" ); } catch (error) { console.error(error); } }; reader.readAsText( file ); } ); /* ========================================================= RESET ========================================================= */ document.getElementById( "resetAppButton" ) .addEventListener( "click", () => { const confirmed = confirm( "This will permanently reset all local changes. Continue?" ); if (!confirmed) { return; } appState = createDefaultState(); currentCategory = "all"; currentLetter = "a"; saveState(); applyConfiguration(); renderAllSettings(); renderCategoryButtons(); showToast( "Application reset." ); } ); /* ========================================================= DOWNLOAD FILE ========================================================= */ function downloadFile( content, fileName, mimeType ) { const blob = new Blob( [content], { type: mimeType } ); const url = URL.createObjectURL( blob ); const link = document.createElement( "a" ); link.href = url; link.download = fileName; document.body.appendChild( link ); link.click(); document.body.removeChild( link ); setTimeout( () => { URL.revokeObjectURL( url ); }, 1000 ); } /* ========================================================= HTML EXPORT The generated application contains: - Current data - Current configuration - Categories Because this is a self-contained application, the current page HTML can be exported directly. The exported page starts with the embedded application state. ========================================================= */ if (document.getElementById("downloadAppButton")) { document.getElementById("downloadAppButton").addEventListener("click", () => { const currentDocument = document.documentElement.outerHTML; /* * Embed state into the exported file. * The exported file will restore this state * into localStorage when opened. */ const stateScript = `
<script>
localStorage.setItem(
    ${JSON.stringify(STORAGE_KEY)},
    ${JSON.stringify(JSON.stringify(appState))}
);
<\/script>
`;

    const finalHtml = currentDocument.replace('</bo' + 'dy>', stateScript + '\n</bo' + 'dy>');

    if (window.showSaveFilePicker) {
        window.showSaveFilePicker({
            suggestedName: 'alphabet-adventure-custom.html',
            types: [{
                description: 'HTML Document',
                accept: { 'text/html': ['.html'] },
            }],
        }).then(async handle => {
            const writable = await handle.createWritable();
            await writable.write("<!DOCTYPE html>\n" + finalHtml);
            await writable.close();
            showToast("Saved to file successfully!");
        }).catch(err => {
            if (err.name !== 'AbortError') {
                downloadFile(
                    "<!DOCTYPE html>\n" + finalHtml,
                    "alphabet-adventure-custom.html",
                    "text/html"
                );
                showToast("Custom HTML app downloaded!");
            }
        });
    } else {
        downloadFile(
            "<!DOCTYPE html>\n" + finalHtml,
            "alphabet-adventure-custom.html",
            "text/html"
        );
        showToast("Custom HTML app downloaded!");
    }
}); } /* end if */

/* =========================================================
INITIALIZATION
========================================================= */
var virtualKeyboard = document.getElementById("virtualKeyboard");
function renderVirtualKeyboard() {
    if (!virtualKeyboard) return;
    virtualKeyboard.innerHTML = "";
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    letters.forEach(letter => {
        const btn = document.createElement("button");
        btn.className = "key-button";
        btn.textContent = letter;
        btn.addEventListener("pointerdown", (e) => {
            e.preventDefault(); // Prevents simulated mouse events and double firing
            handleKeyPress(letter.toLowerCase(), true);
        });
        virtualKeyboard.appendChild(btn);
    });
}
renderVirtualKeyboard();


/* =========================================================
   KID MODE (FULLSCREEN LOCK)
========================================================= */
var isKidMode = false;
var fullscreenElement = document.documentElement;

function enterKidMode() {
    isKidMode = true;
    if (fullscreenElement.requestFullscreen) {
        fullscreenElement.requestFullscreen().catch(e => console.log(e));
    } else if (fullscreenElement.webkitRequestFullscreen) { /* Safari */
        fullscreenElement.webkitRequestFullscreen();
    } else if (fullscreenElement.msRequestFullscreen) { /* IE11 */
        fullscreenElement.msRequestFullscreen();
    }
    const kidModeBtn = document.getElementById("kidModeButton");
    if (kidModeBtn) kidModeBtn.style.display = "none";
    
    const storyKidModeBtn = document.getElementById("storyKidModeBtn");
    if (storyKidModeBtn) storyKidModeBtn.style.display = "none";
    
    const settingsBtn = document.getElementById("settingsButton");
    if (settingsBtn) settingsBtn.style.display = "none";
    
    const appHeader = document.querySelector(".app-header");
    if (appHeader) appHeader.style.display = "none";
    
    const kidMute = document.getElementById("kidModeMuteBtn");
    if (kidMute) kidMute.style.display = "block";
    
    // Trap back button
    history.pushState({kidMode: true}, ""); 
    showToast("Kid Mode Activated!");
}

if (document.getElementById("storyKidModeBtn")) {
    document.getElementById("storyKidModeBtn").addEventListener("click", enterKidMode);
}

function exitKidMode() {
    isKidMode = false;
    document.getElementById("pinModal").classList.remove("active");
    
    const kidModeBtn = document.getElementById("kidModeButton");
    if (kidModeBtn) kidModeBtn.style.display = "inline-flex";
    
    const storyKidModeBtn = document.getElementById("storyKidModeBtn");
    if (storyKidModeBtn) storyKidModeBtn.style.display = "inline-flex";
    if(gameView.classList.contains("active")) {
        const settingsBtn = document.getElementById("settingsButton");
        if (settingsBtn) settingsBtn.style.display = "inline-block";
    }
    
    const appHeader = document.querySelector(".app-header");
    if (appHeader) appHeader.style.display = "flex";
    
    const kidMute = document.getElementById("kidModeMuteBtn");
    if (kidMute) kidMute.style.display = "none";
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(e => console.log(e));
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
    showToast("Kid Mode Exited");
}

function attemptExitKidMode() {
    if (appState.config.kidPinEnabled === false) {
        exitKidMode();
        return;
    }
    document.getElementById("pinInput").value = "";
    document.getElementById("pinError").style.display = "none";
    document.getElementById("pinModal").classList.add("active");
}

function cancelPinLock() {
    document.getElementById("pinModal").classList.remove("active");
    if (isKidMode) {
        history.pushState({kidMode: true}, "");
        if (fullscreenElement.requestFullscreen) {
            fullscreenElement.requestFullscreen().catch(e => console.log(e));
        } else if (fullscreenElement.webkitRequestFullscreen) {
            fullscreenElement.webkitRequestFullscreen();
        } else if (fullscreenElement.msRequestFullscreen) {
            fullscreenElement.msRequestFullscreen();
        }
    }
}

document.getElementById("submitPinBtn").addEventListener("click", () => {
    if (document.getElementById("pinInput").value === (appState.config.kidPin || "1234")) {
        exitKidMode();
    } else {
        document.getElementById("pinError").style.display = "block";
    }
});

document.getElementById("pinModal").addEventListener("pointerdown", (e) => {
    if (e.target.id === "pinModal") {
        cancelPinLock();
    }
});


document.getElementById("cancelPinBtn").addEventListener("click", cancelPinLock);

window.addEventListener("popstate", (e) => {
    if (isKidMode) {
        attemptExitKidMode();
    }
});

document.addEventListener("fullscreenchange", () => {
    if (isKidMode && !document.fullscreenElement) {
        attemptExitKidMode();
    }
});
document.addEventListener("webkitfullscreenchange", () => {
    if (isKidMode && !document.webkitFullscreenElement) {
        attemptExitKidMode();
    }
});









currentLetterBadge.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (typeof playLetter === "function") {
        playLetter(currentLetter);
    }
});
document.getElementById("instruction").addEventListener("pointerdown", (e) => {
    if (e.target === document.getElementById("instruction")) {
        if (typeof playLetter === "function") {
            playLetter(currentLetter);
        }
    }
});

/* =========================================================
   FORCE UPDATE
========================================================= */
document.getElementById("forceUpdateButton").addEventListener("click", async () => {
    showToast("Checking for updates...");
    try {
        let baseUrl = window.location.href;
        if (baseUrl.endsWith('.html')) baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
        else if (!baseUrl.endsWith('/')) baseUrl += '/';
        const jsonUrl = new URL('alphabet-adventure-backup4.json', baseUrl).href + '?t=' + new Date().getTime();
        
        const response = await fetch(jsonUrl);
        if (response.ok) {
            const data = await response.json();
            const newWords = [];
            for (let word of data.words) {
                if (!appState.words.find(w => w.id === word.id)) {
                    newWords.push(word);
                    appState.words.push(word);
                }
            }
            if (newWords.length > 0) {
                await window.appDB.saveFullState(appState);
                localStorage.setItem("updateDeltaWords", JSON.stringify(newWords));
            }
        }
        
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
            }
        }
        
        window.location.reload(true);
    } catch (e) {
        console.error("Force update failed", e);
        showToast("Update failed or you are offline.");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const deltaStr = localStorage.getItem("updateDeltaWords");
    if (deltaStr) {
        try {
            const newWords = JSON.parse(deltaStr);
            if (newWords && newWords.length > 0) {
                const list = document.getElementById("deltaWordsList");
                list.innerHTML = "";
                newWords.forEach(w => {
                    const li = document.createElement("li");
                    li.textContent = `${w.letter.toUpperCase()} - ${w.word}`;
                    li.style.marginBottom = "5px";
                    list.appendChild(li);
                });
                document.getElementById("deltaModal").classList.add("active");
            }
        } catch (e) {}
        localStorage.removeItem("updateDeltaWords");
    }
});

document.getElementById("closeDeltaModal").addEventListener("click", () => {
    document.getElementById("deltaModal").classList.remove("active");
});

/* =========================================================
   MUTE BUTTON
========================================================= */
function updateMuteButtonIcon() {
    const btn = document.getElementById("muteBtn");
    const storyBtn = document.getElementById("storyMuteBtn");
    const kidBtn = document.getElementById("kidModeMuteBtn");
    const html = appState.config.soundEnabled 
        ? '<span class="material-icons" style="vertical-align: middle;">volume_up</span>' 
        : '<span class="material-icons" style="vertical-align: middle;">volume_off</span>';
    if (btn) btn.innerHTML = html;
    if (storyBtn) storyBtn.innerHTML = html;
    if (kidBtn) kidBtn.innerHTML = html;
}

function toggleMute() {
    appState.config.soundEnabled = !appState.config.soundEnabled;
    updateMuteButtonIcon();
    saveState();
    
    // Also update the checkbox in Settings to keep it in sync
    const settingsCheckbox = document.getElementById("configSound");
    if (settingsCheckbox) {
        settingsCheckbox.checked = appState.config.soundEnabled;
    }

    if (appState.config.soundEnabled) {
        showToast("Sound Unmuted");
        // Only play letter if not in story mode
        if (typeof playLetter === "function" && document.getElementById("gameView").classList.contains("active")) {
            playLetter(currentLetter);
        }
    } else {
        showToast("Sound Muted");
    }
}

if (document.getElementById("storyMuteBtn")) {
    document.getElementById("storyMuteBtn").addEventListener("click", toggleMute);
}
if (document.getElementById("kidModeMuteBtn")) {
    document.getElementById("kidModeMuteBtn").addEventListener("click", toggleMute);
}

window.openArrangeModal = function() {
    document.getElementById("storyArrangeModal").classList.add("active");
    renderStoryArrangeGrid();
};

window.closeArrangeModal = function() {
    document.getElementById("storyArrangeModal").classList.remove("active");
    renderStorySelectedPreview(); // re-render the mini preview
};

function renderStoryArrangeGrid() {
    const container = document.getElementById("storyArrangeGrid");
    container.innerHTML = "";
    
    if (selectedStoryWordIds.length === 0) {
        container.innerHTML = `<span style="color: var(--muted); grid-column: 1 / -1;">No words in the sequence to arrange.</span>`;
        return;
    }
    
    selectedStoryWordIds.forEach((wordId, index) => {
        const wordObj = appState.words.find(w => w.id === wordId);
        if (!wordObj) return;
        
        const card = document.createElement("div");
        card.style.cssText = "position: relative; width: 100%; height: 130px; border-radius: 12px; overflow: hidden; border: 3px solid var(--primary); display: flex; flex-direction: column; background: white; user-select: none; cursor: grab;";
        
        let visualHtml = wordObj.imageUrl 
            ? `<img src="${escapeHtml(wordObj.imageUrl)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.outerHTML='<div style=\\'font-size: 3rem;\\'>${escapeHtml(wordObj.fallback || '❓')}</div>'">` 
            : `<div style="font-size: 3rem;">${escapeHtml(wordObj.fallback || "❓")}</div>`;

        card.innerHTML = `
            <div style="position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; width: 24px; height: 24px; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; z-index: 2; font-weight: bold;">${index + 1}</div>
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden;">${visualHtml}</div>
            <div style="background: rgba(255,255,255,0.9); font-size: 1rem; text-align: center; font-weight: bold; padding: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; position: absolute; bottom: 0; width: 100%; border-top: 1px solid rgba(0,0,0,0.1);">${escapeHtml(wordObj.word)}</div>
        `;
        
        card.draggable = true;
        
        card.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", index);
            e.dataTransfer.effectAllowed = "move";
            card.style.opacity = "0.5";
        });
        
        card.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            card.style.borderColor = "var(--success)";
        });
        
        card.addEventListener("dragleave", () => {
            card.style.borderColor = "var(--primary)";
        });
        
        card.addEventListener("drop", (e) => {
            e.preventDefault();
            const draggedIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
            if (!isNaN(draggedIndex) && draggedIndex !== index) {
                const item = selectedStoryWordIds.splice(draggedIndex, 1)[0];
                selectedStoryWordIds.splice(index, 0, item);
                renderStoryArrangeGrid();
            }
        });
        
        card.addEventListener("dragend", () => {
            card.style.opacity = "1";
            card.style.borderColor = "var(--primary)";
        });
        
        container.appendChild(card);
    });
}

function renderThemeSelector() {
    const APP_THEMES = [
        { name: "Ocean Explorer", primary: "#0ea5e9", secondary: "#e0f2fe" },
        { name: "Forest Friend", primary: "#22c55e", secondary: "#dcfce7" },
        { name: "Sunny Day", primary: "#f59e0b", secondary: "#fef3c7" },
        { name: "Berry Sweet", primary: "#ec4899", secondary: "#fce7f3" },
        { name: "Grape Vine", primary: "#8b5cf6", secondary: "#ede9fe" },
        { name: "Cherry Red", primary: "#ef4444", secondary: "#fee2e2" },
        { name: "Minty Fresh", primary: "#14b8a6", secondary: "#ccfbf1" },
        { name: "Sunset Glow", primary: "#f97316", secondary: "#ffedd5" },
        { name: "Magic Indigo", primary: "#6366f1", secondary: "#e0e7ff" },
        { name: "Bubblegum", primary: "#f43f5e", secondary: "#ffe4e6" }
    ];
    
    const container = document.getElementById("themeSelectionContainer");
    if (!container) return;
    container.innerHTML = "";
    
    APP_THEMES.forEach(theme => {
        const btn = document.createElement("div");
        const isActive = (appState.config.primary === theme.primary && appState.config.secondary === theme.secondary);
        
        btn.style.cssText = `
            border: 3px solid ${isActive ? 'var(--text)' : 'transparent'};
            border-radius: 12px;
            padding: 8px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            background: #fff;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            transition: 0.2s;
        `;
        
        btn.innerHTML = `
            <div style="width: 100%; height: 40px; border-radius: 6px; display: flex; overflow: hidden;">
                <div style="flex: 1; background: ${theme.primary};"></div>
                <div style="flex: 1; background: ${theme.secondary};"></div>
            </div>
            <span style="font-size: 0.85rem; font-weight: bold; text-align: center;">${theme.name}</span>
        `;
        
        btn.onclick = () => {
            appState.config.primary = theme.primary;
            appState.config.secondary = theme.secondary;
            renderThemeSelector();
            applyConfiguration();
            saveState(); // Ensure theme choice is saved immediately
        };
        
        container.appendChild(btn);
    });
}
