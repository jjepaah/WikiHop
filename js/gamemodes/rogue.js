import { BaseModeHandler } from "./baseModeHandler.js";
import { rogueState, resetRogueState, clearModifiers, clearVisitedPages } from "../rogue/rogueState.js";
import { getStartAndTarget } from "../rogue/targetPools.js";

export class RogueMode extends BaseModeHandler {
    constructor() {
        super({
            id: "rogue",
            label: "Rogue",
            description: "Navigate through stages with limited clicks, choose modifiers for rewards, and spend clicks in the shop. Run ends when clicks reach zero.",
            rules: {
                sharedClicks: false,
                sharedTimer: false,
                competitiveScoring: false,
                allowCollaboration: false
            },
            colors: {
                primary: "#9c27b0",  // Purple theme for rogue
                secondary: "#ce93d8"
            },
            isMultiplayer: false
        });
        this.timerInterval = null;
        this.stageStartTime = null;
    }

    async initialize(gameState) {
        // Reset rogue state for new run
        resetRogueState();
        
        // Set initial game state
        gameState.mode = "individual";
        gameState.gamemode = "rogue";
        const { startPage, targetPage } = getStartAndTarget(1);
        gameState.startPage = startPage;
        gameState.targetPage = targetPage;
        gameState.clicks = rogueState.clickBalance;
        gameState.history = [];
        gameState.startTime = Date.now();
        gameState.endTime = null;
        gameState.partyCode = null;

        // Track starting clicks for this stage
        rogueState.clicksAtStageStart = rogueState.clickBalance;

        // Show rogue UI elements
        this.updateRogueUI();
        
        console.log(`Rogue mode initialized - Stage ${rogueState.currentStage}: ${gameState.startPage} → ${gameState.targetPage}`);
    }

    async onPageLoad(gameState, currentPage) {
        // Decrement click balance on each navigation
        if (gameState.history.length > 0) { // Don't decrement on initial page load
            // Check for button smasher modifier
            const { getClickMultiplier } = await import("../rogue/modifiers.js");
            const multiplier = getClickMultiplier(rogueState.activeModifiers);
            rogueState.clickBalance -= multiplier;
        }
        
        // Update game state clicks from rogue balance
        gameState.clicks = rogueState.clickBalance;
        
        // Check if reached target - do this BEFORE checking if out of clicks
        // This allows the last click to win the stage and earn reward clicks
        const reachedTarget = currentPage === gameState.targetPage;
        
        // Check if run should end (out of clicks) - but only if we haven't won
        if (rogueState.clickBalance <= 0 && !reachedTarget) {
            // Check for Second Chance
            const { hasItem, removeItem } = await import("../rogue/rogueState.js");
            if (hasItem("secondChance")) {
                // Use Second Chance
                removeItem("secondChance");
                rogueState.clickBalance = 10;
                gameState.clicks = 10;
                alert("Second Chance activated! You've been revived with 10 clicks.");
                this.updateRogueUI();
            } else {
                this.endRun();
                return;
            }
        }
        
        // Add current page to visited pages
        const { addVisitedPage } = await import("../rogue/rogueState.js");
        addVisitedPage(currentPage);
        
        // Apply modifier effects to the page
        // (renderPageWithTransition now waits for page to be fully rendered)
        const { applyModifierEffects } = await import("../rogue/modifiers.js");
        applyModifierEffects(rogueState.activeModifiers, rogueState.visitedPages);
        
        // Restart timer on every page load if Time Pressure is active
        const { hasTimePressure, getTimeLimit } = await import("../rogue/modifiers.js");
        if (hasTimePressure(rogueState.activeModifiers)) {
            this.stageStartTime = Date.now();
            this.startTimePressureTimer(getTimeLimit(rogueState.activeModifiers));
        }
        
        // Update UI
        this.updateRogueUI();
    }

    async checkWin(gameState) {
        if (gameState.currentPage === gameState.targetPage) {
            // Stop timer if active
            this.stopTimer();
            
            // Calculate stage results
            const clicksUsed = rogueState.clicksAtStageStart - rogueState.clickBalance;
            rogueState.unusedClicksThisStage = rogueState.clickBalance;
            
            return {
                clicks: gameState.clicks,
                timeTaken: ((Date.now() - gameState.startTime) / 1000).toFixed(2),
                isRogueStageComplete: true,
                stageNumber: rogueState.currentStage,
                clicksUsed: clicksUsed,
                unusedClicks: rogueState.unusedClicksThisStage
            };
        }
        return null;
    }

    onWin(winResult) {
        // Don't show standard win modal
        // This will be handled by stage complete logic
        return {
            ...winResult,
            shouldShowWinModal: false
        };
    }

    onEnd() {
        // Hide rogue UI elements
        const rogueStats = document.getElementById("rogue-stats");
        if (rogueStats) {
            rogueStats.classList.add("hidden");
        }
        
        // Clear timer
        this.stopTimer();
        
        console.log("Rogue mode ended");
    }

    startTimePressureTimer(timeLimit) {
        // Clear any existing timer
        this.stopTimer();
        
        const timerDisplay = document.getElementById("timer-display");
        const timerEl = document.getElementById("timer");
        
        if (timerDisplay && timerEl) {
            timerDisplay.classList.remove("hidden");
            
            this.timerInterval = setInterval(() => {
                const elapsed = (Date.now() - this.stageStartTime) / 1000;
                const remaining = Math.max(0, timeLimit - elapsed);
                
                timerEl.textContent = remaining.toFixed(1) + "s";
                
                // Time's up
                if (remaining <= 0) {
                    this.stopTimer();
                    this.handleTimeOut();
                }
            }, 100);
        }
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        const timerDisplay = document.getElementById("timer-display");
        if (timerDisplay) {
            timerDisplay.classList.add("hidden");
        }
    }

    handleTimeOut() {
        alert("Time's up! The stage has failed.");
        this.endRun();
    }

    updateRogueUI() {
        // Show rogue stats sidebar
        const rogueStats = document.getElementById("rogue-stats");
        if (rogueStats) {
            rogueStats.classList.remove("hidden");
        }

        // Only hide timer if it's not currently running
        if (!this.timerInterval) {
            const timerDisplay = document.getElementById("timer-display");
            if (timerDisplay) {
                timerDisplay.classList.add("hidden");
            }
        }

        // Update stage number
        const stageElement = document.getElementById("rogue-stage");
        if (stageElement) {
            stageElement.textContent = rogueState.currentStage;
        }

        // Update score
        const scoreElement = document.getElementById("rogue-score");
        if (scoreElement) {
            scoreElement.textContent = rogueState.totalScore;
        }

        // Update WikiPoints
        const wpElement = document.getElementById("rogue-wikipoints");
        if (wpElement) {
            wpElement.textContent = rogueState.wikiPoints;
        }

        // Update active modifiers list
        const modifierList = document.getElementById("rogue-modifier-list");
        if (modifierList) {
            modifierList.innerHTML = "";
            if (rogueState.activeModifiers.length === 0) {
                modifierList.innerHTML = "<li>None</li>";
            } else {
                rogueState.activeModifiers.forEach(mod => {
                    const li = document.createElement("li");
                    li.textContent = mod.name;
                    modifierList.appendChild(li);
                });
            }
        }

        // Update items list
        const itemList = document.getElementById("rogue-item-list");
        if (itemList) {
            itemList.innerHTML = "";
            const allItems = [...rogueState.permanentUpgrades, ...rogueState.ownedItems];
            if (allItems.length === 0) {
                itemList.innerHTML = "<li>None</li>";
            } else {
                allItems.forEach(item => {
                    const li = document.createElement("li");
                    li.textContent = item.name;
                    itemList.appendChild(li);
                });
            }
        }

        // Update click counter
        const clickCounter = document.getElementById("click-counter");
        if (clickCounter) {
            clickCounter.textContent = rogueState.clickBalance;
        }
    }

    async endRun() {
        const { calculateFinalScore } = await import("../rogue/scoring.js");
        const stagesCompleted = rogueState.currentStage - 1;
        const finalScore = calculateFinalScore(rogueState.totalScore, stagesCompleted);
        
        console.log(`Rogue run ended - Final Score: ${finalScore}, Stages: ${stagesCompleted}`);
        
        // Show final score modal
        const message = `Run Ended!\n\nStages completed: ${stagesCompleted}\nFinal Score: ${finalScore}\nWikiPoints earned: ${rogueState.wikiPoints}\n\nClick OK to return to menu.`;
        alert(message);
        
        // Return to main menu
        document.getElementById("home-btn").click();
    }
}
