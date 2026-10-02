/* Photos des activités et hôtels (img/activities, img/hotels) — règles dans data/photos.json. */

import { PHOTO_RELATED, PHOTO_RULES } from "../core/data.js";

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

export function photosFor(act){
  const out = [];
  const seen = new Set();
  const push = src => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    out.push(src);
  };
  if (act.photo) push(act.photo);
  (act.photos || []).forEach(push);
  if (act.img) push(act.img);
  const slug = photoSlug(act);
  if (slug){
    push("./img/activities/" + slug + ".jpg");
    push("./img/activities/" + slug + "-2.jpg");
    push("./img/activities/" + slug + "-3.jpg");
    // photos voisines (même ambiance) en complément
    (PHOTO_RELATED[slug] || []).forEach(r => {
      push("./img/activities/" + r + ".jpg");
      push("./img/activities/" + r + "-2.jpg");
    });
  }
  return out.slice(0, 5);
}

function photoFor(act){
  const list = photosFor(act);
  return list[0] || null;
}
