import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

const SampleReportViewer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [rendering, setRendering] = useState(false);

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      const doc = await pdfjsLib.getDocument("/reports/Kenya_2026_Economic_Outlook.pdf").promise;
      setPdfDoc(doc);
      // Limit sample preview to first 50 pages
      setTotalPages(Math.min(doc.numPages, 50));
    };
    loadPdf();
  }, []);

  // Render page to canvas
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current || rendering) return;
    setRendering(true);

    const page = await pdfDoc.getPage(pageNum);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    // Scale to fit container width while maintaining aspect ratio
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
    if (pdfDoc) renderPage(currentPage);
  }, [pdfDoc, currentPage, renderPage]);

  // Re-render on resize
  useEffect(() => {
    const handleResize = () => {
      if (pdfDoc) renderPage(currentPage);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pdfDoc, currentPage, renderPage]);

  const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [totalPages]);

  const isLastPage = currentPage === totalPages;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Viewer */}
      <div
        ref={containerRef}
        className="relative w-full max-w-3xl rounded-lg border border-border bg-card overflow-hidden card-shadow-lg select-none"
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      >
        {/* Page canvas */}
        <canvas
          ref={canvasRef}
          className="w-full block pointer-events-none"
          style={{ userSelect: "none" }}
        />

        {/* Overlay on last page */}
        <AnimatePresence>
          {isLastPage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/85 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
            >
              <Lock className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-display font-bold text-2xl text-foreground mb-3">
                That's just a taste.
              </h3>
              <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
                The full Kenya 2026 Economic Outlook goes deeper — 120+ pages of sector analysis,
                investment frameworks, and projections you won't find anywhere else.
              </p>
              <Button variant="hero" size="lg" className="hover-sink" asChild>
                <Link to="/kenya-2026">
                  Unlock the Full Report <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation arrows */}
        <button
          onClick={goPrev}
          disabled={currentPage === 1}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center text-foreground disabled:opacity-20 hover:bg-background transition-colors card-shadow"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goNext}
          disabled={currentPage === totalPages}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center text-foreground disabled:opacity-20 hover:bg-background transition-colors card-shadow"
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Page indicator */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        {/* Progress bar */}
        <div className="w-32 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(currentPage / totalPages) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SampleReportViewer;
