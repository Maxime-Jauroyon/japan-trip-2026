/* Réservations : statut d’ouverture des billets, rappels à date fixe, alertes « réservable ». */

import { LEGS, PREP_CHECKS } from "../core/data.js";
import { formatBookingDateFr, parseBookingDate, todayLocalDate } from "../core/dates.js";

/** Jaune = pas encore · Rouge = réservable · Vert = déjà réservé. */
export function bookingOpenStatus(link, leg){
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
  const today = todayLocalDate();
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
export function collectPrepReminders(checks){
  const state = checks || {};
  const today = todayLocalDate();
  return PREP_CHECKS.filter(item => item.remindFrom).map(item => {
    const due = parseBookingDate(item.remindFrom);
    const done = Object.prototype.hasOwnProperty.call(state, item.id) ? !!state[item.id] : !!item.done;
    const days = due ? Math.round((due.getTime() - today.getTime()) / 86400000) : null;
    const active = due ? days <= 0 : false;
    const soon = due ? days > 0 && days <= 45 : false;
    return { ...item, due, days, done, active, soon };
  }).filter(r => !r.done);
}

export function collectBookableAlerts(){
  const out = [];
  LEGS.forEach(leg => {
    const links = leg.bookings?.links;
    if (!links) return;
    links.forEach((link, i) => {
      if (bookingOpenStatus(link, leg).key !== "bookable") return;
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
