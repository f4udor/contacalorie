import { describe, expect, it } from "vitest";
import { SWIPE_ACTION_WIDTH, SWIPE_ICON_ACTION_WIDTH, SWIPE_LOCK_PX, nextOpenRow, shouldStayOpen, swipeDirection, swipeOffset } from "./swipe-logic";

describe("direzione del gesto", () => {
  it("sotto la soglia non si decide", () => {
    expect(swipeDirection(5, 3)).toBe("pending");
    expect(swipeDirection(-(SWIPE_LOCK_PX - 1), SWIPE_LOCK_PX - 1)).toBe("pending");
  });
  it("più orizzontale che verticale: orizzontale", () => {
    expect(swipeDirection(-20, 5)).toBe("horizontal");
    expect(swipeDirection(30, -29)).toBe("horizontal");
  });
  it("più verticale che orizzontale o diagonale pari: lo scorrimento della pagina", () => {
    expect(swipeDirection(-5, 20)).toBe("vertical");
    expect(swipeDirection(10, 10)).toBe("vertical");
    expect(swipeDirection(0, -40)).toBe("vertical");
  });
});

describe("posizione durante il trascinamento", () => {
  const w = 148;
  it("verso sinistra la riga segue il dito fino alla larghezza dei pulsanti", () => {
    expect(swipeOffset(0, -50, w)).toBe(-50);
    expect(swipeOffset(0, -400, w)).toBe(-w);
  });
  it("verso destra non succede nulla: la riga chiusa non si muove", () => {
    expect(swipeOffset(0, 60, w)).toBe(0);
  });
  it("da aperta si richiude trascinando a destra", () => {
    expect(swipeOffset(-w, 100, w)).toBe(-48);
    expect(swipeOffset(-w, 400, w)).toBe(0);
  });
});

describe("rilascio", () => {
  it("resta aperta oltre il 40% della larghezza, altrimenti si richiude", () => {
    expect(shouldStayOpen(-60, 148)).toBe(true);
    expect(shouldStayOpen(-59, 148)).toBe(false);
    expect(shouldStayOpen(0, 148)).toBe(false);
    expect(shouldStayOpen(-10, 0)).toBe(false);
  });
  it("i pulsanti sono larghi almeno 44 px", () => {
    expect(SWIPE_ACTION_WIDTH).toBeGreaterThanOrEqual(44);
    expect(SWIPE_ICON_ACTION_WIDTH).toBeGreaterThanOrEqual(44);
  });
});

describe("una sola riga aperta alla volta", () => {
  it("aprirne una chiude l'altra", () => {
    expect(nextOpenRow(null, "a", true)).toBe("a");
    expect(nextOpenRow("a", "b", true)).toBe("b");
  });
  it("chiudere una riga che non è l'aperta non cambia nulla; chiudere l'aperta la chiude", () => {
    expect(nextOpenRow("a", "b", false)).toBe("a");
    expect(nextOpenRow("a", "a", false)).toBeNull();
  });
});
