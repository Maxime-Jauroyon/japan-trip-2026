/* Environnement : mobile, mouvement réduit, iOS, mode app (écran d’accueil). */

export function prefersReducedMotion(){
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (_) { return false; }
}

export function isMobileUi(){
  return window.matchMedia("(max-width: 900px)").matches;
}

export function isIOSDevice(){
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function isStandaloneApp(){
  return window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches;
}

export function isIOSInstalledPWA(){
  return isStandaloneApp();
}
