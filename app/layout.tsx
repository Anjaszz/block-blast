import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";

export const viewport: Viewport = {
  themeColor: "#0a0c12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "BlockArena | Competitive Block Blast",
  description: "Web-based multiplayer block puzzle arena. Compete in 5-player stages or rise on the global leaderboard.",
  applicationName: "BlockArena",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BlockArena",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <body
        className="min-h-full bg-[#0a0c12] text-white flex flex-col font-sans antialiased selection:bg-[#2563eb] selection:text-white"
        suppressHydrationWarning
      >
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
