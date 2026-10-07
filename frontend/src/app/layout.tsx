import type { Metadata } from "next";
import "./globals.css";
import "./liquid-glass.css";
import "./landing.css";

export const metadata: Metadata = {
  title: "ASCEND — Autonomous Cross-Channel Intelligence & Decision Engine",
  description: "AI-native advertising intelligence and autonomous decision engine for D2C brands",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen selection:bg-white/25 selection:text-white">
        {children}
      </body>
    </html>
  );
}
