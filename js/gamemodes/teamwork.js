import { BaseModeHandler } from "./baseModeHandler.js";

/**
 * Teamwork Gamemode (Multiplayer)
 * Players work together to reach the target
 * When any player reaches target, all players see the win screen
 */
export class TeamworkMode extends BaseModeHandler {
    constructor() {
        super({
            id: "teamwork",
            label: "Teamwork",
            description: "Work together to reach the target",
            rules: {
                sharedClicks: true,
                sharedTimer: true,
                competitiveScoring: false,
                allowCollaboration: true
            },
            colors: {
                primary: "#4CAF50",
                secondary: "#81C784"
            },
            isMultiplayer: true
        });
    }

    async initialize(gameState, params = {}) {
        const { startPage, targetPage, wikiLang, partyCode } = params;
        
        gameState.mode = "party";
        gameState.gamemode = "teamwork";
        gameState.startPage = startPage;
        gameState.targetPage = targetPage;
        gameState.clicks = 0;
        gameState.history = [];
        gameState.startTime = Date.now();
        gameState.endTime = null;
        gameState.partyCode = partyCode;
    }

    async onPageLoad(gameState, currentPage) {
        // Teamwork mode has no special page load logic
        // Clicks are tracked normally in shared game loop
    }

    async onWin(gameState) {
        gameState.endTime = Date.now();
        const runTimeMs = gameState.endTime - gameState.startTime;

        // This will notify other players
        return {
            clicks: gameState.clicks,
            timeMs: runTimeMs,
            partyCode: gameState.partyCode,
            notifyOthers: true
        };
    }

    async cleanup(gameState) {
        // No special cleanup needed
    }

    /**
     * Check if clicks should be shared across team
     */
    isClicksShared() {
        return this.isRuleEnabled("sharedClicks");
    }

    /**
     * Check if timer should be shared across team
     */
    isTimerShared() {
        return this.isRuleEnabled("sharedTimer");
    }
}
