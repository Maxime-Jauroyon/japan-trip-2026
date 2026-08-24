// Cache le site pour Safari hors ligne (après 1ère ouverture avec Wi‑Fi)
if ("serviceWorker" in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      reg.update();
      if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            sw.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
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

function bindForceRefresh(btn){
  let busy = false;
  let lastTouch = 0;
  const run = async (e) => {
    if (busy) return;
    busy = true;
    if (e && e.cancelable) e.preventDefault();
    btn.blur();
    await forceRefreshApp();
  };
  btn.addEventListener("touchend", (e) => {
    lastTouch = Date.now();
    run(e);
  }, { passive: false });
  btn.addEventListener("click", (e) => {
    if (Date.now() - lastTouch < 700) return;
    run(e);
  });
}

const refreshBtn = document.getElementById("force-refresh");
if (refreshBtn) bindForceRefresh(refreshBtn);