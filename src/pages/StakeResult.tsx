import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const StakeResult = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [details, setDetails] = useState<{ poll_id?: string; amount?: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setErrorMsg("No payment reference found.");
      return;
    }

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-stake", {
          body: { reference },
        });

        if (error || !data?.success) {
          setStatus("error");
          setErrorMsg(data?.error || "Verification failed.");
          return;
        }

        setStatus("success");
        setDetails({ poll_id: data.poll_id, amount: data.amount });
      } catch {
        setStatus("error");
        setErrorMsg("Something went wrong. Please contact support.");
      }
    };

    verify();
  }, [reference]);

  return (
    <Layout>
      <section className="section-padding min-h-[60vh] flex items-center">
        <div className="container-page max-w-lg mx-auto text-center">
          {status === "loading" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">Verifying Your Forecast...</h2>
              <p className="text-muted-foreground">Please wait while we confirm your participation.</p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Forecast Confirmed! 🎯</h2>
              <p className="text-muted-foreground">
                Your ${details?.amount} forecast allocation has been recorded. 
                You'll receive an accuracy-based distribution if your forecast is correct.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Link
                  to="/forecast-arena-pro"
                  className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-6 py-3 font-display font-semibold shadow-md hover:bg-accent/90 transition-colors"
                >
                  Back to Forecast Arena Pro
                </Link>
                <Link
                  to="/kenya-2026"
                  className="inline-flex items-center justify-center rounded-md border border-border text-foreground px-6 py-3 font-display font-semibold hover:bg-muted transition-colors"
                >
                  View Kenya Report
                </Link>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Verification Failed</h2>
              <p className="text-muted-foreground">{errorMsg}</p>
              <Link
                to="/forecast-arena-pro"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 font-display font-semibold hover:bg-primary/90 transition-colors"
              >
                Return to Forecast Arena Pro
              </Link>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default StakeResult;
