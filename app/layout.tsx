import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWAUpdateBanner from "@/components/PWAUpdateBanner";
import NavigationProgress from "@/components/NavigationProgress";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  themeColor: "#0F766E",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://futurewaymakers.co.za"),
  title: {
    default: "Future WayMakers - Your CV, but make it TikTok.",
    template: "%s | Future WayMakers"
  },
  description: "The TikTok-ified talent marketplace for the SA hustle. Show your skill, get the gig, and build your vibe CV.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  keywords: ["Future WayMakers", "Jobs South Africa", "Video CV", "Hustle", "Talent Marketplace", "TikTok CV"],
  authors: [{ name: "Future WayMakers Team" }],
  creator: "Future WayMakers Platform Group",
  publisher: "Future WayMakers",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "https://futurewaymakers.co.za",
    siteName: "Future WayMakers",
    title: "Future WayMakers - Your CV, but make it TikTok.",
    description: "The TikTok-ified talent marketplace for the SA hustle. Show your skill, get the gig, and build your vibe CV.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Future WayMakers - Show Your Skill. Get The Gig.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Future WayMakers - Your CV, but make it TikTok.",
    description: "The TikTok-ified talent marketplace for the SA hustle. Show your skill, get the gig, and build your vibe CV.",
    images: ["/og-image.png"],
    creator: "@futurewaymakers",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Future WayMakers",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body
        className="antialiased selection:bg-[#0F766E] selection:text-white relative"
      >
        <div className="vibe-overlay fixed inset-0 z-[9999] pointer-events-none" />
        <Suspense>
          <NavigationProgress />
        </Suspense>
        {children}
        <PWAInstallPrompt />
        <PWAUpdateBanner />
        <Toaster 
          richColors 
          position="top-center" 
          toastOptions={{
            style: { 
              background: '#0F172A', 
              color: '#fff', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '2rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }
          }} 
        />
      </body>
    </html>
  );
}
