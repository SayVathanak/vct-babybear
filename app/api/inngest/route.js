import { serve } from "inngest/next";
import { createUserOrder, inngest, syncUserCreation, syncUserDeletion, syncUserUpdation, handleItemStatusUpdated, handleOrderStatusUpdated, verifyBakongPayments } from "@/config/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    createUserOrder,
    handleItemStatusUpdated,
    handleOrderStatusUpdated,
    verifyBakongPayments 
  ],
});
