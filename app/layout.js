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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* ... your head content ... */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#ffffff" />
          <meta name="msapplication-TileColor" content="#ffffff" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Baby Bear" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
          <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
          <link rel="apple-touch-startup-image" href="/icons/splash-2048x2732.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
          <style dangerouslySetInnerHTML={{
            __html: `
              @supports (-webkit-touch-callout: none) {
                input[type="text"], input[type="search"], textarea {
                  font-size: 16px !important;
                }
              }
              body {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                user-select: none;
              }
              input, textarea, [contenteditable] {
                -webkit-user-select: text;
                user-select: text;
              }
              button, [role="button"], a {
                -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
                touch-action: manipulation;
              }
              input, select, textarea {
                font-size: 16px;
              }
              .min-h-screen {
                min-height: 100vh;
                min-height: -webkit-fill-available;
              }
              @supports (padding: max(0px)) {
                .pb-safe {
                  padding-bottom: max(1rem, env(safe-area-inset-bottom));
                }
              }
            `
          }} />
          <script src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2/dist/quagga.min.js"></script>
        </head>
        <body className={`${outfit.className} antialiased text-gray-700`}>
          <Toaster />
          <AppContextProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <CartPopup />
            <TelegramPopup />
            {/* <TelegramChat /> */}
            <BottomNavbar />
          </AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}