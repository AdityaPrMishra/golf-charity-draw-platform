import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Golf Charity Draw API",
  description: "Backend API for the Golf Charity Draw platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
