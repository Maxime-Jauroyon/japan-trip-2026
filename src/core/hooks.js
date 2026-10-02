/* Points d’accroche carte → interface.
   La carte (src/map) ne dépend jamais de l’UI : elle appelle ces hooks,
   que main.js relie aux panneaux au démarrage. */
const noop = () => {};

export const hooks = {
  openCity: noop,
  openLeg: noop,
  openJourney: noop,
  openActivityDetail: noop,
  openStopDetail: noop,
  openHotelDetail: noop
};

export function setHooks(impl) {
  Object.assign(hooks, impl);
}
