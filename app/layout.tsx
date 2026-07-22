import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#090a0c",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://morrow.systems"),
  title: "Morrow — Strategic certainty, compiled",
  description:
    "A decision intelligence system that turns evidence into causal maps, counterfactual simulations, and auditable action.",
  applicationName: "Morrow",
  openGraph: {
    title: "Morrow — Interrogate the future",
    description:
      "Evidence-grounded decision intelligence for irreversible bets.",
    type: "website",
    images: [{ url: "/og.png", width: 1730, height: 909 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Morrow — Interrogate the future",
    description:
      "Evidence-grounded decision intelligence for irreversible bets.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
