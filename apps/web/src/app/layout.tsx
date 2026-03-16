import type { Metadata } from "next";
import type { ReactNode } from "react";

import { env } from "@/env";

import "./globals.css";

export const metadata: Metadata = {
  title: env.NEXT_PUBLIC_APP_NAME,
  description: "Monorepo foundation for the Blackout Manor AI social-thriller.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
