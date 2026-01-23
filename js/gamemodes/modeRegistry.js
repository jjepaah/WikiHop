import { SetRunMode } from "./setRun.js";
import { RandomMode } from "./random.js";
import { TimedMode } from "./timed.js";
import { TeamworkMode } from "./teamwork.js";
import { CompetitionMode } from "./competition.js";
import { RogueMode } from "./rogue.js";

/**
 * Mode Registry
 * Centralized registry for all available gamemodes
 * Provides factory methods to get gamemode instances
 */
export class ModeRegistry {
    constructor() {
        this.modes = new Map();
        this.currentMode = null;
        this.initializeDefaultModes();
    }

    /**
     * Initialize all default gamemodes
     */
    initializeDefaultModes() {
        // Single-player modes
        this.register(new SetRunMode());
        this.register(new RandomMode());
        this.register(new TimedMode());
        this.register(new RogueMode());

        // Multiplayer modes
        this.register(new TeamworkMode());
        this.register(new CompetitionMode());
    }

    /**
     * Register a new gamemode
     * @param {BaseModeHandler} modeInstance - Instance of a gamemode handler
     */
    register(modeInstance) {
        this.modes.set(modeInstance.id, modeInstance);
    }

    /**
     * Get a gamemode by ID
     * @param {string} modeId - The mode ID (e.g., "set", "random", "teamwork")
     * @returns {BaseModeHandler} The gamemode instance
     */
    getMode(modeId) {
        const mode = this.modes.get(modeId);
        if (!mode) {
            throw new Error(`Gamemode "${modeId}" not found in registry`);
        }
        return mode;
    }

    /**
     * Set the current active gamemode
     * @param {string} modeId - The mode ID
     */
    setCurrentMode(modeId) {
        const mode = this.getMode(modeId);
        this.currentMode = mode;
        return mode;
    }

    /**
     * Get the currently active gamemode
     * @returns {BaseModeHandler} The current gamemode
     */
    getCurrentMode() {
        if (!this.currentMode) {
            throw new Error("No gamemode is currently active");
        }
        return this.currentMode;
    }

    /**
     * Get all available gamemodes
     * @returns {Array<Object>} Array of gamemode configs
     */
    getAllModes() {
        return Array.from(this.modes.values()).map(mode => mode.getConfig());
    }

    /**
     * Get all single-player modes
     * @returns {Array<Object>} Array of single-player gamemode configs
     */
    getSinglePlayerModes() {
        return this.getAllModes().filter(mode => !mode.isMultiplayer);
    }

    /**
     * Get all multiplayer modes
     * @returns {Array<Object>} Array of multiplayer gamemode configs
     */
    getMultiplayerModes() {
        return this.getAllModes().filter(mode => mode.isMultiplayer);
    }

    /**
     * Check if a mode is multiplayer
     * @param {string} modeId - The mode ID
     * @returns {boolean} Whether the mode is multiplayer
     */
    isMultiplayer(modeId) {
        const mode = this.getMode(modeId);
        return mode.isMultiplayer;
    }

    /**
     * Check if a rule is enabled for a gamemode
     * @param {string} modeId - The mode ID
     * @param {string} ruleName - The rule name
     * @returns {boolean} Whether the rule is enabled
     */
    isRuleEnabled(modeId, ruleName) {
        const mode = this.getMode(modeId);
        return mode.isRuleEnabled(ruleName);
    }
}

// Create and export a singleton instance
export const modeRegistry = new ModeRegistry();
