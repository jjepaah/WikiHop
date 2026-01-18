function renderPage(page) {
    const titleEl = document.getElementById("page-title");
    const contentEl = document.getElementById("content");

    titleEl.textContent = page.title;

    const temp = document.createElement("div");
    temp.innerHTML = page.text["*"];

    const article = temp.querySelector(".mw-parser-output");

    if (!article) {
        contentEl.textContent = "Failed to load article content.";
        return;
    }

    article.querySelectorAll(
        ".infobox, .toc, .metadata, .navbox, .vertical-navbox, .mw-editsection"
    ).forEach(el => el.remove());

    contentEl.innerHTML = "";
    contentEl.appendChild(article);

    article.querySelectorAll("a[href^='/wiki/']").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();

            const title = decodeURIComponent(
            link.getAttribute("href").replace("/wiki/", "")
            );

            loadPage(title);
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