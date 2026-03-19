import { Link } from "react-router-dom";
import { ArrowRight, Upload, Music, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MusicNotes from "@/components/MusicNotes";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Index Page - Página inicial do SinfonIA
 * Landing page com explicação do sistema e CTA para transcrição
 */
const Index = () => {
  const { t } = useLanguage();

  // Passos de como funciona
  const steps = [
    {
      icon: <Upload className="h-8 w-8" />,
      title: t("index.feature1.title"),
      description: t("index.feature1.desc"),
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: t("index.feature2.title"),
      description: t("index.feature2.desc"),
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: t("index.feature3.title"),
      description: t("index.feature3.desc"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Decoração de fundo */}
      <MusicNotes />
      
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative gradient-hero py-32 md:py-48 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center animate-fade-in-up pt-8 md:pt-12">
              {/* Título principal */}
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
                {t("index.hero.title.prefix")} <span className="text-gradient">{t("index.hero.title.highlight")}</span>
              </h1>

              {/* Subtítulo */}
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t("index.hero.subtitle")}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-lg px-8 glow-primary text-white"
                >
                  <Link to="/transcribe">
                    {t("index.hero.cta")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Decoração de onda */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Como Funciona */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                {t("index.features.title")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="relative glass-card rounded-xl p-6 text-center animate-fade-in transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Número do passo */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center font-bold text-secondary-foreground shadow-lg">
                    {index + 1}
                  </div>
                  
                  {/* Ícone */}
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    {step.icon}
                  </div>
                  
                  {/* Conteúdo */}
                  <h3 className="text-xl font-serif font-semibold mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center glass-card rounded-2xl p-8 md:p-12 gradient-musical">
              <Music className="h-12 w-12 text-primary dark:text-white mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground dark:text-white mb-4">
                {t("index.hero.cta")}
              </h2>
              <Button 
                asChild 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-lg px-8 text-white"
              >
                <Link to="/transcribe">
                  {t("nav.start")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
