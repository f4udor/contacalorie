import { createSign } from "node:crypto";
import { RESPONSE_SCHEMA, SYSTEM_PROMPT, buildUserMessage } from "./prompt";
import { AiError } from "./types";
import type { AiProvider, EstimateRequest } from "./types";

export interface ServiceAccount {
  client_email: string;
  private_key: string;
}

export interface VertexConfig {
  project: string;
  /** Regione, per esempio "europe-west4". */
  region: string;
  /** Nome del modello Gemini, per esempio "gemini-2.5-flash". */
  model: string;
  credentials: ServiceAccount;
}

type Fetch = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

/** Gemini su Vertex AI, chiamato dal server con un account di servizio (nessuna libreria: firma del token con `node:crypto`). */
export class VertexProvider implements AiProvider {
  readonly name = "vertex";
  private token: { value: string; expires: number } | null = null;

  constructor(
    private readonly config: VertexConfig,
    private readonly doFetch: Fetch = fetch as unknown as Fetch,
    private readonly now: () => number = () => Date.now(),
  ) {}

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expires - 60_000 > this.now()) return this.token.value;
    const iat = Math.floor(this.now() / 1000);
    const claims = { iss: this.config.credentials.client_email, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 };
    const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify(claims))}`;
    const signature = createSign("RSA-SHA256").update(unsigned).sign(this.config.credentials.private_key);
    const assertion = `${unsigned}.${b64url(signature)}`;
    const res = await this.doFetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${encodeURIComponent(assertion)}`,
    });
    const body = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };
    if (!res.ok || !body.access_token) {
      // Solo stato e messaggio di Google: niente chiave, niente testo del pasto.
      console.error("[vertex] token rifiutato", res.status, body.error ?? "", body.error_description ?? "");
      throw new AiError("rete");
    }
    this.token = { value: body.access_token, expires: this.now() + (body.expires_in ?? 3600) * 1000 };
    return body.access_token;
  }

  async estimateMeals(request: EstimateRequest): Promise<unknown> {
    let res;
    try {
      const { project, region, model } = this.config;
      const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${project}/locations/${region}/publishers/google/models/${model}:generateContent`;
      res = await this.doFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await this.accessToken()}` },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: buildUserMessage(request) }] }],
          generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
        }),
      });
    } catch (e) {
      if (e instanceof AiError) throw e;
      console.error("[vertex] rete", e instanceof Error ? e.message : String(e));
      throw new AiError("rete");
    }
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: { status?: string; message?: string } } | null;
      // Solo stato e messaggio di Google: niente chiave, niente testo del pasto.
      console.error("[vertex] risposta", res.status, err?.error?.status ?? "", err?.error?.message ?? "");
      throw new AiError("rete");
    }
    const body = (await res.json().catch(() => null)) as { candidates?: { content?: { parts?: { text?: string }[] } }[] } | null;
    const text = body?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    if (!text) throw new AiError("non-valida");
    try {
      return JSON.parse(text);
    } catch {
      throw new AiError("non-valida");
    }
  }
}
