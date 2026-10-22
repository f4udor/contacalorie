import { describe, expect, it } from "vitest";
import { VERSIONI, sceglieVersione } from "./versione";

describe("sceglieVersione (#50)", () => {
  it("production: versione principale", () => {
    expect(sceglieVersione("production", "main")).toBe("principale");
  });
  it("preview e branch dev: versione dev", () => {
    expect(sceglieVersione("preview", "dev")).toBe("dev");
  });
  it("preview e un altro branch: versione prova", () => {
    expect(sceglieVersione("preview", "f4udor/50-icona")).toBe("prova");
  });
  it("variabili assenti: versione principale", () => {
    expect(sceglieVersione(undefined, undefined)).toBe("principale");
    expect(sceglieVersione("", "")).toBe("principale");
  });
  it("nomi e icone", () => {
    expect(VERSIONI.principale.nome).toBe("Personal Health");
    expect(VERSIONI.dev.nome).toBe("PH Dev");
    expect(VERSIONI.prova.nome).toBe("PH Prova");
    expect(VERSIONI.principale.icona192).toBe("/icon-192.png");
    expect(VERSIONI.dev.icona192).toBe("/icone/dev-icon-192.png");
    expect(VERSIONI.prova.icona512).toBe("/icone/prova-icon-512.png");
  });
});
