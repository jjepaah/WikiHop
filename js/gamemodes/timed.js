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
        this.timerDuration = 300; // 5 minutes in seconds (default)
        this.timerInterval = null;
        this.onTimerEnd = null;
    }

    async initialize(gameState, params = {}) {
        const { startPage, targetPage, timeLimitMinutes } = params;

        // Set time duration based on parameter or use default 5 minutes
        this.timerDuration = (timeLimitMinutes || 5) * 60; // Convert minutes to seconds

        gameState.mode = "timed";
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
            const remaining = Math.max(this.timerDuration - elapsed, 0);
            if (timerEl) timerEl.textContent = remaining.toFixed(2) + "s";

            // Stop updating once we hit zero; the timeout handler will finish the flow
            if (remaining <= 0) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        }, 10);
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
        // Stop and hide timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        const timerDisplay = document.getElementById("timer-display");
        if (timerDisplay) timerDisplay.classList.add("hidden");
    }
}
