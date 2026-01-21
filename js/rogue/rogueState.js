// Rogue gamemode state management
export const rogueState = {
    currentStage: 1,
    clickBalance: 18,
    totalScore: 0,
    wikiPoints: 0,
    activeModifiers: [],
    ownedItems: [],
    permanentUpgrades: [],
    visitedPages: [],
    stageHistory: [],
    unusedClicksThisStage: 0,
    clicksAtStageStart: 18
};

export function resetRogueState() {
    rogueState.currentStage = 1;
    rogueState.clickBalance = 18;
    rogueState.totalScore = 0;
    rogueState.wikiPoints = 0;
    rogueState.activeModifiers = [];
    rogueState.ownedItems = [];
    rogueState.permanentUpgrades = [];
    rogueState.visitedPages = [];
    rogueState.stageHistory = [];
    rogueState.unusedClicksThisStage = 0;
    rogueState.clicksAtStageStart = 18;
}

export function addModifier(modifier) {
    rogueState.activeModifiers.push(modifier);
}

export function clearModifiers() {
    rogueState.activeModifiers = [];
}

export function addItem(item) {
    if (item.permanent) {
        rogueState.permanentUpgrades.push(item);
    } else {
        rogueState.ownedItems.push(item);
    }
}

export function removeItem(itemId) {
    rogueState.ownedItems = rogueState.ownedItems.filter(item => item.id !== itemId);
}

export function hasItem(itemId) {
    return rogueState.ownedItems.some(item => item.id === itemId) ||
           rogueState.permanentUpgrades.some(item => item.id === itemId);
}

export function addVisitedPage(pageName) {
    if (!rogueState.visitedPages.includes(pageName)) {
        rogueState.visitedPages.push(pageName);
    }
}

export function clearVisitedPages() {
    rogueState.visitedPages = [];
}
