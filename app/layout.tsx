import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rackd-nvl.vercel.app"),

  title: {
    default: "rackd.nvl — Affordable Branded Clothing",
    template: "%s | rackd.nvl",
  },

  description:
    "Affordable branded clothing in Naval, Biliran. Browse workwear, vintage, streetwear and sportswear from rackd.nvl.",

  keywords: [
    "rackd.nvl",
    "branded clothes",
    "affordable clothes",
    "Naval Biliran",
    "clothing Philippines",
    "workwear",
    "vintage clothing",
    "streetwear",
    "sportswear",
  ],

  openGraph: {
    title: "rackd.nvl — Affordable Branded Clothing",

    description:
      "Curated branded clothing at reasonable prices.",

    url: "https://rackd-nvl.vercel.app",

    siteName: "rackd.nvl",

    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "rackd.nvl — Affordable Branded Clothing",
      },
    ],

    locale: "en_PH",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title: "rackd.nvl — Affordable Branded Clothing",

    description:
      "Curated branded clothing at reasonable prices.",

    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}