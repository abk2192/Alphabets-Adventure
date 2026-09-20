/* ========================================================= PLAY LETTER ========================================================= */ 
function playLetter(letter) { 
    currentLetter = letter; 
    currentLetterBadge.textContent = letter.toUpperCase(); 

    if (typeof gameMode !== 'undefined' && gameMode === 'multi') {
        const allData = getAllWordsForLetter(letter, currentCategory);
        if (allData.length === 0) {
            showMissingLetter(letter);
            return;
        }
        showMultiModeGrid(allData, letter);
    } else {
        const data = getWordForLetter( letter, currentCategory ); 
        if (!data) { 
            showMissingLetter( letter ); 
            return; 
        } 
        showSingleImageFromMulti(data);
    }
} /* ========================================================= SHOW MISSING LETTER ========================================================= */ function showMissingLetter(letter) { wordContainer.innerHTML = ""; imageArea.innerHTML = ""; const message = document.createElement( "div" ); message.className = "fallback"; message.innerHTML = ` <div class="fallback-icon"> ❓ </div> <div class="fallback-text"> No word for ${letter.toUpperCase()} in this category yet. </div> `; imageArea.appendChild( message ); } /* ========================================================= IMAGE DISPLAY ========================================================= */ function showWordImage(data) { imageArea.innerHTML = ""; const wrapper = document.createElement( "div" ); wrapper.className = "image-wrapper"; /* * No image URL means * immediate fallback. */ if ( !data.imageUrl ) { showFallback( wrapper, data ); imageArea.appendChild( wrapper ); playSound(data); return; } const image = document.createElement( "img" ); image.className = "word-image"; image.src = data.imageUrl; image.alt = data.word; image.addEventListener( "error", () => { showFallback( wrapper, data ); }, { once: true } ); wrapper.appendChild( image ); imageArea.appendChild( wrapper ); playSound(data); } /* ========================================================= FALLBACK ========================================================= */ function showFallback( wrapper, data ) { wrapper.innerHTML = ""; const fallback = document.createElement( "div" ); fallback.className = "fallback"; const icon = document.createElement( "div" ); icon.className = "fallback-icon"; icon.textContent = data.fallback || "❓"; const text = document.createElement( "div" ); text.className = "fallback-text"; text.textContent = data.word; fallback.appendChild( icon ); fallback.appendChild( text ); wrapper.appendChild( fallback ); } /* ========================================================= SOUND ========================================================= */ 
var audioCache = {};
var currentlyPlayingAudio = null;
var currentAudioTimeout = null;

function stopCurrentAudio() {
    if (currentAudioTimeout) {
        clearTimeout(currentAudioTimeout);
        currentAudioTimeout = null;
    }
    if (currentlyPlayingAudio) {
        currentlyPlayingAudio.pause();
        currentlyPlayingAudio.currentTime = 0;
        currentlyPlayingAudio = null;
    }
}

async function playSound(data) {
    if (appState.config.customAudioEnabled === false || !data) {
        playSyntheticSound();
        return;
    }
    
    let url = data.audioUrl;
    
    try {
        if (!url) {
            const cacheKey = "dynamic_url_" + data.word;
            if (audioCache[cacheKey]) {
                url = audioCache[cacheKey];
            } else {
                url = await getAnimalAudioUrl(data.word.toLowerCase());
                audioCache[cacheKey] = url;
            }
            if (data.id) {
                data.audioUrl = url;
                saveState();
                if (typeof renderWordTable === "function") {
                    renderWordTable();
                }
            }
        }
        
        if (!audioCache[url]) {
            audioCache[url] = new Audio(url);
        }
        
        stopCurrentAudio();
        
        currentlyPlayingAudio = audioCache[url];
        currentlyPlayingAudio.currentTime = 0;
        currentlyPlayingAudio.play().then(() => {
            const maxDur = (appState.config.maxAudioDuration !== undefined ? appState.config.maxAudioDuration : 3) * 1000;
            currentAudioTimeout = setTimeout(() => {
                if (currentlyPlayingAudio === audioCache[url]) {
                    stopCurrentAudio();
                }
            }, maxDur);
        }).catch(e => {
            console.log("Audio playback failed:", e);
            playSyntheticSound();
        });
    } catch(e) {
        console.log("Audio error:", e);
        playSyntheticSound();
    }
}

function playSyntheticSound() {
    stopCurrentAudio();
    if ( !appState.config.soundEnabled ) { return; } 
    try { 
        if ( !audioContext ) { audioContext = new ( window.AudioContext || window.webkitAudioContext )(); } 
        const oscillator = audioContext.createOscillator(); 
        const gain = audioContext.createGain(); 
        oscillator.connect( gain ); 
        gain.connect( audioContext.destination ); 
        oscillator.frequency.value = 700; 
        oscillator.type = "sine"; 
        gain.gain.setValueAtTime( 0.12, audioContext.currentTime ); 
        gain.gain.exponentialRampToValueAtTime( 0.001, audioContext.currentTime + 0.25 ); 
        oscillator.start(); oscillator.stop( audioContext.currentTime + 0.25 ); 
    } catch (error) { 
        console.log( "Audio unavailable" ); 
    } 
}

/* ========================================================= KEYBOARD ========================================================= */ 
var keyboardLocked = false; 
function handleKeyPress(key, fromVirtual = false) { 
    if (!fromVirtual && appState.config.keyboardListener === false) return;
    if (keyboardLocked) return; 
    keyboardLocked = true; 
    
    const lockTime = appState.config.lockDelay !== undefined ? appState.config.lockDelay : 500;
    
    const vKeys = document.querySelectorAll('.key-button');
    let pressedVKey = null;
    vKeys.forEach(btn => {
        if (btn.textContent.toLowerCase() === key) {
            btn.classList.add('locked-key');
            pressedVKey = btn;
        }
    });

    setTimeout(() => { 
        keyboardLocked = false; 
        if (pressedVKey) pressedVKey.classList.remove('locked-key');
    }, lockTime); 
    playLetter(key); 
} 
document.addEventListener( "keydown", event => { 
    const target = event.target; 
    if ( target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" ) { return; } 
    const key = event.key.toLowerCase(); 
    if ( /^[a-z]$/.test( key ) ) { 
        event.preventDefault(); 
        handleKeyPress( key ); 
    } 
} ); 
document.querySelectorAll(".key-button").forEach(btn => {
    btn.addEventListener("click", () => {
        handleKeyPress(btn.textContent.toLowerCase(), true);
    });
});

