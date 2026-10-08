import { describe, expect, it } from "vitest";
import { plural } from "./plural";

describe("plural", () => {
  it("singolare, plurale e zero", () => {
    expect(plural(1, "giorno", "giorni")).toBe("1 giorno");
    expect(plural(3, "giorno", "giorni")).toBe("3 giorni");
    expect(plural(0, "giorno", "giorni")).toBe("0 giorni");
    expect(plural(1200, "piatto", "piatti")).toBe("1.200 piatti");
  });
});
