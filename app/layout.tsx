import type { Metadata } from "next";
import "./globals.css";
import "./companion.css";
import "@fontsource/chewy/400.css";
import { SessionProvider } from "@/components/game/SessionProvider";

export const metadata: Metadata = {
  title: "Pip — The AI Student You Have to Teach",
  description: "Teach it. Prove it. Master it. A magical math adventure where understanding restores a world.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><SessionProvider>{children}</SessionProvider></body>
    </html>
  );
}
