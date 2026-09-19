import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AppShell } from "@/components/hireflow/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hireflow.vercel.app";

const TITLE = "HireFlow — Evidence-backed candidate screening";
const DESCRIPTION =
  "HireFlow maps candidates against job requirements, shows the source evidence behind every claim, and flags what it cannot verify instead of guessing.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "HireFlow",
  keywords: [
    "AI recruitment",
    "candidate screening",
    "evidence-backed hiring",
    "interview intelligence",
    "explainable AI",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "HireFlow",
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
