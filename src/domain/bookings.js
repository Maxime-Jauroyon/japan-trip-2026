/* Réservations : statut d’ouverture des billets, rappels à date fixe, alertes « réservable ». */

import { LEGS, PREP_CHECKS } from "../core/data.js";
import { formatBookingDateFr, parseBookingDate, todayLocalDate } from "../core/dates.js";

/** Jaune = pas encore · Rouge = réservable · Vert = déjà réservé. */
export function bookingOpenStatus(link, leg, today = todayLocalDate()){
  const legDone = leg && (leg.status === "reserved" || leg.status === "paid");
  const linkDone = !!(link.reserved || link.paid || legDone);
  if (linkDone) {
    return {
      key:"reserved",
      label: leg && leg.status === "paid" ? "Payé / réservé" : "Réservé"
    };
  }
  if (link.optional && !link.openFrom) {
    return { key:"optional", label:"Optionnel · IC le jour J" };
  }
  const open = parseBookingDate(link.openFrom);
  if (!open) return { key:"bookable", label: link.optional ? "Optionnel · réservable" : "Réservable" };
  const days = Math.round((open.getTime() - today.getTime()) / 86400000);
  const when = formatBookingDateFr(open);
  const time = link.openTime ? ` · ${link.openTime} JST` : "";
  if (days <= 0) {
    return {
      key:"bookable",
      label: link.optional ? "Optionnel · réservable" : "Réservable — à réserver"
    };
  }
  // Pas encore (jaune) — y compris « bientôt »
  if (days <= 14) {
    return {
      key:"wait",
      label: `${link.optional ? "Optionnel · " : ""}Bientôt · dans ${days} j · ${when}${time}`
    };
  }
  return {
    key:"wait",
    label: `${link.optional ? "Optionnel · " : ""}Pas encore · ouvre ${when}${time}`
  };
}

/** Rappels billets à date fixe, non cochés. `checks` : état des cases ({ id: bool }). */
export function collectPrepReminders(checks, today = todayLocalDate()){
  const state = checks || {};
  return PREP_CHECKS.filter(item => item.remindFrom).map(item => {
    const due = parseBookingDate(item.remindFrom);
    const done = Object.prototype.hasOwnProperty.call(state, item.id) ? !!state[item.id] : !!item.done;
    const days = due ? Math.round((due.getTime() - today.getTime()) / 86400000) : null;
    const active = due ? days <= 0 : false;
    const soon = due ? days > 0 && days <= 45 : false;
    return { ...item, due, days, done, active, soon };
  }).filter(r => !r.done);
}

export function collectBookableAlerts(today = todayLocalDate()){
  const out = [];
  LEGS.forEach(leg => {
    const links = leg.bookings?.links;
    if (!links) return;
    links.forEach((link, i) => {
      if (bookingOpenStatus(link, leg, today).key !== "bookable") return;
      out.push({
        id: leg.id + ":" + i,
        legId: leg.id,
        legTitle: leg.title || (leg.from + " → " + leg.to),
        label: link.label,
        site: link.site,
        url: link.url
      });
    });
  });
  return out;
}

/* —— Liste « À faire » : réservations ouvertes + rappels billets, par urgence —— */

/** Au-delà de ce nombre de jours après l’échéance, c’est « en retard ». */
export const TODO_LATE_AFTER_DAYS = 3;
/** Fenêtre « bientôt » avant l’échéance. */
export const TODO_SOON_DAYS = 14;
const URGENCY_RANK = { late: 0, now: 1, soon: 2 };

const daysBetween = (from, to) => Math.round((to.getTime() - from.getTime()) / 86400000);

function urgencyOf(days){
  if (days == null) return "now";
  if (days < -TODO_LATE_AFTER_DAYS) return "late";
  if (days <= 0) return "now";
  return days <= TODO_SOON_DAYS ? "soon" : null;
}

/**
 * Tout ce qu’il reste à faire, trié par urgence puis par date.
 * `checks` : cases cochées ({ id: bool }) ; `doneBookings` : ids de réservations marquées faites sur l’appareil.
 * Élément : { id, kind: "booking" | "reminder", title, meta, due, days, urgency: "late" | "now" | "soon", links, legId }.
 * `days` < 0 = échéance passée depuis |days| jours.
 */
export function collectTodos(checks, doneBookings, today = todayLocalDate()){
  const done = doneBookings || new Set();
  const out = [];
  LEGS.forEach(leg => {
    (leg.bookings?.links || []).forEach((link, i) => {
      const id = leg.id + ":" + i;
      if (done.has(id) || link.optional) return;
      const st = bookingOpenStatus(link, leg, today).key;
      if (st === "reserved") return;
      const due = parseBookingDate(link.openFrom);
      const days = due ? daysBetween(today, due) : null;
      const urgency = st === "bookable" ? urgencyOf(days == null ? 0 : Math.min(days, 0)) : urgencyOf(days);
      if (!urgency) return;
      out.push({
        id, kind: "booking", urgency, due, days,
        title: leg.title || (leg.from + " → " + leg.to),
        meta: [link.label, link.site].filter(Boolean).join(" · "),
        links: link.url ? [{ label: link.site ? "Réserver · " + link.site : "Réserver", url: link.url }] : [],
        legId: leg.id
      });
    });
  });
  collectPrepReminders(checks, today).forEach(r => {
    const urgency = urgencyOf(r.days);
    if (!urgency) return;
    const links = (r.links && r.links.length) ? r.links : (r.url ? [{ label: r.urlLabel || "Ouvrir", url: r.url }] : []);
    out.push({ id: r.id, kind: "reminder", urgency, due: r.due, days: r.days, title: r.label, meta: r.meta || "", links, legId: null });
  });
  return out.sort((a, b) =>
    URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] ||
    (a.due ? a.due.getTime() : 0) - (b.due ? b.due.getTime() : 0));
}

/** Libellé court de l’échéance : « En retard · depuis 9 j », « Aujourd’hui », « Dans 10 j · 13 oct. 2026 ». */
export function todoDueLabel(t){
  if (t.days == null) return "À faire";
  if (t.days < 0) return (t.urgency === "late" ? "En retard · " : "") + `depuis ${-t.days} j`;
  if (t.days === 0) return "Aujourd’hui";
  return `Dans ${t.days} j · ${formatBookingDateFr(t.due)}`;
}
