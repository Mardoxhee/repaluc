import type { NextConfig } from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  cacheOnNavigation: true,
  // Ne PAS recharger automatiquement à la reconnexion : cela peut
  // interrompre l'utilisateur et, sur connexion faible, remplacer un
  // rendu hors-ligne valide par une page cassée.
  reloadOnOnline: false,
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withFlowbiteReact(withSerwist(nextConfig));