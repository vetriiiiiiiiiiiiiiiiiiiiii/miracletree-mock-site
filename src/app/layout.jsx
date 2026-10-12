import { Assistant } from "next/font/google";
import { SITE } from "@/lib/constants";
import { organizationSchema, siteUrl, websiteSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { Analytics } from "@/components/analytics/Analytics";
import "./globals.css";

// Dawn's default type: Assistant for body and headings alike.
const assistant = Assistant({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-assistant",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(siteUrl("/")),
  title: {
    default: `${SITE.name} — Moringa superfoods from Madurai`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.legalName }],
  creator: SITE.legalName,
  publisher: SITE.legalName,
  formatDetection: { telephone: false, address: false, email: false },
  alternates: { canonical: siteUrl("/") },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE.name,
    url: siteUrl("/"),
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    // Dawn has one colour scheme on the storefront, so the theme is fixed.
    <html lang="en-IN" data-theme="light" className={assistant.variable}>
      <body>
        <JsonLd id="org" data={organizationSchema()} />
        <JsonLd id="website" data={websiteSchema()} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
