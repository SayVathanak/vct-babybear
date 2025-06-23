import { serve } from "inngest/next";
import { 
    inngest,
    createUserOrder, 
    deductInventory,         
    restoreInventory,        
    syncUserCreation, 
    syncUserDeletion, 
    syncUserUpdation, 
    handleItemStatusUpdated, 
    handleOrderStatusUpdated, 
    verifyBakongPayments, 
    checkFastApiHealth 
} from "@/config/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    createUserOrder,
    deductInventory,         
    restoreInventory,        
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    handleItemStatusUpdated,
    handleOrderStatusUpdated,
    verifyBakongPayments,
    checkFastApiHealth
  ],
});