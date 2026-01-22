import { ui } from "./ui/uiElements.js";
import { renderPageWithTransition } from "./ui.js";
import * as state from "./core/gameState.js";
import { modeRegistry } from "./gamemodes/modeRegistry.js";

// Track timed mode timeout
let timerTimeout = null;

ui.startPageEl.textContent = state.gameState.startPage;
ui.targetPageEl.textContent = state.gameState.targetPage;
ui.clickCounterEl.textContent = state.gameState.clicks;

//----------------------------------------------
// Rogue Mode Stage Handling
//----------------------------------------------

async function handleRogueStageComplete(winResult) {
    const currentMode = modeRegistry.getCurrentMode();
    
    // Import rogue state
    const { rogueState } = await import("./rogue/rogueState.js");
    const { calculateStageScore, getClickReward } = await import("./rogue/scoring.js");
    
    // Calculate score and rewards
    const stageScore = calculateStageScore(
        rogueState.unusedClicksThisStage,
        rogueState.activeModifiers.length
    );
    const clickReward = await getClickReward(rogueState.activeModifiers.length, rogueState);
    
    // Update rogue state
    rogueState.totalScore += stageScore;
    rogueState.clickBalance += clickReward;
    
    // Show stage complete modal
    const modal = document.getElementById("stage-complete-modal");
    document.getElementById("stage-complete-number").textContent = rogueState.currentStage;
    document.getElementById("stage-clicks-used").textContent = winResult.clicksUsed;
    document.getElementById("stage-clicks-remaining").textContent = rogueState.unusedClicksThisStage;
    document.getElementById("stage-clicks-earned").textContent = clickReward;
    document.getElementById("stage-score-earned").textContent = stageScore;
    
    modal.classList.remove("hidden");
    disableAllLinks();
    
    // Update UI
    currentMode.updateRogueUI();
}

//----------------------------------------------
// Game functions
//----------------------------------------------

export async function loadPage(title, isUserClick = true) {
    if (isUserClick) {
        // In Rogue mode, clicks are managed by the gamemode itself (countdown system)
        // For other modes, increment click counter (count up system)
        if (state.gameState.gamemode !== "rogue") {
            state.gameState.clicks++;
            ui.clickCounterEl.textContent = state.gameState.clicks;
        }

        state.gameState.history.push(title);
    }

    ui.startPageEl.textContent = state.gameState.startPage;
    ui.targetPageEl.textContent = state.gameState.targetPage;
    ui.clickCounterEl.textContent = state.gameState.clicks;

    const page = await fetchPage(title);
    state.gameState.currentPage = page.title;

    renderPageWithTransition(page);

    // Call gamemode's onPageLoad hook
    try {
        const currentMode = modeRegistry.getCurrentMode();
        await currentMode.onPageLoad(state.gameState, page.title);
    } catch (e) {
        console.warn("Error in gamemode onPageLoad:", e);
    }

    checkWin();
}

async function checkWin() {
    if (state.gameState.currentPage === state.gameState.targetPage) {
        // Clear any pending timeout for timed mode
        if (timerTimeout) {
            clearTimeout(timerTimeout);
            timerTimeout = null;
        }

        // Call gamemode's checkWin to get result
        const currentMode = modeRegistry.getCurrentMode();
        const winResult = currentMode.checkWin(state.gameState);
        
        // Handle rogue mode stage completion differently
        if (winResult && winResult.isRogueStageComplete) {
            handleRogueStageComplete(winResult);
            return;
        }

        if (ui.winTitleEl) ui.winTitleEl.textContent = "You reached the target!";
        ui.finalClicksEl.textContent = state.gameState.clicks;
        ui.winModal.classList.remove("hidden");
        disableAllLinks();

        state.gameState.endTime = Date.now();

        const runTimeMs = state.gameState.endTime - state.gameState.startTime;
        const runTimeSeconds = (runTimeMs / 1000).toFixed(2);

        ui.finalTimeEl.textContent = `${runTimeSeconds}s`;

        // Call gamemode's onWin handler
        try {
            const onWinResult = await currentMode.onWin(state.gameState);

            // Handle gamemode-specific win logic
            if (onWinResult.shouldSaveLeaderboard) {
                let player = window.getCurrentUsername();
                
                // If guest mode, prompt for username
                if (window.isGuestMode || !player) {
                    player = prompt("Enter your name for the leaderboard:") || "Anonymous";
                }
                
                // Check if it's random or timed mode
                if (state.gameState.mode === "random") {
                    await saveRandomScore({
                        player,
                        clicks: winResult.clicks,
                        startPage: winResult.startPage,
                        targetPage: winResult.targetPage,
                        timeMs: winResult.timeMs
                    });
                    const leaderboard = await getRandomLeaderboard();
                    console.log("Top 10 random scores:", leaderboard);
                } else if (state.gameState.mode === "timed") {
                    await saveTimedScore({
                        player,
                        clicks: winResult.clicks,
                        startPage: winResult.startPage,
                        targetPage: winResult.targetPage,
                        timeLeft: winResult.timeLeft
                    });
                    const leaderboard = await getTimedLeaderboard();
                    console.log("Top 10 timed scores:", leaderboard);
                }
                
                // Reload the leaderboard display
                if (window.reloadLeaderboard) {
                    window.reloadLeaderboard();
                }
            }

            // Handle teamwork notification
            if (winResult.notifyOthers && state.gameState.mode === "party" && state.gameState.gamemode === "teamwork" && window.CURRENT_PARTY) {
                try {
                    const { markPartyAsFinished } = await import("./multiplayer.js");
                    await markPartyAsFinished(window.CURRENT_PARTY);
                } catch (e) {
                    console.warn("Could not mark party as finished:", e);
                }
            }

            // Handle competition winner recording
            if (state.gameState.mode === "party" && state.gameState.gamemode === "competition" && window.CURRENT_PARTY) {
                try {
                    const { setCompetitionWinner } = await import("./multiplayer.js");
                    await setCompetitionWinner(window.CURRENT_PARTY, {
                        clicks: winResult.clicks,
                        timeMs: winResult.timeMs
                    });
                } catch (e) {
                    console.warn("Could not record competition winner:", e);
                }
            }
        } catch (e) {
            console.warn("Error in gamemode onWin:", e);
        }
    }
}

function disableAllLinks() {
    document.querySelectorAll("#content a").forEach(link => {
        link.style.pointerEvents = "none";
        link.style.opacity = 0.4;
    });
}

//----------------------------------------------
// Event listeners
//----------------------------------------------

// Toggle page inputs visibility based on gamemode selection
ui.gamemodeSelect.addEventListener("change", () => {
    const pageInputSections = document.querySelectorAll(".page-input-section");
    const timeLimitSection = document.getElementById("time-limit-section");
    const isRandomMode = ui.gamemodeSelect.value === "random";
    const isTimedMode = ui.gamemodeSelect.value === "timed";
    const isRogueMode = ui.gamemodeSelect.value === "rogue";
    
    pageInputSections.forEach(section => {
        section.style.display = (isRandomMode || isRogueMode) ? "none" : "flex";
    });
    
    // Show time limit section only for timed mode
    if (timeLimitSection) {
        timeLimitSection.classList.toggle("hidden", !isTimedMode);
    }
});

// Trigger change event on page load to set initial state
ui.gamemodeSelect.dispatchEvent(new Event("change"));

// Handle custom time limit input visibility
const timeLimitPreset = document.getElementById("time-limit-preset");
if (timeLimitPreset) {
    timeLimitPreset.addEventListener("change", () => {
        const customTimeWrapper = document.getElementById("custom-time-input-wrapper");
        if (customTimeWrapper) {
            customTimeWrapper.style.display = timeLimitPreset.value === "custom" ? "block" : "none";
        }
    });
}

// Main menu start button - single player
ui.startForm.addEventListener("submit", async e => {
    e.preventDefault();

    const modeId = ui.gamemodeSelect.value;
    
    // Set current gamemode in registry
    const currentMode = modeRegistry.setCurrentMode(modeId);

    if (typeof setWikiLang === "function") setWikiLang(ui.langSelect.value);

    let start = ui.startPageInput.value.trim();
    let target = ui.targetPageInput.value.trim();

    // Handle page generation based on gamemode
    if (modeId === "rogue") {
        // Rogue mode handles its own page generation
        // Initialize directly without passing start/target
        await currentMode.initialize(state.gameState);
        
        ui.startModal.style.display = "none";
        loadPage(state.gameState.startPage, false);
        return; // Exit early for rogue mode
    } else if (modeId === "random") {
        // Random mode: always generate both pages
        start = await getRandomPageTitle();
        target = await getRandomPageTitle();
        while (target === start) {
            target = await getRandomPageTitle();
        }
    } else if (modeId === "set" || modeId === "timed") {
        // Set Run and Time Attack: flexible input logic
        // If only start is provided, generate target
        if (start && !target) {
            target = await getRandomPageTitle();
        }
        // If only target is provided, generate start
        else if (!start && target) {
            start = await getRandomPageTitle();
        }
        // If neither provided, generate both
        else if (!start && !target) {
            start = await getRandomPageTitle();
            target = await getRandomPageTitle();
        }
        // If both provided, use them as-is
        
        // Ensure start and target are different
        while (target === start) {
            target = await getRandomPageTitle();
        }
    }

    // For timed mode, get the custom time limit if provided
    let timeLimitMinutes = 5; // default
    let timeLimitPreset = "standard";
    let arePagesRandom = false;
    
    if (modeId === "timed") {
        const timeLimitPresetEl = document.getElementById("time-limit-preset");
        if (timeLimitPresetEl) {
            timeLimitPreset = timeLimitPresetEl.value;
            if (timeLimitPreset === "custom") {
                const customTimeInput = document.getElementById("custom-time-input");
                if (customTimeInput && customTimeInput.value) {
                    timeLimitMinutes = parseInt(customTimeInput.value) || 5;
                }
            }
        }
        
        // Check if both pages were randomly generated (not user-provided)
        const startInput = ui.startPageInput.value.trim();
        const targetInput = ui.targetPageInput.value.trim();
        arePagesRandom = (!startInput && !targetInput);
    }

    // Initialize the gamemode with necessary params
    await currentMode.initialize(state.gameState, {
        startPage: start,
        targetPage: target,
        wikiLang: ui.langSelect.value,
        getRandomPageTitle,
        timeLimitMinutes,
        timeLimitPreset,
        arePagesRandom
    });

    // For timed mode, set up timeout to end game after time limit
    if (timerTimeout) {
        clearTimeout(timerTimeout);
    }
    if (modeId === "timed") {
        const timeoutMs = timeLimitMinutes * 60 * 1000; // Convert to milliseconds
        timerTimeout = setTimeout(() => {
            // Time's up - show game over
            if (state.gameState.currentPage !== state.gameState.targetPage) {
                if (ui.winTitleEl) ui.winTitleEl.textContent = "Your time ran out";
                ui.finalClicksEl.textContent = state.gameState.clicks;
                ui.finalTimeEl.textContent = `${(timeLimitMinutes * 60).toFixed(2)}s`;
                ui.winModal.classList.remove("hidden");
                disableAllLinks();
                // Clean up the gamemode
                const currentMode = modeRegistry.getCurrentMode();
                if (currentMode && currentMode.cleanup) {
                    currentMode.cleanup(state.gameState);
                }
            }
        }, timeoutMs);
    }

    // For timed mode, the timer is started inside initialize
    // For other modes, we don't need separate timer setup

    ui.clickCounterEl.textContent = 0;
    ui.startModal.style.display = "none";

    updateSidebar();
    resetTargetInfo();

    loadPage(state.gameState.startPage, false);
});

// Exposed function for multiplayer to start the game using the same logic
window.startGameFromParty = async function({ startPage, targetPage, wikiLang, mode, partyCode, gamemode } = {}) {
    const modeId = gamemode || "teamwork";
    
    // Set current gamemode in registry
    const currentMode = modeRegistry.setCurrentMode(modeId);

    if (typeof setWikiLang === "function" && wikiLang) setWikiLang(wikiLang);

    // Initialize the gamemode with party params
    await currentMode.initialize(state.gameState, {
        startPage,
        targetPage,
        wikiLang,
        partyCode,
        getRandomPageTitle: modeId === "random" ? getRandomPageTitle : undefined
    });

    ui.clickCounterEl.textContent = 0;
    ui.startModal.style.display = "none";

    updateSidebar();
    resetTargetInfo();

    await loadPage(state.gameState.startPage, false);
};

// Target info expandable - click to toggle
let targetInfoLoaded = false;

ui.targetPageEl.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isCollapsed = ui.tooltip.classList.contains("collapsed");
    
    if (!isCollapsed) {
        // Collapse
        ui.tooltip.classList.add("collapsed");
    } else {
        // Expand - load content if not already loaded
        if (!targetInfoLoaded) {
            const firstParagraph = await window.fetchFirstParagraph(state.gameState.targetPage);
            console.log("Fetched first paragraph:", firstParagraph);
            ui.tooltip.textContent = firstParagraph;
            targetInfoLoaded = true;
        }
        
        ui.tooltip.classList.remove("collapsed");
    }
});

// Reset target info when game state changes
export function resetTargetInfo() {
    targetInfoLoaded = false;
    ui.tooltip.classList.add("collapsed");
    ui.tooltip.textContent = "";
}

// Win screen button
ui.newRoundBtn.addEventListener("click", () => {
    ui.winModal.classList.add("hidden");

    state.gameState.clicks = 0;
    ui.clickCounterEl.textContent = 0;
    state.gameState.history = [];
    resetTargetInfo();
    ui.startModal.style.display = "flex";
    // restore start/join buttons if they were hidden for a party host
    const startBtn = document.getElementById("start-game-btn");
    if (startBtn) startBtn.style.display = "";
    const joinBtn = document.getElementById("join-party-btn");
    if (joinBtn) joinBtn.style.display = "";
    const createBtn = document.getElementById("create-party-btn");
    if (createBtn) createBtn.style.display = "";
    // restore other start-box children (inputs, form) in case they were hidden for joiners
    try {
        const startBox = document.getElementById("start-box");
        if (startBox) Array.from(startBox.children).forEach(child => child.style.display = "");
    } catch (e) {
        console.warn("Could not restore start-box children:", e);
    }
})

// Rogue mode: Stage complete continue button
const continueStageBtn = document.getElementById("continue-stage-btn");
if (continueStageBtn) {
    continueStageBtn.addEventListener("click", async () => {
        const modal = document.getElementById("stage-complete-modal");
        modal.classList.add("hidden");
        
        // Progress to next stage
        const currentMode = modeRegistry.getCurrentMode();
        if (currentMode.id === "rogue") {
            const { rogueState, clearModifiers, clearVisitedPages } = await import("./rogue/rogueState.js");
            const { calculateWikiPoints } = await import("./rogue/scoring.js");
            
            // Award WikiPoints
            const wikiPoints = calculateWikiPoints(rogueState.activeModifiers.length);
            rogueState.wikiPoints += wikiPoints;
            
            // Clear stage-specific state
            clearModifiers();
            clearVisitedPages();
            
            // Increment stage
            rogueState.currentStage++;
            
            // Show modifier selection modal
            await showModifierSelectionModal();
        }
    });
}

ui.homeBtn.addEventListener("click", () => {
    state.gameState.clicks = 0;
    state.gameState.history = [];
    ui.clickCounterEl.textContent = 0;
    resetTargetInfo();

    ui.winModal.classList.add("hidden");
    ui.startModal.style.display = "flex";
    // restore start/join buttons if they were hidden for a party host
    const startBtn2 = document.getElementById("start-game-btn");
    if (startBtn2) startBtn2.style.display = "";
    const joinBtn2 = document.getElementById("join-party-btn");
    if (joinBtn2) joinBtn2.style.display = "";
    const createBtn2 = document.getElementById("create-party-btn");
    if (createBtn2) createBtn2.style.display = "";
    try {
        const startBox2 = document.getElementById("start-box");
        if (startBox2) Array.from(startBox2.children).forEach(child => child.style.display = "");
    } catch (e) {
        console.warn("Could not restore start-box children:", e);
    }
});

//----------------------------------------------
// Rogue Mode: Modifier Selection
//----------------------------------------------

async function showModifierSelectionModal() {
    const { rogueState, addModifier } = await import("./rogue/rogueState.js");
    const { getRandomModifiers } = await import("./rogue/modifiers.js");
    const { getDifficultyMultiplier, getClickReward } = await import("./rogue/scoring.js");
    
    const modal = document.getElementById("modifier-selection-modal");
    const optionsContainer = document.getElementById("modifier-options");
    const clicksDisplay = document.getElementById("modifier-clicks-display");
    const confirmBtn = document.getElementById("confirm-modifiers-btn");
    
    // Update clicks display
    clicksDisplay.textContent = rogueState.clickBalance;
    
    // Clear previous options
    optionsContainer.innerHTML = "";
    
    // Generate modifier options (0-3 modifiers)
    let selectedDifficulty = null;
    
    for (let count = 0; count <= 3; count++) {
        const choiceDiv = document.createElement("div");
        choiceDiv.className = "modifier-choice";
        choiceDiv.dataset.difficulty = count;
        
        const header = document.createElement("div");
        header.className = "modifier-choice-header";
        
        const title = document.createElement("div");
        title.className = "modifier-choice-title";
        const difficultyNames = ["No Challenge", "Easy", "Medium", "Hard"];
        title.textContent = `${difficultyNames[count]} (${count} modifier${count !== 1 ? 's' : ''})`;
        
        const reward = document.createElement("div");
        reward.className = "modifier-reward";
        const clickReward = await getClickReward(count, rogueState);
        const multiplier = getDifficultyMultiplier(count);
        reward.textContent = `+${clickReward} clicks, ×${multiplier} score`;
        
        header.appendChild(title);
        header.appendChild(reward);
        choiceDiv.appendChild(header);
        
        // Show random modifiers for this difficulty
        if (count > 0) {
            const randomMods = getRandomModifiers(count);
            const modList = document.createElement("ul");
            modList.className = "modifier-list";
            
            randomMods.forEach(mod => {
                const li = document.createElement("li");
                li.textContent = `• ${mod.name}: ${mod.description}`;
                li.dataset.modId = mod.id;
                modList.appendChild(li);
            });
            
            choiceDiv.appendChild(modList);
            choiceDiv.dataset.modifiers = JSON.stringify(randomMods.map(m => m.id));
        } else {
            choiceDiv.dataset.modifiers = JSON.stringify([]);
        }
        
        // Click handler
        choiceDiv.addEventListener("click", () => {
            // Remove previous selection
            document.querySelectorAll(".modifier-choice").forEach(choice => {
                choice.classList.remove("selected");
            });
            
            // Select this choice
            choiceDiv.classList.add("selected");
            selectedDifficulty = count;
        });
        
        optionsContainer.appendChild(choiceDiv);
    }
    
    // Auto-select no challenge option
    optionsContainer.firstChild.classList.add("selected");
    selectedDifficulty = 0;
    
    // Show modal
    modal.classList.remove("hidden");
    
    // Wait for confirmation
    return new Promise((resolve) => {
        const handler = async () => {
            if (selectedDifficulty === null) return;
            
            // Get selected choice
            const selectedChoice = document.querySelector(".modifier-choice.selected");
            const modifierIds = JSON.parse(selectedChoice.dataset.modifiers);
            
            // Import and add modifiers
            const { getModifier } = await import("./rogue/modifiers.js");
            modifierIds.forEach(modId => {
                const modifier = getModifier(modId);
                addModifier(modifier);
            });
            
            // Hide modal
            modal.classList.add("hidden");
            
            // Remove event listener
            confirmBtn.removeEventListener("click", handler);
            
            // Show shop before starting stage
            await showShopModal();
            
            // Start new stage
            await startNewRogueStage();
            
            resolve();
        };
        
        confirmBtn.addEventListener("click", handler);
    });
}

async function showShopModal() {
    const { rogueState, addItem, removeItem, hasItem } = await import("./rogue/rogueState.js");
    const { generateShopInventory, applyItemEffect } = await import("./rogue/shop.js");
    
    const modal = document.getElementById("shop-modal");
    const itemsContainer = document.getElementById("shop-items");
    const clicksDisplay = document.getElementById("shop-clicks-display");
    const closeBtn = document.getElementById("close-shop-btn");
    const rerollBtn = document.getElementById("reroll-shop-btn");
    
    let currentInventory = [];
    let rerollCost = 4;
    const ownedIds = new Set([
        ...rogueState.permanentUpgrades.map(i => i.id),
        ...rogueState.ownedItems.map(i => i.id)
    ]);
    
    function renderShop() {
        clicksDisplay.textContent = rogueState.clickBalance;
        itemsContainer.innerHTML = "";
        
        currentInventory.forEach(item => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "shop-item";
            
            const alreadyOwned = ownedIds.has(item.id);
            if (alreadyOwned) {
                itemDiv.classList.add("purchased");
            }
            
            const header = document.createElement("div");
            header.className = "shop-item-header";
            
            const name = document.createElement("div");
            name.className = "shop-item-name";
            name.textContent = item.name;
            
            const cost = document.createElement("div");
            cost.className = "shop-item-cost";
            cost.textContent = `${item.cost} clicks`;
            
            header.appendChild(name);
            header.appendChild(cost);
            
            const description = document.createElement("div");
            description.className = "shop-item-description";
            description.textContent = item.description;
            
            const type = document.createElement("div");
            type.className = "shop-item-type";
            type.textContent = item.permanent ? "Permanent Upgrade" : "Consumable";
            
            const buyBtn = document.createElement("button");
            buyBtn.className = "shop-item-buy-btn";
            
            if (alreadyOwned) {
                buyBtn.textContent = "Owned";
                buyBtn.disabled = true;
            } else if (rogueState.clickBalance < item.cost) {
                buyBtn.textContent = "Not Enough Clicks";
                buyBtn.disabled = true;
            } else {
                buyBtn.textContent = "Buy";
                buyBtn.addEventListener("click", async () => {
                    // Purchase item
                    rogueState.clickBalance -= item.cost;
                    addItem(item);
                    ownedIds.add(item.id);
                    
                    // Apply immediate effects
                    const result = await applyItemEffect(item, rogueState, state.gameState);
                    if (result.message) {
                        console.log(result.message);
                    }
                    
                    // Re-render shop
                    renderShop();
                    
                    // Update rogue UI
                    const currentMode = modeRegistry.getCurrentMode();
                    if (currentMode) currentMode.updateRogueUI();
                });
            }
            
            itemDiv.appendChild(header);
            itemDiv.appendChild(description);
            itemDiv.appendChild(type);
            itemDiv.appendChild(buyBtn);
            
            itemsContainer.appendChild(itemDiv);
        });
        
        // Update reroll button
        rerollBtn.textContent = `Reroll (${rerollCost} clicks)`;
        rerollBtn.disabled = rogueState.clickBalance < rerollCost;
    }
    
    // Generate initial inventory
    currentInventory = generateShopInventory(4);
    renderShop();
    
    // Reroll handler
    const rerollHandler = () => {
        if (rogueState.clickBalance >= rerollCost) {
            rogueState.clickBalance -= rerollCost;
            currentInventory = generateShopInventory(4);
            renderShop();
        }
    };
    rerollBtn.addEventListener("click", rerollHandler);
    
    // Show modal
    modal.classList.remove("hidden");
    
    // Wait for close
    return new Promise((resolve) => {
        const closeHandler = () => {
            modal.classList.add("hidden");
            closeBtn.removeEventListener("click", closeHandler);
            rerollBtn.removeEventListener("click", rerollHandler);
            resolve();
        };
        closeBtn.addEventListener("click", closeHandler);
    });
}

async function startNewRogueStage() {
    const { rogueState } = await import("./rogue/rogueState.js");
    const { getStartAndTarget } = await import("./rogue/targetPools.js");
    const currentMode = modeRegistry.getCurrentMode();
    
    // Set new start and target (ensuring they're different)
    const { startPage, targetPage } = getStartAndTarget(rogueState.currentStage);
    state.gameState.startPage = startPage;
    state.gameState.targetPage = targetPage;
    state.gameState.clicks = rogueState.clickBalance;
    state.gameState.history = [];
    state.gameState.startTime = Date.now();
    
    // Track starting clicks for new stage
    rogueState.clicksAtStageStart = rogueState.clickBalance;
    
    // Reset target info for new stage
    resetTargetInfo();
    
    // Update UI
    currentMode.updateRogueUI();
    
    // Load the new start page
    await loadPage(state.gameState.startPage, false);
    
    console.log(`Starting Stage ${rogueState.currentStage}: ${state.gameState.startPage} → ${state.gameState.targetPage}`);
}

// Start
ui.startModal.style.display = "flex";
loadPage(state.gameState.startPage, false);