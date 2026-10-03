#!/usr/bin/env node
/* Allège les photos (fiches détail) : 1000 px max, JPEG progressif qualité 72, métadonnées retirées.
   Une photo n’est réécrite que si elle gagne > 10 % ; elle est alors marquée (commentaire JPEG)
   pour ne jamais être recompressée deux fois. La date du fichier est conservée : les vignettes ne sont pas
   refaites. Outil de dev : nécessite ImageMagick (`convert`, `identify`). Usage : npm run photos */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["img/activities", "img/hotels"];
const MARK = "jt-photo-v1";
const tmp = path.join(os.tmpdir(), `photo-${process.pid}.jpg`);
let done = 0, skipped = 0, before = 0, after = 0;

for (const rel of DIRS) {
  const dir = path.join(ROOT, rel);
  for (const name of fs.readdirSync(dir)) {
    if (!/\.jpe?g$/i.test(name)) continue;
    const src = path.join(dir, name);
    const st = fs.statSync(src);
    if (execFileSync("identify", ["-format", "%c", src]).toString().includes(MARK)) { skipped++; continue; }
    execFileSync("convert", [src, "-auto-orient", "-strip", "-resize", "1000x1000>", "-sampling-factor", "4:2:0",
      "-quality", "72", "-interlace", "JPEG", "-set", "comment", MARK, tmp]);
    const size = fs.statSync(tmp).size;
    before += st.size;
    if (size < st.size * 0.9) {
      fs.copyFileSync(tmp, src);
      after += size;
      done++;
    } else {
      after += st.size;   // gain trop faible : original gardé tel quel
      skipped++;
    }
    fs.utimesSync(src, st.atime, st.mtime);
  }
}
fs.rmSync(tmp, { force: true });
const mo = (n) => (n / 1048576).toFixed(1).replace(".", ",") + " Mo";
console.log(`photos : ${done} allégée(s), ${skipped} inchangée(s)` + (before ? ` · ${mo(before)} → ${mo(after)}` : ""));
