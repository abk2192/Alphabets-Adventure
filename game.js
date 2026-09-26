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
} 

/* ========================================================= SHOW MISSING LETTER ========================================================= */ 
function showMissingLetter(letter) { 
    wordContainer.innerHTML = ""; 
    imageArea.innerHTML = ""; 
    const message = document.createElement("div"); 
    message.className = "fallback"; 
    message.innerHTML = ` <div class="fallback-icon"> ❓ </div> <div class="fallback-text"> No word for ${letter.toUpperCase()} in this category yet. </div> `; 
    imageArea.appendChild(message); 
} 

/* ========================================================= SOUND ========================================================= */

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
    if (!appState.config.soundEnabled) return;

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
    if (keyboardLocked) return; 
    
    // Only process key presses if the game view is active
    const gameViewEl = document.getElementById('gameView');
    if (gameViewEl && !gameViewEl.classList.contains('active')) {
        return;
    }

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

        // ── Letter Bubble Game keyboard handler ──────────────────────────
        const bubbleViewEl = document.getElementById('bubbleGameView');
        const inBubbleGame = bubbleViewEl && bubbleViewEl.classList.contains('active')
                          && window.isBubbleGameActive && window.bubbleGameLetterPractice;
        if (inBubbleGame) {
            handleBubbleKeyPress(key.toUpperCase());
            return;
        }

        handleKeyPress( key ); 
    } 
} );

/**
 * Handle a keyboard letter press while in letter-bubble game mode.
 * Correct key  → find the target bubble and pop it programmatically.
 * Wrong key    → play a soft "miss" beep and briefly shake the target display.
 */
function handleBubbleKeyPress(pressedLetter) {
    const targetLetter = window.bubbleGameTargetLetter;
    if (!targetLetter) return;

    if (pressedLetter === targetLetter) {
        // ── Correct! Find the target bubble and pop it ───────────────────
        const bgContainer = document.querySelector('.background-decoration');
        if (!bgContainer) return;

        const targetBubble = Array.from(
            bgContainer.querySelectorAll('.bubble:not(.popped)')
        ).find(b => b.dataset.letter === targetLetter);

        if (targetBubble) {
            // Simulate the same pop logic used by the click handler:
            // synthesise a click at the bubble's centre so the existing
            // async pop handler runs exactly once with all its side-effects.
            const rect = targetBubble.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            // PointerEvent is more reliable than MouseEvent for the hit-test
            targetBubble.dispatchEvent(new MouseEvent('click', {
                bubbles: true, cancelable: true,
                clientX: cx, clientY: cy
            }));
        } else {
            // No target bubble visible yet — still advance to next letter
            setTimeout(() => { if (typeof pickNewBubbleGameLetter === 'function') pickNewBubbleGameLetter(); }, 300);
        }

        // Flash the target-letter display green as feedback
        const display = document.getElementById('bubbleTargetLetterDisplay');
        if (display) {
            const prevColor = display.style.color;
            display.style.color = '#4ecdc4';
            display.style.transform = 'scale(1.25)';
            display.style.transition = 'transform 0.15s ease, color 0.15s ease';
            setTimeout(() => {
                display.style.color = prevColor;
                display.style.transform = 'scale(1)';
            }, 350);
        }

    } else {
        // ── Wrong key — soft miss sound + shake ──────────────────────────
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        } catch(e) {}

        // Briefly shake the target display to indicate wrong answer
        const display = document.getElementById('bubbleTargetLetterDisplay');
        if (display) {
            display.style.animation = 'bubbleKeyMiss 0.35s ease';
            display.addEventListener('animationend', () => {
                display.style.animation = '';
            }, { once: true });
        }
    }
} 
document.querySelectorAll(".key-button").forEach(btn => {
    btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        handleKeyPress(btn.textContent.toLowerCase(), true);
    });
});

