import { describe, expect, it } from "vitest";
import { lightRole, ringRole, ROLE_BG, ROLE_TEXT, ROLE_USE, ROLES } from "./roles";

const TODAY = "2026-10-08";

describe("stati del motore → colori di §10.2", () => {
  it("oggi sotto obiettivo (accento) → Comando", () => {
    expect(ringRole("accento", TODAY, TODAY)).toBe("comando");
  });
  it("giorno futuro sotto obiettivo (accento) → Comando", () => {
    expect(ringRole("accento", "2026-10-09", TODAY)).toBe("comando");
  });
  it("giorno passato sotto obiettivo (accento) → Sotto", () => {
    expect(ringRole("accento", "2026-10-07", TODAY)).toBe("sotto");
  });
  it("verde → In obiettivo, giallo → Attenzione, rosso → Fuori, in ogni giorno", () => {
    for (const date of ["2026-10-07", TODAY, "2026-10-09"]) {
      expect(ringRole("verde", date, TODAY)).toBe("in-obiettivo");
      expect(ringRole("giallo", date, TODAY)).toBe("attenzione");
      expect(ringRole("rosso", date, TODAY)).toBe("fuori");
    }
  });
  it("giorno senza pasti (neutro) → grigio secondario", () => {
    expect(ringRole("neutro", TODAY, TODAY)).toBe("testo-secondario");
  });
  it("semafori dei nutrienti: verde → In obiettivo, giallo → Attenzione, rosso → Fuori", () => {
    expect(lightRole("verde")).toBe("in-obiettivo");
    expect(lightRole("giallo")).toBe("attenzione");
    expect(lightRole("rosso")).toBe("fuori");
    expect(lightRole("neutro")).toBe("testo-secondario");
  });
});

describe("ruoli", () => {
  it("sono sedici, ognuno con la sua didascalia e le sue classi", () => {
    expect(ROLES).toHaveLength(16);
    for (const r of ROLES) {
      expect(ROLE_USE[r]).toBeTruthy();
      expect(ROLE_TEXT[r]).toBe(`text-${r}`);
      expect(ROLE_BG[r]).toBe(`bg-${r}`);
    }
  });
});
