import type { AiProvider, EstimateRequest } from "./types";

/** Provider finto per sviluppo e test: risponde con ciò che gli dice `respond`. Nessuna rete. */
export function createFakeProvider(respond: (request: EstimateRequest) => unknown | Promise<unknown>): AiProvider & { calls: EstimateRequest[] } {
  const calls: EstimateRequest[] = [];
  return {
    name: "finto",
    calls,
    async estimateMeals(request) {
      calls.push(request);
      return respond(request);
    },
  };
}

const LABEL = /\[preferito (\d+):[^\]]*\]/g;
const SLOT_BY_HOUR = (localTime: string) => {
  const hour = Number(localTime.slice(0, 2));
  return hour < 10 ? "colazione" : hour < 16 ? "pranzo" : hour < 18 ? "spuntino" : "cena";
};
const toNumber = (t: string) => Number(t.replace(",", "."));

/** Cerca una quantità semplice in un pezzo di testo: «100 g», «2 porzioni», «mezza porzione», «×2». */
function saidIn(piece: string): { grams: number | null; servings: number | null; matched: string } {
  const g = /(\d+(?:[.,]\d+)?)\s*(?:g|gr|grammi)\b/i.exec(piece);
  if (g) return { grams: toNumber(g[1]), servings: null, matched: g[0] };
  const half = /mezza porzione/i.exec(piece);
  if (half) return { grams: null, servings: 0.5, matched: half[0] };
  const p = /(\d+(?:[.,]\d+)?)\s*porzion[ei]/i.exec(piece);
  if (p) return { grams: null, servings: toNumber(p[1]), matched: p[0] };
  const x = /[×x]\s*(\d+(?:[.,]\d+)?)/i.exec(piece);
  if (x) return { grams: null, servings: toNumber(x[1]), matched: x[0] };
  return { grams: null, servings: null, matched: "" };
}

/**
 * Risposta del provider finto di sviluppo e dei test: riconosce le etichette dei preferiti («[preferito N: nome]») e una quantità semplice
 * subito dopo ciascuna (grammi, porzioni, «mezza porzione», «×2»); il resto del testo diventa un solo piatto stimato con numeri fissi.
 * In una correzione cambia la quantità dei preferiti con i grammi o le porzioni scritti nella correzione. Nessuna rete.
 */
export function demoEstimate(request: { text: string; localTime: string; previous?: { meals: { slot: string; dishes: unknown[]; favorites?: { ref: number; quantitySaid: boolean; grams: number | null; servings: number | null }[] }[] }; correction?: string }) {
  const said = /\ba (colazione|pranzo|cena)\b/i.exec(request.text);
  const slot = said ? said[1].toLowerCase() : SLOT_BY_HOUR(request.localTime);
  if (request.previous && request.correction) {
    const quantity = saidIn(request.correction);
    const meals = request.previous.meals.map((m) => ({
      ...m,
      freeMeal: false,
      favorites: (m.favorites ?? []).map((f, i) => (i === 0 && (quantity.grams !== null || quantity.servings !== null) ? { ref: f.ref, quantitySaid: true, grams: quantity.grams, servings: quantity.servings } : f)),
    }));
    return { meals };
  }
  const matches = [...request.text.matchAll(LABEL)];
  const favorites = matches.map((m, i) => {
    const end = i + 1 < matches.length ? (matches[i + 1].index as number) : request.text.length;
    const after = request.text.slice((m.index as number) + m[0].length, end).split(/[,;.\n]/)[0];
    const said = saidIn(after);
    const any = said.grams !== null || said.servings !== null;
    return { ref: Number(m[1]), quantitySaid: any, grams: said.grams, servings: said.servings, matched: said.matched };
  });
  let rest = request.text.replace(LABEL, " ").replace(/\ba (colazione|pranzo|cena)\b/gi, " ");
  for (const f of favorites) if (f.matched) rest = rest.replace(f.matched, " ");
  rest = rest.replace(/[\s,;.]+/g, " ").trim();
  // Restano solo congiunzioni («e», «con»): nessun piatto da stimare.
  const CONNECTIVES = /(?<![\p{L}])(?:e|ed|con|più)(?![\p{L}])/giu;
  const dishes = /\p{L}/u.test(rest.replace(CONNECTIVES, " "))
    ? [{ name: rest.replace(/^(?:(?:e|ed|con|più)\s+)+/iu, "").slice(0, 60), quantity: "100 g pasta a crudo, 80 g sugo di pomodoro, 5 g olio", quantityAssumed: true, weightG: 185, kcal: 400, protein: 20, carbs: 45, fat: 15, fiber: 5, salt: 1.5, note: "Stima di prova (provider finto)." }]
    : [];
  return { meals: [{ slot, freeMeal: false, dishes, favorites: favorites.map(({ ref, quantitySaid, grams, servings }) => ({ ref, quantitySaid, grams, servings })) }] };
}
