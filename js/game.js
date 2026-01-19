const clickCounterEl = document.getElementById("click-counter");
const startPageEl = document.getElementById("start-page");
const targetPageEl = document.getElementById("target-page");

// Main menu
const startModal = document.getElementById("start-modal");
const startPageInput = document.getElementById("start-menu");
const targetPageInput = document.getElementById("target-menu");
const startForm = document.getElementById("start-form");
const langSelect = document.getElementById("wiki-lang");
const gamemodeSelect = document.getElementById("gamemode");

// Sidebar
const tooltip = document.getElementById("target-tooltip");
const homeBtn = document.getElementById("home-btn");

// Win
const winModal = document.getElementById("win-modal");
const finalClicksEl = document.getElementById("final-clicks");
const finalTimeEl = document.getElementById("final-time");
const newRoundBtn = document.getElementById("new-round-btn");

const gameState = {
    startPage: "Finland",
    targetPage: "Pakkala",
    clicks: 0,
    currentPage: null,
    history: [],
    mode: "set",

    startTime: null,
    endTime: null
};

startPageEl.textContent = gameState.startPage;
targetPageEl.textContent = gameState.targetPage;
clickCounterEl.textContent = gameState.clicks;

//----------------------------------------------
// Game functions
//----------------------------------------------

async function loadPage(title, isUserClick = true) {
    if (isUserClick) {
        gameState.clicks++;
        clickCounterEl.textContent = gameState.clicks;

        gameState.history.push(title);
    }

    startPageEl.textContent = gameState.startPage;
    targetPageEl.textContent = gameState.targetPage;
    clickCounterEl.textContent = gameState.clicks;

    const page = await fetchPage(title);
    gameState.currentPage = page.title;

    renderPageWithTransition(page);

    checkWin();
}

async function checkWin() {
    if (gameState.currentPage === gameState.targetPage) {
        finalClicksEl.textContent = gameState.clicks;
        winModal.classList.remove("hidden");
        disableAllLinks();
        
        gameState.endTime = Date.now();

        const runTimeMs = gameState.endTime - gameState.startTime;
        const runTimeSeconds = Math.round(runTimeMs / 1000);

        finalTimeEl.textContent = `${runTimeSeconds} seconds`;

        if (gameState.mode === "random") {

            const player = prompt("Enter your name for the leaderboard:") || "Anonymous";
            await saveRandomScore({
                player,
                clicks: gameState.clicks,
                startPage: gameState.startPage,
                targetPage: gameState.targetPage,
                timeMs: runTimeMs
            });

            const leaderboard = await getRandomLeaderboard();
            console.log("Top 10 scores:", leaderboard);
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

// Main menu start button
startForm.addEventListener("submit", async e => {
    e.preventDefault();

    const mode = gamemodeSelect.value;
    gameState.mode = mode;

    if (typeof setWikiLang === "function") setWikiLang(langSelect.value);

    let start = startPageInput.value.trim();
    let target = targetPageInput.value.trim();

    if (mode === "random" || !start) start = await getRandomPageTitle();
    if (mode === "random" || !target) target = await getRandomPageTitle();

    while (target === start) {
        target = await getRandomPageTitle();
    }

    gameState.startPage = start;
    gameState.targetPage = target;
    gameState.clicks = 0;
    clickCounterEl.textContent = 0;
    gameState.history = [];

    startModal.style.display = "none";

    if (mode === "timed") startTimer(360);

    updateSidebar();
    gameState.startTime = Date.now();
    gameState.endTime = null;

    loadPage(gameState.startPage, false);
});

// Exposed function for multiplayer to start the game using the same logic
window.startGameFromParty = async function({ startPage, targetPage, wikiLang, mode } = {}) {
    const m = mode || "set";
    gameState.mode = m;

    if (typeof setWikiLang === "function" && wikiLang) setWikiLang(wikiLang);

    let start = (startPage && startPage.trim()) || (startPageInput.value || "").trim();
    let target = (targetPage && targetPage.trim()) || (targetPageInput.value || "").trim();

    if (m === "random" || !start) start = await getRandomPageTitle();
    if (m === "random" || !target) target = await getRandomPageTitle();

    while (target === start) {
        target = await getRandomPageTitle();
    }

    gameState.startPage = start;
    gameState.targetPage = target;
    gameState.clicks = 0;
    clickCounterEl.textContent = 0;
    gameState.history = [];

    startModal.style.display = "none";

    if (m === "timed") startTimer(360);

    updateSidebar();
    gameState.startTime = Date.now();
    gameState.endTime = null;

    await loadPage(gameState.startPage, false);
};

let tooltipTimeout;

targetPageEl.addEventListener("mouseenter", async () => {
    tooltipTimeout = setTimeout(async () => {
        const firstParagraph = await fetchFirstParagraph(gameState.targetPage);
        console.log("Fetched paragraph:", firstParagraph);
        
        tooltip.textContent = firstParagraph;

        const rect = targetPageEl.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        tooltip.style.left = `${rect.left + window.scrollX}px`;

        tooltip.classList.add("visible");
        tooltip.classList.remove("hidden");
    }, 200);
});

targetPageEl.addEventListener("mouseleave", () => {
    clearTimeout(tooltipTimeout);
    tooltip.classList.remove("visible");
    tooltip.classList.add("hidden");
})

// Win screen button
newRoundBtn.addEventListener("click", () => {
    winModal.classList.add("hidden");

    gameState.clicks = 0;
    clickCounterEl.textContent = 0;
    gameState.history = [];
    startModal.style.display = "flex";
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

homeBtn.addEventListener("click", () => {
    gameState.clicks = 0;
    gameState.history = [];
    clickCounterEl.textContent = 0;

    winModal.classList.add("hidden");
    startModal.style.display = "flex";
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
startModal.style.display = "flex";
loadPage(gameState.startPage, false);