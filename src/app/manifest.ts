import type { MetadataRoute } from "next";
import { VERSIONI, versioneCorrente } from "./lib/versione";

export default function manifest(): MetadataRoute.Manifest {
  const v = VERSIONI[versioneCorrente()];
  return {
    name: v.nome,
    short_name: v.nome,
    description: "Dieta e attività fisica, in un posto solo.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    lang: "it",
    icons: [
      { src: v.icona192, sizes: "192x192", type: "image/png" },
      { src: v.icona512, sizes: "512x512", type: "image/png" },
    ],
  };
}
