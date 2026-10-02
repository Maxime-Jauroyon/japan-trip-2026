/* Liste des villes au-dessus de la carte. */

import { CITIES, ORDER } from "../core/data.js";
import { esc } from "../core/dom.js";
import { cityList } from "../core/elements.js";
import { cityIconSvg } from "../shared/icons.js";
import { openCity } from "./panels/city-panel.js";

/** Liste des villes (colonne desktop / pastilles mobile). */
export function initCityList() {
  ORDER.forEach(id => {
    const c = CITIES[id];
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.city = id;
    b.innerHTML = `<span class="ico">${cityIconSvg(id)}</span><span><strong>${esc(c.name)}</strong></span>`;
    b.addEventListener("click", () => openCity(id));
    cityList.appendChild(b);
  });
}
