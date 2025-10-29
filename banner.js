class BannerAnimation {
    constructor() {
        this.banner = document.getElementById('banner');
        this.shootingStars = document.getElementById('shooting-stars');
        this.starThreshold = this.calculateStarProbability();
        this.starFreeze = 0;
        this.starFreezeBig = 0;
        this.lastDay = new Date().getDate();
        this.guaranteedBigStar = false;
        this.bannerRect = null;
        this.isVisible = true;

        this.starPool = { small: [], big: [] };
        this.activeStars = [];
        this.cachedDate = null;
        this.lastDateCheck = 0;
        this.resizeTimeout = null;

        // Cache parallax elements
        this.parallaxElements = null;

        this.init();
    }

    init() {
        console.log("Today's StarVal:", this.starThreshold);
        this.updateBannerRect();
        this.setupVisibilityListener();
        this.initializeStarPools();
        this.startParallaxScrolling();
        this.startStarGeneration();
        this.scheduleGuaranteedBigStar();
    }

    updateBannerRect() {
        this.bannerRect = this.banner.getBoundingClientRect();
    }

    setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
        });

        let resizeRAF = null;
        window.addEventListener('resize', () => {
            // Cancel pending resize update if any
            if (resizeRAF) {
                cancelAnimationFrame(resizeRAF);
            }
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }

            // Use RAF for smooth updates, with timeout for debouncing
            this.resizeTimeout = setTimeout(() => {
                resizeRAF = requestAnimationFrame(() => {
                    this.updateBannerRect();
                    resizeRAF = null;
                });
            }, 100);
        });
    }

    initializeStarPools() {
        // Pre-create star elements to avoid DOM creation overhead
        for (let i = 0; i < 10; i++) {
            this.starPool.small.push(this.createStarElement(false));
            this.starPool.big.push(this.createStarElement(true));
        }
    }

    createStarElement(isBig) {
        const star = document.createElement('div');
        star.className = isBig ? 'star-big' : 'star';
        star.style.backgroundColor = '#fdfae7';
        star.style.boxShadow = '0 0 4px rgba(253, 250, 231, 0.8)';

        return { element: star, inUse: false, positionAnimationId: null };
    }

    calculateStarProbability(isNewDay = false) {
        if (isNewDay) {
            console.log("New Day...");
        }

        // Cache date calculations to avoid repeated Date object creation
        if (!this.cachedDate || isNewDay) {
            const dateObj = new Date();
            this.cachedDate = {
                date: dateObj.getDate(),
                weekday: dateObj.getDay(),
                month: dateObj.getMonth() + 1,
                year: dateObj.getFullYear()
            };
            this.lastDateCheck = performance.now();
        }

        const { date, weekday, month, year } = this.cachedDate;

        let threshold = 0;

        // Random Stuff
        if (weekday % 2 === 0) { // even numbered weekday
            threshold += 2;
        }
        if (date % 2 !== 0) { // odd numbered date
            threshold += 3;
        }
        if ([1, 2, 3, 11, 12].includes(month)) { // jan, feb, mar, nov, dec
            threshold += 4;
        }

        // Modifiers
        if (year % 2 !== 0) { // Year isn't even
            threshold = threshold / 2.0;
        }
        if (year % 5 === 0 || year % 10 === 0) { // Year ends with 5 or 0
            threshold = threshold * 1.5;
        }

        // Overrides
        if (month + date === 13) {
            threshold = 0;
        }
        if (weekday === 5 && date === 13) { // Friday the 13th
            threshold = 0;
        }

        // Special Dates
        if (month === 2 && date === 15) { // day the original feature was coded
            console.log("Anniversary of the star feature...");
            threshold = 8;
        }
        if (month === 4 && date === 20 && year.toString().includes('69')) { // easter egg
            console.log("Nice Day.");
            threshold = 500;
        }

        return Math.round(threshold);
    }

    startParallaxScrolling() {
        // Cache DOM elements once
        if (!this.parallaxElements) {
            this.parallaxElements = {
                stars: document.querySelector('.stars'),
                clouds1: document.getElementById('clouds1'),
                clouds2: document.getElementById('clouds2'),
                mountains: document.querySelector('.mountains'),
                mountainsBack: document.querySelector('.mountains-back'),
                houses: document.querySelector('.houses'),
                frontHouses: document.querySelector('.front-houses'),
                ground: document.querySelector('.ground')
            };
        }

        const { stars, clouds1, clouds2, mountains, mountainsBack, houses, frontHouses, ground } = this.parallaxElements;
        let scrollOffset = 0;

        const animate = () => {
            if (!this.isVisible) {
                requestAnimationFrame(animate);
                return;
            }

            scrollOffset += 0.5;

            // Batch DOM updates to minimize repaints
            // Round to whole pixels to prevent Safari Retina blurriness
            const updates = [
                [stars, `${Math.round(-scrollOffset * 0.001)}px top`],
                [clouds1, `${Math.round(-scrollOffset * 0.08)}px bottom`],
                [clouds2, `${Math.round(-scrollOffset * 0.06)}px bottom`],
                [mountains, `${Math.round(-scrollOffset * 0.5)}px bottom`],
                [mountainsBack, `${Math.round(150 + -scrollOffset * 0.4)}px bottom`],
                [houses, `${Math.round(-scrollOffset * 0.7)}px bottom`],
                [frontHouses, `${Math.round(-scrollOffset * 0.9)}px bottom`],
                [ground, `${Math.round(-scrollOffset * 1.0)}px bottom`]
            ];

            // Apply all updates in a single batch
            for (const [element, position] of updates) {
                if (element) {
                    element.style.backgroundPosition = position;
                }
            }

            // Reset scroll offset smoothly when it gets too large
            if (scrollOffset > 20000) {
                scrollOffset = scrollOffset % 20000;
            }

            requestAnimationFrame(animate);
        };

        animate();
    }

    startStarGeneration() {
        let lastFrameTime = performance.now();
        let frameCount = 0;

        const generateStar = (currentTime) => {
            if (!this.isVisible) {
                lastFrameTime = currentTime;
                requestAnimationFrame(generateStar);
                return;
            }

            const deltaTime = (currentTime - lastFrameTime) / 1000; // Convert to seconds
            lastFrameTime = currentTime;

            // Check if a new day has started (force fresh date check, not cached)
            const currentDay = new Date().getDate();
            if (currentDay !== this.lastDay) {
                this.starThreshold = this.calculateStarProbability(true);
                this.lastDay = currentDay;
                // Invalidate cached date to force recalculation
                this.cachedDate = null;
            }

            if (this.starFreeze <= 0) {
                this.tryCreateStar();
            }

            // Update freeze timers using actual delta time
            if (this.starFreeze > 0) {
                this.starFreeze -= deltaTime;
            }
            if (this.starFreezeBig > 0) {
                this.starFreezeBig -= deltaTime;
            }

            // Prune star pools periodically (every ~5 seconds at 60fps)
            frameCount++;
            if (frameCount >= 300) {
                this.pruneStarPools();
                frameCount = 0;
            }

            requestAnimationFrame(generateStar);
        };

        requestAnimationFrame(generateStar);
    }

    tryCreateStar() {
        // Ensure bannerRect is valid
        if (!this.bannerRect || this.bannerRect.width === 0) {
            this.updateBannerRect();
            if (!this.bannerRect || this.bannerRect.width === 0) {
                return; // Banner not ready yet
            }
        }

        const rand = Math.floor(Math.random() * 250);
        const randSize = Math.floor(Math.random() * rand);

        if (rand < this.starThreshold) {

            if (randSize < rand / 4.5 && this.starThreshold > 8 && this.starFreezeBig <= 0) {
                // Create big star
                this.createBigStar(this.bannerRect);
                this.starFreezeBig = 20 / this.starThreshold;
            } else {
                // Create regular star
                this.createRegularStar(this.bannerRect);
            }

            this.starFreeze = 1 / (this.starThreshold * 2);
        }
    }

    getStarFromPool(isBig) {
        const pool = isBig ? this.starPool.big : this.starPool.small;
        let star = pool.find(s => !s.inUse);
        
        if (!star) {
            // Pool exhausted, create new star (fallback)
            star = this.createStarElement(isBig);
            pool.push(star);
        }
        
        star.inUse = true;
        return star;
    }

    returnStarToPool(star) {
        star.inUse = false;

        // Cancel position animations
        if (star.positionAnimationId) {
            cancelAnimationFrame(star.positionAnimationId);
            star.positionAnimationId = null;
        }

        if (star.element.parentNode) {
            star.element.parentNode.removeChild(star.element);
        }
    }

    pruneStarPools() {
        // Keep pool sizes reasonable (max 20 of each type)
        const maxPoolSize = 20;

        // Prune small star pool
        const unusedSmall = this.starPool.small.filter(s => !s.inUse);
        if (unusedSmall.length > maxPoolSize) {
            this.starPool.small = this.starPool.small.filter(s => s.inUse)
                .concat(unusedSmall.slice(0, maxPoolSize));
        }

        // Prune big star pool
        const unusedBig = this.starPool.big.filter(s => !s.inUse);
        if (unusedBig.length > maxPoolSize) {
            this.starPool.big = this.starPool.big.filter(s => s.inUse)
                .concat(unusedBig.slice(0, maxPoolSize));
        }
    }

    createRegularStar(bannerRect) {
        const star = this.getStarFromPool(false);

        const size = Math.floor(Math.random() * 3 + 2) * 2; // 4, 6, 8px (pixel sizes)
        star.element.style.width = size + 'px';
        star.element.style.height = size + 'px';

        // Store animation properties
        star.startX = Math.random() * (bannerRect.width + 180) - 90;

        // All stars spawn above the screen
        // Weighted random: mostly near top, some further up
        const rand = Math.random();
        const normalizedY = Math.pow(rand, 2); // Square makes values cluster near 0
        star.startY = -10 - (normalizedY * 150); // Range from -10 to -160 (all negative)

        star.startTime = performance.now();
        star.duration = 1000;
        star.size = size;

        star.element.style.left = Math.round(star.startX) + 'px';
        star.element.style.top = Math.round(star.startY) + 'px';
        star.element.style.opacity = '0';

        this.shootingStars.appendChild(star.element);
        this.activeStars.push(star);

        // Start position animation
        this.animateStarPosition(star, false);
    }

    createBigStar(bannerRect) {
        const star = this.getStarFromPool(true);

        const size = Math.floor(Math.random() * 3 + 3) * 2; // 6, 8, 10px (bigger pixel sizes)
        star.element.style.width = size + 'px';
        star.element.style.height = size + 'px';

        // Store animation properties
        star.startX = Math.random() * (bannerRect.width + 180) - 90;

        // All stars spawn above the screen
        // Weighted random: mostly near top, some further up
        const rand = Math.random();
        const normalizedY = Math.pow(rand, 2); // Square makes values cluster near 0
        star.startY = -10 - (normalizedY * 150); // Range from -10 to -160 (all negative)

        star.startTime = performance.now();
        star.duration = 1500;
        star.size = size;

        star.element.style.left = Math.round(star.startX) + 'px';
        star.element.style.top = Math.round(star.startY) + 'px';
        star.element.style.opacity = '0';

        this.shootingStars.appendChild(star.element);
        this.activeStars.push(star);

        // Start position animation
        this.animateStarPosition(star, true);
    }

    animateStarPosition(star, isBig) {
        const totalDistance = 300; // pixels to move (increased to go further down)
        const distanceX = totalDistance;
        const distanceY = totalDistance / 2;

        const animate = (currentTime) => {
            if (!star.element.parentNode) {
                return; // Star was removed
            }

            const elapsed = currentTime - star.startTime;
            const progress = Math.min(elapsed / star.duration, 1);

            // Simple fade in/out while moving the whole time
            let opacity = 1;
            if (progress < 0.2) {
                // Fade in during first 20%
                opacity = progress / 0.2;
            } else if (progress > 0.8) {
                // Fade out during last 20%
                opacity = 1 - ((progress - 0.8) / 0.2);
            }

            // Always moving - use full progress
            const moveProgress = progress;

            // Round to whole pixels for pixel-perfect movement
            const currentX = Math.round(star.startX + (distanceX * moveProgress));
            const currentY = Math.round(star.startY + (distanceY * moveProgress));

            star.element.style.left = currentX + 'px';
            star.element.style.top = currentY + 'px';
            star.element.style.opacity = opacity;

            if (progress < 1) {
                star.positionAnimationId = requestAnimationFrame(animate);
            } else {
                // Clean up when done
                this.returnStarToPool(star);
                const index = this.activeStars.indexOf(star);
                if (index > -1) {
                    this.activeStars.splice(index, 1);
                }
            }
        };

        star.positionAnimationId = requestAnimationFrame(animate);
    }


    scheduleGuaranteedBigStar() {
        const delay = Math.random() * 3000 + 1000; // 1-4 seconds
        setTimeout(() => {
            if (!this.guaranteedBigStar) {
                // Ensure bannerRect is valid before creating star
                if (!this.bannerRect || this.bannerRect.width === 0) {
                    this.updateBannerRect();
                }
                if (this.bannerRect && this.bannerRect.width > 0) {
                    this.createBigStar(this.bannerRect);
                    this.guaranteedBigStar = true;
                }
            }
        }, delay);
    }
}

// Initialize the banner animation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BannerAnimation();
});