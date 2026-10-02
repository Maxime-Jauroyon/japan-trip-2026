/* Thème clair / sombre / auto (data-theme sur <html>, carte assortie). */

import { THEME_KEY } from "../config.js";
import { applyMapTheme } from "../map/controller.js";

function themePref(){
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch (_) { return "auto"; }
}

export function applyThemePref(){
  const pref = themePref();
  let dark = true;
  try { dark = window.matchMedia("(prefers-color-scheme: dark)").matches; } catch (_) { /* ignore */ }
  const t = pref === "auto" ? (dark ? "dark" : "light") : pref;
  document.documentElement.dataset.theme = t;
  document.documentElement.dataset.themePref = pref;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t === "light" ? "#f6f2ea" : "#0c1118");
  document.querySelectorAll("#theme-picker [data-theme-choice]").forEach(b => {
    const on = b.dataset.themeChoice === pref;
    b.classList.toggle("on", on);
    b.setAttribute("aria-checked", on ? "true" : "false");
  });
  applyMapTheme();
}

export function setThemePref(pref){
  try {
    if (pref === "auto") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch (_) { /* ignore */ }
  applyThemePref();
}

/** Applique le thème mémorisé et suit le mode système quand il est sur « Auto ». */
export function initTheme() {
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (themePref() === "auto") applyThemePref();
    });
  } catch (_) { /* ignore */ }
  applyThemePref();
}
