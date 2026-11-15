import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = { title: "myNotebook", description: "Apprendre • Organiser • Réussir" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
