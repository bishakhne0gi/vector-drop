import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/shared/QueryProvider";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vectordrop.co.in"),
  title: {
    default: "VectorDrop — Free Image to SVG Converter Online",
    template: "%s | VectorDrop",
  },
  description:
    "Convert PNG, JPG, and raster images to clean, editable SVG vectors instantly. Better than Adobe Illustrator Image Trace, Vectorizer.AI, and SVGtrace — free, fast, and browser-based.",
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
  authors: [{ name: "VectorDrop", url: "https://vectordrop.co.in" }],
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
    url: "https://vectordrop.co.in",
    siteName: "VectorDrop",
    title: "VectorDrop — Free Image to SVG Converter Online",
    description:
      "Convert PNG, JPG, and raster images to clean, editable SVG vectors instantly. No Illustrator needed.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VectorDrop — Image to SVG Converter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VectorDrop — Free Image to SVG Converter Online",
    description:
      "Convert PNG & JPG images to clean SVG vectors instantly. Better than Vectorizer.AI & Illustrator Image Trace — free.",
    site: "@vectordrop",
    creator: "@vectordrop",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://vectordrop.co.in",
  },
  icons: {
    icon: "/icon",
    shortcut: "/icon",
    apple: "/apple-icon",
  },
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
      <body className="min-h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
