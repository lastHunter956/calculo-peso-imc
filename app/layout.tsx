import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AudioSettingsProvider } from "../contexts/AudioSettingsContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Evaluación de Salud",
  description: "Análisis biométrico avanzado con información personalizada",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AudioSettingsProvider>{children}</AudioSettingsProvider>
      </body>
    </html>
  );
}
