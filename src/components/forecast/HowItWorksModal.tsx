import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import ShareCalculator from "./ShareCalculator";
import { ArrowRight } from "lucide-react";

interface HowItWorksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { num: "1", title: "Choose a question", desc: "Pick an economic event you have a view on." },
  { num: "2", title: "Submit your forecast", desc: "Select Yes or No based on your analysis." },
  { num: "3", title: "Contribute an allocation (coming soon)", desc: "Each unit costs the current consensus price and resolves at $1 if correct." },
  { num: "4", title: "Accuracy-based distribution", desc: "Correct forecasts receive a distribution based on accuracy." },
];

const HowItWorksModal = ({ open, onOpenChange }: HowItWorksModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">How Forecast Arena Works</DialogTitle>
          <DialogDescription>
            Submit forecasts on economic outcomes. Correct forecasts receive accuracy-based distributions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.num} className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-mono text-xs font-bold text-primary">{step.num}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Try the calculator</p>
            <ShareCalculator />
          </div>

          <Link
            to="/how-it-works"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors"
          >
            Read the full explainer
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-[10px] text-muted-foreground text-center">
            Forecasting involves uncertainty. Only participate with what you are comfortable allocating.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksModal;
