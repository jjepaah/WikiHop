import { BaseModeHandler } from "./baseModeHandler.js";

/**
 * Set Run Gamemode
 * Player manually chooses start and target pages
 */
export class SetRunMode extends BaseModeHandler {
    constructor() {
        super({
            id: "set",
            label: "Set Run",
            description: "Choose your start and target pages",
            rules: {
                sharedClicks: false,
                sharedTimer: false,
                competitiveScoring: false,
                allowCollaboration: false
            },
            colors: {
                primary: "#2196F3",
                secondary: "#64B5F6"
            },
            isMultiplayer: false
        });
        this.timerInterval = null;
    }

    async initialize(gameState, params = {}) {
        const { startPage, targetPage, wikiLang } = params;
        
        gameState.mode = "set";
        gameState.gamemode = "individual";
        gameState.startPage = startPage;
        gameState.targetPage = targetPage;
        gameState.clicks = 0;
        gameState.history = [];
        gameState.startTime = Date.now();
        gameState.endTime = null;
        gameState.partyCode = null;

        // Show timer and start updating it
        const timerDisplay = document.getElementById("timer-display");
        const timerEl = document.getElementById("timer");
        if (timerDisplay) timerDisplay.classList.remove("hidden");
        
        this.timerInterval = setInterval(() => {
            const elapsed = (Date.now() - gameState.startTime) / 1000;
            if (timerEl) timerEl.textContent = elapsed.toFixed(2) + "s";
        }, 10);
    }

    async onPageLoad(gameState, currentPage) {
        // Set run mode has no special page load logic
    }

    async onWin(gameState) {
        // Set run mode has no special win logic
        // Just return the stats
        return {
            clicks: gameState.clicks,
            timeMs: gameState.endTime - gameState.startTime
        };
    }

    async cleanup(gameState) {
        // Stop and hide timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        const timerDisplay = document.getElementById("timer-display");
        if (timerDisplay) timerDisplay.classList.add("hidden");
    }
}
