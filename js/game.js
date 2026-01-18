const clickCounterEl = document.getElementById("click-counter");
const startPageEl = document.getElementById("start-page");
const targetPageEl = document.getElementById("target-page");

const gameState = {
    startPage: "Finland",
    targetPage: "Nikkilä",
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
    }

    const page = await fetchPage(title);
    gameState.currentPage = page.title;
    gameState.history.push(page.title);

    renderPageWithTransition(page);
}

// Start here
loadPage("Finland");