#!/usr/bin/env node
/* Régénère la liste ASSETS de sw.js à partir des fichiers réellement présents :
   page, code (src), styles, données (data), librairie (lib), images (img).
   Usage : node scripts/gen-precache.mjs */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["src", "styles", "data", "lib", "img"];
const EXT = /\.(js|css|json|png|jpe?g|webp|svg)$/i;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return EXT.test(e.name) && !e.name.endsWith(".map") ? [p] : [];
  });
}

const files = DIRS.flatMap((d) => walk(path.join(ROOT, d)))
  .map((p) => "./" + path.relative(ROOT, p).split(path.sep).join("/"))
  .sort();
const assets = ["./", "./index.html", "./manifest.webmanifest", "./sw.js", ...files];

/* Empreinte du contenu de chaque image : le service worker re-télécharge une image modifiée
   sous le même nom (sinon le cache persistant des images la garderait figée). */
const sha1 = (rel) => crypto.createHash("sha1").update(fs.readFileSync(path.join(ROOT, rel))).digest("hex").slice(0, 10);
const imgHash = Object.fromEntries(files.filter((a) => a.startsWith("./img/")).map((a) => [a, sha1(a)]));

const swPath = path.join(ROOT, "sw.js");
const sw = fs.readFileSync(swPath, "utf8");
const block = "// <precache> — généré par scripts/gen-precache.mjs, ne pas éditer à la main\n" +
  "const ASSETS = [\n" + assets.map((a) => `  ${JSON.stringify(a)}`).join(",\n") + "\n];\n" +
  "const IMG_HASH = {\n" + Object.entries(imgHash).map(([a, h]) => `  ${JSON.stringify(a)}: ${JSON.stringify(h)}`).join(",\n") + "\n};\n// </precache>";
const next = sw.replace(/\/\/ <precache>[\s\S]*?\/\/ <\/precache>/, block);
if (next === sw && !sw.includes(block)) throw new Error("Marqueurs <precache> introuvables dans sw.js");
fs.writeFileSync(swPath, next);
console.log(`sw.js : ${assets.length} fichiers en précache`);
