import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Layout from "@/components/Layout";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

interface PdfPageViewerProps {
  pdfUrl: string;
  title: string;
  backLink?: string;
  backLabel?: string;
  extraActions?: React.ReactNode;
  hideDownload?: boolean;
}

const PdfPageViewer = ({ pdfUrl, title, backLink = "/", backLabel = "Back", extraActions, hideDownload = false }: PdfPageViewerProps) => {
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const doc = await pdfjsLib.getDocument(pdfUrl).promise;
        const images: string[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
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
      } catch (err) {
        console.error("Failed to load PDF:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPdf();
  }, [pdfUrl]);

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <Link to={backLink} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </Link>
            <div className="flex gap-2">
              {extraActions}
              {!hideDownload && (
                <a href={pdfUrl} download>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </Button>
                </a>
              )}
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-foreground mb-6">{title}</h1>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {pageImages.map((src, i) => (
                <div key={i}>
                  <img
                    src={src}
                    alt={`Page ${i + 1}`}
                    className="w-full rounded-lg border border-border shadow-md select-none"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  <p className="text-center text-xs text-muted-foreground mt-1">Page {i + 1}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default PdfPageViewer;
