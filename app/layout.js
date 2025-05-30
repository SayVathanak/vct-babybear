import { Outfit } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import CartPopup from "@/components/CartPopup";
import TelegramPopup from "@/components/TelegramPopup";

const outfit = Outfit({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700"] 
});

export const metadata = {
  title: "Home | Baby Bear",
  description: "Premium Imported Baby Products - Baby Bear",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Baby Bear',
  },
  icons: {
    apple: '/icons/icon-192x192.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

// COMPLETELY REMOVE viewport restrictions for iOS PWA keyboard fix
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
  // Removed maximumScale and userScalable entirely
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* PWA Manifest */}
          <link rel="manifest" href="/manifest.json" />
          
          {/* Theme Colors */}
          <meta name="theme-color" content="#ffffff" />
          <meta name="msapplication-TileColor" content="#ffffff" />
          
          {/* Apple Specific Meta Tags */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Baby Bear" />
          
          {/* Apple Touch Icons */}
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
          <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
          
          {/* Splash Screen for iOS */}
          <link rel="apple-touch-startup-image" href="/icons/splash-2048x2732.png" />
          
          {/* iOS PWA Keyboard Fix - Alternative viewport */}
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
          
          {/* Remove format detection that might interfere */}
          {/* <meta name="format-detection" content="telephone=no" /> */}
        </head>
        <body className={`${outfit.className} antialiased text-gray-700`}>
          <Toaster />
          <AppContextProvider>
            {children}
            <CartPopup />
            <TelegramPopup />
          </AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}