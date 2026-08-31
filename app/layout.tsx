import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "PromptGuard - Auditor de seguranca para LLMs",
  description:
    "Simula ataques de prompt injection e jailbreak contra o seu system prompt e expoe falhas de protecao antes da producao.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-base-950 text-ink-600 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}