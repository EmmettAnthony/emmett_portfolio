import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/get-site-settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  return {
    name: `${settings.siteName} | ${settings.tagline}`,
    short_name: settings.siteName,
    description: settings.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#09090b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon-120x120.png",
        sizes: "120x120",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon-76x76.png",
        sizes: "76x76",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        src: "/pwa-screenshot-mobile.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: "Homepage — Emmett Anthony, Professional Software Developer",
      },
      {
        src: "/pwa-screenshot-desktop.png",
        sizes: "1280x1003",
        type: "image/png",
        form_factor: "wide",
        label: "Homepage — Emmett Anthony, Professional Software Developer",
      },
    ],
  };
}
