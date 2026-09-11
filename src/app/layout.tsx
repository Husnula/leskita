import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
export const metadata: Metadata = { title: "LesKita | Tutoring Management", description: "Platform SaaS Manajemen Les Profesional" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" /></head>
      <body className="antialiased font-sans bg-surface text-ink"><ErrorBoundary>{children}</ErrorBoundary></body>
    </html>
  );
}
