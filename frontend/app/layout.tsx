import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERIZON AI - Crescimento Empresarial com IA",
  description: "Uma empresa completa operada por Inteligência Artificial",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
