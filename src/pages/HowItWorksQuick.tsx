import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PdfPageViewer from "@/components/PdfPageViewer";

const HowItWorksQuick = () => (
  <PdfPageViewer
    pdfUrl="/documents/how-it-works-quick.pdf"
    title="How It Works — Quick Summary"
    backLink="/"
    backLabel="Back to Forecast Arena"
    extraActions={
      <Link to="/how-it-works-detailed">
        <Button variant="outline" size="sm">Full Guide →</Button>
      </Link>
    }
  />
);

export default HowItWorksQuick;
