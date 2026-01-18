const WIKI_API = "https://en.wikipedia.org/w/api.php";

async function fetchPage(title) {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "text|links",
    format: "json",
    origin: "*"
  });

  const res = await fetch(`${WIKI_API}?${params}`);
  const data = await res.json();

  return data.parse;
}