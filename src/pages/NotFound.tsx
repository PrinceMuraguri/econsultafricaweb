import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SEO title="Page Not Found — Econsult Africa" description="The page you're looking for doesn't exist or has been moved." path="/404" noindex />
      <div className="text-center container-page">
        <p className="font-mono text-xs text-gold uppercase tracking-widest mb-6">Error 404</p>
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-4">Signal Lost.</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button variant="hero" size="lg" className="hover-sink" asChild>
          <Link to="/">Return to the Briefing Room</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
