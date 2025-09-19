
import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { FetchProvider } from "./context/FetchContext";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={`${rubik.variable} font-sans antialiased overflow-x-hidden w-screen max-w-full`}>
        <FetchProvider>
          {children}
        </FetchProvider>
      </body>
    </html>
  );
}