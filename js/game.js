const clickCounterEl = document.getElementById("click-counter");
const startPageEl = document.getElementById("start-page");
const targetPageEl = document.getElementById("target-page");

const winModal = document.getElementById("win-modal");
const finalClicksEl = document.getElementById("final-clicks");
const newRoundBtn = document.getElementById("new-round-btn");

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

        gameState.history.push(title);
    }

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

newRoundBtn.addEventListener("click", () => {
    winModal.classList.add("hidden");

    gameState.clicks = 0;
    clickCounterEl.textContent = 0;
    gameState.history = [];
    loadPage(gameState.startPage, false);
})


// Start here
loadPage(gameState.startPage, false);