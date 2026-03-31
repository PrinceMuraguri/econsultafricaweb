import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { CheckCircle, Download, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { trackFunnelEvent } from "@/lib/sales-funnel";

const PurchaseSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const pTitle = searchParams.get("product") || "Report";
  const pType = searchParams.get("type") || "report";
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setLoading(false);
      setError("No payment reference found.");
      return;
    }

    const verifyAndGetLink = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("report-download", {
          body: { reference },
        });
        if (fnError) throw fnError;
        if (data?.download_url) {
          setDownloadUrl(data.download_url);

          // Send purchase confirmation email
          const customerEmail = data.customer_email;
          if (customerEmail && customerEmail !== "customer@placeholder.com") {
            supabase.functions.invoke("send-transactional-email", {
              body: {
                templateName: "purchase-confirmation",
                recipientEmail: customerEmail,
                idempotencyKey: `purchase-confirm-${reference}`,
                templateData: {
                  productTitle: data.product_title || pTitle,
                  downloadUrl: data.download_url,
                  reference,
                },
              },
            }).then(({ error: emailError }) => {
              if (emailError) throw emailError;
            }).catch((err) => console.error("Failed to send confirmation email:", err));
          }

          // Redirect to thank you page after a brief moment
          setTimeout(() => {
            navigate(`/thank-you?reference=${reference}&product=${encodeURIComponent(pTitle)}&download=${encodeURIComponent(data.download_url)}`);
          }, 2000);
        } else {
          throw new Error("Could not generate download link.");
        }
      } catch (err: any) {
        setError(err.message || "Payment verification failed.");
      } finally {
        setLoading(false);
      }
    };

    verifyAndGetLink();
  }, [navigate, pTitle, pType, reference]);

  return (
    <Layout>
      <section className="section-padding min-h-[60vh] flex items-center">
        <div className="container-page">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mx-auto text-center"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground">Verifying your payment…</p>
              </div>
            ) : error ? (
              <>
                <p className="text-destructive font-semibold mb-4">{error}</p>
                <Button variant="hero-outline" size="lg" asChild>
                  <Link to="/intelligence-marketplace">Back to Marketplace</Link>
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle className="w-16 h-16 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Purchase Verified!</h1>
                <p className="text-muted-foreground">Redirecting you to your thank you page…</p>
                {downloadUrl && (
                  <Button variant="hero" size="lg" className="hover-sink" asChild>
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackFunnelEvent("download_report", { productTitle: pTitle, productType: pType, metadata: { reference } })}
                    >
                      <Download className="mr-2 w-4 h-4" /> Download Report Now
                    </a>
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default PurchaseSuccess;
