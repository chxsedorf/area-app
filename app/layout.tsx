import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { AreaProvider } from "@/components/AreaProvider";

export const metadata: Metadata = {
  title: "AREA",
  description: "歩いた場所が、あなたのAREAになる。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <AreaProvider>{children}</AreaProvider>
      </body>
    </html>
  );
}