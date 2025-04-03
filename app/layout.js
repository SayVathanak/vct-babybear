import { Outfit } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import CartPopup from "@/components/CartPopup"; // Import the CartPopup component

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500"] });

export const metadata = {
  title: "Home | Baby Bear",
  description: "VCT Baby Bear",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${outfit.className} antialiased text-gray-700`} >
          <Toaster />
          <AppContextProvider>
            {children}
            <CartPopup /> {/* Add the CartPopup component here */}
          </AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}