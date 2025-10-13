import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import ProviderWrapper from "@/components/provider-wrapper";
import { ToastContainer } from "react-toastify";
import { NuqsAdapter } from "@/lib/nuqs-adapter";

import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hệ thống Quản lý Tài liệu",
  description: "Hệ thống quản lý tài liệu tĩnh hiện đại",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ToastContainer
          position="top-right"
          autoClose={2500}
          hideProgressBar
          theme="colored"
        />
        <NuqsAdapter>
          <ProviderWrapper>{children}</ProviderWrapper>
        </NuqsAdapter>
      </body>
    </html>
  );
}
