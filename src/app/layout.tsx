import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { StoreBootstrap } from "@/components/store-bootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "DailyLog",
  description:
    "\u5e97\u8217\u30aa\u30fc\u30ca\u30fc\u5411\u3051\u306e\u7d71\u5408\u65e5\u8a8c\u30fb\u58f2\u4e0a\u30fb\u30b9\u30b1\u30b8\u30e5\u30fc\u30eb\u7ba1\u7406\u30a2\u30d7\u30ea",
  applicationName: "DailyLog",
  manifest: "/manifest.webmanifest"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body>
        <StoreBootstrap />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}