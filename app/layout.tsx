import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rackle",
  description: "A Wordle-spinoff with a letter rack economy.",
  manifest: "/manifest.webmanifest",
  themeColor: "#111111",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
