import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export default function CartDrawer() {
  const { items, removeItem, clearCart, total, isOpen, setIsOpen } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const customerEmail = user?.email ?? "";
      const productNames = items.map(i => i.title).join(", ");
      const callbackUrl = `${window.location.origin}/purchase-success?product=${encodeURIComponent(productNames)}&type=bundle`;
      const { data, error } = await supabase.functions.invoke("paystack-checkout", {
        body: {
          email: customerEmail,
          amount: total,
          callback_url: callbackUrl,
          metadata: {
            type: "cart_bundle",
            customer_email: customerEmail || undefined,
            products: items.map(i => ({ title: i.title, price: i.price, file: i.file })),
          },
        },
      });
      if (error || !data?.authorization_url) throw new Error(data?.error || "Checkout failed");
      clearCart();
      window.location.href = data.authorization_url;
    } catch (err: any) {
      alert(err.message || "Payment error");
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Your Cart ({items.length})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Your cart is empty
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.country}</p>
                  </div>
                  <p className="text-sm font-bold text-primary mx-3">${item.price}</p>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">${total}</span>
              </div>
              <Button className="w-full" size="lg" onClick={handleCheckout} disabled={loading}>
                {loading ? "Processing..." : `Checkout — $${total}`} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={clearCart}>
                Clear Cart
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
