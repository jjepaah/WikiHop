async function loadPage(title) {
  const page = await fetchPage(title);
  renderPage(page);
}

// Start here
loadPage("Finland");