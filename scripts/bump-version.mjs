#!/usr/bin/env node
/* Passe l’app à la version suivante (ou à celle donnée) partout où elle apparaît :
   src/config.js (APP_VERSION), sw.js (nom du cache), index.html (?v= des styles et du module).
   Puis régénère la précache du service worker.
   Usage : node scripts/bump-version.mjs [165] */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = (p) => path.join(ROOT, p);
const configSrc = fs.readFileSync(file("src/config.js"), "utf8");
const current = Number(configSrc.match(/APP_VERSION = "v(\d+)"/)[1]);
const next = process.argv[2] ? Number(process.argv[2]) : current + 1;
if (!Number.isInteger(next) || next <= 0) throw new Error("Version invalide : " + process.argv[2]);

const edits = [
  ["src/config.js", /APP_VERSION = "v\d+"/, `APP_VERSION = "v${next}"`],
  ["sw.js", /const CACHE = "japan-trip-2026-v\d+"/, `const CACHE = "japan-trip-2026-v${next}"`],
  ["index.html", /(\.\/(?:styles\/[\w-]+\.css|src\/main\.js))\?v=\d+/g, `$1?v=${next}`]
];
for (const [rel, re, rep] of edits) {
  const p = file(rel);
  const src = fs.readFileSync(p, "utf8");
  const out = src.replace(re, rep);
  if (out === src && current !== next) throw new Error(`${rel} : motif de version introuvable`);
  fs.writeFileSync(p, out);
}
execFileSync(process.execPath, [file("scripts/gen-precache.mjs")], { stdio: "inherit" });
console.log(`Version v${current} → v${next}`);
