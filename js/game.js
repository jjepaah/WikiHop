import { ui } from "./ui/uiElements.js";
import { renderPageWithTransition } from "./ui.js";
import * as state from "./core/gameState.js";
import { modeRegistry } from "./gamemodes/modeRegistry.js";

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
        ui.finalClicksEl.textContent = state.gameState.clicks;
        ui.winModal.classList.remove("hidden");
        disableAllLinks();

        state.gameState.endTime = Date.now();

        const runTimeMs = state.gameState.endTime - state.gameState.startTime;
        const runTimeSeconds = Math.round(runTimeMs / 1000);

        ui.finalTimeEl.textContent = `${runTimeSeconds} seconds`;

        // Call gamemode's onWin handler
        try {
            const currentMode = modeRegistry.getCurrentMode();
            const winResult = await currentMode.onWin(state.gameState);

            // Handle gamemode-specific win logic
            if (winResult.shouldSaveLeaderboard) {
                const player = prompt("Enter your name for the leaderboard:") || "Anonymous";
                await saveRandomScore({
                    player,
                    clicks: winResult.clicks,
                    startPage: winResult.startPage,
                    targetPage: winResult.targetPage,
                    timeMs: winResult.timeMs
                });

                const leaderboard = await getRandomLeaderboard();
                console.log("Top 10 scores:", leaderboard);
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
    const isRandomMode = ui.gamemodeSelect.value === "random";
    
    pageInputSections.forEach(section => {
        section.style.display = isRandomMode ? "none" : "flex";
    });
});

// Main menu start button - single player
ui.startForm.addEventListener("submit", async e => {
    e.preventDefault();

    const modeId = ui.gamemodeSelect.value;
    
    // Set current gamemode in registry
    const currentMode = modeRegistry.setCurrentMode(modeId);

    if (typeof setWikiLang === "function") setWikiLang(ui.langSelect.value);

    let start = ui.startPageInput.value.trim();
    let target = ui.targetPageInput.value.trim();

    // For random mode, generate random pages if not provided
    if (modeId === "random" || !start) start = await getRandomPageTitle();
    if (modeId === "random" || !target) target = await getRandomPageTitle();

    while (target === start) {
        target = await getRandomPageTitle();
    }

    // Initialize the gamemode with necessary params
    await currentMode.initialize(state.gameState, {
        startPage: start,
        targetPage: target,
        wikiLang: ui.langSelect.value,
        getRandomPageTitle
    });

    // For timed mode, set up timer
    if (modeId === "timed") {
        startTimer(360);
    }

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