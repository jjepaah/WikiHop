import { BaseModeHandler } from "./baseModeHandler.js";

/**
 * Random Gamemode
 * Both start and target pages are randomly generated
 * Scores are saved to leaderboard
 */
export class RandomMode extends BaseModeHandler {
    constructor() {
        super({
            id: "random",
            label: "Random",
            description: "Race with random start and target pages",
            rules: {
                sharedClicks: false,
                sharedTimer: false,
                competitiveScoring: true,
                allowCollaboration: false
            },
            colors: {
                primary: "#FF9800",
                secondary: "#FFB74D"
            },
            isMultiplayer: false
        });
    }

    async initialize(gameState, params = {}) {
        const { getRandomPageTitle } = params;
        
        if (!getRandomPageTitle) {
            throw new Error("Random mode requires getRandomPageTitle function");
        }

        gameState.mode = "random";
        gameState.gamemode = "individual";
        gameState.clicks = 0;
        gameState.history = [];
        gameState.startTime = Date.now();
        gameState.endTime = null;
        gameState.partyCode = null;

        // Generate random start and target
        let startPage = await getRandomPageTitle();
        let targetPage = await getRandomPageTitle();

        while (targetPage === startPage) {
            targetPage = await getRandomPageTitle();
        }

        gameState.startPage = startPage;
        gameState.targetPage = targetPage;
    }

    async onPageLoad(gameState, currentPage) {
        // Random mode has no special page load logic
    }

    async onWin(gameState) {
        gameState.endTime = Date.now();
        const runTimeMs = gameState.endTime - gameState.startTime;

        // Return win stats with leaderboard flag
        return {
            clicks: gameState.clicks,
            timeMs: runTimeMs,
            shouldSaveLeaderboard: true,
            startPage: gameState.startPage,
            targetPage: gameState.targetPage
        };
    }

    async cleanup(gameState) {
        // No special cleanup needed
    }
}
