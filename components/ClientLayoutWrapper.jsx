'use client';

import React from "react";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import CartPopup from "@/components/CartPopup";
import TelegramPopup from "@/components/TelegramPopup";
import BottomNavbar from "@/components/BottomNavbar/BottomNavbar";
import ConditionalLayout from "@/components/ConditionalLayout";
import usePullToRefresh from '@/hooks/usePullToRefresh';

export default function ClientLayoutWrapper({ children }) {
  // Call the hook here to enable pull-to-refresh globally
  usePullToRefresh();
  
  return (
    <ClerkProvider>
      <Toaster />
      <AppContextProvider>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
        <CartPopup />
        <TelegramPopup />
        <BottomNavbar />
      </AppContextProvider>
    </ClerkProvider>
  );
}