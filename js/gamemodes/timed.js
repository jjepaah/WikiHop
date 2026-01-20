import { BaseModeHandler } from "./baseModeHandler.js";

/**
 * Timed Gamemode
 * Race against the clock with a 6-minute timer
 */
export class TimedMode extends BaseModeHandler {
    constructor() {
        super({
            id: "timed",
            label: "Time Attack",
            description: "Reach the target before time runs out",
            rules: {
                sharedClicks: false,
                sharedTimer: false,
                competitiveScoring: false,
                allowCollaboration: false
            },
            colors: {
                primary: "#F44336",
                secondary: "#EF5350"
            },
            isMultiplayer: false
        });
        this.timerDuration = 360; // 6 minutes in seconds
        this.onTimerEnd = null;
    }

    async initialize(gameState, params = {}) {
        const { getRandomPageTitle, startTimer } = params;
        
        if (!getRandomPageTitle || !startTimer) {
            throw new Error("Timed mode requires getRandomPageTitle and startTimer functions");
        }

        gameState.mode = "timed";
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

        // Start the timer
        startTimer(this.timerDuration, () => {
            // Timer ended callback - this will be triggered when time runs out
            if (this.onTimerEnd) {
                this.onTimerEnd(gameState);
            }
        });
    }

    async onPageLoad(gameState, currentPage) {
        // Timed mode has no special page load logic
    }

    async onWin(gameState) {
        gameState.endTime = Date.now();
        const runTimeMs = gameState.endTime - gameState.startTime;

        return {
            clicks: gameState.clicks,
            timeMs: runTimeMs,
            timedOut: false
        };
    }

    /**
     * Called when timer runs out
     */
    async onTimeOut(gameState) {
        gameState.endTime = Date.now();
        return {
            clicks: gameState.clicks,
            timeMs: this.timerDuration * 1000,
            timedOut: true
        };
    }

    /**
     * Set callback for when timer ends
     */
    setTimerEndCallback(callback) {
        this.onTimerEnd = callback;
    }

    async cleanup(gameState) {
        // Timer should be stopped by the game loop
    }
}
