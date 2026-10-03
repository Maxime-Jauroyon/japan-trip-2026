/* Classement des lieux / arrêts (icône de pin, phrases utiles selon le contexte). */

export function stopPinKind(stop){
  const k = ((stop && stop.kind) || "").toLowerCase();
  if (/aéroport|aeroport|airport|hnd|cdg/.test(k) || /aéroport|aeroport|haneda|cdg|hnd/i.test(stop.name || "")) return "plane";
  if (/bus|terminal bus|arrêt bus|arret bus/.test(k)) return "bus";
  return "train";
}

export function pinKind(title){
  const t = (title || "").toLowerCase();
  if (/gundam/.test(t)) return "gundam";
  if (/jinja|dera|shrine|temple|sanctuaire|inari|meiji|yasaka|kasuga|pagode|kinkaku|chūrei|churei|namba yasaka|hozenji|palais|kiyomizu|tōdai|todai|kōfuku|kofuku|nijn|nijō|nijo/.test(t)) return "torii";
  if (/château|chateau|castle|jinya|tower|tour|tsūten|tsuten/.test(t)) return "castle";
  if (/arcade|pokemon|nintendo|animate|universal|den den|teamlab|mugiwara|sunshine|character street|itoya|fuji-?q|highland/.test(t)) return "play";
  if (/lac|lake|parc|park|bambou|bamboo|forêt|forest|jardin|garden|sumida|momiji|téléphérique|telepherique|ropeway|yanaka|oshino|saiko|kenroku|philosophe|philosopher/.test(t)) return "nature";
  if (/marché|marche|market|omicho|ōmichō|nishiki|kuromon|miyagawa|dotonbori|shinsaibashi|ginza/.test(t)) return "market";
  if (/déjeuner|dîner|diner|thé|tea|wagashi|takoyaki|feuille d’or|feuille d'or|gold leaf|food|cérémonie|ceremonie/.test(t)) return "food";
  if (/village|gassho|shirakawa|sanmachi|nagamachi|chaya|pontochō|pontocho|yokocho|ruelle/.test(t)) return "town";
  return "pin";
}

export function legPhraseContext(mode){
  const m = String(mode || "").toLowerCase();
  if (/avion|vol|plane/.test(m)) return "plane";
  if (/bus/.test(m)) return "bus";
  return "train";
}

export function stopPhraseContext(stop){
  const k = stopPinKind(stop);
  if (k === "plane") return "plane";
  if (k === "bus") return "bus";
  return "train";
}

/** Contexte des phrases utiles d’un lieu : champ « phrases » des données, sinon d’après le titre. */
export function phraseContextForAct(act){
  if (act.phrases) return act.phrases;
  const t = (act.title || "").toLowerCase();
  if (/parc d’attractions|parc à thème|theme park/.test(t)) return "park";
  if (/marché|marche|market|nishiki|kuromon|omicho|ōmichō/.test(t)) return "market";
  if (/temple|sanctuaire|jinja|dera|shrine|todai|fushimi|meiji|senso|kasuga|kinkaku|kiyomizu|pagode|inari|nijo|kōfuku|kofuku/.test(t)) return "temple";
  if (/magasin|boutique|shopping|donki|animate|pokemon/.test(t)) return "shop";
  if (/cérémonie|ceremonie|atelier|wagashi|feuille d’or/.test(t)) return "culture";
  if (/déjeuner|dejeuner|dîner|diner|restaurant|ramen|sushi|izakaya|takoyaki|okonomiyaki|street food/.test(t)) return "restaurant";
  return "visit";
}
