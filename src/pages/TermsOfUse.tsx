import Layout from "@/components/Layout";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PDF_URL = "/documents/terms-of-use.pdf";

const TermsOfUse = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-page max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Forecast Arena
            </Link>
            <a href={PDF_URL} download>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="w-3.5 h-3.5" /> Download PDF
              </Button>
            </a>
          </div>

          <h1 className="font-display text-2xl font-bold text-foreground mb-6">Terms of Use</h1>

          <div className="w-full bg-muted rounded-lg overflow-hidden border border-border" style={{ height: "80vh" }}>
            <iframe
              src={`${PDF_URL}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0"
              title="Terms of Use"
            />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TermsOfUse;
