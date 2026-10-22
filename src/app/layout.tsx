import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthGate } from "./auth-provider";
import { ImportPrompt } from "./components/data-import";
import { BottomNav } from "./components/nav";
import { Onboarding } from "./components/onboarding";
import { NoticeBanner } from "./components/notice-banner";
import { DataProvider } from "./data-provider";
import { VERSIONI, versioneCorrente } from "./lib/versione";

const versione = versioneCorrente();
const dati = VERSIONI[versione];

export const metadata: Metadata = {
  title: dati.nome,
  description: "Dieta e attività fisica, in un posto solo.",
  appleWebApp: { capable: true, title: dati.nome, statusBarStyle: "black" },
  formatDetection: { telephone: false },
  // Nella versione principale restano le icone di src/app (icon.png, apple-icon.png).
  ...(versione === "principale"
    ? {}
    : { icons: { icon: dati.icona512, apple: dati.iconaApple } }),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Colore della barra del browser: lo Sfondo di §10.2 (nero pieno).
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <DataProvider>
          <AuthGate>
            {/* In fondo c'è spazio per la barra, per il tasto + e per il respiro tra i due (BRIEF §10.4). */}
            <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-[calc(10rem+env(safe-area-inset-bottom))]">
              <NoticeBanner />
              {children}
            </div>
            <BottomNav />
            <ImportPrompt />
            <Onboarding />
          </AuthGate>
        </DataProvider>
      </body>
    </html>
  );
}
