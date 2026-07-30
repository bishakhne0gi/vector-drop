import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "@/components/shared/QueryProvider";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { PostHogProvider } from "@/components/shared/PostHogProvider";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/seo/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Free Image to SVG Converter — Vectorize PNG & JPG in Seconds",
    template: "%s | VectorDrop",
  },
  description:
    "Turn any PNG or JPG into a clean, editable SVG in seconds. Free and browser-based. A faster alternative to Illustrator Image Trace and Vectorizer.AI.",
  keywords: [
    "image to svg",
    "png to svg",
    "jpg to svg",
    "raster to vector",
    "vector converter",
    "svg converter",
    "vectorize image",
    "free svg converter",
    "adobe illustrator alternative",
    "vectorizer ai alternative",
    "svg trace",
    "image trace",
    "figma vectorize alternative",
    "bitmap to vector",
    "online svg converter",
  ],
  authors: [{ name: "VectorDrop", url: SITE_URL }],
  creator: "VectorDrop",
  publisher: "VectorDrop",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "VectorDrop",
    title: "Free Image to SVG Converter — Vectorize PNG & JPG in Seconds",
    description:
      "Turn any PNG or JPG into a clean, editable SVG in seconds. Free and browser-based.",
    images: [`${SITE_URL}/opengraph-image`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Image to SVG Converter — Vectorize PNG & JPG in Seconds",
    description:
      "Turn any PNG or JPG into a clean SVG in seconds. Free and browser-based. Illustrator Image Trace & Vectorizer.AI alternative.",
    site: "@vectordrop",
    creator: "@vectordrop",
    images: [`${SITE_URL}/opengraph-image`],
  },
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  icons: {
    icon: "/icon",
    shortcut: "/icon",
    apple: "/apple-icon",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "VectorDrop",
      url: SITE_URL,
      logo: `${SITE_URL}/icon`,
      sameAs: ["https://x.com/vectordrop"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "VectorDrop",
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: "VectorDrop",
      url: SITE_URL,
      description:
        "Convert PNG, JPG, and raster images to clean, editable SVG vectors instantly. Free, fast, and browser-based.",
      applicationCategory: "DesignApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Preconnect to external origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <ClerkProvider>
          <PostHogProvider>
            <ThemeProvider>
              <QueryProvider>{children}</QueryProvider>
            </ThemeProvider>
          </PostHogProvider>
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}
