import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import ProductInterestModal from "@/components/ProductInterestModal";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

const MAX_PREVIEW_PAGES = 5;

const BRIEF_NAMES: Record<string, string> = {
  "Kenya_2026_Banking_Financial_Services_Brief.pdf": "Banking & Financial Services",
  "Kenya_2026_Agriculture_Food_Security_Brief.pdf": "Agriculture & Food Security",
  "Kenya_2026_Energy_Infrastructure_Brief.pdf": "Energy & Infrastructure",
  "Kenya_2026_Manufacturing_Industry_Brief.pdf": "Manufacturing & Industry",
  "Kenya_2026_Technology_Digital_Economy_Brief.pdf": "Digital Economy",
  "Kenya_2026_Tourism_Hospitality_Brief.pdf": "Tourism & Hospitality",
  "Kenya_2026_Real_Estate_Construction_Brief.pdf": "Real Estate & Construction",
  "Kenya_2026_Retail_Consumer_Brief.pdf": "Retail & Consumer",
};

const SectorBriefPreview = () => {
  const { filename } = useParams<{ filename: string }>();
  const decodedFilename = decodeURIComponent(filename || "");
  const briefTitle = BRIEF_NAMES[decodedFilename] || decodedFilename.replace(/_/g, " ").replace(".pdf", "");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const doc = await pdfjsLib.getDocument(`/reports/sector-briefs/${decodedFilename}`).promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
      } catch (err) {
        console.error("Failed to load PDF:", err);
      }
    };
    if (decodedFilename) loadPdf();
  }, [decodedFilename]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current || rendering) return;
    setRendering(true);
    const page = await pdfDoc.getPage(pageNum);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const containerWidth = containerRef.current?.clientWidth || 800;
    const dpr = window.devicePixelRatio || 1;
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = (containerWidth / baseViewport.width) * dpr;
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${viewport.width / dpr}px`;
    canvas.style.height = `${viewport.height / dpr}px`;
    await page.render({ canvasContext: ctx, viewport }).promise;
    setRendering(false);
  }, [pdfDoc, rendering]);

  useEffect(() => {
    if (pdfDoc && currentPage <= MAX_PREVIEW_PAGES) renderPage(currentPage);
  }, [pdfDoc, currentPage, renderPage]);

  const isOnPaywall = currentPage > MAX_PREVIEW_PAGES;
  const canGoNext = currentPage <= MAX_PREVIEW_PAGES;
  const canGoPrev = currentPage > 1;

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page">
          <div className="mb-6">
            <Link to="/intelligence-marketplace" className="text-sm text-primary hover:text-accent transition-colors">
              ← Back to Intelligence Marketplace
            </Link>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{briefTitle} — Sample Preview</h1>
          <p className="text-muted-foreground mb-6">
            Preview the first {MAX_PREVIEW_PAGES} pages. Purchase the full brief for complete analysis and strategic recommendations.
          </p>

          <div ref={containerRef} className="max-w-4xl mx-auto">
            {currentPage <= MAX_PREVIEW_PAGES ? (
              <>
                <div className="relative bg-muted rounded-lg overflow-hidden border border-border shadow-lg">
                  <canvas ref={canvasRef} className="w-full select-none pointer-events-none" />
                  {rendering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-4">
                  <Button variant="outline" size="sm" disabled={!canGoPrev} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground font-mono">
                    Page {currentPage} of {MAX_PREVIEW_PAGES} (preview)
                  </span>
                  <Button variant="outline" size="sm" disabled={!canGoNext || currentPage === MAX_PREVIEW_PAGES}
                    onClick={() => setCurrentPage(p => p + 1)}>
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {currentPage === MAX_PREVIEW_PAGES && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 text-center"
                  >
                    <Button size="lg" onClick={() => setCurrentPage(MAX_PREVIEW_PAGES + 1)} className="hover-sink">
                      Continue Reading <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </>
            ) : (
              /* Paywall CTA */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-border p-8 md:p-12 text-center"
              >
                <Lock className="w-12 h-12 text-primary mx-auto mb-6" />
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  You've reached the end of the preview
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-2">
                  The remaining pages contain the full sector analysis — opportunity mapping, risk assessment, competitive landscape, and strategic recommendations that drive real decisions.
                </p>
                <p className="text-lg font-bold text-primary mb-6">
                  Unlock the complete <span className="text-foreground">{briefTitle}</span> brief for just <span className="text-accent">$95</span>.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" className="hover-sink" onClick={() => setInterestOpen(true)}>
                    <ShoppingCart className="w-4 h-4 mr-2" /> Purchase Full Brief — $95
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setCurrentPage(1)}>
                    Back to Preview
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  One-time purchase. Instant PDF delivery. Single organization license.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <ProductInterestModal
        open={interestOpen}
        onOpenChange={setInterestOpen}
        productTitle={`Kenya ${briefTitle} Sector Brief`}
      />
    </Layout>
  );
};

export default SectorBriefPreview;
