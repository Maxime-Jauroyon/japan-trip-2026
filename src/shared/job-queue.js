/* File d’attente de tâches asynchrones : au plus `max` en même temps, la plus prioritaire d’abord, et à priorité égale la plus
   récente (ce que l’utilisateur regarde maintenant passe avant ce qu’il a déjà dépassé). Une tâche peut être abandonnée avant
   son départ (`live()` renvoie false) : elle rend alors `fallback` sans rien lancer. Pur : aucune dépendance au navigateur. */

export function createJobQueue(max = 4){
  const waiting = [];
  let active = 0, seq = 0;

  function pump(){
    while (active < max && waiting.length) {
      const prio = (j) => (typeof j.prio === "function" ? j.prio() : j.prio) || 0;   // priorité recalculée au départ : elle peut changer en attendant
      let best = 0;
      waiting.forEach((j, i) => { const [a, b] = [prio(j), prio(waiting[best])]; if (a > b || (a === b && j.seq > waiting[best].seq)) best = i; });
      const job = waiting.splice(best, 1)[0];
      if (job.live && !job.live()) { job.resolve(job.fallback); continue; }
      active++;
      const end = (settle) => (v) => { active--; settle(v); pump(); };   // la place est libérée avant de répondre à l’appelant
      Promise.resolve().then(job.task).then(end(job.resolve), end(job.reject));
    }
  }

  return {
    /** Programme `task` (fonction qui rend une promesse) ; `opts` : { prio = 0 (nombre ou fonction), live, fallback }. */
    run(task, opts = {}){
      return new Promise((resolve, reject) => {
        waiting.push({ task, resolve, reject, prio: opts.prio || 0, live: opts.live, fallback: opts.fallback, seq: ++seq });
        pump();
      });
    },
    get size(){ return waiting.length; },
    get running(){ return active; }
  };
}

/** Mémorise les promesses en cours par clé : une même demande faite deux fois ne part qu’une fois. */
export function createDedupe(){
  const pending = new Map();
  return (key, start) => {
    if (pending.has(key)) return pending.get(key);
    const p = Promise.resolve().then(start).finally(() => pending.delete(key));
    pending.set(key, p);
    return p;
  };
}
