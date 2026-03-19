import { useLanguage } from "@/contexts/LanguageContext";
import type { Note } from "./SheetMusicViewer";

interface TablatureViewerProps {
  notes: Note[];
  instrument: string;
}

// Mapeamento de notas para cordas e trastes
const guitarTuning = ["E", "B", "G", "D", "A", "E"]; // 1ª a 6ª corda (alto para baixo)
const bassTuning = ["G", "D", "A", "E"]; // 1ª a 4ª corda

const noteToFret = (noteName: string, octave: number, stringNote: string, stringOctave: number): number | null => {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const noteIndex = notes.indexOf(noteName);
  const stringIndex = notes.indexOf(stringNote);
  
  if (noteIndex === -1 || stringIndex === -1) return null;
  
  const noteSemitones = octave * 12 + noteIndex;
  const stringSemitones = stringOctave * 12 + stringIndex;
  const fret = noteSemitones - stringSemitones;
  
  if (fret >= 0 && fret <= 24) return fret;
  return null;
};

const findBestPosition = (noteName: string, octave: number, tuning: string[], startOctaves: number[]): { string: number; fret: number } | null => {
  for (let i = 0; i < tuning.length; i++) {
    const fret = noteToFret(noteName, octave, tuning[i], startOctaves[i]);
    if (fret !== null && fret <= 12) {
      return { string: i, fret };
    }
  }
  // Se não encontrou posição ideal, tenta qualquer posição
  for (let i = 0; i < tuning.length; i++) {
    const fret = noteToFret(noteName, octave, tuning[i], startOctaves[i]);
    if (fret !== null) {
      return { string: i, fret };
    }
  }
  return null;
};

const TablatureViewer = ({ notes, instrument }: TablatureViewerProps) => {
  const { t } = useLanguage();
  
  const isGuitar = instrument === "guitar" || instrument === "electricGuitar";
  const isBass = instrument === "bass";
  
  if (!isGuitar && !isBass) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t("tab.notSupported")}</p>
      </div>
    );
  }

  const tuning = isBass ? bassTuning : guitarTuning;
  const stringOctaves = isBass ? [2, 2, 1, 1] : [4, 3, 3, 3, 2, 2];
  const stringCount = tuning.length;

  // Calcular posições para cada nota
  const notePositions = notes.map(note => {
    const pos = findBestPosition(note.name.replace("#", "#"), note.octave, tuning, stringOctaves);
    return pos;
  });

  const tabWidth = Math.max(800, 100 + notes.length * 50);
  const stringSpacing = 20;
  const tabHeight = (stringCount + 1) * stringSpacing;

  return (
    <div className="w-full overflow-x-auto bg-card rounded-lg border border-border p-4">
      <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
        {t("tab.title")} - {isBass ? t("instrument.bass") : t("instrument.guitar")}
      </h3>
      
      <div className="min-w-[600px]">
        <svg 
          viewBox={`0 0 ${tabWidth} ${tabHeight + 40}`}
          className="w-full"
          style={{ height: `${tabHeight + 60}px` }}
        >
          {/* Rótulos das cordas */}
          {tuning.map((note, i) => (
            <text
              key={`label-${i}`}
              x="20"
              y={30 + i * stringSpacing}
              className="fill-muted-foreground text-sm font-mono"
              style={{ fontSize: "14px" }}
            >
              {note}
            </text>
          ))}
          
          {/* Linhas das cordas */}
          {Array.from({ length: stringCount }).map((_, i) => (
            <line
              key={`string-${i}`}
              x1="50"
              y1={25 + i * stringSpacing}
              x2={tabWidth - 20}
              y2={25 + i * stringSpacing}
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
            />
          ))}

          {/* Trastes/números */}
          {notes.map((note, noteIndex) => {
            const pos = notePositions[noteIndex];
            if (!pos) return null;
            
            const x = 80 + noteIndex * 50;
            const y = 25 + pos.string * stringSpacing;
            
            return (
              <g key={noteIndex} className="animate-fade-in" style={{ animationDelay: `${noteIndex * 30}ms` }}>
                {/* Fundo branco para o número */}
                <rect
                  x={x - 10}
                  y={y - 10}
                  width="20"
                  height="20"
                  rx="3"
                  className="fill-background"
                />
                {/* Número do traste */}
                <text
                  x={x}
                  y={y + 5}
                  textAnchor="middle"
                  className="fill-primary font-bold font-mono"
                  style={{ fontSize: "14px" }}
                >
                  {pos.fret}
                </text>
              </g>
            );
          })}

          {/* Notas abaixo */}
          {notes.map((note, noteIndex) => {
            const x = 80 + noteIndex * 50;
            return (
              <text
                key={`note-label-${noteIndex}`}
                x={x}
                y={tabHeight + 30}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: "10px" }}
              >
                {note.name}{note.octave}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        <span>🎸 {notes.length} {t("tab.notesOnTab")}</span>
      </div>
    </div>
  );
};

export default TablatureViewer;
