import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CredX — Alternative Credit Scoring",
  description:
    "CredX gives new-to-credit users a transparent, explainable credit health score powered by alternative financial signals.",
  keywords: ["alternative credit", "credit health", "fintech", "gig workers", "explainable AI"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
