import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Upendo Pharmacy",
  description: "Dawa bora, huduma ya kwanza - Upendo Pharmacy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sw">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
