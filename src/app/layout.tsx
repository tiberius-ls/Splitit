import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WalletProvider } from "@/lib/WalletContext";

export const metadata: Metadata = {
  title: "SplitIt | Nimiq Mini App",
  description: "Split expenses instantly with friends using Nimiq Pay.",
  applicationName: "SplitIt",
  appleWebApp: {
    capable: true,
    title: "SplitIt",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f111a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <div id="app-container">
            {children}
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
