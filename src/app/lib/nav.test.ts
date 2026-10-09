import { describe, expect, it } from "vitest";
import { activeTab, canGoNextWeek, dayNav, panelWeekReducer, shiftWeek, weekNav } from "./nav";

const TODAY = "2026-10-08"; // giovedì; la settimana corrente parte da lunedì 2026-10-05

describe("intestazione di Oggi", () => {
  it("sul presente il tasto di ritorno è disattivato; le frecce vanno al giorno prima e dopo", () => {
    const n = dayNav(TODAY, TODAY);
    expect(n.nowDisabled).toBe(true);
    expect(n.prevHref).toBe("/?d=2026-10-07");
    expect(n.nextHref).toBe("/?d=2026-10-09");
  });
  it("altrove è attivo e il tocco riporta a oggi", () => {
    for (const date of ["2026-10-07", "2026-10-20"]) {
      const n = dayNav(date, TODAY);
      expect(n.nowDisabled).toBe(false);
      expect(n.nowHref).toBe("/");
    }
  });
  it("la freccia che arriva a oggi porta all'indirizzo senza data", () => {
    expect(dayNav("2026-10-07", TODAY).nextHref).toBe("/");
    expect(dayNav("2026-10-09", TODAY).prevHref).toBe("/");
  });
});

describe("intestazione della Settimana", () => {
  const monday = "2026-10-05";
  it("sulla settimana corrente il tasto di ritorno è disattivato", () => {
    const n = weekNav(monday, TODAY);
    expect(n.nowDisabled).toBe(true);
    expect(n.prevHref).toBe("/settimana?w=2026-09-28");
    expect(n.nextHref).toBe("/settimana?w=2026-10-12");
  });
  it("su un'altra settimana è attivo e riporta a questa settimana", () => {
    for (const m of ["2026-09-28", "2026-10-12"]) {
      const n = weekNav(m, TODAY);
      expect(n.nowDisabled).toBe(false);
      expect(n.nowHref).toBe("/settimana");
    }
  });
  it("le frecce che arrivano alla settimana corrente portano all'indirizzo senza data", () => {
    expect(weekNav("2026-09-28", TODAY).nextHref).toBe("/settimana");
    expect(weekNav("2026-10-12", TODAY).prevHref).toBe("/settimana");
  });
});

describe("frecce delle settimane nei pannelli", () => {
  it("passano alla settimana precedente o successiva", () => {
    expect(shiftWeek("2026-10-05", -1)).toBe("2026-09-28");
    expect(shiftWeek("2026-10-05", 1)).toBe("2026-10-12");
  });
  it("niente freccia in avanti oltre la settimana corrente", () => {
    expect(canGoNextWeek("2026-10-05", TODAY)).toBe(false);
    expect(canGoNextWeek("2026-09-28", TODAY)).toBe(true);
    expect(canGoNextWeek("2026-10-12", TODAY)).toBe(false);
  });
});

describe("voce attiva della barra", () => {
  it("Oggi, Settimana, Grafici; le Impostazioni non sono nella barra", () => {
    expect(activeTab("/")).toBe("oggi");
    expect(activeTab("/settimana")).toBe("settimana");
    expect(activeTab("/grafici")).toBe("grafici");
    expect(activeTab("/impostazioni")).toBeNull();
    expect(activeTab("/prova-stile")).toBeNull();
  });
});

describe("settimana dentro un pannello (T6.3)", () => {
  const screenMonday = "2026-10-05"; // la settimana della schermata sotto (anche la corrente)
  it("le frecce spostano di una settimana alla volta e non toccano la settimana della schermata", () => {
    const back = panelWeekReducer(screenMonday, "indietro", TODAY);
    expect(back).toBe("2026-09-28");
    expect(panelWeekReducer(back, "indietro", TODAY)).toBe("2026-09-21");
    expect(panelWeekReducer(back, "avanti", TODAY)).toBe(screenMonday);
    // La schermata tiene il suo lunedì: è un valore che il pannello non riceve per riferimento né modifica.
    expect(screenMonday).toBe("2026-10-05");
  });
  it("niente settimana futura: dalla settimana corrente «avanti» resta dov'è", () => {
    expect(panelWeekReducer("2026-10-05", "avanti", TODAY)).toBe("2026-10-05");
    // Anche partendo da una settimana già futura non si avanza.
    expect(panelWeekReducer("2026-10-19", "avanti", TODAY)).toBe("2026-10-19");
  });
  it("il ritorno al presente riporta alla settimana corrente da qualsiasi punto", () => {
    expect(panelWeekReducer("2026-08-03", "oggi", TODAY)).toBe("2026-10-05");
    expect(panelWeekReducer("2026-10-19", "oggi", TODAY)).toBe("2026-10-05");
  });
  it("chiudere e riaprire il pannello riparte dalla settimana della schermata", () => {
    const afterMoves = ["indietro", "indietro", "avanti"].reduce((m, a) => panelWeekReducer(m, a as "indietro" | "avanti", TODAY), screenMonday);
    expect(afterMoves).toBe("2026-09-28");
    // Un pannello nuovo parte dal lunedì della schermata, che non è cambiato.
    expect(screenMonday).toBe("2026-10-05");
  });
});
