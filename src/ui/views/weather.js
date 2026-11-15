/* Météo du jour (Open-Meteo, mise en cache locale) avec repli sur le climat du mois (data/cities.json). */

import { WEATHER_CACHE_KEY } from "../../config.js";
import { CITIES, CITY_CLIMATE, TRIP } from "../../core/data.js";
import { dayToISO, daysUntilISO, japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { agoLabel, isFresh } from "../../domain/live-data.js";
import { daysForCity } from "../../domain/trip.js";

/** Une prévision en cache reste valable 90 min ; au-delà (ou à chaque retour dans l’app) on la redemande si le réseau est là. */
const WX_MAX_AGE_MS = 90 * 60000;

const WX_LABELS = {
  0:"Ensoleillé", 1:"Plutôt clair", 2:"Nuageux", 3:"Couvert",
  45:"Brouillard", 48:"Brouillard", 51:"Bruine", 53:"Bruine", 55:"Bruine",
  61:"Pluie", 63:"Pluie", 65:"Forte pluie", 71:"Neige", 73:"Neige", 75:"Neige",
  80:"Averses", 81:"Averses", 82:"Fortes averses", 95:"Orage"
};

function loadWeatherCache(){
  try { return JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || "{}"); } catch (_) { return {}; }
}

function saveWeatherCache(obj){
  try { localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(obj)); } catch (_) {}
}

async function getWeatherForDay(day){
  const iso = dayToISO(day);
  const city = CITIES[day.city];
  if (!iso || !city) return null;
  const until = daysUntilISO(iso);
  const climate = CITY_CLIMATE[day.city] || null;

  if (until > 16 || until < 0) {
    if (!climate) return null;
    return { type:"climate", min:climate.lo, max:climate.hi, note:climate.note };
  }

  const cacheKey = day.city + "|" + iso;
  const cache = loadWeatherCache();
  const hit = cache[cacheKey];
  if (hit && hit.data && isFresh(hit.at, Date.now(), WX_MAX_AGE_MS)) return hit.data;

  if (!navigator.onLine) {
    // Hors ligne : dernière prévision connue (avec son heure), sinon le climat du mois
    if (hit && hit.data) return { ...hit.data, offline: true };
    if (climate) return { type:"climate", min:climate.lo, max:climate.hi, note:climate.note + " (hors ligne)" };
    return null;
  }

  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + city.lat +
      "&longitude=" + city.lng +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      (until === 0 ? "&current=temperature_2m,weather_code" : "") +
      "&timezone=Asia%2FTokyo&start_date=" + iso + "&end_date=" + iso;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("weather");
    const json = await res.json();
    const d = json.daily || {};
    const code = d.weather_code && d.weather_code[0];
    const data = {
      type: "forecast",
      min: Math.round(d.temperature_2m_min[0]),
      max: Math.round(d.temperature_2m_max[0]),
      label: WX_LABELS[code] || "Variable",
      rain: d.precipitation_probability_max ? d.precipitation_probability_max[0] : null,
      now: json.current && Number.isFinite(json.current.temperature_2m) ? { temp: Math.round(json.current.temperature_2m), label: WX_LABELS[json.current.weather_code] || "" } : null,
      at: Date.now()
    };
    cache[cacheKey] = { at: Date.now(), data };
    saveWeatherCache(cache);
    return data;
  } catch (_) {
    if (hit && hit.data) return { ...hit.data, offline: true };
    if (climate) return { type:"climate", min:climate.lo, max:climate.hi, note:climate.note };
    return null;
  }
}

let watchedDay = null;

/** Retient le jour affiché et remet la météo à jour quand on revient dans l’app ou que le réseau revient. */
function watchWeather(day){
  const first = watchedDay === null;
  watchedDay = day;
  if (!first) return;
  const refresh = () => { if (watchedDay && !document.hidden && document.getElementById("onsite-weather")) renderOnsiteWeather(watchedDay, true); };
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("online", refresh);
}

export async function renderOnsiteWeather(day, quiet){
  watchWeather(day);
  const box = document.getElementById("onsite-weather");
  if (!box || !day) { if (box) box.hidden = true; return; }
  box.hidden = false;
  if (!quiet) box.innerHTML = `<span class="wx-note">Météo…</span>`;
  const wx = await getWeatherForDay(day);
  if (!wx) { box.hidden = true; return; }
  const cityName = CITIES[day.city] ? CITIES[day.city].name : day.city;
  if (wx.type === "forecast") {
    const nowTxt = wx.now ? `Maintenant ${wx.now.temp}°${wx.now.label ? " · " + esc(wx.now.label) : ""} · ` : "";
    box.innerHTML =
      `<span class="wx-temps">${wx.min}° – ${wx.max}°C</span>` +
      `<span class="wx-note">${nowTxt}${esc(wx.label)}${wx.rain != null ? ` · pluie ${wx.rain}%` : ""} · ${esc(cityName)}` +
      `${wx.at ? ` · mise à jour ${agoLabel(wx.at, Date.now())}${wx.offline ? " (hors ligne)" : ""}` : ""}</span>`;
  } else {
    box.innerHTML =
      `<span class="wx-temps">${wx.min}° – ${wx.max}°C</span>` +
      `<span class="wx-note">Climat type en ${esc(TRIP.climateMonth)} · ${esc(cityName)}</span>`;
  }
}

const WX_ICONS = [[0, "☀️"], [2, "🌤️"], [3, "☁️"], [48, "🌫️"], [67, "🌧️"], [77, "🌨️"], [82, "🌦️"], [99, "⛈️"]];
const wxIcon = (code) => (WX_ICONS.find(([max]) => code <= max) || [0, "🌤️"])[1];
const forecastRuns = {};

/**
 * Prévisions des jours du voyage dans une ville (fenêtre Open-Meteo : aujourd’hui → J+15),
 * un seul appel par ville et par jour, gardé en cache local. Retourne { iso: { min, max, label, icon, rain } }.
 */
export async function getCityForecast(cityId){
  const city = CITIES[cityId];
  const isos = daysForCity(cityId).map(dayToISO).filter(iso => iso && daysUntilISO(iso) >= 0 && daysUntilISO(iso) <= 15).sort();
  if (!city || !isos.length) return {};
  const key = "f|" + cityId;
  const cache = loadWeatherCache();
  if (cache[key] && isFresh(cache[key].at, Date.now(), WX_MAX_AGE_MS)) return cache[key].data;
  if (!navigator.onLine) return (cache[key] && cache[key].data) || {};
  if (!forecastRuns[key]) forecastRuns[key] = (async () => {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + city.lat + "&longitude=" + city.lng +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&timezone=Asia%2FTokyo&start_date=" + isos[0] + "&end_date=" + isos[isos.length - 1];
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("weather");
    const d = (await res.json()).daily || {};
    const data = {};
    (d.time || []).forEach((iso, i) => {
      const code = d.weather_code[i];
      data[iso] = {
        min: Math.round(d.temperature_2m_min[i]), max: Math.round(d.temperature_2m_max[i]),
        label: WX_LABELS[code] || "Variable", icon: wxIcon(code),
        rain: d.precipitation_probability_max ? d.precipitation_probability_max[i] : null
      };
    });
    const c = loadWeatherCache();
    c[key] = { at: Date.now(), data };
    saveWeatherCache(c);
    return data;
  })().finally(() => { delete forecastRuns[key]; });
  try { return await forecastRuns[key]; } catch (_) { return (cache[key] && cache[key].data) || {}; }
}

/** Remplit les emplacements [data-wx="AAAA-MM-JJ"] d’un panneau ville avec la prévision du jour. */
export async function fillCityForecast(root, cityId){
  if (!root || !root.querySelector("[data-wx]")) return;
  const fc = await getCityForecast(cityId);
  root.querySelectorAll("[data-wx]").forEach(el => {
    const wx = fc[el.dataset.wx];
    if (!wx) return;
    el.textContent = `${wx.icon} ${wx.max}°/${wx.min}°`;
    el.title = wx.label + (wx.rain != null ? ` · pluie ${wx.rain} %` : "");
    el.hidden = false;
  });
}
