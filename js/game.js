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
// Game functions
//----------------------------------------------

export async function loadPage(title, isUserClick = true) {
    if (isUserClick) {
        state.gameState.clicks++;
        ui.clickCounterEl.textContent = state.gameState.clicks;

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
            const currentMode = modeRegistry.getCurrentMode();
            const winResult = await currentMode.onWin(state.gameState);

            // Handle gamemode-specific win logic
            if (winResult.shouldSaveLeaderboard) {
                const player = prompt("Enter your name for the leaderboard:") || "Anonymous";
                
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
    
    pageInputSections.forEach(section => {
        section.style.display = isRandomMode ? "none" : "flex";
    });
    
    // Show time limit section only for timed mode
    if (timeLimitSection) {
        timeLimitSection.classList.toggle("hidden", !isTimedMode);
    }
});

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
    if (modeId === "random") {
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

    await loadPage(state.gameState.startPage, false);
};

let tooltipTimeout;

ui.targetPageEl.addEventListener("mouseenter", async () => {
    tooltipTimeout = setTimeout(async () => {
        const firstParagraph = await fetchFirstParagraph(state.gameState.targetPage);
        console.log("Fetched paragraph:", firstParagraph);
        
        ui.tooltip.textContent = firstParagraph;

        const rect = ui.targetPageEl.getBoundingClientRect();
        ui.tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        ui.tooltip.style.left = `${rect.left + window.scrollX}px`;

        ui.tooltip.classList.add("visible");
        ui.tooltip.classList.remove("hidden");
    }, 200);
});

ui.targetPageEl.addEventListener("mouseleave", () => {
    clearTimeout(tooltipTimeout);
    ui.tooltip.classList.remove("visible");
    ui.tooltip.classList.add("hidden");
})

// Win screen button
ui.newRoundBtn.addEventListener("click", () => {
    ui.winModal.classList.add("hidden");

    state.gameState.clicks = 0;
    ui.clickCounterEl.textContent = 0;
    state.gameState.history = [];
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

ui.homeBtn.addEventListener("click", () => {
    state.gameState.clicks = 0;
    state.gameState.history = [];
    ui.clickCounterEl.textContent = 0;

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

// Start
ui.startModal.style.display = "flex";
loadPage(state.gameState.startPage, false);