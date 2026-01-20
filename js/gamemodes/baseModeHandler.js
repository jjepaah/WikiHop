/**
 * Base Gamemode Handler
 * All gamemodes extend this class to provide consistent interface
 */
export class BaseModeHandler {
    constructor(config) {
        this.id = config.id;
        this.label = config.label;
        this.description = config.description;
        this.rules = config.rules;
        this.colors = config.colors;
        this.isMultiplayer = config.isMultiplayer || false;
    }

    /**
     * Called when gamemode is initialized
     * @param {Object} gameState - The game state object
     * @param {Object} params - Additional parameters (startPage, targetPage, wikiLang, partyCode, etc.)
     */
    async initialize(gameState, params = {}) {
        throw new Error("initialize() must be implemented by subclass");
    }

    /**
     * Called on every page load during gameplay
     * @param {Object} gameState - The game state object
     * @param {string} currentPage - The page the player is currently on
     */
    async onPageLoad(gameState, currentPage) {
        // Optional: Override for gamemode-specific logic
    }

    /**
     * Called when win condition is met (player reached target page)
     * @param {Object} gameState - The game state object with clicks, time, etc.
     */
    async onWin(gameState) {
        throw new Error("onWin() must be implemented by subclass");
    }

    /**
     * Called when gamemode is ended/cleaned up
     * @param {Object} gameState - The game state object
     */
    async cleanup(gameState) {
        // Optional: Override for cleanup logic
    }

    /**
     * Check if a specific rule is enabled for this gamemode
     * @param {string} ruleName - Name of the rule to check
     * @returns {boolean} Whether the rule is enabled
     */
    isRuleEnabled(ruleName) {
        return this.rules[ruleName] === true;
    }

    /**
     * Get gamemode configuration
     * @returns {Object} Gamemode config
     */
    getConfig() {
        return {
            id: this.id,
            label: this.label,
            description: this.description,
            rules: this.rules,
            colors: this.colors,
            isMultiplayer: this.isMultiplayer
        };
    }
}
