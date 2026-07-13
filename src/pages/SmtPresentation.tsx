import PdfPageViewer from "@/components/PdfPageViewer";
import pdfAsset from "@/assets/VPAY_Executive_Deck_Econsult_Africa.pdf.asset.json";

const SmtPresentation = () => (
  <PdfPageViewer
    pdfUrl={pdfAsset.url}
    title="SMT Presentation — Executive Deck"
    backLink="/"
    backLabel="Back to home"
  />
);

export default SmtPresentation;
