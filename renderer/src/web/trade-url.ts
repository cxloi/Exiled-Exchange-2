// strip pasted full trade url down to the search id
export const toTradeId = (url: string) =>
  url
    .trim()
    .replace(/^.*?trade2\/search\/poe2\/[^/]+\//, "")
    .replace(/^\/+/, "");

export function openTradeSearch(url: string, league: string | undefined) {
  const id = toTradeId(url);
  if (!id || !league) return;
  window.open(
    "https://www.pathofexile.com/trade2/search/poe2/" +
      encodeURIComponent(league) + "/" + id,
    "_blank",
  );
}
