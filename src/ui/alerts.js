/* Bandeaux bas d’écran : installation iPhone, réservations ouvertes, rappels billets. */

import { BOOKING_ALERT_KEY, IOS_INSTALL_KEY, REMINDER_ALERT_KEY } from "../config.js";
import { prepCheckState } from "../core/checklist-store.js";
import { esc } from "../core/dom.js";
import { isIOSDevice, isIOSInstalledPWA } from "../core/env.js";
import { hooks } from "../core/hooks.js";
import { collectBookableAlerts, collectPrepReminders } from "../domain/bookings.js";

export function initIOSInstallHint(){
  const box = document.getElementById("ios-install");
  const btn = document.getElementById("ios-install-dismiss");
  if (!box || !btn) return;
  if (!isIOSDevice() || isIOSInstalledPWA()) {
    box.hidden = true;
    return;
  }
  try {
    if (localStorage.getItem(IOS_INSTALL_KEY) === "1") {
      box.hidden = true;
      return;
    }
  } catch (_) { /* ignore */ }
  box.hidden = false;
  syncBottomBanners();
  btn.addEventListener("click", () => {
    box.hidden = true;
    try { localStorage.setItem(IOS_INSTALL_KEY, "1"); } catch (_) { /* ignore */ }
    syncBottomBanners();
  });
}

function loadDismissedBookingAlerts(){
  try {
    const raw = localStorage.getItem(BOOKING_ALERT_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (_) {
    return new Set();
  }
}

function saveDismissedBookingAlerts(set){
  try { localStorage.setItem(BOOKING_ALERT_KEY, JSON.stringify([...set])); } catch (_) { /* ignore */ }
}

function syncBottomBanners(){
  const layers = [
    { el: document.getElementById("ios-install"), est: 132 },
    { el: document.getElementById("booking-alert"), est: 150 },
    { el: document.getElementById("reminder-alert"), est: 150 }
  ];
  let bottom = 12;
  layers.forEach(({ el, est }) => {
    if (!el) return;
    if (el.hidden) {
      el.style.bottom = "";
      el.classList.remove("above-ios");
      return;
    }
    el.style.bottom = `calc(${bottom}px + env(safe-area-inset-bottom))`;
    bottom += est;
  });
}

function renderBookingAlert(){
  const box = document.getElementById("booking-alert");
  const list = document.getElementById("booking-alert-list");
  const btn = document.getElementById("booking-alert-dismiss");
  if (!box || !list || !btn) return;

  const dismissed = loadDismissedBookingAlerts();
  const alerts = collectBookableAlerts().filter(a => !dismissed.has(a.id));
  if (!alerts.length) {
    box.hidden = true;
    syncBottomBanners();
    return;
  }

  list.innerHTML = alerts.map(a =>
    `<li><button type="button" class="booking-alert-item" data-leg-id="${esc(a.legId)}" data-url="${esc(a.url)}">` +
    `<span><strong>${esc(a.legTitle)}</strong><span>${esc(a.label)} · ${esc(a.site)}</span></span>` +
    `<span class="booking-alert-go" aria-hidden="true">Voir →</span></button></li>`
  ).join("");

  list.querySelectorAll(".booking-alert-item").forEach(el => {
    el.addEventListener("click", () => {
      const legId = el.dataset.legId;
      const url = el.dataset.url;
      if (legId) hooks.openLeg(legId);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    });
  });

  box.hidden = false;
  syncBottomBanners();

  if (btn._bookingBound) return;
  btn._bookingBound = true;
  btn.addEventListener("click", () => {
    const dismissedNow = loadDismissedBookingAlerts();
    collectBookableAlerts().forEach(a => dismissedNow.add(a.id));
    saveDismissedBookingAlerts(dismissedNow);
    box.hidden = true;
    syncBottomBanners();
  });
}

export function initBookingAlert(){
  renderBookingAlert();
}

function loadDismissedReminderAlerts(){
  try {
    const raw = localStorage.getItem(REMINDER_ALERT_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (_) {
    return new Set();
  }
}

function saveDismissedReminderAlerts(set){
  try { localStorage.setItem(REMINDER_ALERT_KEY, JSON.stringify([...set])); } catch (_) { /* ignore */ }
}

function collectDueReminderAlerts(){
  return collectPrepReminders(prepCheckState()).filter(r => r.active);
}

export function renderReminderAlert(){
  const box = document.getElementById("reminder-alert");
  const list = document.getElementById("reminder-alert-list");
  const btn = document.getElementById("reminder-alert-dismiss");
  if (!box || !list || !btn) return;

  const dismissed = loadDismissedReminderAlerts();
  const alerts = collectDueReminderAlerts().filter(a => !dismissed.has(a.id));
  if (!alerts.length) {
    box.hidden = true;
    syncBottomBanners();
    return;
  }

  list.innerHTML = alerts.map(a => {
    const firstUrl = (a.links && a.links[0] && a.links[0].url) || a.url || "";
    return `<li><button type="button" class="reminder-alert-item" data-url="${esc(firstUrl)}" data-check-id="${esc(a.id)}">` +
    `<span><strong>${esc(a.label)}</strong><span>${esc(a.meta)}</span></span>` +
    `<span class="reminder-alert-go" aria-hidden="true">Préparatifs →</span></button></li>`;
  }).join("");

  list.querySelectorAll(".reminder-alert-item").forEach(el => {
    el.addEventListener("click", () => {
      hooks.setAppTab("prep");
      const sec = document.getElementById("prep-reminders-sec");
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  box.hidden = false;
  syncBottomBanners();

  if (btn._reminderBound) return;
  btn._reminderBound = true;
  btn.addEventListener("click", () => {
    const dismissedNow = loadDismissedReminderAlerts();
    collectDueReminderAlerts().forEach(a => dismissedNow.add(a.id));
    saveDismissedReminderAlerts(dismissedNow);
    box.hidden = true;
    syncBottomBanners();
  });
}

export function initReminderAlert(){
  renderReminderAlert();
}
