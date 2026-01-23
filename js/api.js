let WIKI_LANG = "en";

function setWikiLang(lang) {
    WIKI_LANG = lang;
}

function getWikiLang() {
    return WIKI_LANG;
}

function getWikiApi() {
    return `https://${WIKI_LANG}.wikipedia.org/w/api.php`;
}

async function fetchPage(title) {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "text|links",
    format: "json",
    origin: "*"
  });

    try {
        const res = await fetch(`${getWikiApi()}?${params}`);
        if (!res.ok) {
            console.warn(`Failed to fetch page "${title}", status: ${res.status}`);
            return '<p>Could not load page "${title}".</p>';
        }

        const data = await res.json();
        if (data.error) {
            console.warn(`Wikipedia API error for "${title}": ${data.error.info}`);
            return '<p>Page "${title}" does not exist.</p>';
        }

        return data.parse;

    } catch (e) {
        console.error(`Error fetching page "${title}":`, e);
        return `<p>Error loading page "${title}".</p>`;
    }
}

async function getRandomPageTitle() {
    let page;
    do {
        const params = new URLSearchParams({
            action: "query",
            list: "random",
            rnnamespace: 0,
            rnlimit: 1,
            format: "json",
            origin: "*"
        });

        const res = await fetch(`${getWikiApi()}?${params}`);
        const data = await res.json();
        page = data.query.random[0];
        
    } while (!page || !page.title);

    return page.title;
}

async function fetchFirstParagraph(title) {
    const params = new URLSearchParams({
        action: "parse",
        page: title,
        prop: "text",
        section: 0,
        format: "json",
        origin: "*"
    });

    const res = await fetch(`https://${WIKI_LANG}.wikipedia.org/w/api.php?${params}`);
    const data = await res.json();

    if (!data.parse || !data.parse.text) return "No preview available.";

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = data.parse.text["*"];

    // Remove unwanted elements before searching for paragraphs
    tempDiv.querySelectorAll("style, script, .IPA, .reference, sup.reference, .mw-editsection").forEach(el => el.remove());

    // Get all paragraphs
    const paragraphs = tempDiv.querySelectorAll("p");
    
    // Find the first substantial paragraph (at least 50 characters of actual text)
    for (const p of paragraphs) {
        // Remove reference links like [1], [2], etc.
        let text = p.textContent
            .replace(/\[\d+\]/g, '') // Remove citation numbers [1], [2]
            .replace(/\[.*?\]/g, '')  // Remove other brackets
            .trim();
        
        // Check if text is long enough
        if (text.length > 50) {
            // Limit to first 3 sentences (count periods followed by space or end of string)
            const sentences = text.match(/[^.!?]+[.!?]+/g);
            if (sentences && sentences.length > 3) {
                text = sentences.slice(0, 3).join('').trim();
            }
            
            return text;
        }
    }

    return "No preview available.";
}