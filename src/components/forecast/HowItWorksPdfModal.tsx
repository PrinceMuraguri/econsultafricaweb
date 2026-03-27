import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, ArrowLeft } from "lucide-react";

interface HowItWorksPdfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_PDF = "/documents/how-it-works-quick.pdf";
const DETAILED_PDF = "/documents/how-it-works-detailed.pdf";

const HowItWorksPdfModal = ({ open, onOpenChange }: HowItWorksPdfModalProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [viewingDetailed, setViewingDetailed] = useState(false);
  const totalPages = 5;

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    } else {
      setShowEndScreen(true);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleClose = () => {
    setCurrentPage(1);
    setShowEndScreen(false);
    setViewingDetailed(false);
    onOpenChange(false);
  };

  const handleGoBack = () => {
    setCurrentPage(1);
    setShowEndScreen(false);
    setViewingDetailed(false);
    onOpenChange(false);
  };

  const handleLearnMore = () => {
    setViewingDetailed(true);
    setShowEndScreen(false);
  };

  const currentPdf = viewingDetailed ? DETAILED_PDF : QUICK_PDF;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="font-display text-base flex items-center gap-2">
            {viewingDetailed && (
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { setViewingDetailed(false); setShowEndScreen(true); }}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {viewingDetailed ? "How It Works — Full Guide" : "How It Works"}
          </DialogTitle>
        </DialogHeader>

        {!showEndScreen ? (
          <>
            <div className="w-full bg-muted" style={{ height: "min(65vh, 500px)" }}>
              <iframe
                src={`${currentPdf}#page=${viewingDetailed ? 1 : currentPage}&toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title="How it works"
              />
            </div>

            {!viewingDetailed && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="text-xs text-muted-foreground font-mono">
                  {currentPage} / {totalPages}
                </span>
                <Button size="sm" onClick={handleNext} className="bg-primary text-primary-foreground">
                  {currentPage === totalPages ? "Done" : "Next"} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {viewingDetailed && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <a href={DETAILED_PDF} download className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-accent transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download Full Guide
                </a>
                <Button size="sm" onClick={handleGoBack} className="bg-accent text-accent-foreground">
                  Back to Forecast Arena
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-12 gap-6 text-center">
            <p className="text-lg font-display font-semibold text-foreground">What would you like to do?</p>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <Button onClick={handleGoBack} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                I get the point, take me back to the Forecast Arena
              </Button>
              <Button variant="outline" onClick={handleLearnMore} className="flex-1 font-semibold">
                I want to learn more about how this works
              </Button>
            </div>

            <div className="flex gap-4 mt-2">
              <a href={QUICK_PDF} download className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Download className="w-3 h-3" /> Quick Summary
              </a>
              <a href={DETAILED_PDF} download className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Download className="w-3 h-3" /> Full Guide
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksPdfModal;
