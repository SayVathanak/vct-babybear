import { Outfit } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import CartPopup from "@/components/CartPopup";
import TelegramPopup from "@/components/TelegramPopup"; // Import the new TelegramPopup component

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata = {
  title: "Home | Baby Bear",
  description: "Premium Imported Baby Products - Baby Bear",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${outfit.className} antialiased text-gray-700`} >
          <Toaster />
          <AppContextProvider>
            {children}
            <CartPopup />
            <TelegramPopup /> {/* Add the TelegramPopup component here */}
          </AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}