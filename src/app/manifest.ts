import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ssanguine Maison",
    short_name: "Ssanguine",
    description: "Garments, flora & small ceremonies for the violet hour.",
    start_url: "/en",
    display: "standalone",
    background_color: "#fdfbf7",
    theme_color: "#2a1854",
    icons: [
      // Replace with actual PNG icons after launch.
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  };
}
