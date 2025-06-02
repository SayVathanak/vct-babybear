'use client';

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isSellerRoute = pathname?.startsWith('/seller');

  return (
    <>
      {!isSellerRoute && <Navbar />}
      <main className={`pb-4 pb-safe ${!isSellerRoute ? 'pt-12' : 'pt-4'}`}>
        {children}
      </main>
    </>
  );
}