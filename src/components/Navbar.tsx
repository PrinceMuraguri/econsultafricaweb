import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import logo from "@/assets/econsult-africa-logo.png";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Kenya 2026", href: "/kenya-2026" },
  { label: "Forecast Arena", href: "/forecast-arena" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "Insights", href: "/insights" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <nav className="container-page flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Econsult Africa" className="h-10 w-auto" />
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors duration-200 ${
                location.pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-accent"
              } ${link.href === "/forecast-arena" ? "font-bold flex items-center gap-1.5" : ""}`}
            >
              {link.href === "/forecast-arena" ? (
                <>
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent-foreground bg-accent px-1.5 py-0.5 rounded animate-[pulse_3s_ease-in-out_infinite]">
                    New
                  </span>
                  <span className="text-foreground">Forecast Arena</span>
                </>
              ) : link.label}
            </Link>
          ))}
          <Button variant="hero" size="sm" className="hover-sink" asChild>
            <Link to="/kenya-2026">Buy Report</Link>
          </Button>
        </div>

        <button className="lg:hidden p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="container-page py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)}
                  className={`text-sm font-medium py-2 flex items-center gap-1.5 ${location.pathname === link.href ? "text-primary" : "text-muted-foreground"} ${link.href === "/forecast-arena" ? "font-bold" : ""}`}>
                  {link.href === "/forecast-arena" ? (
                    <>
                      <span className="text-[10px] font-black uppercase tracking-wider text-accent-foreground bg-accent px-1.5 py-0.5 rounded animate-[pulse_3s_ease-in-out_infinite]">
                        New
                      </span>
                      <span className="text-foreground">Forecast Arena</span>
                    </>
                  ) : link.label}
                </Link>
              ))}
              <Button variant="hero" size="sm" className="hover-sink mt-2" asChild>
                <Link to="/kenya-2026" onClick={() => setMobileOpen(false)}>Buy Report</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
