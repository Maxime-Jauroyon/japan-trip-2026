// Cache le site pour Safari hors ligne (après 1ère ouverture avec Wi‑Fi)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      reg.update();
      if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }).catch(() => {});
  });
}

async function forceRefreshApp(){
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (_) {}
  const url = new URL(location.href);
  url.searchParams.set("refresh", String(Date.now()));
  location.replace(url.toString());
}

const refreshBtn = document.getElementById("force-refresh");
if (refreshBtn) refreshBtn.addEventListener("click", forceRefreshApp);