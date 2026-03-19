import { Piano, Guitar, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export type InstrumentType = 
  | "piano" 
  | "violao" 
  | "guitarra" 
  | "baixo" 
  | "flauta" 
  | "violino";

// Ícone customizado de guitarra elétrica (Flying V style)
const ElectricGuitarIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Flying V body */}
    <path d="M12 4L6 18L8 20L12 14L16 20L18 18L12 4Z" />
    {/* Neck */}
    <line x1="12" y1="4" x2="12" y2="2" />
    {/* Headstock */}
    <path d="M10 2h4" />
    {/* Pickups */}
    <ellipse cx="12" cy="12" rx="1.5" ry="0.5" />
    <ellipse cx="12" cy="14" rx="1.5" ry="0.5" />
    {/* Bridge */}
    <line x1="10" y1="16" x2="14" y2="16" />
  </svg>
);

// Ícone customizado de flauta
const FluteIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12h18" />
    <path d="M3 12c0-1 0.5-2 1.5-2h15c1 0 1.5 1 1.5 2s-0.5 2-1.5 2h-15c-1 0-1.5-1-1.5-2z" />
    <circle cx="7" cy="12" r="0.5" fill="currentColor" />
    <circle cx="10" cy="12" r="0.5" fill="currentColor" />
    <circle cx="13" cy="12" r="0.5" fill="currentColor" />
    <circle cx="16" cy="12" r="0.5" fill="currentColor" />
    <circle cx="19" cy="12" r="0.5" fill="currentColor" />
    <path d="M4 10v-2c0-0.5 0.5-1 1-1h1" />
  </svg>
);

// Ícone customizado de violino
const ViolinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Scroll/Pegbox */}
    <path d="M12 2C10 2 9 3 9 4.5C9 5.5 10 6 11 6H12" />
    {/* Neck */}
    <line x1="12" y1="6" x2="12" y2="9" />
    {/* Body - figure 8 shape */}
    <ellipse cx="12" cy="12" rx="3.5" ry="3" />
    <ellipse cx="12" cy="18" rx="4" ry="3.5" />
    {/* C-bouts (waist curves) */}
    <path d="M8.5 14.5c-0.5 0.5-0.5 1.5 0 2" />
    <path d="M15.5 14.5c0.5 0.5 0.5 1.5 0 2" />
    {/* F-holes */}
    <path d="M10 13c0.3 0.8 0.3 1.2 0 2" />
    <path d="M14 13c-0.3 0.8-0.3 1.2 0 2" />
    {/* Bridge */}
    <line x1="10.5" y1="17" x2="13.5" y2="17" />
    {/* Tailpiece */}
    <line x1="11" y1="20" x2="13" y2="20" />
    {/* Chinrest */}
    <ellipse cx="15" cy="20" rx="1" ry="0.5" />
  </svg>
);

interface Instrument {
  id: InstrumentType;
  nameKey: string;
  icon: React.ReactNode;
}

interface InstrumentSelectorProps {
  selectedInstrument: InstrumentType;
  onSelect: (instrument: InstrumentType) => void;
}

/**
 * InstrumentSelector Component - Seleção de instrumento musical
 * Cards visuais para escolha do instrumento a ser transcrito
 */
const InstrumentSelector = ({ selectedInstrument, onSelect }: InstrumentSelectorProps) => {
  const { t } = useLanguage();

  // Lista de instrumentos disponíveis
  const instruments: Instrument[] = [
    { id: "piano", nameKey: "instrument.piano", icon: <Piano className="h-6 w-6" /> },
    { id: "violao", nameKey: "instrument.guitar", icon: <Guitar className="h-6 w-6" /> },
    { id: "guitarra", nameKey: "instrument.electricGuitar", icon: <ElectricGuitarIcon className="h-6 w-6" /> },
    { id: "baixo", nameKey: "instrument.bass", icon: <Music className="h-6 w-6" /> },
    { id: "flauta", nameKey: "instrument.flute", icon: <FluteIcon className="h-6 w-6" /> },
    { id: "violino", nameKey: "instrument.violin", icon: <ViolinIcon className="h-6 w-6" /> },
  ];

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-3">
        {t("instrument.title")}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {instruments.map((instrument) => (
          <button
            key={instrument.id}
            onClick={() => onSelect(instrument.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200",
              selectedInstrument === instrument.id
                ? "border-primary bg-primary/10 text-primary shadow-md glow-primary"
                : "border-border bg-card hover:border-primary/50 hover:bg-accent/50 text-muted-foreground"
            )}
          >
            <div className={cn(
              "transition-transform duration-200",
              selectedInstrument === instrument.id && "scale-110"
            )}>
              {instrument.icon}
            </div>
            <span className="text-xs font-medium">{t(instrument.nameKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default InstrumentSelector;