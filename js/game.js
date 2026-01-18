const clickCounterEl = document.getElementById("click-counter");
const startPageEl = document.getElementById("start-page");
const targetPageEl = document.getElementById("target-page");

// Main menu
const startModal = document.getElementById("start-modal");
const startPageInput = document.getElementById("start-menu");
const targetPageInput = document.getElementById("target-menu");
const startForm = document.getElementById("start-form");
const langSelect = document.getElementById("wiki-lang");

// Win
const winModal = document.getElementById("win-modal");
const finalClicksEl = document.getElementById("final-clicks");
const newRoundBtn = document.getElementById("new-round-btn");

const gameState = {
    startPage: "Finland",
    targetPage: "Pakkala",
    clicks: 0,
    currentPage: null,
    history: [],
};

startPageEl.textContent = gameState.startPage;
targetPageEl.textContent = gameState.targetPage;
clickCounterEl.textContent = gameState.clicks;

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

function checkWin() {
    if (gameState.currentPage === gameState.targetPage) {
        finalClicksEl.textContent = gameState.clicks;
        winModal.classList.remove("hidden");
        disableAllLinks();
    }
}

function disableAllLinks() {
    document.querySelectorAll("#content a").forEach(link => {
        link.style.pointerEvents = "none";
        link.style.opacity = 0.4;
    });
}

// Main menu start button
startForm.addEventListener("submit", async e => {
    e.preventDefault();

    setWikiLang(langSelect.value);

    let start = startPageInput.value.trim();
    let target = targetPageInput.value.trim();

    if (!start) start = await getRandomPageTitle();
    if (!target) target = await getRandomPageTitle();

    while (target === start) {
        target = getRandomPageTitle();
    }

    gameState.startPage = start;
    gameState.targetPage = target;
    gameState.clicks = 0;
    clickCounterEl.textContent = 0;
    gameState.history = [];

    startModal.style.display = "none";
    updateSidebar();
    loadPage(gameState.startPage, false);
});


// Win screen button
newRoundBtn.addEventListener("click", () => {
    winModal.classList.add("hidden");

    gameState.clicks = 0;
    clickCounterEl.textContent = 0;
    gameState.history = [];
    loadPage(gameState.startPage, false);
})


// Start
startModal.style.display = "flex";
loadPage(gameState.startPage, false);