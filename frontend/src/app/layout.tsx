import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="bg-[#eef2f6] text-slate-800 antialiased selection:bg-[#635bff] selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
