import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";

const FILE = "src/engine/prova.ts";

async function errori(codice: string, filePath = FILE) {
  const eslint = new ESLint();
  const [r] = await eslint.lintText(codice, { filePath });
  return r.messages.filter((m) => m.ruleId === "no-restricted-imports");
}

describe("regola di lint su src/engine", () => {
  it.each([
    'import x from "../app/page"; export const y = x;',
    'import { a } from "../modules/meals"; export const y = a;',
    'import { a } from "../../package.json"; export const y = a;',
    'import { a } from "@/modules/ai"; export const y = a;',
    'import React from "react"; export const y = React;',
  ])("blocca %s", async (codice) => {
    expect((await errori(codice)).length).toBeGreaterThan(0);
  });

  it("ammette import interni", async () => {
    expect(await errori('import { a } from "./defaults"; export const y = a;')).toHaveLength(0);
  });

  it("i test del motore possono importare vitest", async () => {
    expect(await errori('import { it } from "vitest"; it("x", () => {});', "src/engine/x.test.ts")).toHaveLength(0);
  });
});
