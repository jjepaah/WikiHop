// Modifier definitions and effects for Rogue mode

export const MODIFIERS = {
    // Easy modifiers (+2 clicks, x1.5 score)
    fogOfWarEasy: {
        id: "fogOfWarEasy",
        name: "Fog of War (Easy)",
        description: "Only see 10 links at a time",
        difficulty: "easy",
        clickReward: 2,
        scoreMultiplier: 1.5,
        params: { visibleLinks: 10 }
    },
    scenicRouteEasy: {
        id: "scenicRouteEasy",
        name: "Scenic Route (Easy)",
        description: "Path must be at least 8 clicks",
        difficulty: "easy",
        clickReward: 2,
        scoreMultiplier: 1.5,
        params: { minClicks: 8 }
    },
    timePressureEasy: {
        id: "timePressureEasy",
        name: "Time Pressure (Easy)",
        description: "Complete in 60 seconds",
        difficulty: "easy",
        clickReward: 2,
        scoreMultiplier: 1.5,
        params: { timeLimit: 60 }
    },
    
    // Medium modifiers (+4 clicks, x2.0 score)
    fogOfWarMedium: {
        id: "fogOfWarMedium",
        name: "Fog of War (Medium)",
        description: "Only see 6 links at a time",
        difficulty: "medium",
        clickReward: 4,
        scoreMultiplier: 2.0,
        params: { visibleLinks: 6 }
    },
    dontLookBack: {
        id: "dontLookBack",
        name: "Don't Look Back",
        description: "Can't visit already visited pages",
        difficulty: "medium",
        clickReward: 4,
        scoreMultiplier: 2.0,
        params: {}
    },
    buttonSmasherMedium: {
        id: "buttonSmasherMedium",
        name: "Button Smasher (Medium)",
        description: "Every click costs 2 clicks",
        difficulty: "medium",
        clickReward: 4,
        scoreMultiplier: 2.0,
        params: { clickMultiplier: 2 }
    },
    scenicRouteMedium: {
        id: "scenicRouteMedium",
        name: "Scenic Route (Medium)",
        description: "Path must be at least 14 clicks",
        difficulty: "medium",
        clickReward: 4,
        scoreMultiplier: 2.0,
        params: { minClicks: 14 }
    },
    timePressureMedium: {
        id: "timePressureMedium",
        name: "Time Pressure (Medium)",
        description: "Complete in 50 seconds",
        difficulty: "medium",
        clickReward: 4,
        scoreMultiplier: 2.0,
        params: { timeLimit: 50 }
    },
    
    // Hard modifiers (+6 clicks, x3.0 score)
    fogOfWarHard: {
        id: "fogOfWarHard",
        name: "Fog of War (Hard)",
        description: "Only see 3 links at a time",
        difficulty: "hard",
        clickReward: 6,
        scoreMultiplier: 3.0,
        params: { visibleLinks: 3 }
    },
    buttonSmasherHard: {
        id: "buttonSmasherHard",
        name: "Button Smasher (Hard)",
        description: "Every click costs 4 clicks",
        difficulty: "hard",
        clickReward: 6,
        scoreMultiplier: 3.0,
        params: { clickMultiplier: 4 }
    },
    timePressureHard: {
        id: "timePressureHard",
        name: "Time Pressure (Hard)",
        description: "Complete in 35 seconds",
        difficulty: "hard",
        clickReward: 6,
        scoreMultiplier: 3.0,
        params: { timeLimit: 35 }
    }
};

// Get modifier by ID
export function getModifier(modifierId) {
    return MODIFIERS[modifierId];
}

// Get random modifiers (excluding already selected ones)
export function getRandomModifiers(count, exclude = []) {
    const available = Object.values(MODIFIERS).filter(
        mod => !exclude.includes(mod.id)
    );
    
    const shuffled = available.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Apply modifier effects to the page
export function applyModifierEffects(modifiers, visitedPages = []) {
    modifiers.forEach(modifier => {
        switch (modifier.id) {
            case "fogOfWarEasy":
            case "fogOfWarMedium":
            case "fogOfWarHard":
                applyFogOfWar(modifier.params.visibleLinks);
                break;
            case "dontLookBack":
                applyDontLookBack(visitedPages);
                break;
            // Button Smasher is handled in onPageLoad
            // Time Pressure needs timer (Phase 2)
            // Scenic Route is validated at win (Phase 2)
        }
    });
}

// Fog of War: Show only N random links
function applyFogOfWar(visibleCount) {
    const links = Array.from(document.querySelectorAll("#content a"));
    
    // Shuffle links
    const shuffled = links.sort(() => Math.random() - 0.5);
    
    // Hide all except first N
    shuffled.forEach((link, index) => {
        if (index >= visibleCount) {
            link.style.display = "none";
        }
    });
}

// Don't Look Back: Disable links to visited pages
function applyDontLookBack(visitedPages) {
    const links = document.querySelectorAll("#content a");
    
    links.forEach(link => {
        const linkTitle = link.getAttribute("data-wiki-title") || link.title || link.textContent;
        
        if (visitedPages.includes(linkTitle)) {
            link.style.pointerEvents = "none";
            link.style.opacity = "0.3";
            link.style.textDecoration = "line-through";
            link.title = "Already visited";
        }
    });
}

// Get click multiplier from active modifiers
export function getClickMultiplier(modifiers) {
    let multiplier = 1;
    
    modifiers.forEach(modifier => {
        if (modifier.id.startsWith("buttonSmasher")) {
            multiplier = modifier.params.clickMultiplier;
        }
    });
    
    return multiplier;
}

// Check if modifiers include time pressure
export function hasTimePressure(modifiers) {
    return modifiers.some(mod => mod.id.startsWith("timePressure"));
}

// Get time limit from modifiers
export function getTimeLimit(modifiers) {
    const timeMod = modifiers.find(mod => mod.id.startsWith("timePressure"));
    return timeMod ? timeMod.params.timeLimit : null;
}
