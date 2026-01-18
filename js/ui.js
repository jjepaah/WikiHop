function renderPage(page) {
    const titleEl = document.getElementById("page-title");
    const contentEl = document.getElementById("content");

    // Set title
    titleEl.textContent = page.title;

    // Parse HTML
    const temp = document.createElement("div");
    temp.innerHTML = page.text["*"];

    const article = temp.querySelector(".mw-parser-output");

    if (!article) {
        contentEl.textContent = "Failed to load article content.";
        return;
    }

    // Remove unwanted UI elements
    article.querySelectorAll(
        ".infobox, .toc, .metadata, .navbox, .vertical-navbox, .mw-editsection"
    ).forEach(el => el.remove());

    contentEl.innerHTML = "";
    contentEl.appendChild(article);

    // Always scroll to top on page load
    window.scrollTo({ top: 0, behavior: "instant" });

    // Link handling
    article.querySelectorAll("a").forEach(link => {
        const href = link.getAttribute("href");
        if (!href) return;

        // Disable red links
        if (link.classList.contains("new")) {
            link.removeAttribute("href");
            link.style.pointerEvents = "none";
            link.style.cursor = "not-allowed";
            return;
        }

        // Only allow wiki navigation
        if (!href.startsWith("/wiki/")) return;

        link.addEventListener("click", e => {
            e.preventDefault();

            const title = decodeURIComponent(
                href.replace("/wiki/", "").replace(/_/g, " ")
            );

            loadPage(title, true);
        });
    });
}

async function renderPageWithTransition(page) {
    const titleEl = document.getElementById("page-title");
    const contentEl = document.getElementById("content");

    // Fade out
    contentEl.style.opacity = 0;
    titleEl.style.opacity = 0;

    // Wait for transition duration
    await new Promise(r => setTimeout(r, 400));

    renderPage(page);

    //Fade in
    requestAnimationFrame(() => {
        contentEl.style.opacity = 1;
        titleEl.style.opacity = 1;
    });
}