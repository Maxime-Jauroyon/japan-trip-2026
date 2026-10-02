#!/usr/bin/env node
/* Régénère la liste ASSETS de sw.js à partir des fichiers réellement présents :
   page, code (src), styles, données (data), librairie (lib), images (img).
   Usage : node scripts/gen-precache.mjs */
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
const assets = ["./", "./index.html", "./sw.js", ...files];

const swPath = path.join(ROOT, "sw.js");
const sw = fs.readFileSync(swPath, "utf8");
const block = "// <precache> — généré par scripts/gen-precache.mjs, ne pas éditer à la main\n" +
  "const ASSETS = [\n" + assets.map((a) => `  ${JSON.stringify(a)}`).join(",\n") + "\n];\n// </precache>";
const next = sw.replace(/\/\/ <precache>[\s\S]*?\/\/ <\/precache>/, block);
if (next === sw && !sw.includes(block)) throw new Error("Marqueurs <precache> introuvables dans sw.js");
fs.writeFileSync(swPath, next);
console.log(`sw.js : ${assets.length} fichiers en précache`);
