import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import LanguageSelector from "./LanguageSelector";
import HistoryPanel from "./HistoryPanel";
import ThemeToggle from "./ThemeToggle";
import type { Note } from "./SheetMusicViewer";

interface HeaderProps {
  onLoadTranscription?: (notes: Note[], instrument: string) => void;
}

const Header = ({ onLoadTranscription }: HeaderProps) => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img
              src="/sinfonia-logo.png"
              alt="Sinfonia"
              className="h-20 w-auto transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3">
            <Link
              to="/"
              className="text-muted-foreground hover:text-primary transition-colors font-medium px-2"
            >
              {t("nav.home")}
            </Link>
            <Link
              to="/transcribe"
              className="text-muted-foreground hover:text-primary transition-colors font-medium px-2"
            >
              {t("nav.transcribe")}
            </Link>
            
            {/* History Panel - only show when user is logged in */}
            {user && onLoadTranscription && (
              <HistoryPanel onLoadTranscription={onLoadTranscription} />
            )}
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Auth buttons */}
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {t("nav.logout")}
              </Button>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link to="/auth" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {t("nav.login")}
                </Link>
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <LanguageSelector />
            <button
              className="p-2 text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-foreground hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.home")}
              </Link>
              <Link
                to="/transcribe"
                className="text-foreground hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.transcribe")}
              </Link>
              {user && onLoadTranscription && (
                <div onClick={() => setIsMenuOpen(false)}>
                  <HistoryPanel onLoadTranscription={onLoadTranscription} />
                </div>
              )}
              {user ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("nav.logout")}
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    {t("nav.login")}
                  </Link>
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
