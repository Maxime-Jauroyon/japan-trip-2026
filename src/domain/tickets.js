/* Billets : comment les prendre / les montrer sur place, trajet par trajet. Fonctions pures.
   Données : legs.json → leg.ticket = { kind, headline, steps: [...], who? }. */

export const TICKET_KINDS = {
  print: { label: "Confirmation imprimée", short: "Imprimée", icon: "🖨️" },
  pickup: { label: "Billets papier à retirer", short: "À retirer", icon: "🎫" },
  qr: { label: "QR code", short: "QR code", icon: "📱" },
  eticket: { label: "E-ticket sur le téléphone", short: "E-ticket", icon: "📲" },
  boarding: { label: "Carte d’embarquement", short: "Embarquement", icon: "✈️" }
};

/** Ticket valide d’un trajet : type connu + au moins une étape. */
export function validTicket(t){
  return !!t && !!TICKET_KINDS[t.kind] && typeof t.headline === "string" && t.headline.trim() !== "" &&
    Array.isArray(t.steps) && t.steps.length > 0 && t.steps.every((s) => typeof s === "string" && s.trim() !== "");
}

/**
 * Trajets ayant un ticket, dans l’ordre du voyage : { day, when, leg, ticket }.
 * `when` = horaire de la carte du jour (ex. « 09:05–10:50 »).
 */
export function ticketTimeline(days, legs){
  const byId = new Map((legs || []).map((l) => [l.id, l]));
  const out = [];
  (days || []).forEach((day) => (day.moves || []).forEach((m) => {
    const leg = m.leg ? byId.get(m.leg) : null;
    if (leg && validTicket(leg.ticket)) out.push({ day, when: m.when || "", leg, ticket: leg.ticket });
  }));
  return out;
}
