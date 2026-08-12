import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Stackline Poker | Play Texas Hold'em",
  description: "Play-money Texas Hold'em with real-time tables and leaderboards."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
