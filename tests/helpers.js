/* Charge data/*.json depuis le disque et hydrate le store (comme au démarrage de l’app). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_FILES, hydrate } from "../src/core/data.js";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function loadTripData() {
  const raw = Object.fromEntries(DATA_FILES.map((name) => [
    name, JSON.parse(fs.readFileSync(path.join(ROOT, "data", name + ".json"), "utf8"))
  ]));
  hydrate(raw);
  return raw;
}
