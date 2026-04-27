import { Helmet } from "react-helmet-async";
import PdfPageViewer from "@/components/PdfPageViewer";

const FiatWhitepaper = () => {
  return (
    <>
      <PdfPageViewer
        pdfUrl="/documents/FIAT_Whitepaper.pdf"
        title="Econsult Africa Forecast Arena — FIAT Whitepaper v1.0"
        backLink="/"
        backLabel="Back to home"
      />
    </>
  );
};

export default FiatWhitepaper;
