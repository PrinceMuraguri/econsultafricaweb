import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "already" | "invalid" | "success" | "error">("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const validate = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) { setStatus("invalid"); return; }
        setStatus(data.valid === false && data.reason === "already_unsubscribed" ? "already" : "valid");
      } catch { setStatus("error"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      setStatus(data?.success ? "success" : "error");
    } catch { setStatus("error"); }
    setProcessing(false);
  };

  return (
    <Layout>
      <section className="section-padding min-h-[60vh] flex items-center">
        <div className="container-page max-w-md mx-auto text-center">
          {status === "loading" && <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />}
          {status === "valid" && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-4">Unsubscribe</h1>
              <p className="text-muted-foreground mb-6">Are you sure you want to unsubscribe from Econsult Africa emails?</p>
              <Button onClick={handleUnsubscribe} disabled={processing} variant="destructive" size="lg">
                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm Unsubscribe
              </Button>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Unsubscribed</h1>
              <p className="text-muted-foreground">You will no longer receive emails from us.</p>
            </>
          )}
          {status === "already" && (
            <>
              <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Already Unsubscribed</h1>
              <p className="text-muted-foreground">This email has already been unsubscribed.</p>
            </>
          )}
          {(status === "invalid" || status === "error") && (
            <>
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Link</h1>
              <p className="text-muted-foreground">This unsubscribe link is invalid or expired.</p>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Unsubscribe;
