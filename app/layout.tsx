
import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { FetchProvider } from "./context/FetchContext";
import OfflineIndicator from "./components/OfflineIndicator";
import PWAInstaller from "./components/PWAInstaller";
import SerwistProvider from "./components/SerwistProvider";

// Configuration de la police Rubik avec les sous-ensembles et styles nécessaires
const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  // Vous pouvez ajouter d'autres options comme :
  // weight: ["400", "500", "700"], // Pour charger plusieurs poids
  // style: ["normal", "italic"],   // Pour charger les italiques
});

export const metadata: Metadata = {
  title: "Suivi des victimes",
  description: "App de suivi de victimes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Suivi des victimes",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Suivi des victimes",
    title: "Suivi des victimes",
    description: "Application de suivi et gestion des victimes",
  },
  twitter: {
    card: "summary",
    title: "Suivi des victimes",
    description: "Application de suivi et gestion des victimes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="overflow-x-hidden">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${rubik.variable} font-sans antialiased overflow-x-hidden w-screen max-w-full`}>
        <FetchProvider>
          <SerwistProvider />
          <PWAInstaller />
          <OfflineIndicator />
          {children}
        </FetchProvider>
      </body>
    </html>
  );
}