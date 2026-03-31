import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { CheckCircle, Download, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { trackFunnelEvent } from "@/lib/sales-funnel";

const PurchaseSuccess = () => {
  const [searchParams] = useSearchParams();
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
          trackFunnelEvent("purchase_complete", { productTitle: pTitle, productType: pType, metadata: { reference } });
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
  }, [reference]);

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
                  <Link to="/kenya-2026">Back to Report</Link>
                </Button>
              </>
            ) : (
              <>
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  Purchase Successful
                </h1>
                <p className="text-muted-foreground mb-2">
                  Thank you for purchasing the Kenya 2026 Economic Outlook report.
                </p>
                {reference && (
                  <p className="text-sm text-muted-foreground mb-8">
                    Reference: <span className="font-mono">{reference}</span>
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {downloadUrl && (
                    <Button variant="hero" size="lg" className="hover-sink" asChild>
                      <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 w-4 h-4" /> Download Report
                      </a>
                    </Button>
                  )}
                  <Button variant="hero-outline" size="lg" className="hover-sink" asChild>
                    <Link to="/">
                      <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default PurchaseSuccess;
