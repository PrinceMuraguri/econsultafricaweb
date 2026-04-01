import PdfPageViewer from "@/components/PdfPageViewer";

const TermsOfUse = () => (
  <PdfPageViewer
    pdfUrl="/documents/terms-of-use.pdf"
    title="Terms of Use"
    backLink="/"
    backLabel="Back to Forecast Arena"
  />
);

export default TermsOfUse;
