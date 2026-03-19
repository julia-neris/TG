import { Music } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Footer Component - Rodapé do SinfonIA
 * Contém informações do projeto e créditos do TCC
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo e descrição */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Music className="h-6 w-6 text-primary" />
              <span className="text-xl font-serif font-bold text-gradient">
                SinfonIA
              </span>
            </Link>
            <p className="text-muted-foreground text-sm">
              {t("footer.description")}
            </p>
          </div>

          {/* Links rápidos */}
          <div className="space-y-4">
            <h3 className="font-serif font-semibold text-foreground">
              {t("footer.quickLinks")}
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                to="/"
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                {t("footer.homePage")}
              </Link>
              <Link
                to="/transcribe"
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                {t("footer.transcribeAudio")}
              </Link>
            </nav>
          </div>

          {/* Créditos TCC */}
          <div className="space-y-4">
            <h3 className="font-serif font-semibold text-foreground">
              {t("footer.aboutProject")}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t("footer.graduationWork")}
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-center text-muted-foreground text-sm">
            © {currentYear} SinfonIA. Neris, Júlia
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
