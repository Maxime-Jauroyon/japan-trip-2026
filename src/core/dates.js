/* Dates : « aujourd’hui » au Japon, jours du voyage ↔ dates ISO, dates de réservation, tri des horaires. */

import { DAYS } from "./data.js";

export function parseBookingDate(iso){
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

export function todayLocalDate(){
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function formatBookingDateFr(d){
  if (!d) return "";
  return d.toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });
}

export function japanTodayISO(){
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date());
  } catch (_) {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }
}

/* Préfixes des mois en français (janv., févr., …) */
const FR_MONTHS = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];

export function dayToISO(day){
  // "8 nov 2026" → 2026-11-08
  const m = String(day.date || "").match(/(\d+)\s+([a-zéû]+)\.?\s+(\d{4})/i);
  if (!m) return null;
  const month = FR_MONTHS.findIndex(p => m[2].toLowerCase().startsWith(p)) + 1;
  if (!month) return null;
  return m[3] + "-" + String(month).padStart(2, "0") + "-" + String(m[1]).padStart(2, "0");
}

export function findTripDayByISO(iso){
  return DAYS.find(d => dayToISO(d) === iso) || null;
}

export function parseWhenSort(when){
  const s = String(when || "").toLowerCase();
  const hm = s.match(/(\d{1,2})[:h](\d{2})/);
  if (hm) return parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10);
  if (/matin|morning|tôt|tot/.test(s)) return 8 * 60;
  if (/après-midi|apres-midi|midi/.test(s)) return 13 * 60;
  if (/soir|nuit|après|apres/.test(s)) return 19 * 60;
  if (/arrivée|arrivee|atterr|vol/.test(s)) return 7 * 60;
  return 12 * 60;
}

export function parseHotelTimeSort(str, fallback){
  const s = String(str || "");
  const hm = s.match(/(\d{1,2})[:h](\d{2})/);
  if (hm) return parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10);
  if (/matin/.test(s.toLowerCase())) return 9 * 60;
  if (/après-midi|apres-midi/.test(s.toLowerCase())) return 15 * 60;
  return fallback;
}

export function daysUntilISO(iso){
  const today = japanTodayISO();
  return Math.round((Date.parse(iso + "T12:00:00+09:00") - Date.parse(today + "T12:00:00+09:00")) / 86400000);
}
