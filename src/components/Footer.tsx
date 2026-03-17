import { Link } from "react-router-dom";

const footerLinks = [
  {
    title: "Intelligence",
    links: [
      { label: "Kenya 2026 Outlook", href: "/kenya-2026" },
      { label: "Sector Briefs", href: "/sectors" },
      { label: "Insights", href: "/insights" },
      { label: "Research Decode", href: "/research-decode" },
    ],
  },
  {
    title: "Advisory",
    links: [
      { label: "Services", href: "/services" },
      { label: "Executive Briefings", href: "/contact" },
      { label: "Quarterly Retainer", href: "/services" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="container-page py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <Link to="/" className="font-display font-bold text-lg tracking-tight text-foreground">
              Econsult <span className="text-primary">Africa</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Strategic economic intelligence for organizations navigating the Kenyan market.
            </p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="font-display font-semibold text-sm text-foreground mb-4">{group.title}</h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Econsult Africa. All rights reserved.
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            Nairobi, Kenya
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
