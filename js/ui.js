function renderPage(page) {
  const titleEl = document.getElementById("page-title");
  const contentEl = document.getElementById("content");

  titleEl.textContent = page.title;

  // Create a temporary container to parse HTML
  const temp = document.createElement("div");
  temp.innerHTML = page.text["*"];

  // Wikipedia main content is inside .mw-parser-output
  const article = temp.querySelector(".mw-parser-output");

  if (!article) {
    contentEl.textContent = "Failed to load article content.";
    return;
  }

  // Remove unwanted elements
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