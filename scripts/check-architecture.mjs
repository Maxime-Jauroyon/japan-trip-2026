#!/usr/bin/env node
/* Garde-fou d’architecture (src/) :
   1. couches — un module n’importe que des couches inférieures ou égales :
        config, core, shared (0)  →  domain (1)  →  map (2)  →  ui, pwa (3)  →  main.js (4)
   2. aucun import circulaire ;
   3. les modules n’ont pas d’effet de bord au chargement (seulement déclarations / imports),
      sauf main.js et core/elements.js (références DOM).
   Usage : node scripts/check-architecture.mjs */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (p.endsWith(".js")) files.push(p);
  }
})(SRC);

const rel = (p) => path.relative(SRC, p).split(path.sep).join("/");
function layer(mod) {
  if (mod === "main.js") return 4;
  const top = mod.split("/")[0];
  if (["config.js", "core", "shared"].includes(top)) return 0;
  if (top === "domain") return 1;
  if (top === "map") return 2;
  if (["ui", "pwa"].includes(top)) return 3;
  throw new Error("Dossier sans couche définie : " + mod);
}

const errors = [];
const graph = {};
for (const f of files) {
  const mod = rel(f);
  const src = fs.readFileSync(f, "utf8");
  graph[mod] = [...src.matchAll(/^import\s[^;]*?from\s+"([^"]+)";/gms)].map((m) => rel(path.resolve(path.dirname(f), m[1])));
  for (const dep of graph[mod]) {
    if (!fs.existsSync(path.join(SRC, dep))) errors.push(`${mod} importe un fichier absent : ${dep}`);
    else if (layer(dep) > layer(mod)) errors.push(`${mod} (couche ${layer(mod)}) importe ${dep} (couche ${layer(dep)})`);
  }
  if (mod !== "main.js" && mod !== "core/elements.js") {
    // Instructions top-level autorisées : import, export, function, const/let, class, commentaires
    const body = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const bad = body.split("\n").filter((line) => /^[A-Za-z_$(]/.test(line) &&
      !/^(import|export|function|async function|const|let|class|var)\b/.test(line));
    if (bad.length) errors.push(`${mod} : instruction exécutée au chargement → « ${bad[0].trim().slice(0, 60)} »`);
  }
}

// cycles (DFS)
const state = {};
const stack = [];
function visit(m) {
  state[m] = 1; stack.push(m);
  for (const d of graph[m] || []) {
    if (state[d] === 1) errors.push("cycle : " + [...stack.slice(stack.indexOf(d)), d].join(" → "));
    else if (!state[d]) visit(d);
  }
  stack.pop(); state[m] = 2;
}
Object.keys(graph).forEach((m) => { if (!state[m]) visit(m); });

if (errors.length) {
  console.error("✗ architecture :\n  - " + errors.join("\n  - "));
  process.exit(1);
}
console.log(`✓ architecture : ${files.length} modules, couches respectées, aucun cycle`);
