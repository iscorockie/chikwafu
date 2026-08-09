import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [ids, setIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chikwafu_wishlist")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("chikwafu_wishlist", JSON.stringify(ids));
  }, [ids]);

  const toggleWishlist = (product) => {
    setIds((prev) => {
      const has = prev.includes(product._id);
      if (has) {
        toast(`Removed ${product.name} from wishlist`);
        return prev.filter((id) => id !== product._id);
      }
      toast.success(`${product.name} saved to wishlist`);
      return [...prev, product._id];
    });
  };

  const isWishlisted = (id) => ids.includes(id);

  return (
    <WishlistContext.Provider value={{ ids, toggleWishlist, isWishlisted, count: ids.length }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
