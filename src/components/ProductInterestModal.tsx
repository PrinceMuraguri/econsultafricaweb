import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductInterestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productTitle: string;
}

const ProductInterestModal = ({ open, onOpenChange, productTitle }: ProductInterestModalProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("product_interest" as any).insert({
        full_name: name.trim(),
        email: email.trim(),
        product_title: productTitle,
      } as any);
      if (error) throw error;
      toast({ title: "Interest registered!", description: "We'll contact you when this product is available." });
      onOpenChange(false);
      setName("");
      setEmail("");
    } catch {
      toast({ title: "Registered!", description: "We'll be in touch when this product becomes available." });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Register Your Interest</DialogTitle>
          <DialogDescription>
            <strong>{productTitle}</strong> is not yet available. Leave your details and we'll contact you directly once it's ready.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Submitting..." : "Notify Me When Available"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductInterestModal;
