// Scoring calculations for Rogue mode

/**
 * Calculate score for a completed stage
 * Formula: (100 + unusedClicks × 10) × difficultyMultiplier
 */
export function calculateStageScore(unusedClicks, modifierCount) {
    const baseScore = 100;
    const clickBonus = unusedClicks * 10;
    const multiplier = getDifficultyMultiplier(modifierCount);
    
    return Math.floor((baseScore + clickBonus) * multiplier);
}

/**
 * Get difficulty multiplier based on number of modifiers
 */
export function getDifficultyMultiplier(modifierCount) {
    const multipliers = {
        0: 1.0,
        1: 1.5,
        2: 2.0,
        3: 3.0
    };
    return multipliers[modifierCount] || 1.0;
}

/**
 * Calculate click reward for completing a stage
 * Base reward + modifier bonus + shop upgrades
 */
export async function getClickReward(modifierCount, rogueState = null) {
    const baseReward = 10;
    const bonuses = {
        0: 0,
        1: 2,
        2: 5,
        3: 8
    };
    
    let totalReward = baseReward + (bonuses[modifierCount] || 0);
    
    // Add shop upgrade bonuses if rogueState provided
    if (rogueState) {
        const { calculateBonusClicksFromUpgrades } = await import("./shop.js");
        const upgradeBonus = calculateBonusClicksFromUpgrades(rogueState, baseReward, modifierCount);
        totalReward += upgradeBonus;
    }
    
    return totalReward;
}

/**
 * Calculate WikiPoints earned
 * 1 WikiPoint per stage, multiplied by difficulty
 */
export function calculateWikiPoints(modifierCount) {
    return Math.ceil(getDifficultyMultiplier(modifierCount));
}

/**
 * Calculate bonus score for completing stages
 * 50 points per stage completed
 */
export function calculateStageCompletionBonus(stagesCompleted) {
    return stagesCompleted * 50;
}

/**
 * Calculate final run score
 */
export function calculateFinalScore(totalStageScore, stagesCompleted) {
    return totalStageScore + calculateStageCompletionBonus(stagesCompleted);
}
