import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "A* Marketplace · 星級頂尖教育平台",
    short_name: "A* Marketplace",
    description: "澳門導師配對與預約平台",
    start_url: "/zh-HK",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000225",
    theme_color: "#000225",
    lang: "zh-HK",
    dir: "ltr",
    categories: ["education"],
    icons: [
      {
        src: "/pwa/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/pwa/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
