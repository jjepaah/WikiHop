// Shop system for Rogue mode

export const SHOP_ITEMS = {
    // Permanent upgrades
    efficientNavigator: {
        id: "efficientNavigator",
        name: "Efficient Navigator",
        description: "+2 clicks earned per stage completed",
        cost: 15,
        permanent: true,
        effect: "clickReward"
    },
    masterOfPuppets: {
        id: "masterOfPuppets",
        name: "Master of Puppets",
        description: "Every modifier gives +2 extra clicks",
        cost: 18,
        permanent: true,
        effect: "modifierBonus"
    },
    speedReader: {
        id: "speedReader",
        name: "Speed Reader",
        description: "Time-based modifiers give +15 seconds",
        cost: 12,
        permanent: true,
        effect: "timeBonus"
    },
    readingGlasses: {
        id: "readingGlasses",
        name: "Reading Glasses",
        description: "Always see at least 5 links (counters Fog of War)",
        cost: 10,
        permanent: true,
        effect: "minLinks"
    },
    
    // Consumable items
    secondChance: {
        id: "secondChance",
        name: "Second Chance",
        description: "One-time revival when you run out of clicks (restore 10 clicks)",
        cost: 20,
        permanent: false,
        effect: "revive"
    },
    skipTarget: {
        id: "skipTarget",
        name: "Skip Target",
        description: "Generate a new target for current stage",
        cost: 8,
        permanent: false,
        effect: "skipTarget"
    },
    disableModifier: {
        id: "disableModifier",
        name: "Disable Modifier",
        description: "Remove one active modifier",
        cost: 6,
        permanent: false,
        effect: "disableModifier"
    },
    freeRerolls: {
        id: "freeRerolls",
        name: "2 Free Rerolls",
        description: "Get 2 free shop rerolls in next shop",
        cost: 5,
        permanent: false,
        effect: "rerolls"
    }
};

// Get random shop items
export function generateShopInventory(count = 4, exclude = []) {
    const available = Object.values(SHOP_ITEMS).filter(
        item => !exclude.includes(item.id)
    );
    
    const shuffled = available.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Get item by ID
export function getShopItem(itemId) {
    return SHOP_ITEMS[itemId];
}

// Calculate effective cost with discounts
export function getEffectiveCost(item, discounts = {}) {
    let cost = item.cost;
    
    // Apply any discounts here in future
    
    return cost;
}

// Apply shop item effects
export async function applyItemEffect(item, rogueState, gameState) {
    switch (item.effect) {
        case "skipTarget":
            // Skip target - generate new one
            const { getTargetForStage } = await import("./targetPools.js");
            const newTarget = getTargetForStage(rogueState.currentStage);
            gameState.targetPage = newTarget;
            // Update UI
            const targetEl = document.getElementById("target-page");
            if (targetEl) targetEl.textContent = newTarget;
            return { success: true, message: `New target: ${newTarget}` };
            
        case "disableModifier":
            // Disable one modifier
            if (rogueState.activeModifiers.length > 0) {
                const removed = rogueState.activeModifiers.pop();
                return { success: true, message: `Removed: ${removed.name}` };
            }
            return { success: false, message: "No active modifiers" };
            
        case "revive":
            // This is stored as an item and used automatically when clicks reach 0
            return { success: true, message: "Second Chance equipped" };
            
        default:
            // Permanent upgrades are passive
            return { success: true, message: `${item.name} equipped` };
    }
}

// Check if player has specific permanent upgrade
export function hasPermanentUpgrade(rogueState, upgradeId) {
    return rogueState.permanentUpgrades.some(item => item.id === upgradeId);
}

// Calculate bonus clicks from permanent upgrades
export function calculateBonusClicksFromUpgrades(rogueState, baseClickReward, modifierCount) {
    let bonus = 0;
    
    // Efficient Navigator: +2 per stage
    if (hasPermanentUpgrade(rogueState, "efficientNavigator")) {
        bonus += 2;
    }
    
    // Master of Puppets: +2 per modifier
    if (hasPermanentUpgrade(rogueState, "masterOfPuppets")) {
        bonus += modifierCount * 2;
    }
    
    return bonus;
}
