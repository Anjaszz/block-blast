import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlockArena | Competitive Block Blast",
  description: "Web-based multiplayer block puzzle arena. Compete in 5-player stages or rise on the global leaderboard.",
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
      </body>
    </html>
  );
}
