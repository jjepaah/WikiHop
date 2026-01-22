import { ui } from "./ui/uiElements.js";
import { loadPage } from "./game.js";

function renderPage(page) {
    ui.titleEl.textContent = page.title;

    const temp = document.createElement("div");
    temp.innerHTML = page.text["*"];

    const article = temp.querySelector(".mw-parser-output");

    if (!article) {
        ui.contentEl.textContent = "Failed to load article content.";
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

    ui.contentEl.innerHTML = "";
    ui.contentEl.appendChild(article);

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

        // Skip external links and anchor links (like those in help documentation)
        if (link.classList.contains('external-link') || link.classList.contains('anchor-link')) return;

        // Only allow internal wiki navigation
        if (!href.startsWith("/wiki/")) return;

        link.addEventListener("click", async e => {
            e.preventDefault();
            const raw = href.replace("/wiki/", "").replace(/_/g, " ");
            let title;
            try {
                title = decodeURIComponent(raw);
            } catch {
                title = raw;
            }
            
            // Check if this is the target page and validate modifiers before navigating
            const { gameState } = await import("./core/gameState.js");
            if (gameState.gamemode === "rogue" && title === gameState.targetPage) {
                const { rogueState } = await import("./rogue/rogueState.js");
                const { hasScenicRoute, getMinClicks } = await import("./rogue/modifiers.js");
                
                console.log("Target clicked! Active modifiers:", rogueState.activeModifiers);
                console.log("Has scenic route:", hasScenicRoute(rogueState.activeModifiers));
                
                if (hasScenicRoute(rogueState.activeModifiers)) {
                    const minClicks = getMinClicks(rogueState.activeModifiers);
                    // Add 1 to account for the click that's about to happen
                    const clicksUsed = rogueState.clicksAtStageStart - rogueState.clickBalance + 1;
                    
                    console.log(`Scenic Route check: ${clicksUsed} clicks used, need ${minClicks}`);
                    
                    if (clicksUsed < minClicks) {
                        alert(`Scenic Route requires at least ${minClicks} clicks. You will have used ${clicksUsed}. Keep exploring!`);
                        return; // Don't navigate
                    }
                }
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

export async function renderPageWithTransition(page) {
    ui.contentEl.style.opacity = 0;
    ui.titleEl.style.opacity = 0;

    await new Promise(r => setTimeout(r, 400));

    renderPage(page);

    // Wait for both requestAnimationFrame and allow fade-in to start
    await new Promise(resolve => {
        requestAnimationFrame(() => {
            ui.contentEl.style.opacity = 1;
            ui.titleEl.style.opacity = 1;
            // Wait one more frame to ensure rendering is complete
            requestAnimationFrame(resolve);
        });
    });
}

// Load and render markdown help file
export async function loadHelpPage() {
    try {
        const response = await fetch('docs/Rules.md');
        const markdown = await response.text();
        
        ui.titleEl.textContent = 'Help & Rules';
        
        // Helper to create ID from header text
        const createId = (text) => text.toLowerCase().replace(/[^\w]+/g, '-');
        
        // Convert markdown to HTML (basic conversion)
        let html = markdown
            // Headers with IDs
            .replace(/^### (.*)$/gim, (match, text) => `<h3 id="${createId(text)}">${text}</h3>`)
            .replace(/^## (.*)$/gim, (match, text) => `<h2 id="${createId(text)}">${text}</h2>`)
            .replace(/^# (.*)$/gim, (match, text) => `<h1 id="${createId(text)}">${text}</h1>`)
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
            // Inline code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Links - differentiate between anchor links and external links
            .replace(/\[(.*?)\]\((#.*?)\)/g, '<a href="$2" class="anchor-link">$1</a>')
            .replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" class="external-link" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/\[(.*?)\]\(((?!#|https?:\/\/).*?)\)/g, '<span class="disabled-link">$1</span>')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        html = '<div class="help-content"><p>' + html + '</p></div>';
        
        ui.contentEl.innerHTML = html;
        ui.contentEl.style.opacity = 1;
        ui.titleEl.style.opacity = 1;
        
        // Add click handler for anchor links to scroll to sections
        const anchorLinks = ui.contentEl.querySelectorAll('.anchor-link');
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
        
        // Add click handler for external links to ensure they open in new tab
        const externalLinks = ui.contentEl.querySelectorAll('.external-link');
        externalLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent game's link handler
            });
        });
        
        // Hide start modal
        ui.startModal.style.display = 'none';
    } catch (error) {
        console.error('Error loading help:', error);
        ui.contentEl.innerHTML = '<p>Failed to load help documentation.</p>';
    }
}

// Add help link handler
document.addEventListener('DOMContentLoaded', () => {
    const helpLink = document.getElementById('help-link');
    if (helpLink) {
        helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadHelpPage();
        });
    }
});