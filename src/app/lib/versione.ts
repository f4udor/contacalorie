// Quale versione dell'app è in esecuzione: decide icona e nome (#50).
export type Versione = "principale" | "dev" | "prova";

export type DatiVersione = {
  nome: string;
  icona192: string;
  icona512: string;
  iconaApple: string;
};

export const VERSIONI: Record<Versione, DatiVersione> = {
  principale: {
    nome: "Personal Health",
    icona192: "/icon-192.png",
    icona512: "/icon-512.png",
    iconaApple: "/apple-icon.png",
  },
  dev: {
    nome: "PH Dev",
    icona192: "/icone/dev-icon-192.png",
    icona512: "/icone/dev-icon-512.png",
    iconaApple: "/icone/dev-apple-icon.png",
  },
  prova: {
    nome: "PH Prova",
    icona192: "/icone/prova-icon-192.png",
    icona512: "/icone/prova-icon-512.png",
    iconaApple: "/icone/prova-apple-icon.png",
  },
};

/** `vercelEnv` è VERCEL_ENV, `ramo` è VERCEL_GIT_COMMIT_REF. */
export function sceglieVersione(vercelEnv: string | undefined, ramo: string | undefined): Versione {
  if (vercelEnv !== "preview") return "principale";
  return ramo === "dev" ? "dev" : "prova";
}

export function versioneCorrente(): Versione {
  return sceglieVersione(process.env.VERCEL_ENV, process.env.VERCEL_GIT_COMMIT_REF);
}
