import { createContext, useContext, useState, ReactNode } from "react";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  type: "country_report" | "sector_brief" | "audience_note";
  file?: string;
  country: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
    setIsOpen(true);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setItems([]);
  const total = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
