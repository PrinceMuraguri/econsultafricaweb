import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, User, LogIn, LogOut, Wallet, Bookmark, Crown, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import RegistrationModal from "@/components/auth/RegistrationModal";
import LoginModal from "@/components/auth/LoginModal";
import NotificationBell from "@/components/NotificationBell";
import logo from "@/assets/econsult-africa-logo.png";
import { PRO_ENABLED } from "@/lib/features"; // Pro flag: gates Pro nav link

// Pro flag: the Pro entry is only included in navLinks when PRO_ENABLED is true.
const navLinks = PRO_ENABLED
  ? [
      { label: "Forecast Arena", href: "/" },
      { label: "Forecast Arena", href: "/forecast-arena-pro", isPro: true },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "AI Council API", href: "/api-docs" },
      { label: "Shop", href: "/intelligence-marketplace" },
      { label: "Philosophy", href: "/our-philosophy" },
      { label: "Insights", href: "/insights" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ]
  : [
      { label: "Forecast Arena", href: "/" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "AI Council API", href: "/api-docs" },
      { label: "Shop", href: "/intelligence-marketplace" },
      { label: "Philosophy", href: "/our-philosophy" },
      { label: "Insights", href: "/insights" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ];

const Navbar = () => {
  const location = useLocation();
  const { user, profile, wallet, demoBalance, signOut } = useAuth();
  const isProRoute = location.pathname.startsWith("/forecast-arena-pro");
  const showDemo = isProRoute;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const isLoggedIn = !!user;

  // Close modals when user becomes authenticated — prevents orphaned overlays
  useEffect(() => {
    if (user) {
      setLoginOpen(false);
      setRegisterOpen(false);
    }
  }, [user]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        {/* Mobile top nav strip */}
        <div className="lg:hidden overflow-x-auto border-b border-border/50 bg-background/60">
          <div className="flex items-center gap-1 px-3 py-1.5 min-w-max">
            {navLinks.map((link: any) => (
              <Link key={link.href} to={link.href}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                  link.isPro
                    ? location.pathname.startsWith("/forecast-arena-pro") ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:bg-muted"
                    : location.pathname === link.href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}>
                {link.label}{link.isPro && <span className="ml-0.5 text-[10px] font-black text-amber-500">PRO</span>}
              </Link>
            ))}
            {isLoggedIn && (
              <Link to="/my-dashboard"
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                  location.pathname === "/my-dashboard" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}>
                Dashboard
              </Link>
            )}
          </div>
        </div>

        <nav className="container-page flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Econsult Africa" className="h-10 w-auto" />
          </Link>

          <div className="hidden lg:flex items-center gap-4">
            {navLinks.map((link: any) => (
              link.isPro ? (
                <Link key={link.href} to={link.href}
                  className={`inline-flex items-center gap-1 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                    location.pathname.startsWith("/forecast-arena-pro")
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}>
                  <span>{link.label}</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wide text-amber-950 bg-amber-400 px-1.5 py-0.5 rounded">PRO <Crown className="w-2.5 h-2.5" /></span>
                </Link>
              ) : (
                <Link key={link.href} to={link.href}
                  className={`text-sm font-medium transition-colors duration-200 whitespace-nowrap inline-flex items-center gap-1 ${
                    location.pathname === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {link.label === "Shop" && <ShoppingCart className="w-3.5 h-3.5" />}
                  {link.label}
                </Link>
              )
            ))}

            {isLoggedIn ? (
              <>
                {showDemo ? (
                  <Link to="/forecast-arena-pro" className="flex items-center gap-1 text-xs font-mono font-semibold text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full hover:bg-amber-500/20 transition-colors" title="Demo Arena Coins">
                    <Wallet className="w-3 h-3" />{(demoBalance ?? 0).toFixed(2)} AC
                  </Link>
                ) : wallet && (
                  <Link to="/my-dashboard" className="flex items-center gap-1 text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full hover:bg-primary/20 transition-colors">
                    <Wallet className="w-3 h-3" />${wallet.balance_usd.toFixed(2)}
                  </Link>
                )}
                <NotificationBell />
                <Link to="/watchlist"
                  className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                    location.pathname === "/watchlist" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  <Bookmark className="w-4 h-4" />
                </Link>
                <Link to="/my-dashboard"
                  className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                    location.pathname === "/my-dashboard" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  <User className="w-4 h-4" />
                  {profile?.full_name?.split(" ")[0] || profile?.username || "Dashboard"}
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-destructive gap-1">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setLoginOpen(true)} className="gap-1">
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </Button>
                <Button size="sm" onClick={() => setRegisterOpen(true)}>
                  Join Now
                </Button>
              </>
            )}

          </div>

          <button className="lg:hidden p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-background border-b border-border overflow-hidden">
              <div className="container-page py-4 flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)}
                    className={`text-sm font-medium py-2 ${location.pathname === link.href ? "text-primary" : "text-muted-foreground"}`}>
                    {link.label}
                  </Link>
                ))}
                {isLoggedIn ? (
                  <>
                    <Link to="/watchlist" onClick={() => setMobileOpen(false)}
                      className={`text-sm font-medium py-2 flex items-center gap-1.5 ${location.pathname === "/watchlist" ? "text-primary" : "text-muted-foreground"}`}>
                      <Bookmark className="w-4 h-4" /> Watchlist
                    </Link>
                    <Link to="/my-dashboard" onClick={() => setMobileOpen(false)}
                      className={`text-sm font-medium py-2 flex items-center gap-1.5 ${location.pathname === "/my-dashboard" ? "text-primary" : "text-muted-foreground"}`}>
                      <User className="w-4 h-4" /> {profile?.full_name?.split(" ")[0] || "Dashboard"}
                      {showDemo
                        ? <span className="text-xs font-mono text-amber-600 ml-auto">{(demoBalance ?? 0).toFixed(2)} AC</span>
                        : wallet && <span className="text-xs font-mono text-primary ml-auto">${wallet.balance_usd.toFixed(2)}</span>}
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => { signOut(); setMobileOpen(false); }} className="justify-start text-muted-foreground hover:text-destructive gap-1">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </Button>
                  </>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => { setLoginOpen(true); setMobileOpen(false); }} className="flex-1 gap-1">
                      <LogIn className="w-3.5 h-3.5" /> Sign In
                    </Button>
                    <Button size="sm" onClick={() => { setRegisterOpen(true); setMobileOpen(false); }} className="flex-1">
                      Join Now
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <RegistrationModal open={registerOpen} onOpenChange={setRegisterOpen}
        onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true); }} />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen}
        onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true); }} />
    </>
  );
};

export default Navbar;
