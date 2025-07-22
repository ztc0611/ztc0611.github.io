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
        this.preloadedFrames = { small: [], big: [] };
        this.cachedDate = null;
        this.lastDateCheck = 0;
        this.resizeTimeout = null;
        
        this.init();
    }

    init() {
        console.log("Today's StarVal:", this.starThreshold);
        this.updateBannerRect();
        this.setupVisibilityListener();
        this.preloadStarFrames();
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
        
        window.addEventListener('resize', () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = setTimeout(() => {
                this.updateBannerRect();
            }, 100);
        });
    }

    preloadStarFrames() {
        // Preload small star frames
        for (let i = 1; i <= 14; i++) {
            const img = new Image();
            img.src = `TitleScreen/Star/smallstartest_straight${i}.png`;
            this.preloadedFrames.small.push(img.src);
        }
        
        // Preload big star frames
        for (let i = 1; i <= 13; i++) {
            const img = new Image();
            img.src = `TitleScreen/StarBig/StarBig${i}.png`;
            this.preloadedFrames.big.push(img.src);
        }
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
        
        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '100%';
        
        star.appendChild(img);
        return { element: star, img: img, inUse: false, animationId: null };
    }

    calculateStarProbability(isNewDay = false) {
        if (isNewDay) {
            console.log("New Day...");
        }

        // Cache date calculations to avoid repeated Date object creation
        const now = performance.now();
        if (!this.cachedDate || now - this.lastDateCheck > 60000) { // Check every minute
            const dateObj = new Date();
            this.cachedDate = {
                date: dateObj.getDate(),
                weekday: dateObj.getDay(),
                month: dateObj.getMonth() + 1,
                year: dateObj.getFullYear()
            };
            this.lastDateCheck = now;
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
        const stars = document.querySelector('.stars');
        const clouds1 = document.getElementById('clouds1');
        const clouds2 = document.getElementById('clouds2');
        const mountains = document.querySelector('.mountains');
        const mountainsBack = document.querySelector('.mountains-back');
        const houses = document.querySelector('.houses');
        const frontHouses = document.querySelector('.front-houses');
        const ground = document.querySelector('.ground');

        let scrollOffset = 0;

        const animate = () => {
            if (!this.isVisible) {
                requestAnimationFrame(animate);
                return;
            }

            scrollOffset += 0.5;

            // Batch DOM updates to minimize repaints
            const updates = [
                [stars, `${-scrollOffset * 0.001}px top`],
                [clouds1, `${-scrollOffset * 0.08}px bottom`],
                [clouds2, `${-scrollOffset * 0.06}px bottom`],
                [mountains, `${-scrollOffset * 0.5}px bottom`],
                [mountainsBack, `${150 + -scrollOffset * 0.4}px bottom`],
                [houses, `${-scrollOffset * 0.7}px bottom`],
                [frontHouses, `${-scrollOffset * 0.9}px bottom`],
                [ground, `${-scrollOffset * 1.0}px bottom`]
            ];

            // Apply all updates in a single batch
            for (const [element, position] of updates) {
                if (element) {
                    element.style.backgroundPosition = position;
                }
            }

            // Reset scroll offset when it gets too large
            if (scrollOffset > 20000) {
                scrollOffset = 0;
            }

            requestAnimationFrame(animate);
        };

        animate();
    }

    startStarGeneration() {
        const generateStar = () => {
            if (!this.isVisible) {
                requestAnimationFrame(generateStar);
                return;
            }

            // Check if a new day has started (use cached date)
            const currentDay = this.cachedDate ? this.cachedDate.date : new Date().getDate();
            if (currentDay !== this.lastDay) {
                this.starThreshold = this.calculateStarProbability(true);
                this.lastDay = currentDay;
            }

            if (this.starFreeze <= 0) {
                this.tryCreateStar();
            }

            // Update freeze timers
            if (this.starFreeze > 0) {
                this.starFreeze -= 0.016; // ~60fps
            }
            if (this.starFreezeBig > 0) {
                this.starFreezeBig -= 0.016;
            }

            requestAnimationFrame(generateStar);
        };

        generateStar();
    }

    tryCreateStar() {
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
        if (star.animationId) {
            clearTimeout(star.animationId);
            star.animationId = null;
        }
        if (star.element.parentNode) {
            star.element.parentNode.removeChild(star.element);
        }
    }

    createRegularStar(bannerRect) {
        const star = this.getStarFromPool(false);
        
        // Create animated star using preloaded sprite frames
        const frameCount = 14; // smallstartest_straight1 to 14
        const currentFrame = Math.floor(Math.random() * frameCount) + 1;
        star.img.src = this.preloadedFrames.small[currentFrame - 1];
        
        const size = Math.random() * 20 + 12; // 12-32px scaled for 300px height
        star.element.style.width = size + 'px';
        star.element.style.height = size + 'px';
        star.element.style.left = (Math.random() * (bannerRect.width + 60) - 30) + 'px';
        star.element.style.top = (Math.random() * 80 - 10) + 'px';
        
        this.shootingStars.appendChild(star.element);
        this.activeStars.push(star);
        
        // Animate through sprite frames
        this.animateStarFrames(star.img, frameCount, 2000, false);
        
        // Remove star after animation completes
        star.animationId = setTimeout(() => {
            this.returnStarToPool(star);
            const index = this.activeStars.indexOf(star);
            if (index > -1) {
                this.activeStars.splice(index, 1);
            }
        }, 2000);
    }

    createBigStar(bannerRect) {
        const star = this.getStarFromPool(true);
        
        // Create animated big star using preloaded sprite frames
        const frameCount = 13; // StarBig1 to 13
        const currentFrame = Math.floor(Math.random() * frameCount) + 1;
        star.img.src = this.preloadedFrames.big[currentFrame - 1];
        
        const size = Math.random() * 25 + 30; // 30-55px scaled for 300px height
        star.element.style.width = size + 'px';
        star.element.style.height = size + 'px';
        star.element.style.left = (Math.random() * (bannerRect.width + 60) - 30) + 'px';
        star.element.style.top = (Math.random() * 80 - 10) + 'px';
        
        this.shootingStars.appendChild(star.element);
        this.activeStars.push(star);
        
        // Animate through sprite frames
        this.animateStarFrames(star.img, frameCount, 3000, true);
        
        // Remove star after animation completes
        star.animationId = setTimeout(() => {
            this.returnStarToPool(star);
            const index = this.activeStars.indexOf(star);
            if (index > -1) {
                this.activeStars.splice(index, 1);
            }
        }, 3000);
    }

    animateStarFrames(img, frameCount, duration, isBig) {
        let currentFrame = 1;
        const staticDuration = duration * 0.57; // 57% of animation is static (frames 1-7)
        const movingDuration = duration * 0.33; // 33% is movement (frames 8-14)
        const staticFrameInterval = staticDuration / 7; // static frames
        const movingFrameInterval = movingDuration / (frameCount - 7); // remaining frames
        
        const frames = isBig ? this.preloadedFrames.big : this.preloadedFrames.small;
        
        const animate = () => {
            if (img && img.parentNode && currentFrame <= frameCount) {
                img.src = frames[currentFrame - 1];
                currentFrame++;
                
                if (currentFrame <= frameCount) {
                    const nextInterval = currentFrame <= 8 ? staticFrameInterval : movingFrameInterval;
                    setTimeout(animate, nextInterval);
                }
            }
        };
        
        setTimeout(animate, staticFrameInterval);
    }

    scheduleGuaranteedBigStar() {
        const delay = Math.random() * 3000 + 1000; // 1-4 seconds
        setTimeout(() => {
            if (!this.guaranteedBigStar) {
                this.createBigStar(this.bannerRect);
                this.guaranteedBigStar = true;
            }
        }, delay);
    }
}

// Initialize the banner animation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BannerAnimation();
});