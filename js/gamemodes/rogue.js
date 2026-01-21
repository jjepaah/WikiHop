import { BaseModeHandler } from "./baseModeHandler.js";
import { rogueState, resetRogueState, clearModifiers, clearVisitedPages } from "../rogue/rogueState.js";
import { getTargetForStage, getRandomStartPage } from "../rogue/targetPools.js";

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
    }

    async initialize(gameState) {
        // Reset rogue state for new run
        resetRogueState();
        
        // Set initial game state
        gameState.mode = "individual";
        gameState.gamemode = "rogue";
        gameState.startPage = getRandomStartPage();
        gameState.targetPage = getTargetForStage(1);
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
        
        // Check if run should end (out of clicks)
        if (rogueState.clickBalance <= 0) {
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
        const { applyModifierEffects } = await import("../rogue/modifiers.js");
        applyModifierEffects(rogueState.activeModifiers, rogueState.visitedPages);
        
        // Update UI
        this.updateRogueUI();
    }

    checkWin(gameState) {
        if (gameState.currentPage === gameState.targetPage) {
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
        
        console.log("Rogue mode ended");
    }

    updateRogueUI() {
        // Show rogue stats sidebar
        const rogueStats = document.getElementById("rogue-stats");
        if (rogueStats) {
            rogueStats.classList.remove("hidden");
        }

        // Hide timer display (not used in rogue mode)
        const timerDisplay = document.getElementById("timer-display");
        if (timerDisplay) {
            timerDisplay.classList.add("hidden");
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
