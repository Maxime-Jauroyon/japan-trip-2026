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

/** Ouvre le sélecteur de photos (appareil photo / photothèque) ; résout avec les fichiers choisis ([] si annulé). */
export function pickPhotos(){
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.style.display = "none";
    input.addEventListener("change", () => { resolve([...input.files]); input.remove(); });
    input.addEventListener("cancel", () => { resolve([]); input.remove(); });
    document.body.appendChild(input);
    input.click();
  });
}
