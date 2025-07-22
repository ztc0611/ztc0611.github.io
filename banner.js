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
        
        this.init();
    }

    init() {
        console.log("Today's StarVal:", this.starThreshold);
        this.updateBannerRect();
        this.setupVisibilityListener();
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
            this.updateBannerRect();
        });
    }

    calculateStarProbability(isNewDay = false) {
        if (isNewDay) {
            console.log("New Day...");
        }

        const now = new Date();
        const date = now.getDate();
        const weekday = now.getDay(); // 0 = Sunday, 6 = Saturday
        const month = now.getMonth() + 1; // 0-based, so add 1
        const year = now.getFullYear();

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

            // Different scroll speeds for parallax effect using background-position
            if (stars) {
                stars.style.backgroundPosition = `${-scrollOffset * 0.001}px top`;
            }
            if (clouds1) {
                clouds1.style.backgroundPosition = `${-scrollOffset * 0.08}px bottom`;
            }
            if (clouds2) {
                clouds2.style.backgroundPosition = `${-scrollOffset * 0.06}px bottom`;
            }
            if (mountains) {
                mountains.style.backgroundPosition = `${-scrollOffset * 0.5}px bottom`;
            }
            if (mountainsBack) {
                mountainsBack.style.backgroundPosition = `${150 + -scrollOffset * 0.4}px bottom`;
            }
            if (houses) {
                houses.style.backgroundPosition = `${-scrollOffset * 0.7}px bottom`;
            }
            if (frontHouses) {
                frontHouses.style.backgroundPosition = `${-scrollOffset * 0.9}px bottom`;
            }
            if (ground) {
                ground.style.backgroundPosition = `${-scrollOffset * 1.0}px bottom`;
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

            // Check if a new day has started
            const currentDay = new Date().getDate();
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

    createRegularStar(bannerRect) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Create animated star using sprite frames
        const img = document.createElement('img');
        const frameCount = 14; // smallstartest_straight1 to 14
        const currentFrame = Math.floor(Math.random() * frameCount) + 1;
        img.src = `TitleScreen/Star/smallstartest_straight${currentFrame}.png`;
        img.style.width = '100%';
        img.style.height = '100%';
        
        const size = Math.random() * 20 + 12; // 12-32px scaled for 300px height
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.left = (Math.random() * (bannerRect.width + 60) - 30) + 'px';
        star.style.top = (Math.random() * 80 - 10) + 'px';
        
        star.appendChild(img);
        this.shootingStars.appendChild(star);
        
        // Animate through sprite frames
        this.animateStarFrames(img, frameCount, 2000);
        
        // Remove star after animation completes
        setTimeout(() => {
            if (star && star.parentNode) {
                star.parentNode.removeChild(star);
            }
        }, 2000);
    }

    createBigStar(bannerRect) {
        const star = document.createElement('div');
        star.className = 'star-big';
        
        // Create animated big star using sprite frames
        const img = document.createElement('img');
        const frameCount = 13; // StarBig1 to 13
        const currentFrame = Math.floor(Math.random() * frameCount) + 1;
        img.src = `TitleScreen/StarBig/StarBig${currentFrame}.png`;
        img.style.width = '100%';
        img.style.height = '100%';
        
        const size = Math.random() * 25 + 30; // 30-55px scaled for 300px height
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.left = (Math.random() * (bannerRect.width + 60) - 30) + 'px';
        star.style.top = (Math.random() * 80 - 10) + 'px';
        
        star.appendChild(img);
        this.shootingStars.appendChild(star);
        
        // Animate through sprite frames
        this.animateStarFrames(img, frameCount, 3000);
        
        // Remove star after animation completes
        setTimeout(() => {
            if (star && star.parentNode) {
                star.parentNode.removeChild(star);
            }
        }, 3000);
    }

    animateStarFrames(img, frameCount, duration) {
        let currentFrame = 1;
        const frameInterval = duration / frameCount; // Play through frames once
        const staticDuration = duration * 0.57; // 57% of animation is static (frames 1-7)
        const movingDuration = duration * 0.33; // 33% is movement (frames 8-14)
        const staticFrameInterval = staticDuration / 7; // static frames
        const movingFrameInterval = movingDuration / (frameCount - 7); // remaining frames
        
        const animate = () => {
            if (img && img.parentNode && currentFrame <= frameCount) {
                const isSmall = img.src.includes('smallstartest');
                
                if (isSmall) {
                    img.src = `TitleScreen/Star/smallstartest_straight${currentFrame}.png`;
                } else {
                    img.src = `TitleScreen/StarBig/StarBig${currentFrame}.png`;
                }
                
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