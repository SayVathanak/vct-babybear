import { Outfit } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import CartPopup from "@/components/CartPopup";
import TelegramPopup from "@/components/TelegramPopup"; 
import TelegramChat from "@/components/TelegramChat"; 
import BottomNavbar from "@/components/BottomNavbar/BottomNavbar";
import ConditionalLayout from "@/components/ConditionalLayout";
import Script from "next/script";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap", // Better font loading performance
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
    icon: '/favicon.ico',
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152' },
      { url: '/icons/icon-167x167.png', sizes: '167x167' },
      { url: '/icons/icon-180x180.png', sizes: '180x180' },
      { url: '/icons/icon-192x192.png', sizes: '192x192' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Baby Bear',
    'msapplication-TileColor': '#ffffff',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevent zoom on iOS
  userScalable: false, // Disable zoom for app-like experience
  themeColor: '#ffffff',
  viewportFit: 'cover', // For iPhone X+ notch handling
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* Preconnect to external domains for better performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* PWA Manifest */}
          <link rel="manifest" href="/manifest.json" />
          
          {/* Favicon and Icons */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
          <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
          <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
          
          {/* Apple Splash Screens - Add more sizes for different devices */}
          <link 
            rel="apple-touch-startup-image" 
            media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" 
            href="/icons/splash-1290x2796.png" 
          />
          <link 
            rel="apple-touch-startup-image" 
            media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" 
            href="/icons/splash-1242x2688.png" 
          />
          <link 
            rel="apple-touch-startup-image" 
            media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" 
            href="/icons/splash-1125x2436.png" 
          />
          <link 
            rel="apple-touch-startup-image" 
            media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" 
            href="/icons/splash-828x1792.png" 
          />
          <link 
            rel="apple-touch-startup-image" 
            media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" 
            href="/icons/splash-750x1334.png" 
          />
          {/* Add a fallback splash screen */}
          <link rel="apple-touch-startup-image" href="/icons/splash-2048x2732.png" />
          
          {/* Critical CSS for mobile optimization */}
          <style dangerouslySetInnerHTML={{
            __html: `
              /* iOS Safari specific fixes */
              @supports (-webkit-touch-callout: none) {
                /* Prevent zoom on input focus */
                input[type="text"], 
                input[type="search"], 
                input[type="email"],
                input[type="password"],
                input[type="number"],
                input[type="tel"],
                textarea, 
                select {
                  font-size: 16px !important;
                  transform: translateZ(0); /* Hardware acceleration */
                }
              }
              
              /* Mobile-first optimizations */
              * {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
              }
              
              body {
                -webkit-user-select: none;
                user-select: none;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                touch-action: pan-x pan-y;
                overscroll-behavior: none; /* Prevent bounce scrolling */
              }
              
              /* Allow text selection in inputs and text areas */
              input, textarea, [contenteditable] {
                -webkit-user-select: text;
                user-select: text;
                -webkit-touch-callout: default;
              }
              
              /* Better touch targets */
              button, [role="button"], a {
                -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
                touch-action: manipulation;
                min-height: 44px; /* iOS recommended minimum touch target */
                min-width: 44px;
              }
              
              /* Improved viewport handling */
              .min-h-screen {
                min-height: 100vh;
                min-height: 100dvh; /* Dynamic viewport height */
                min-height: -webkit-fill-available;
              }
              
              /* Safe area handling for modern iOS devices */
              @supports (padding: max(0px)) {
                .pb-safe {
                  padding-bottom: max(1rem, env(safe-area-inset-bottom));
                }
                .pt-safe {
                  padding-top: max(1rem, env(safe-area-inset-top));
                }
                .pl-safe {
                  padding-left: max(1rem, env(safe-area-inset-left));
                }
                .pr-safe {
                  padding-right: max(1rem, env(safe-area-inset-right));
                }
              }
              
              /* Prevent horizontal scroll */
              html, body {
                overflow-x: hidden;
                width: 100%;
                max-width: 100%;
              }
              
              /* Performance optimizations */
              img {
                content-visibility: auto;
              }
              
              /* Better focus states for accessibility */
              button:focus-visible,
              a:focus-visible,
              input:focus-visible,
              textarea:focus-visible {
                outline: 2px solid #007AFF;
                outline-offset: 2px;
              }
              
              /* Loading state optimization */
              .loading {
                content-visibility: hidden;
              }
            `
          }} />
        </head>
        <body className={`${outfit.className} antialiased text-gray-700`}>
          {/* Toast notifications */}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
          
          {/* Main app context and layout */}
          <AppContextProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            
            {/* Global UI components */}
            <CartPopup />
            <TelegramPopup />
            {/* <TelegramChat /> */}
            <BottomNavbar />
          </AppContextProvider>
          
          {/* Load QuaggaJS with better performance */}
          <Script
            src="https://cdnjs.cloudflare.com/ajax/libs/quagga/0.14.0/quagga.min.js"
            strategy="lazyOnload"
            onLoad={() => {
              console.log('QuaggaJS loaded successfully');
            }}
            onError={(e) => {
              console.error('Failed to load QuaggaJS:', e);
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}