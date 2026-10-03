/* Photos des activités et hôtels (img/activities, img/hotels) — règles dans data/photos.json. */

import { PHOTO_RULES, PLACE_PHOTOS } from "../core/data.js";

export function hotelPhotos(h){
  const out = [];
  const seen = new Set();
  const push = src => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    out.push(src);
  };
  if (h.photo) push(h.photo);
  (h.photos || []).forEach(push);
  if (h.img) push(h.img);
  const slug = h.photoSlug || h.slug;
  if (slug){
    push("./img/hotels/" + slug + ".jpg");
    push("./img/hotels/" + slug + "-2.jpg");
    push("./img/hotels/" + slug + "-3.jpg");
    push("./img/hotels/" + slug + "-4.jpg");
    push("./img/hotels/" + slug + "-5.jpg");
  }
  return out.slice(0, 5);
}

export function photoSlug(act){
  if (act.slug) return act.slug;
  const t = (act.title || "").toLowerCase();
  for (const { re, slug } of PHOTO_RULES){
    if (re.test(t)) return slug;
  }
  return null;
}

/** Photo affichable : { src, credit? } — credit = { author, license, licenseUrl, source }. */
function placePhoto(p){
  return {
    src: "./img/activities/" + p.file,
    credit: { author: p.author, license: p.license, licenseUrl: p.licenseUrl, source: p.source }
  };
}

/** Photos d’une activité : `photos` explicites de l’idée, puis celles du lieu (data/photos.json). */
export function photosFor(act){
  const out = (act.photos || []).map(src => ({ src }));
  const slug = photoSlug(act);
  (slug && PLACE_PHOTOS[slug] || []).forEach(p => out.push(placePhoto(p)));
  return out.slice(0, 4);
}

/** Vignette légère d’une photo locale (img/…/x.jpg → img/…/thumb/x.jpg, cf. npm run thumbs). */
export function thumbOf(src){
  const m = String(src || "").match(/^(.*\/img\/(?:activities|hotels))\/([^/]+?)\.(jpe?g|png|webp)$/i);
  return m ? `${m[1]}/thumb/${m[2]}.jpg` : src;
}
