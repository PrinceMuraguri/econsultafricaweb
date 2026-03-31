import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

const MAX_PREVIEW_PAGES = 8;

const BRIEF_NAMES: Record<string, string> = {
  "Kenya_2026_Banking_Financial_Services_Brief.pdf": "Banking & Financial Services",
  "Kenya_2026_Agriculture_Food_Security_Brief.pdf": "Agriculture & Food Security",
  "Kenya_2026_Energy_Infrastructure_Brief.pdf": "Energy & Infrastructure",
  "Kenya_2026_Manufacturing_Industry_Brief.pdf": "Manufacturing & Industry",
  "Kenya_2026_Technology_Digital_Economy_Brief.pdf": "Digital Economy",
  "Kenya_2026_Tourism_Hospitality_Brief.pdf": "Tourism & Hospitality",
  "Kenya_2026_Real_Estate_Construction_Brief.pdf": "Real Estate & Construction",
  "Kenya_2026_Retail_Consumer_Brief.pdf": "Retail & Consumer",
  "Kenya_2026_Investor_Strategy_Note.pdf": "Investor Strategy Note",
  "Kenya_2026_Development_Partner_Brief.pdf": "Development Partner Brief",
  "Kenya_2026_Corporate_Strategy_Brief.pdf": "Corporate Strategy Brief",
  "Kenya_2026_Startup_SME_Scan.pdf": "Startup & SME Environment Scan",
  "Kenya_2026_Exporter_Importer_Trade_Brief.pdf": "Exporter/Importer Trade Brief",
  "kenya-oil-shortage-assessment-march-2026.pdf": "Kenya 2026 Economic Outlook",
  "Kenya_2026_Economic_Outlook.pdf": "Kenya 2026 Economic Outlook",
};

const SectorBriefPreview = () => {
  const { filename } = useParams<{ filename: string }>();
  const decodedFilename = decodeURIComponent(filename || "");
  const briefTitle = BRIEF_NAMES[decodedFilename] || decodedFilename.replace(/_/g, " ").replace(".pdf", "");

  // Use 50 pages for the Kenya country report, 8 for everything else
  const isCountryReport = decodedFilename.includes("kenya-oil-shortage") || decodedFilename.includes("Kenya_2026_Sample");
  const maxPages = isCountryReport ? 50 : MAX_PREVIEW_PAGES;
  const price = isCountryReport ? 495 : 95;
  const productType = isCountryReport ? "country_report" : "sector_brief";

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Load PDF and render all preview pages as images
  useEffect(() => {
    const loadPdf = async () => {
      try {
        // Try sector-briefs folder first, fall back to reports folder for country reports
        const pdfPath = isCountryReport
          ? `/reports/${decodedFilename}`
          : `/reports/sector-briefs/${decodedFilename}`;
        const doc = await pdfjsLib.getDocument(pdfPath).promise;
        setPdfDoc(doc);
        const pagesToRender = Math.min(doc.numPages, maxPages);
        const images: string[] = [];

        for (let i = 1; i <= pagesToRender; i++) {
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          images.push(canvas.toDataURL("image/jpeg", 0.85));
        }

        setPageImages(images);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load PDF:", err);
        setLoading(false);
      }
    };
    if (decodedFilename) loadPdf();
  }, [decodedFilename]);

  const handlePurchase = async () => {
    setPurchaseLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/purchase-success?product=${encodeURIComponent(briefTitle)}&type=${productType}`;
      const { data, error } = await supabase.functions.invoke("paystack-checkout", {
        body: {
          email: "",
          amount: price,
          callback_url: callbackUrl,
          metadata: { type: productType, product: `Kenya ${briefTitle}`, file: decodedFilename },
        },
      });
      if (error || !data?.authorization_url) throw new Error(data?.error || "Failed to start payment");
      window.location.href = data.authorization_url;
    } catch (err: any) {
      alert(err.message || "Payment error. Please try again.");
      setPurchaseLoading(false);
    }
  };

  return (
    <Layout>
      <section className="py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/intelligence-marketplace" className="text-sm text-primary hover:text-accent transition-colors">
              ← Back to Intelligence Marketplace
            </Link>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{briefTitle} — Sample Preview</h1>
          <p className="text-muted-foreground mb-6">
            Browse the first {maxPages} pages free. Purchase the full {isCountryReport ? "report" : "brief"} for the complete analysis.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Render each page as a full-width image */}
              {pageImages.map((src, i) => {
                const isLastPreviewPage = i === pageImages.length - 1;
                return (
                  <div key={i} className="relative">
                    <img
                      src={src}
                      alt={`Page ${i + 1}`}
                      className={`w-full rounded-lg border border-border shadow-md select-none ${isLastPreviewPage ? "blur-[3px]" : ""}`}
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                    {isLastPreviewPage && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-background/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-8 text-center"
                      >
                        <Lock className="w-12 h-12 text-primary mb-4" />
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                          You've seen the highlights. Now get the full picture.
                        </h2>
                        <p className="text-muted-foreground max-w-lg mb-2">
                          {isCountryReport
                            ? "The remaining chapters contain the real insights — the Opportunity Map, Risks & Mitigation table, policy recommendations, and the investor strategy framework. These sections include the practical \"So what\" about everything."
                            : "The remaining pages contain the complete sector analysis — opportunity mapping, risk assessment, competitive landscape, and strategic recommendations that drive real decisions."}
                        </p>
                        <p className="text-lg font-bold text-primary mb-6">
                          Unlock the full <span className="text-foreground">{briefTitle}</span> {isCountryReport ? "report" : "brief"} for just <span className="text-accent">${price}</span>.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button size="lg" className="hover-sink" onClick={handlePurchase} disabled={purchaseLoading}>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {purchaseLoading ? "Processing..." : `Purchase Full ${isCountryReport ? "Report" : "Brief"} — $${price}`}
                          </Button>
                          <Button variant="outline" size="lg" asChild>
                            <Link to="/intelligence-marketplace">Browse Other Briefs</Link>
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                          One-time purchase · Instant PDF delivery · Single organization license
                        </p>
                      </motion.div>
                    )}
                    {!isLastPreviewPage && (
                      <p className="text-center text-xs text-muted-foreground mt-1">Page {i + 1}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default SectorBriefPreview;
