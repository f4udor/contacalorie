import { describe, expect, it } from "vitest";
import { shouldCloseOnDrag } from "./sheet-logic";

describe("shouldCloseOnDrag", () => {
  it("chiude oltre la distanza limite, anche se lento", () => {
    expect(shouldCloseOnDrag(120, 5000)).toBe(true);
    expect(shouldCloseOnDrag(300, 5000)).toBe(true);
  });
  it("non chiude per un trascinamento corto e lento", () => {
    expect(shouldCloseOnDrag(119, 5000)).toBe(false);
    expect(shouldCloseOnDrag(0, 100)).toBe(false);
    expect(shouldCloseOnDrag(-50, 100)).toBe(false);
  });
  it("chiude con un gesto veloce anche se breve", () => {
    expect(shouldCloseOnDrag(60, 100)).toBe(true);
  });
  it("non chiude con un gesto veloce ma sotto la distanza minima", () => {
    expect(shouldCloseOnDrag(39, 10)).toBe(false);
  });
  it("durata zero non divide per zero", () => {
    expect(shouldCloseOnDrag(60, 0)).toBe(false);
  });
});
