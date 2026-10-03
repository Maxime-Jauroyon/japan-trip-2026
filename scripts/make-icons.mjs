#!/usr/bin/env node
/* Génère les icônes PNG (écran d’accueil iPhone, installation) à partir de img/logo.svg.
   Rendu par Chromium sans interface (outil de développement, aucune dépendance npm).
   Les PNG sont pleins (coins carrés) : iOS et Android arrondissent eux-mêmes.
   Usage : npm run icons   (CHROME=/chemin/vers/chrome pour un autre navigateur) */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/* chrome-headless-shell respecte la taille de fenêtre exacte (Chrome « complet » impose ≥ 500 px). */
const shells = fs.existsSync("/opt/pw-browsers")
  ? fs.readdirSync("/opt/pw-browsers").filter((d) => d.startsWith("chromium_headless_shell"))
    .map((d) => `/opt/pw-browsers/${d}/chrome-linux/headless_shell`)
  : [];
const CANDIDATES = [process.env.CHROME, ...shells].filter(Boolean);
const chrome = CANDIDATES.find((p) => fs.existsSync(p));
if (!chrome) throw new Error("chrome-headless-shell introuvable : définir CHROME=/chemin/vers/headless_shell");

const svg = fs.readFileSync(path.join(ROOT, "img/logo.svg"), "utf8")
  .replace(/(<rect data-corner="1"[^>]*?) rx="[\d.]+"/, "$1 rx=\"0\"");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "icons-"));

for (const size of [180, 192, 512]) {
  const html = path.join(tmp, `icon-${size}.html`);
  fs.writeFileSync(html, `<!doctype html><style>html,body{margin:0;background:#121a33}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  const out = path.join(ROOT, `img/icon-${size}.png`);
  execFileSync(chrome, ["--no-sandbox", "--disable-gpu", "--hide-scrollbars",
    `--window-size=${size},${size}`, `--screenshot=${out}`, "file://" + html], { stdio: "ignore" });
  console.log(`img/icon-${size}.png`);
}
fs.rmSync(tmp, { recursive: true, force: true });
