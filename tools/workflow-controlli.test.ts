import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const testo = readFileSync(path.resolve(__dirname, "../.github/workflows/controlli-pr.yml"), "utf8");

describe("workflow controlli-pr", () => {
  it("parte sulle pull request verso dev, con i quattro tipi", () => {
    expect(testo).toContain("pull_request:");
    expect(testo).toContain("branches: [dev]");
    expect(testo).toContain("types: [opened, synchronize, reopened, ready_for_review]");
  });

  it("usa Node 22 e non ha segreti", () => {
    expect(testo).toContain("node-version: 22");
    expect(testo).not.toContain("secrets.");
  });

  it("lancia lint, test, build e lo script, con il branch da variabile d'ambiente", () => {
    for (const c of ["npm run lint", "npm test", "npm run build", 'node tools/controlli-pr.mjs "$BRANCH" origin/dev']) expect(testo).toContain(c);
    expect(testo).toContain("BRANCH: ${{ github.head_ref }}");
  });

  it("usa solo azioni ufficiali actions/*", () => {
    const azioni = [...testo.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]);
    expect(azioni.length).toBeGreaterThan(0);
    for (const a of azioni) expect(a).toMatch(/^actions\//);
  });
});
