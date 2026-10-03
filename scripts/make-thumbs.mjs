#!/usr/bin/env node
/* Vignettes légères des photos (listes : frise du jour, cartes d’hôtel) — 240 px, ≈ 12 Ko.
   img/activities/x.jpg → img/activities/thumb/x.jpg (idem img/hotels). Ne refait que les manquantes
   ou périmées. Outil de dev : nécessite ImageMagick (`convert`). Usage : npm run thumbs */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["img/activities", "img/hotels"];
let made = 0, kept = 0;
for (const rel of DIRS) {
  const dir = path.join(ROOT, rel), out = path.join(dir, "thumb");
  fs.mkdirSync(out, { recursive: true });
  for (const name of fs.readdirSync(dir)) {
    if (!/\.(jpe?g|png|webp)$/i.test(name)) continue;
    const src = path.join(dir, name), dst = path.join(out, name.replace(/\.(png|webp)$/i, ".jpg"));
    if (fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= fs.statSync(src).mtimeMs) { kept++; continue; }
    execFileSync("convert", [src, "-auto-orient", "-strip", "-resize", "240x240^", "-gravity", "center",
      "-extent", "240x240", "-sampling-factor", "4:2:0", "-quality", "70", "-interlace", "JPEG", dst]);
    made++;
  }
  // Vignettes orphelines (photo supprimée)
  for (const t of fs.readdirSync(out)) {
    if (!fs.existsSync(path.join(dir, t))) fs.unlinkSync(path.join(out, t));
  }
}
console.log(`vignettes : ${made} créée(s), ${kept} à jour`);
