import { describe, expect, it } from "vitest";
import { providerModelLabel, readableModelName } from "./model-name";

describe("nome leggibile del modello", () => {
  it("«gemini-2.5-flash» → «Gemini 2.5 Flash»", () => {
    expect(readableModelName("gemini-2.5-flash")).toBe("Gemini 2.5 Flash");
  });
  it("altri nomi: parole con la maiuscola, numeri invariati", () => {
    expect(readableModelName("gemini-1.5-pro")).toBe("Gemini 1.5 Pro");
    expect(readableModelName("gemini-2.0-flash-001")).toBe("Gemini 2.0 Flash 001");
    expect(readableModelName("  gemini-2.5-flash-lite  ")).toBe("Gemini 2.5 Flash Lite");
  });
  it("senza modello configurato non c'è nome", () => {
    expect(readableModelName(undefined)).toBeNull();
    expect(readableModelName(null)).toBeNull();
    expect(readableModelName("   ")).toBeNull();
    expect(providerModelLabel(null)).toBeNull();
    expect(providerModelLabel({ name: "vertex" })).toBeNull();
  });
  it("il provider finto dice «Modello di prova»; Vertex il nome leggibile", () => {
    expect(providerModelLabel({ name: "finto" })).toBe("Modello di prova");
    expect(providerModelLabel({ name: "vertex", model: "gemini-2.5-flash" })).toBe("Gemini 2.5 Flash");
  });
});
