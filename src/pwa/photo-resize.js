/* Réduction d’une photo avant envoi : JPEG de `maxSide` px au plus (orientation EXIF respectée). */

function loadImage(file){
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image illisible")); };
    img.src = url;
  });
}

export async function resizeImage(file, maxSide, quality){
  let src = null;
  if (typeof createImageBitmap === "function") src = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!src) src = await loadImage(file);
  const w = src.width || src.naturalWidth, h = src.height || src.naturalHeight;
  const k = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * k));
  canvas.height = Math.max(1, Math.round(h * k));
  canvas.getContext("2d").drawImage(src, 0, 0, canvas.width, canvas.height);
  if (src.close) src.close();
  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error("conversion impossible"))), "image/jpeg", quality));
}

/* Vidéos : relues sans le son et ré-encodées en 720 p (MediaRecorder), 20 s au plus : ≈ 5 Mo, léger à envoyer. */

export const MAX_VIDEO_S = 20;
const VIDEO_PX = 720, VIDEO_BPS = 2_500_000;
const VIDEO_TYPES = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];

/** Type d’enregistrement vidéo possible sur cet appareil ("" si aucun). */
export function videoRecordingType(){
  if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) return "";
  return VIDEO_TYPES.find(t => MediaRecorder.isTypeSupported(t)) || "";
}

const waitFor = (target, ok, bad) => new Promise((resolve, reject) => {
  target.addEventListener(ok, resolve, { once: true });
  target.addEventListener(bad, () => reject(new Error("vidéo illisible")), { once: true });
});

/**
 * Prépare une vidéo : { blob (sans son), ext ("mp4" ou "webm"), poster (JPEG 400 px), seconds }.
 * `onProgress(0..1)` suit l’avancée (le travail se fait en temps réel).
 */
export async function compressVideo(file, onProgress){
  const mime = videoRecordingType();
  if (!mime) throw new Error("vidéo non prise en charge sur ce navigateur");
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  Object.assign(v, { muted: true, playsInline: true, preload: "auto", src: url });
  v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
  try {
    if (v.readyState < 2) await waitFor(v, "loadeddata", "error");
    const k = Math.min(1, VIDEO_PX / Math.max(v.videoWidth, v.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(2, Math.round(v.videoWidth * k / 2) * 2);
    canvas.height = Math.max(2, Math.round(v.videoHeight * k / 2) * 2);
    const ctx = canvas.getContext("2d");
    const draw = () => ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const total = Math.min(MAX_VIDEO_S, v.duration && isFinite(v.duration) ? v.duration : MAX_VIDEO_S);
    const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: mime, videoBitsPerSecond: VIDEO_BPS });
    const chunks = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise(resolve => { rec.onstop = resolve; });
    let poster = null;
    const finish = () => { if (rec.state !== "inactive") rec.stop(); v.pause(); };
    draw();
    rec.start(500);
    await v.play();
    await new Promise((resolve) => {
      const tick = () => {
        draw();
        if (!poster && v.currentTime > 0.15) poster = resizeCanvasToBlob(canvas, 400, 0.7);
        if (onProgress) onProgress(Math.min(1, v.currentTime / total));
        if (v.ended || v.currentTime >= total || v.paused) { resolve(); return; }
        if ("requestVideoFrameCallback" in v) v.requestVideoFrameCallback(tick); else requestAnimationFrame(tick);
      };
      tick();
      setTimeout(resolve, (total + 8) * 1000);
    });
    draw();
    if (!poster) poster = resizeCanvasToBlob(canvas, 400, 0.7);
    finish();
    await stopped;
    const blob = new Blob(chunks, { type: mime.split(";")[0] });
    if (!blob.size) throw new Error("vidéo vide");
    return { blob, ext: mime.startsWith("video/mp4") ? "mp4" : "webm", poster: await poster, seconds: Math.round(total) };
  } finally {
    URL.revokeObjectURL(url);
    v.removeAttribute("src"); v.load();
  }
}

function resizeCanvasToBlob(src, maxSide, quality){
  const k = Math.min(1, maxSide / Math.max(src.width, src.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(src.width * k));
  c.height = Math.max(1, Math.round(src.height * k));
  c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
  return new Promise((resolve, reject) => c.toBlob(b => (b ? resolve(b) : reject(new Error("miniature impossible"))), "image/jpeg", quality));
}

/** Ouvre le sélecteur de photos (appareil photo / photothèque) ; résout avec les fichiers choisis ([] si annulé). */
export function pickPhotos(){
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.multiple = true;
    input.style.display = "none";
    input.addEventListener("change", () => { resolve([...input.files]); input.remove(); });
    input.addEventListener("cancel", () => { resolve([]); input.remove(); });
    document.body.appendChild(input);
    input.click();
  });
}
