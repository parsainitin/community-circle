import type { Metadata, Viewport } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CommunityProvider } from "@/context/CommunityContext";
import AppLayout from "@/components/AppLayout";
import PWARegister from "@/components/PWARegister";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jambu Community Circle",
  description: "A mobile-first community portal mimicking WhatsApp's clean interface",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ComCircle",
  },
};

export const viewport: Viewport = {
  themeColor: "#128C7E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-slate-100 flex justify-center min-h-screen w-full">
        <AuthProvider>
          <CommunityProvider>
            <PWARegister />
            <AppLayout>{children}</AppLayout>
          </CommunityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


