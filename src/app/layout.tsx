import type { Metadata } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://saanguine.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: { default: "Saanguine Maison", template: "%s · Saanguine" },
  description: "Garments, flora & small ceremonies for the violet hour. A Bangladeshi maison, slowly assembled.",
  applicationName: "Saanguine",
  keywords: ["luxury", "Bangladesh", "Dhaka", "perfume", "jewelry", "clothing", "boutique", "maison"],
  openGraph: {
    type: "website",
    siteName: "Saanguine Maison",
    locale: "en_BD",
    alternateLocale: ["bn_BD"],
    url: BASE,
    title: "Saanguine Maison",
    description: "Garments, flora & small ceremonies for the violet hour.",
  },
  twitter: { card: "summary_large_image", title: "Saanguine Maison" },
  formatDetection: { email: false, address: false, telephone: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
