/* Recherche plein texte (lieux, hôtels, gares, phrases) : sans accents ni casse. Fonctions pures. */

/** « Kōfuku-ji, Château » → « kofuku ji chateau ». */
export function normalize(s){
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[’'`´]/g, "").replace(/[^a-z0-9぀-ヿ一-龯]+/g, " ").trim();
}

/**
 * Éléments correspondant à `q` (tous les mots doivent apparaître, en début de mot).
 * Chaque élément : { title, sub?, keywords? , … }. Les plus pertinents d’abord, `limit` au plus.
 */
export function searchIndex(items, q, limit = 40){
  const words = normalize(q).split(" ").filter(Boolean);
  if (!words.length) return [];
  const scored = [];
  (items || []).forEach((it, i) => {
    const title = " " + normalize(it.title);
    const hay = title + " " + normalize(it.sub) + " " + normalize(it.keywords);
    if (!words.every((w) => hay.includes(" " + w))) return;
    let score = 0;
    if (title.startsWith(" " + words[0])) score += 4;
    words.forEach((w) => { if (title.includes(" " + w)) score += 2; });
    scored.push({ it, i, score });
  });
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.slice(0, limit).map((s) => s.it);
}
