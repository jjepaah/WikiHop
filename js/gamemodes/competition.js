import { BaseModeHandler } from "./baseModeHandler.js";

/**
 * Competition Gamemode (Multiplayer)
 * Players race against each other independently
 * Individual scores and stats are tracked
 */
export class CompetitionMode extends BaseModeHandler {
    constructor() {
        super({
            id: "competition",
            label: "Competition",
            description: "Race against other players",
            rules: {
                sharedClicks: false,
                sharedTimer: true,
                competitiveScoring: true,
                allowCollaboration: false
            },
            colors: {
                primary: "#FF6B6B",
                secondary: "#FF8A8A"
            },
            isMultiplayer: true
        });
    }

    async initialize(gameState, params = {}) {
        const { startPage, targetPage, wikiLang, partyCode } = params;
        
        gameState.mode = "party";
        gameState.gamemode = "competition";
        gameState.startPage = startPage;
        gameState.targetPage = targetPage;
        gameState.clicks = 0;
        gameState.history = [];
        gameState.startTime = Date.now();
        gameState.endTime = null;
        gameState.partyCode = partyCode;
    }

    async onPageLoad(gameState, currentPage) {
        // Competition mode has no special page load logic
        // Clicks are tracked independently per player
    }

    async onWin(gameState) {
        gameState.endTime = Date.now();
        const runTimeMs = gameState.endTime - gameState.startTime;

        // Return individual stats (not shared with team)
        return {
            clicks: gameState.clicks,
            timeMs: runTimeMs,
            partyCode: gameState.partyCode,
            notifyOthers: false  // Don't force other players to see win modal
        };
    }

    async cleanup(gameState) {
        // No special cleanup needed
    }

    /**
     * Get competitive ranking data
     * (Can be extended to show leaderboard, player positions, etc.)
     */
    getCompetitiveStats(playerStats) {
        // Sort by clicks (ascending), then by time (ascending)
        return playerStats.sort((a, b) => {
            if (a.clicks !== b.clicks) {
                return a.clicks - b.clicks;
            }
            return a.timeMs - b.timeMs;
        });
    }

    /**
     * Check if individual scores should be tracked
     */
    hasIndividualScoring() {
        return this.isRuleEnabled("competitiveScoring");
    }
}
