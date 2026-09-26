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

            if (!wordData.imageUrl && !wordData.url) {
                WordCardComponent.renderFallback(wrapper, wordData);
                imageAreaElement.appendChild(wrapper);
                if (options.onImageError) options.onImageError();
            } else {
                const image = document.createElement("img");
                image.className = "word-image";
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

                // Fetch from IDB cache (or populate IDB)
                if (typeof window.getOrFetchWordImage === 'function') {
                    window.getOrFetchWordImage(wordData).then(dataUrl => {
                        if (dataUrl) {
                            image.src = dataUrl;
                        } else {
                            image.src = wordData.imageUrl || wordData.url;
                        }
                    }).catch(() => {
                        image.src = wordData.imageUrl || wordData.url;
                    });
                } else {
                    image.src = wordData.imageUrl || wordData.url;
                }
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

class ImageSearchComponent {
    /**
     * Initializes the Image Search panel.
     * @param {HTMLElement} containerElement - The DOM element to render the grid into.
     * @param {Function} onImageSelected - Callback (highResUrl) => void
     */
    constructor(containerElement, onImageSelected) {
        this.container = containerElement;
        this.onImageSelected = onImageSelected;
        this.currentQuery = "";
        this.currentOffset = 0;
    }

    async search(query) {
        this.currentQuery = query;
        this.currentOffset = 0;
        this.container.style.display = "grid";
        this.container.innerHTML = "<div style='grid-column: 1/-1; text-align:center; padding: 20px; color: var(--muted);'>Searching free images...</div>";
        await this.fetchImages(this.currentQuery, this.currentOffset, false);
    }

    async fetchImages(query, offset, append = false) {
        try {
            const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=24&gsroffset=${offset}&prop=pageimages&piprop=thumbnail&pithumbsize=400&origin=*`);
            const data = await response.json();
            
            let imgs = [];
            if (data.query && data.query.pages) {
                const pages = Object.values(data.query.pages);
                imgs = pages.filter(p => p.thumbnail && p.thumbnail.source).map(p => p.thumbnail.source);
            }
            
            if (imgs.length === 0 && !append) {
                this.container.innerHTML = "<div style='grid-column: 1/-1; text-align:center; padding: 20px; color: var(--muted);'>No images found. Please paste a URL manually.</div>";
            } else if (imgs.length === 0 && append) {
                const existingLoadMore = this.container.querySelector(".load-more-images-btn");
                if (existingLoadMore) {
                    existingLoadMore.textContent = "No more images";
                    existingLoadMore.disabled = true;
                }
            } else {
                this.renderImageResults(imgs, append);
            }
        } catch (err) {
            if (!append) {
                this.container.innerHTML = "<div style='grid-column: 1/-1; text-align:center; padding: 20px; color: var(--muted);'>Search failed. Please paste a URL manually.</div>";
            } else {
                const existingLoadMore = this.container.querySelector(".load-more-images-btn");
                if (existingLoadMore) {
                    existingLoadMore.textContent = "Load failed. Try again.";
                    existingLoadMore.disabled = false;
                }
            }
        }
    }

    renderImageResults(imgs, append = false) {
        if (!append) {
            this.container.innerHTML = "";
        }
        
        const existingLoadMore = this.container.querySelector(".load-more-images-btn");
        if (existingLoadMore) existingLoadMore.remove();

        imgs.forEach(imgUrl => {
            const img = document.createElement("img");
            img.src = imgUrl;
            img.style.width = "100%";
            img.style.height = "80px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "8px";
            img.style.cursor = "pointer";
            img.style.border = "2px solid transparent";
            
            img.onerror = () => { img.style.display = 'none'; };
            
            img.addEventListener("mouseover", () => img.style.border = "2px solid var(--primary)");
            img.addEventListener("mouseout", () => img.style.border = "2px solid transparent");
            
            // USE CLICK INSTEAD OF POINTERDOWN TO AVOID SCROLL CONFLICTS
            img.addEventListener("click", () => {
                let finalUrl = imgUrl;
                if (finalUrl.includes('/thumb/')) {
                    let parts = finalUrl.split('/');
                    parts.pop();
                    finalUrl = parts.join('/').replace('/thumb/', '/');
                }
                this.onImageSelected(finalUrl);
            });
            
            this.container.appendChild(img);
        });
        
        if (imgs.length > 0) {
            const loadMore = document.createElement("button");
            loadMore.type = "button";
            loadMore.className = "button button-secondary load-more-images-btn";
            loadMore.style.gridColumn = "1 / -1";
            loadMore.style.marginTop = "10px";
            loadMore.textContent = "Load More Images...";
            
            loadMore.addEventListener("click", () => {
                loadMore.textContent = "Loading...";
                loadMore.disabled = true;
                this.currentOffset += 24;
                this.fetchImages(this.currentQuery, this.currentOffset, true);
            });
            
            this.container.appendChild(loadMore);
        }
    }
}
