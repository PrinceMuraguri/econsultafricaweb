import PdfPageViewer from "@/components/PdfPageViewer";

const SmtVpay = () => (
  <PdfPageViewer
    pdfUrl="/documents/VPAY_Business_Case_Econsult_Africa.pdf"
    title="SMT-VPAY — Business Case"
    backLink="/"
    backLabel="Back to home"
    hideDownload
  />
);

export default SmtVpay;
