import Layout from "@/components/Layout";
import { FileText, Download } from "lucide-react";

const HowItWorks = () => {
  return (
    <Layout>
      {/* Embedded HTML explainer */}
      <iframe
        src="/documents/how-it-works.html"
        title="How Forecast Arena Works"
        className="w-full border-0"
        style={{ minHeight: "100vh", height: "4200px" }}
      />

      {/* Downloadable Guides */}
      <section className="section-padding bg-muted/30">
        <div className="container-page max-w-3xl">
          <p className="font-mono text-xs text-accent uppercase tracking-widest mb-4">Downloadable Guides</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="/documents/how-it-works-quick-summary.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/60 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Quick Summary</h4>
                <p className="text-xs text-muted-foreground">5-slide overview of how it works</p>
              </div>
              <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
            <a
              href="/documents/how-it-works-detailed.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/60 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground text-sm group-hover:text-accent transition-colors">Detailed Guide</h4>
                <p className="text-xs text-muted-foreground">Comprehensive breakdown of the platform</p>
              </div>
              <Download className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
