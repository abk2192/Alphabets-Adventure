/**
 * Reusable UI Components for Alphabets Adventure
 */

class WordCardComponent {
    /**
     * Renders a word card into the given containers.
     * @param {HTMLElement} wordContainerElement 
     * @param {HTMLElement} imageAreaElement 
     * @param {Object} wordData - { word: string, imageUrl: string, fallback: string, audioUrl: string }
     * @param {Object} options - { onImageLoaded: Function, onImageError: Function, letterDelay: number, imageDelay: number, onLetterClick: Function }
     */
    static render(wordContainerElement, imageAreaElement, wordData, options = {}) {
        if (!wordContainerElement || !imageAreaElement || !wordData || !wordData.word) return;

        const letterDelay = options.letterDelay !== undefined ? options.letterDelay : 180;
        const imageDelay = options.imageDelay !== undefined ? options.imageDelay : 0;

        // Render word
        wordContainerElement.innerHTML = "";
        
        const words = wordData.word.split(" ");
        let globalLetterIndex = 0;
        
        words.forEach((wordStr) => {
            const wordGroup = document.createElement("div");
            wordGroup.style.display = "flex";
            wordGroup.style.gap = "6px";
            wordGroup.style.flexWrap = "wrap";
            wordGroup.style.justifyContent = "center";
            
            const characters = wordStr.split("");
            characters.forEach((character) => {
                const element = document.createElement("span");
                element.className = "animated-letter";
                if (globalLetterIndex === 0) {
                    element.classList.add("first-letter");
                }
                element.style.animationDelay = (globalLetterIndex * letterDelay) + "ms";
                element.textContent = character;
                
                if (options.onLetterClick && /^[a-zA-Z]$/.test(character)) {
                    element.style.cursor = "pointer";
                    element.addEventListener("pointerdown", (e) => {
                        e.preventDefault();
                        options.onLetterClick(character.toLowerCase());
                    });
                }
                
                wordGroup.appendChild(element);
                globalLetterIndex++;
            });
            wordContainerElement.appendChild(wordGroup);
        });

        // Clear image area initially
        imageAreaElement.innerHTML = "";
        
        const renderImage = () => {
            imageAreaElement.innerHTML = "";
            const wrapper = document.createElement("div");
            wrapper.className = "image-wrapper";

            if (!wordData.imageUrl) {
                WordCardComponent.renderFallback(wrapper, wordData);
                imageAreaElement.appendChild(wrapper);
                if (options.onImageError) options.onImageError();
            } else {
                const image = document.createElement("img");
                image.className = "word-image";
                image.src = wordData.imageUrl;
                image.alt = wordData.word;
                
                image.addEventListener("load", () => {
                    if (options.onImageLoaded) options.onImageLoaded();
                });
                
                image.addEventListener("error", () => {
                    WordCardComponent.renderFallback(wrapper, wordData);
                    if (options.onImageError) options.onImageError();
                }, { once: true });
                
                wrapper.appendChild(image);
                imageAreaElement.appendChild(wrapper);
            }
        };

        if (imageDelay > 0 || letterDelay > 0) {
            const totalDelay = globalLetterIndex * letterDelay + imageDelay;
            // Returning the timer ID so the caller can cancel it if needed
            return setTimeout(renderImage, totalDelay);
        } else {
            renderImage();
            return null;
        }
    }

    /**
     * Renders a fallback emoji when an image is missing or fails to load.
     */
    static renderFallback(wrapper, data) {
        wrapper.innerHTML = "";
        const fallback = document.createElement("div");
        fallback.className = "fallback";
        
        const icon = document.createElement("div");
        icon.className = "fallback-icon";
        icon.textContent = data.fallback || "❓";
        
        const text = document.createElement("div");
        text.className = "fallback-text";
        text.textContent = data.word;
        
        fallback.appendChild(icon);
        fallback.appendChild(text);
        wrapper.appendChild(fallback);
    }
}
