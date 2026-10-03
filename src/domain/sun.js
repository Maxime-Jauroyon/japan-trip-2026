/* Lever et coucher du soleil (équation du lever de soleil, précision ≈ 1–2 min), heure du Japon. */

const RAD = Math.PI / 180;
const JST_MIN = 9 * 60;

/** Minutes depuis minuit (heure du Japon) → « 16 h 38 ». */
export function fmtClock(min){
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}

/**
 * Lever / coucher du soleil le jour `iso` (AAAA-MM-JJ) à (lat, lng).
 * Retourne { rise, set } en minutes depuis minuit, heure du Japon, ou null (nuit / jour polaire).
 */
export function sunTimes(lat, lng, iso){
  const t = Date.parse(iso + "T12:00:00Z");
  if (!Number.isFinite(t) || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const n = Math.round(t / 86400000 + 2440587.5 - 2451545 + 0.0008);
  const jStar = n - lng / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const transit = 2451545 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD);
  const sinDec = Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosW = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * sinDec) / (Math.cos(lat * RAD) * cosDec);
  if (cosW < -1 || cosW > 1) return null;
  const w = Math.acos(cosW) / RAD / 360;
  const toJstMin = (j) => {
    const ms = (j - 2440587.5) * 86400000;
    const d = new Date(ms);
    return (d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60 + JST_MIN) % 1440;
  };
  return { rise: toJstMin(transit - w), set: toJstMin(transit + w) };
}
