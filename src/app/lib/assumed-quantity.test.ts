import { describe, expect, it } from "vitest";
import type { FavoriteDish } from "@/data";
import { createFakeProvider, demoEstimate, handleEstimate } from "@/modules/ai";
import type { MealProposal } from "@/modules/ai";
import { SYSTEM_PROMPT } from "@/modules/ai/prompt";
import { buildModelText } from "./favorite-text";
import type { Segment } from "./favorite-text";
import { draftsToPrevious, draftsToProposal, proposalToDrafts } from "./proposal-form";

const hummus: FavoriteDish = { id: "f1", name: "Hummus fatto in casa", quantity: "150 g", weightG: 150, kcal: 150, protein: 7.5, carbs: 10, fat: 9, fiber: 4, salt: 0.5 };
const caffe: FavoriteDish = { id: "f2", name: "Caffè con zucchero", quantity: null, weightG: null, kcal: 20, protein: 0, carbs: 5, fat: 0, fiber: 0, salt: 0 };
const known = new Map([hummus, caffe].map((f) => [f.id, f]));

/** Frase → provider finto → proposta validata → bozza, come nell'app. */
async function ask(segments: Segment[], previous?: MealProposal, correction?: string) {
  const { text, refs } = buildModelText(segments, known);
  const out = await handleEstimate({ provider: createFakeProvider(demoEstimate), gate: null, dailyLimit: 60 }, null, { text, localDate: "2026-01-08", localTime: "13:00", ...(previous ? { previous, correction } : {}) });
  if (out.status !== 200) throw new Error(`stima fallita: ${out.status}`);
  const proposal = (out.body as { proposal: MealProposal }).proposal;
  return { proposal, drafts: proposalToDrafts(proposal, refs) };
}
const t = (text: string): Segment => ({ kind: "text", text });
const f = (x: FavoriteDish): Segment => ({ kind: "favorite", favoriteId: x.id });

describe("«ipotizzata» solo se la quantità non è stata detta (T8.3)", () => {
  it("frase con i grammi detti → non ipotizzata", async () => {
    const { drafts } = await ask([t("200 g di petto di pollo")]);
    expect(drafts[0].dishes[0].quantityAssumed).toBe(false);
  });
  it("frase con un numero di pezzi → non ipotizzata", async () => {
    expect((await ask([t("due uova")])).drafts[0].dishes[0].quantityAssumed).toBe(false);
  });
  it("frase senza quantità → ipotizzata", async () => {
    const { drafts } = await ask([t("pasta al pomodoro")]);
    expect(drafts[0].dishes[0].quantityAssumed).toBe(true);
  });
  it("piatto da preferito con i grammi detti → non ipotizzato, anche senza peso salvato (caso AS) e con peso (caso AN)", async () => {
    expect((await ask([f(caffe), t(" 100 g")])).drafts[0].dishes[0].quantityAssumed).toBe(false);
    expect((await ask([f(hummus), t(" 100 g")])).drafts[0].dishes[0].quantityAssumed).toBe(false);
    expect((await ask([f(hummus), t(" 2 porzioni")])).drafts[0].dishes[0].quantityAssumed).toBe(false);
  });
  it("preferito senza quantità detta → ipotizzato (caso AQ)", async () => {
    expect((await ask([f(hummus)])).drafts[0].dishes[0].quantityAssumed).toBe(true);
  });
  it("la correzione che aggiunge la quantità toglie «ipotizzata», passando dalla bozza come nell'app", async () => {
    const first = await ask([t("pasta al pomodoro")]);
    expect(first.drafts[0].dishes[0].quantityAssumed).toBe(true);
    const previous = draftsToPrevious(first.drafts);
    expect(previous?.meals[0].dishes[0].quantityAssumed).toBe(true);
    const second = await ask([t("pasta al pomodoro")], previous ?? undefined, "erano 100 g");
    expect(second.drafts[0].dishes[0].quantityAssumed).toBe(false);
  });
  it("scrivendo la quantità a mano nella proposta l'etichetta sparisce; la bozza non resta ipotizzata senza quantità", async () => {
    const { drafts } = await ask([t("pasta al pomodoro")]);
    const edited = [{ ...drafts[0], dishes: [{ ...drafts[0].dishes[0], quantity: "100 g pasta", quantityAssumed: false }] }];
    const r = draftsToProposal(edited);
    expect(r.ok && r.proposal.meals[0].dishes[0].quantityAssumed).toBe(false);
    const empty = draftsToProposal([{ ...drafts[0], dishes: [{ ...drafts[0].dishes[0], quantity: "", quantityAssumed: true }] }]);
    expect(empty.ok && empty.proposal.meals[0].dishes[0].quantityAssumed).toBe(false);
  });
  it("il prompt distingue la quantità detta da quella ipotizzata, con l'esempio dei 200 g di petto di pollo", () => {
    expect(SYSTEM_PROMPT).toContain("quantityAssumed riguarda SOLO la quantità che la persona non ha detto");
    expect(SYSTEM_PROMPT).toContain('"200 g di petto di pollo" → nome "Petto di pollo"');
    expect(SYSTEM_PROMPT).toContain("quantityAssumed false (i 200 g sono detti");
    expect(SYSTEM_PROMPT).toContain("Se la correzione dà la quantità");
  });
});
