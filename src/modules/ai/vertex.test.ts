import { generateKeyPairSync, createVerify } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createProviderFromEnv, dailyLimitFromEnv } from "./config";
import { AiError } from "./types";
import { VertexProvider } from "./vertex";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const credentials = { client_email: "servizio@progetto.iam.gserviceaccount.com", private_key: pem };
const config = { project: "mio-progetto", region: "europe-west4", model: "gemini-test", credentials };
const request = { text: "una mela", localDate: "2026-01-08", localTime: "16:00" };
const answer = { meals: [{ slot: "spuntino", dishes: [] }] };

type Call = { url: string; init: { method: string; headers: Record<string, string>; body: string } };
function fakeFetch(handlers: { token?: () => unknown; model?: () => unknown; tokenOk?: boolean; modelOk?: boolean; throws?: boolean } = {}) {
  const calls: Call[] = [];
  const fn = async (url: string, init: Call["init"]) => {
    calls.push({ url, init });
    if (handlers.throws) throw new Error("offline");
    if (url.startsWith("https://oauth2.googleapis.com/token")) return { ok: handlers.tokenOk ?? true, status: 200, json: async () => (handlers.token ? handlers.token() : { access_token: "tok-1", expires_in: 3600 }) };
    return { ok: handlers.modelOk ?? true, status: 200, json: async () => (handlers.model ? handlers.model() : { candidates: [{ content: { parts: [{ text: JSON.stringify(answer) }] } }] }) };
  };
  return { fn, calls };
}

describe("VertexProvider (senza rete: fetch finto)", () => {
  it("firma il token di accesso, chiama il modello giusto e legge il JSON", async () => {
    const { fn, calls } = fakeFetch();
    const p = new VertexProvider(config, fn);
    expect(await p.estimateMeals(request)).toEqual(answer);
    const [tokenCall, modelCall] = calls;
    const assertion = new URLSearchParams(tokenCall.init.body).get("assertion")!;
    const [h, c, s] = assertion.split(".");
    expect(JSON.parse(Buffer.from(c, "base64url").toString())).toMatchObject({ iss: credentials.client_email, aud: "https://oauth2.googleapis.com/token" });
    expect(createVerify("RSA-SHA256").update(`${h}.${c}`).verify(publicKey, Buffer.from(s, "base64url"))).toBe(true);
    expect(modelCall.url).toBe("https://europe-west4-aiplatform.googleapis.com/v1/projects/mio-progetto/locations/europe-west4/publishers/google/models/gemini-test:generateContent");
    expect(modelCall.init.headers.Authorization).toBe("Bearer tok-1");
    const sent = JSON.parse(modelCall.init.body);
    expect(sent.generationConfig.responseMimeType).toBe("application/json");
    expect(sent.generationConfig.temperature).toBe(0);
    expect(sent.generationConfig.responseSchema).toBeDefined();
    expect(sent.contents[0].parts[0].text).toContain("una mela");
    expect(JSON.stringify(sent)).not.toContain(credentials.client_email);
  });

  it("riusa il token finché è valido e ne chiede uno nuovo dopo la scadenza", async () => {
    let now = 0;
    const { fn, calls } = fakeFetch();
    const p = new VertexProvider(config, fn, () => now);
    await p.estimateMeals(request);
    await p.estimateMeals(request);
    expect(calls.filter((c) => c.url.includes("oauth2")).length).toBe(1);
    now = 3_600_000;
    await p.estimateMeals(request);
    expect(calls.filter((c) => c.url.includes("oauth2")).length).toBe(2);
  });

  it.each([
    ["rete assente", { throws: true }, "rete"],
    ["token rifiutato", { tokenOk: false }, "rete"],
    ["modello risponde con errore", { modelOk: false }, "rete"],
    ["nessun testo nella risposta", { model: () => ({ candidates: [] }) }, "non-valida"],
    ["testo che non è JSON", { model: () => ({ candidates: [{ content: { parts: [{ text: "ciao" }] } }] }) }, "non-valida"],
  ] as const)("%s", async (_n, handlers, code) => {
    const p = new VertexProvider(config, fakeFetch(handlers).fn);
    await expect(p.estimateMeals(request)).rejects.toMatchObject({ code });
    await expect(p.estimateMeals(request)).rejects.toBeInstanceOf(AiError);
  });
});

describe("configurazione dalle variabili d'ambiente", () => {
  const env = { VERTEX_PROJECT: "p", VERTEX_REGION: "europe-west4", VERTEX_MODEL: "m", VERTEX_CREDENTIALS_JSON: JSON.stringify(credentials) };
  it("vertex con tutte le variabili", () => {
    expect(createProviderFromEnv(env)?.name).toBe("vertex");
  });
  it.each(["VERTEX_PROJECT", "VERTEX_REGION", "VERTEX_MODEL", "VERTEX_CREDENTIALS_JSON"])("senza %s: non configurata", (k) => {
    expect(createProviderFromEnv({ ...env, [k]: "" })).toBeNull();
  });
  it("credenziali illeggibili o incomplete: non configurata", () => {
    expect(createProviderFromEnv({ ...env, VERTEX_CREDENTIALS_JSON: "{non json" })).toBeNull();
    expect(createProviderFromEnv({ ...env, VERTEX_CREDENTIALS_JSON: "{}" })).toBeNull();
  });
  it("nessuna variabile: non configurata; AI_PROVIDER=fake: provider finto", () => {
    expect(createProviderFromEnv({})).toBeNull();
    expect(createProviderFromEnv({ AI_PROVIDER: "fake" })?.name).toBe("finto");
  });
  it("limite giornaliero: 60 se assente o non valido", () => {
    expect(dailyLimitFromEnv({})).toBe(60);
    expect(dailyLimitFromEnv({ AI_DAILY_LIMIT: "abc" })).toBe(60);
    expect(dailyLimitFromEnv({ AI_DAILY_LIMIT: "-3" })).toBe(60);
    expect(dailyLimitFromEnv({ AI_DAILY_LIMIT: "25" })).toBe(25);
  });
  it("nessuna variabile del modello è pubblica (NEXT_PUBLIC_)", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/modules/ai/config.ts", "utf8");
    expect(src).not.toMatch(/NEXT_PUBLIC_/);
  });
});
