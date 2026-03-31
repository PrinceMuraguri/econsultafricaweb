import { Link } from "react-router-dom";
import logo from "@/assets/econsult-africa-logo.png";

const footerLinks = [
  {
    title: "Intelligence",
    links: [
      { label: "Forecast Arena", href: "/" },
      { label: "Kenya 2026 Outlook", href: "/kenya-2026" },
      { label: "Intelligence Marketplace", href: "/intelligence-marketplace" },
      { label: "Sample Report", href: "/sample-report" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Our Philosophy", href: "/our-philosophy" },
      { label: "Insights & Media", href: "/insights" },
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/econsultafrica/" },
  { label: "X", href: "https://x.com/EconsultAfrica" },
  { label: "Instagram", href: "https://www.instagram.com/econsultafrica/" },
  { label: "TikTok", href: "https://www.tiktok.com/@econsultafrica" },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="container-page py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Econsult Africa" className="h-14 w-auto" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Strategic economic intelligence for African markets. Real-time sentiment. Collective intelligence from the ground.
            </p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors">
                  {social.label}
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">info@econsult.africa</p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="font-display font-semibold text-sm text-foreground mb-4">{group.title}</h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-muted-foreground hover:text-accent transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed mb-6">
            Forecast Arena aggregates users' expectations on economic outcomes for research and insight purposes.
            It is not a trading, betting, or investment platform.{" "}
            <a href="/terms-of-use" className="text-primary underline hover:text-accent">Terms of Use</a>
          </p>
        </div>

        <div className="pt-4 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Econsult Africa. All rights reserved.
          </p>
          <p className="font-mono text-xs text-muted-foreground">Nairobi, Kenya</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
