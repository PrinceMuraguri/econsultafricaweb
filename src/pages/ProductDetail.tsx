import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { getProductBySlug } from "@/data/marketplace-products";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Eye, ArrowRight, Lock, ArrowLeft, BookOpen, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { motion } from "framer-motion";
import { trackFunnelEvent } from "@/lib/sales-funnel";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug || "");
  const { addItem } = useCart();
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {
    if (product) {
      trackFunnelEvent("product_click", { productId: product.id, productTitle: product.title, productType: product.type });
    }
  }, [product?.id]);

  if (!product) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product not found</h1>
          <Button asChild><Link to="/intelligence-marketplace">Back to Marketplace</Link></Button>
        </div>
      </Layout>
    );
  }

  const handleBuyNow = async () => {
    if (!product.available) return;
    setPurchaseLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/purchase-success?product=${encodeURIComponent(product.title)}&type=${product.type}`;
      const { data, error } = await supabase.functions.invoke("paystack-checkout", {
        body: {
          email: "",
          amount: product.price,
          callback_url: callbackUrl,
          metadata: { type: product.type, product: `${product.country} ${product.title}`, file: product.file },
        },
      });
      if (error || !data?.authorization_url) throw new Error(data?.error || "Payment failed");
      window.location.href = data.authorization_url;
    } catch (err: any) {
      alert(err.message || "Payment error");
      setPurchaseLoading(false);
    }
  };

  const previewUrl = product.file
    ? `/sector-brief-preview/${encodeURIComponent(product.file)}`
    : null;

  return (
    <Layout>
      <section className="py-8 md:py-12 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <Link to="/intelligence-marketplace" className="inline-flex items-center gap-1 text-sm text-primary hover:text-accent mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Intelligence Marketplace
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Left — Cover */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-center">
              <div className="relative w-full max-w-sm">
                <div className="bg-muted/30 rounded-lg border border-border p-4 shadow-xl">
                  {product.cover ? (
                    <img src={product.cover} alt={product.title} className="w-full rounded shadow-md" />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-gradient-to-br from-primary/20 to-accent/20 rounded flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {/* Book shadow effect */}
                <div className="absolute -bottom-2 left-2 right-2 h-4 bg-foreground/5 rounded-b-lg blur-sm" />
              </div>
            </motion.div>

            {/* Right — Details */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
              <span className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
                {product.type === "country_report" ? "Country Report" : product.type === "sector_brief" ? "Sector Brief" : "Audience Note"} · {product.country}
              </span>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">{product.title}</h1>

              <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>

              {product.available && (
                <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                  {["Decision-ready analysis, not academic theory", "Data-backed opportunity & risk mapping", "Priority access to future updates & releases"].map(f => (
                    <div key={f} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-3xl font-bold text-primary mb-1">${product.price}</p>
              <p className="text-xs text-muted-foreground mb-6">Single organization license · Instant PDF delivery</p>

              {product.available ? (
                <div className="space-y-3">
                  <Button size="lg" className="w-full hover-sink" onClick={handleBuyNow} disabled={purchaseLoading}>
                    {purchaseLoading ? "Processing..." : `Buy Now — $${product.price}`}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={() => addItem({ id: product.id, title: product.title, price: product.price, type: product.type, file: product.file, country: product.country })}>
                    <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                  </Button>
                  {previewUrl && (
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
                      <Link to={previewUrl}><Eye className="w-4 h-4 mr-2" /> Browse Sample</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 text-center border border-dashed border-border">
                  <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground mb-1">Coming Soon</p>
                  <p className="text-xs text-muted-foreground">This product is not yet available.</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetail;
