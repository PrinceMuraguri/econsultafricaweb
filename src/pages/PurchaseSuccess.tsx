import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { CheckCircle, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PurchaseSuccess = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference");

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
            <p className="text-sm text-muted-foreground mb-8">
              You will receive a download link at your email address shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="hover-sink" asChild>
                <Link to="/">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default PurchaseSuccess;
