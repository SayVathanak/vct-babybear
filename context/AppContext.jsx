// context/AppContext.jsx
'use client'
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext);
}

export const AppContextProvider = (props) => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY;
    const router = useRouter();

    const { user } = useUser();
    const { getToken, openSignIn } = useAuth();

    const [products, setProducts] = useState([]);
    const [userData, setUserData] = useState(false);
    const [isSeller, setIsSeller] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [showCartPanel, setShowCartPanel] = useState(false);

    // This effect now implements the logic based on the cart item count.
    useEffect(() => {
        // Calculate the total number of items in the cart.
        const totalItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

        // Check if the panel has already been shown in this session.
        const hasPanelBeenShown = sessionStorage.getItem('cartPanelShown') === 'true';

        // Logic: If the total item count is exactly 1 AND the panel hasn't been shown yet this session...
        if (totalItems === 1 && !hasPanelBeenShown) {
            setShowCartPanel(true); // ...then show the panel.
            sessionStorage.setItem('cartPanelShown', 'true'); // And set a flag so it doesn't show again.
        }
    }, [cartItems]); // This effect re-runs whenever the cart items change.

    const fetchProductData = async () => {
        try {
            const { data } = await axios.get('/api/product/list');
            if (data.success) {
                setProducts(data.products);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const fetchUserData = async () => {
        try {
            if (user?.publicMetadata?.role === 'seller') {
                setIsSeller(true);
            }

            const token = await getToken();
            const { data } = await axios.get('/api/user/data', { headers: { Authorization: `Bearer ${token}` } });

            if (data.success) {
                setUserData(data.user);
                setCartItems(data.user.cartItems);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // The addToCart function is now simplified. It only handles adding to the cart.
    const addToCart = async (productId, quantity = 1, replaceQuantity = false) => {
        setIsAddingToCart(true);

        setTimeout(async () => {
            let cartData = structuredClone(cartItems);

            if (replaceQuantity || !cartData[productId]) {
                cartData[productId] = quantity;
            } else {
                cartData[productId] += quantity;
            }
            
            // This state update will trigger the useEffect above.
            setCartItems(cartData);

            if (user) {
                try {
                    const token = await getToken();
                    await axios.post('/api/cart/update', { cartData }, { headers: { Authorization: `Bearer ${token}` } });
                } catch (error) {
                    toast.error(error.message);
                }
            }

            setIsAddingToCart(false);
        }, 300);
    }

    const updateCartQuantity = async (itemId, quantity) => {
        let cartData = structuredClone(cartItems);
        if (quantity <= 0) {
            delete cartData[itemId];
        } else {
            cartData[itemId] = quantity;
        }
        setCartItems(cartData);

        if (user) {
            try {
                const token = await getToken();
                await axios.post('/api/cart/update', { cartData }, { headers: { Authorization: `Bearer ${token}` } });
                toast.success('Cart Updated');
            } catch (error) {
                toast.error(error.message);
            }
        }
    }

    const increaseQty = (productId, quantity = 1, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const currentQty = cartItems[productId] || 0;
        updateCartQuantity(productId, currentQty + 1);
    }

    const decreaseQty = (productId, currentQuantity, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        updateCartQuantity(productId, currentQuantity - 1);
    }

    const handlePayClick = () => {
        if (user) {
            router.push("/cart");
        } else {
            toast.error("Please login to continue purchasing");
            openSignIn();
        }
    }

    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            if (cartItems[items] > 0) {
                totalCount += cartItems[items];
            }
        }
        return totalCount;
    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (itemInfo && cartItems[items] > 0) {
                totalAmount += (itemInfo.offerPrice || itemInfo.price) * cartItems[items];
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    }

    useEffect(() => {
        fetchProductData();
    }, []);

    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user]);

    const value = {
        user, getToken,
        currency, router,
        isSeller, setIsSeller,
        userData, fetchUserData,
        products, fetchProductData,
        cartItems, setCartItems,
        addToCart, updateCartQuantity,
        getCartCount, getCartAmount,
        isAddingToCart, setIsAddingToCart,
        increaseQty, decreaseQty,
        handlePayClick,
        searchOpen,
        setSearchOpen,
        showCartPanel,
        setShowCartPanel
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
}
    