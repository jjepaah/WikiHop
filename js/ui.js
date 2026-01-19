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

    // Remove unwanted UI elements (including element with id="stub")
    const removeSelectors = [
        ".infobox",
        ".toc",
        ".mw-heading",
        ".mw-heading2",
        ".mw-heading3",
        ".metadata",
        ".navbox",
        ".vertical-navbox",
        ".sistersitebox",
        ".mw-editsection",
        ".references",
        ".reflist",
        ".ol.references",
        ".reference",
        ".extiw",
        "#stub"
    ];
    article.querySelectorAll(removeSelectors.join(",")).forEach(el => el.remove());

    // Remove lists that only contain external links
    article.querySelectorAll("ul").forEach(ul => {
        if (ul.querySelector("a.external")) ul.remove();
    });

    removeEmptySections(article);

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

        // Only allow internal wiki navigation
        if (!href.startsWith("/wiki/")) return;

        link.addEventListener("click", e => {
            e.preventDefault();
            const raw = href.replace("/wiki/", "").replace(/_/g, " ");
            let title;
            try {
                title = decodeURIComponent(raw);
            } catch {
                title = raw;
            }
            loadPage(title, true);
        });
    });
}

function removeEmptySections(article) {
    const headers = article.querySelectorAll("h2, h3");

    headers.forEach(header => {
        let node = header.nextElementSibling;
        let hasContent = false;

        while (node && !/^H[2-3]$/.test(node.tagName)) {
            if (
                node.textContent.trim() !== "" ||
                node.querySelector("img, table, ul, ol")
            ) {
                hasContent = true;
                break;
            }
            node = node.nextElementSibling;
        }

        if (!hasContent) header.remove();
    });
}

async function renderPageWithTransition(page) {
    const titleEl = document.getElementById("page-title");
    const contentEl = document.getElementById("content");

    contentEl.style.opacity = 0;
    titleEl.style.opacity = 0;

    await new Promise(r => setTimeout(r, 400));

    renderPage(page);

    requestAnimationFrame(() => {
        contentEl.style.opacity = 1;
        titleEl.style.opacity = 1;
    });
}