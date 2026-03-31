import { supabase } from "@/integrations/supabase/client";

type FunnelEvent = 
  | "marketplace_view"
  | "product_click"
  | "sample_view"
  | "add_to_cart"
  | "checkout_start"
  | "purchase_complete"
  | "download_report"
  | "email_sent";

export async function trackFunnelEvent(
  eventType: FunnelEvent,
  opts?: {
    productId?: string;
    productTitle?: string;
    productType?: string;
    userEmail?: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    // Get fingerprint if available
    const fingerprint = localStorage.getItem("voter_fingerprint") || undefined;
    
    await supabase.from("sales_funnel_events" as any).insert({
      event_type: eventType,
      product_id: opts?.productId,
      product_title: opts?.productTitle,
      product_type: opts?.productType,
      user_email: opts?.userEmail,
      user_fingerprint: fingerprint,
      metadata: opts?.metadata || {},
    });
  } catch (e) {
    console.warn("Funnel tracking error:", e);
  }
}
