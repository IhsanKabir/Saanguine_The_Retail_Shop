import type { Metadata } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://ssanguine.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: { default: "Ssanguine Maison", template: "%s · Ssanguine" },
  description: "Garments, flora & small ceremonies for the violet hour. A Bangladeshi maison, slowly assembled.",
  applicationName: "Ssanguine",
  keywords: ["luxury", "Bangladesh", "Dhaka", "perfume", "jewelry", "clothing", "boutique", "maison"],
  openGraph: {
    type: "website",
    siteName: "Ssanguine Maison",
    locale: "en_BD",
    alternateLocale: ["bn_BD"],
    url: BASE,
    title: "Ssanguine Maison",
    description: "Garments, flora & small ceremonies for the violet hour.",
  },
  twitter: { card: "summary_large_image", title: "Ssanguine Maison" },
  formatDetection: { email: false, address: false, telephone: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
