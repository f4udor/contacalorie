import type { DateKey, Light, RingColor } from "@/engine";

/** I ruoli di colore di BRIEF §10.2 (i nomi delle variabili di stile in `globals.css`). */
export const ROLES = [
  "sfondo",
  "scheda",
  "tessera",
  "pannello",
  "testo",
  "testo-secondario",
  "separatore",
  "comando",
  "in-obiettivo",
  "attenzione",
  "fuori",
  "sotto",
  "passi",
  "bici",
  "linea-obiettivo",
  "linea-media",
] as const;

export type Role = (typeof ROLES)[number];

/** Cosa significa ogni ruolo, e solo quello (BRIEF §10.2): è la didascalia della pagina di prova. */
export const ROLE_USE: Record<Role, string> = {
  sfondo: "Fondo dell'app",
  scheda: "Schede",
  tessera: "Piatti, elenchi, tasti a pillola",
  pannello: "Fondo dei pannelli che salgono",
  testo: "Testo principale",
  "testo-secondario": "Etichette, unità, note",
  separatore: "Linee tra le righe di un elenco",
  comando: "Ciò che si tocca per agire; anello del giorno in corso",
  "in-obiettivo": "Giudizio positivo",
  attenzione: "Il giallo dei semafori",
  fuori: "Il rosso dei semafori; azioni distruttive",
  sotto: "Giorno concluso rimasto sotto l'obiettivo",
  passi: "Numeri e grafici dei passi",
  bici: "Numeri e grafici della bici",
  "linea-obiettivo": "Solo la linea dell'obiettivo nei grafici",
  "linea-media": "Solo la linea tratteggiata della media",
};

/** Il colore di un ruolo come valore CSS (`var(--comando)`): per SVG e stili in linea. */
export const roleVar = (role: Role): string => `var(--${role})`;

/** Le classi complete (Tailwind le trova solo scritte per intero). */
export const ROLE_TEXT: Record<Role, string> = {
  sfondo: "text-sfondo",
  scheda: "text-scheda",
  tessera: "text-tessera",
  pannello: "text-pannello",
  testo: "text-testo",
  "testo-secondario": "text-testo-secondario",
  separatore: "text-separatore",
  comando: "text-comando",
  "in-obiettivo": "text-in-obiettivo",
  attenzione: "text-attenzione",
  fuori: "text-fuori",
  sotto: "text-sotto",
  passi: "text-passi",
  bici: "text-bici",
  "linea-obiettivo": "text-linea-obiettivo",
  "linea-media": "text-linea-media",
};

export const ROLE_BG: Record<Role, string> = {
  sfondo: "bg-sfondo",
  scheda: "bg-scheda",
  tessera: "bg-tessera",
  pannello: "bg-pannello",
  testo: "bg-testo",
  "testo-secondario": "bg-testo-secondario",
  separatore: "bg-separatore",
  comando: "bg-comando",
  "in-obiettivo": "bg-in-obiettivo",
  attenzione: "bg-attenzione",
  fuori: "bg-fuori",
  sotto: "bg-sotto",
  passi: "bg-passi",
  bici: "bg-bici",
  "linea-obiettivo": "bg-linea-obiettivo",
  "linea-media": "bg-linea-media",
};

/**
 * Corrispondenza tra gli stati del motore e i colori di §10.2 (il motore non cambia, cambia solo il colore mostrato):
 * "verde" → In obiettivo; "giallo" → Attenzione; "rosso" → Fuori; "accento" → Comando se il giorno è oggi o futuro,
 * Sotto se il giorno è già passato. Un giorno senza pasti ("neutro") resta nel grigio secondario.
 */
export function ringRole(color: RingColor, date: DateKey, today: DateKey): Role {
  switch (color) {
    case "accento":
      return date >= today ? "comando" : "sotto";
    case "verde":
      return "in-obiettivo";
    case "giallo":
      return "attenzione";
    case "rosso":
      return "fuori";
    default:
      return "testo-secondario";
  }
}

/** Lo stesso per i semafori dei nutrienti (che non dipendono dal giorno). */
export function lightRole(light: Light): Role {
  switch (light) {
    case "verde":
      return "in-obiettivo";
    case "giallo":
      return "attenzione";
    case "rosso":
      return "fuori";
    default:
      return "testo-secondario";
  }
}
