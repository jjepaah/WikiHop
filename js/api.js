let WIKI_LANG = "en";

function setWikiLang(lang) {
    WIKI_LANG = lang;
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