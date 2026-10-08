/** Errore dello sportello dei dati con un messaggio già pronto da mostrare all'utente. */
export class DataStoreError extends Error {
  constructor(
    message: string,
    readonly kind: "lettura" | "scrittura" | "accesso",
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DataStoreError";
  }
}

export const MESSAGE_READ_FAILED = "Non riesco a leggere i dati: controlla la connessione e riprova.";
export const MESSAGE_WRITE_FAILED = "Non è stato possibile salvare: controlla la connessione e riprova. Quello che hai scritto non è andato perso.";
export const MESSAGE_NOT_SIGNED_IN = "Non hai effettuato l'accesso.";
