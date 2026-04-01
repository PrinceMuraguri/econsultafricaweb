import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PdfPageViewer from "@/components/PdfPageViewer";

const HowItWorksDetailed = () => (
  <PdfPageViewer
    pdfUrl="/documents/how-it-works-detailed.pdf"
    title="How It Works — Full Guide"
    backLink="/"
    backLabel="Back to Forecast Arena"
    extraActions={
      <Link to="/how-it-works-quick">
        <Button variant="outline" size="sm">← Quick Summary</Button>
      </Link>
    }
  />
);

export default HowItWorksDetailed;
