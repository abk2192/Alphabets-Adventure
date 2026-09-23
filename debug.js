window.spawnBubble = function(isRespawn = false, forceTargetOverride = false) {
    const bgContainer = document.querySelector('.background-decoration');
    if (!bgContainer) return;
    
    // Safety check so we don't spawn infinitely if not needed
    const currentBubbles = bgContainer.querySelectorAll('.bubble:not(.popped)').length;
    const maxBubbles = appState.config.bubbleCount !== undefined ? appState.config.bubbleCount : 5;
    if (isRespawn && !forceTargetOverride && currentBubbles >= maxBubbles) return;
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    let preloadedWord = null;
    let isTarget = false;
    let randomLetter = null;
    
    if (window.isBubbleGameActive) {
        if (window.bubbleGameLetterPractice) {
            bubble.classList.add('has-letter');
            
            let forceTarget = forceTargetOverride;
            let targetCount = 0;
            if (window.bubbleGameTargetLetter) {
                targetCount = Array.from(bgContainer.querySelectorAll('.bubble:not(.popped)')).filter(b => b.dataset.letter === window.bubbleGameTargetLetter).length;
                if (targetCount === 0) forceTarget = true;
            }
            
            if (window.bubbleGameTargetLetter && (forceTarget || (Math.random() < 0.3 && targetCount < 2))) {
                isTarget = true;
                bubble.textContent = window.bubbleGameTargetLetter;
                bubble.dataset.letter = window.bubbleGameTargetLetter;
                const matching = appState.words.filter(w => w.letter.toUpperCase() === window.bubbleGameTargetLetter);
                if (matching.length > 0) preloadedWord = matching[Math.floor(Math.random() * matching.length)];
            } else {
                const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                randomLetter = window.bubbleGameTargetLetter;
                while (randomLetter === window.bubbleGameTargetLetter) {
                    randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
                }
                bubble.textContent = randomLetter;
                bubble.dataset.letter = randomLetter;
            }
        } else {
            if (appState.words.length > 0) {
                preloadedWord = appState.words[Math.floor(Math.random() * appState.words.length)];
            }
        }
    }
    
    // Determine size: Target letters are always the biggest (180px - 260px)
    // Non-target letters are smaller (60px - 140px)
    let size;
    if (isTarget) {
        size = Math.floor(Math.random() * 80) + 180;
    } else {
        size = Math.floor(Math.random() * 80) + 60;
    }
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    if (window.isBubbleGameActive && window.bubbleGameLetterPractice) {
        bubble.style.fontSize = `${size * 0.5}px`;
    }
    
    if (Math.random() < 0.7) {
        bubble.style.left = `${10 + Math.random() * 75}%`;
        bubble.style.top = `${10 + Math.random() * 75}%`;
    } else {
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { // top
            bubble.style.left = `${Math.random() * 100}%`;
            bubble.style.top = `-10%`;
        } else if (edge === 1) { // right
            bubble.style.left = `100%`;
            bubble.style.top = `${Math.random() * 100}%`;
        } else if (edge === 2) { // bottom
            bubble.style.left = `${Math.random() * 100}%`;
            bubble.style.top = `100%`;
        } else { // left
            bubble.style.left = `-10%`;
            bubble.style.top = `${Math.random() * 100}%`;
        }
    }
    
    // Since animation is now forwards, we shouldn't use negative delay for respawns 
    // unless it's initial load to desync them. 
    if (!isRespawn) {
        bubble.style.animationDelay = `-${Math.random() * 12}s`;
    } else {
        bubble.style.animationDelay = `0s`;
    }
    bubble.style.animationDuration = `${getBubbleDuration()}s`;
    
    // When animation ends, bubble has fully faded out. Remove and spawn a new one!
    bubble.addEventListener('animationend', (e) => {
        if (e.animationName === 'floatBubble') {
            if (bubble.parentNode) bubble.remove();
            if (window.isBubbleGameActive) {
                // If it was the target letter that just naturally left, force spawn a replacement!
                window.spawnBubble(true, isTarget); 
            } else {
                window.spawnBubble(true);
            }
        }
    });
        
        if (preloadedWord) {
            bubble.dataset.wordId = preloadedWord.id;
            const cacheUrl = localStorage.getItem(`img_${preloadedWord.id}`);
            const urlToLoad = cacheUrl || preloadedWord.imageUrl || preloadedWord.url;
            if (urlToLoad && urlToLoad !== 'undefined' && urlToLoad !== window.location.href && !urlToLoad.endsWith('/')) {
                const img = new Image();
                img.src = urlToLoad;
            }
        }
    }
    
    bgContainer.appendChild(bubble);
};

// Global listener to pop background bubbles even if they are behind other elements
document.addEventListener('click', function(e) {
