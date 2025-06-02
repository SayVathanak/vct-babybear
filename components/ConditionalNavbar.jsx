'use client';

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";
import { useEffect, useState } from "react";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const [isSellerRoute, setIsSellerRoute] = useState(false);

  useEffect(() => {
    setIsSellerRoute(pathname?.startsWith('/seller'));
  }, [pathname]);

  useEffect(() => {
    // Dynamically adjust the main content padding based on navbar visibility
    const mainElement = document.querySelector('main');
    if (mainElement) {
      if (isSellerRoute) {
        mainElement.className = mainElement.className.replace('pt-12', 'pt-4');
      } else {
        mainElement.className = mainElement.className.replace('pt-4', 'pt-12');
      }
    }
  }, [isSellerRoute]);

  if (isSellerRoute) {
    return null;
  }

  return <Navbar />;
}