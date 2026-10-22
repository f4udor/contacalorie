// Genera le icone delle versioni di prova (giallo "dev", rosso "prova") dalle icone blu di oggi:
// stesso disegno, cambia solo il fondo. Uso: npm run icone
import sharp from "sharp";

const FONDI = { dev: [0xff, 0xcc, 0x00], prova: [0xff, 0x3b, 0x30] };
const ORIGINALI = [
  ["public/icon-192.png", "icon-192.png"],
  ["public/icon-512.png", "icon-512.png"],
  ["src/app/apple-icon.png", "apple-icon.png"],
];

for (const [src, nome] of ORIGINALI) {
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bg = [data[0], data[1], data[2]]; // l'angolo è fondo puro
  for (const [versione, nuovo] of Object.entries(FONDI)) {
    const out = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i += 3) {
      // quanto bianco c'è nel pixel (0 = fondo, 1 = bianco), dal canale con più escursione
      const a = Math.min(1, Math.max(0, (data[i] - bg[0]) / (255 - bg[0])));
      for (let c = 0; c < 3; c++) out[i + c] = Math.round(nuovo[c] + a * (255 - nuovo[c]));
    }
    await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } })
      .png()
      .toFile(`public/icone/${versione}-${nome}`);
  }
}
