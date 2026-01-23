// Modifier definitions and effects for Rogue mode

export const MODIFIERS = {
    // Easy modifiers (+2 clicks, x1.5 score)
    fogOfWarEasy: {
        id: "fogOfWarEasy",
        name: "Fog of War (Easy)",
        description: "10 random links are disabled",
        difficulty: "easy",
        clickReward: 2,
        scoreMultiplier: 1.5,
        params: { disabledLinks: 10 }
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
        description: "20 random links are disabled",
        difficulty: "medium",
        clickReward: 4,
        scoreMultiplier: 2.0,
        params: { disabledLinks: 20 }
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
        description: "30 random links are disabled",
        difficulty: "hard",
        clickReward: 6,
        scoreMultiplier: 3.0,
        params: { disabledLinks: 30 }
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
    // First, clear any previous modifier effects from the old page
    clearModifierEffects();
    
    // Then apply new modifiers
    modifiers.forEach(modifier => {
        switch (modifier.id) {
            case "fogOfWarEasy":
            case "fogOfWarMedium":
            case "fogOfWarHard":
                applyFogOfWar(modifier.params.disabledLinks);
                break;
            case "dontLookBack":
                applyDontLookBack(visitedPages);
                break;
            case "timePressureEasy":
            case "timePressureMedium":
            case "timePressureHard":
                // Timer is handled in RogueMode.onPageLoad
                break;
            // Button Smasher is handled in onPageLoad
            // Scenic Route is validated at win (Phase 2)
        }
    });
}

// Clear all modifier effects (called before applying new modifiers)
function clearModifierEffects() {
    // Remove fog of war effects
    document.querySelectorAll(".fog-disabled").forEach(link => {
        link.classList.remove("fog-disabled");
        link.style.color = "";
        link.style.cursor = "";
        link.style.pointerEvents = "";
        link.title = "";
    });
    
    // Remove don't look back effects
    document.querySelectorAll(".visited-disabled").forEach(link => {
        link.classList.remove("visited-disabled");
        link.style.pointerEvents = "";
        link.style.opacity = "";
        link.style.textDecoration = "";
        link.title = "";
    });
}

// Fog of War: Disable N random links
function applyFogOfWar(disabledCount) {
    const links = Array.from(document.querySelectorAll("#content a"));
    
    // Shuffle links
    const shuffled = links.sort(() => Math.random() - 0.5);
    
    // Disable first N links
    shuffled.slice(0, disabledCount).forEach(link => {
        link.classList.add("fog-disabled");
        link.style.color = "#ba3030";
        link.style.cursor = "not-allowed";
        link.style.pointerEvents = "none";
        link.title = "Link disabled by Fog of War";
    });
}

// Don't Look Back: Disable links to visited pages
function applyDontLookBack(visitedPages) {
    const links = document.querySelectorAll("#content a");
    
    links.forEach(link => {
        const linkTitle = link.getAttribute("data-wiki-title") || link.title || link.textContent;
        
        if (visitedPages.includes(linkTitle)) {
            link.classList.add("visited-disabled");
            link.style.pointerEvents = "none";
            link.style.opacity = "0.3";
            link.style.textDecoration = "line-through";
            link.title = "Already visited - Don't Look Back";
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

// Check if modifiers include scenic route
export function hasScenicRoute(modifiers) {
    return modifiers.some(mod => mod.id.startsWith("scenicRoute"));
}

// Get minimum clicks required from modifiers
export function getMinClicks(modifiers) {
    const scenicMod = modifiers.find(mod => mod.id.startsWith("scenicRoute"));
    return scenicMod ? scenicMod.params.minClicks : 0;
}
