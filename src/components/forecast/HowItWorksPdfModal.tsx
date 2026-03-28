import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

interface HowItWorksPdfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HowItWorksPdfModal = ({ open, onOpenChange }: HowItWorksPdfModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">How It Works</DialogTitle>
          <DialogDescription>
            Choose a guide to learn how Forecast Arena works.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          <Link to="/how-it-works-quick" onClick={() => onOpenChange(false)}>
            <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4" size="lg">
              <FileText className="w-5 h-5 text-accent shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">Quick Summary</p>
                <p className="text-xs text-muted-foreground font-normal">5-slide overview of the key mechanics</p>
              </div>
            </Button>
          </Link>

          <Link to="/how-it-works-detailed" onClick={() => onOpenChange(false)}>
            <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4" size="lg">
              <BookOpen className="w-5 h-5 text-primary shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">Detailed Guide</p>
                <p className="text-xs text-muted-foreground font-normal">Full explainer with examples and FAQs</p>
              </div>
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksPdfModal;
