import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "./components/nav";
import { NoticeBanner } from "./components/notice-banner";
import { DataProvider } from "./data-provider";

export const metadata: Metadata = {
  title: "Personal Health",
  description: "Dieta e attività fisica, in un posto solo.",
  appleWebApp: { capable: true, title: "Personal Health", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <DataProvider>
          <div className="mx-auto flex min-h-dvh w-full flex-col max-w-xl px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
            <NoticeBanner />
            {children}
          </div>
          <BottomNav />
        </DataProvider>
      </body>
    </html>
  );
}
