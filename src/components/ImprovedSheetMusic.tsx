import { useState } from "react";
import { Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import EditNoteDialog from "./EditNoteDialog";
import type { Note } from "./SheetMusicViewer";

interface ImprovedSheetMusicProps {
  notes: Note[];
  onNotesChange?: (notes: Note[]) => void;
  editable?: boolean;
}

const ImprovedSheetMusic = ({ notes, onNotesChange, editable = false }: ImprovedSheetMusicProps) => {
  const { t } = useLanguage();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Mapeamento de notas para posições na pauta
  const notePositions: Record<string, number> = {
    "C": 0, "C#": 0, "D": 1, "D#": 1, "E": 2, "F": 3, "F#": 3, "G": 4, "G#": 4, "A": 5, "A#": 5, "B": 6
  };

  // Calcular posição Y na pauta (linha central = B4)
  const getNoteYPosition = (note: Note) => {
    const basePosition = notePositions[note.name] || 0;
    const octaveOffset = (note.octave - 4) * 7;
    const position = basePosition + octaveOffset;
    // Inverter para que notas mais altas fiquem mais acima
    return 60 - position * 6;
  };

  const isSharp = (name: string) => name.includes("#");

  const handleNoteClick = (index: number) => {
    if (isEditMode && editable) {
      setSelectedNoteIndex(index);
      setEditDialogOpen(true);
    }
  };

  const handleSaveNote = (index: number, updatedNote: Note) => {
    if (onNotesChange) {
      const newNotes = [...notes];
      newNotes[index] = updatedNote;
      onNotesChange(newNotes);
    }
  };

  const handleDeleteNote = (index: number) => {
    if (onNotesChange) {
      const newNotes = notes.filter((_, i) => i !== index);
      onNotesChange(newNotes);
    }
  };

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <svg className="h-16 w-16 mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <p>{t("sheet.noNotes")}</p>
      </div>
    );
  }

  const svgWidth = Math.max(900, 120 + notes.length * 55);

  return (
    <div className="w-full overflow-x-auto bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-serif font-semibold text-foreground">
          {t("sheet.title")}
        </h3>
        {editable && (
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="gap-2"
          >
            <Edit3 className="h-4 w-4" />
            {t("sheet.editMode")}
          </Button>
        )}
      </div>

      {isEditMode && (
        <p className="text-sm text-muted-foreground mb-3">{t("sheet.clickToEdit")}</p>
      )}

      <div className="min-w-[700px] bg-background/50 rounded-lg p-4">
        <svg viewBox={`0 0 ${svgWidth} 140`} className="w-full h-40">
          {/* Clave de Sol melhorada */}
          <g transform="translate(15, 20)">
            <path
              d="M12 0 C12 0 8 15 8 25 C8 35 14 40 14 50 C14 55 10 60 6 60 C2 60 0 55 0 50 C0 45 4 40 8 40 C12 40 16 45 16 55 C16 70 8 80 8 95 C8 105 12 110 12 110"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-foreground"
            />
          </g>

          {/* 5 linhas da pauta */}
          {[30, 42, 54, 66, 78].map((y, i) => (
            <line
              key={i}
              x1="50"
              y1={y}
              x2={svgWidth - 30}
              y2={y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-foreground/40"
            />
          ))}

          {/* Compasso inicial */}
          <text x="55" y="62" className="fill-foreground font-bold" style={{ fontSize: "20px" }}>4</text>
          <text x="55" y="82" className="fill-foreground font-bold" style={{ fontSize: "20px" }}>4</text>

          {/* Notas musicais */}
          {notes.map((note, index) => {
            const x = 100 + index * 55;
            const y = getNoteYPosition(note);
            const clampedY = Math.max(10, Math.min(105, y));
            const isSelected = isEditMode && selectedNoteIndex === index;
            const needsLedgerAbove = clampedY < 30;
            const needsLedgerBelow = clampedY > 78;
            const sharp = isSharp(note.name);

            return (
              <g
                key={index}
                className={cn(
                  "animate-fade-in transition-transform",
                  isEditMode && "cursor-pointer hover:scale-110"
                )}
                style={{ animationDelay: `${index * 40}ms` }}
                onClick={() => handleNoteClick(index)}
              >
                {/* Linhas suplementares */}
                {needsLedgerAbove && (
                  <>
                    {clampedY <= 18 && (
                      <line x1={x - 12} y1={18} x2={x + 12} y2={18} stroke="currentColor" strokeWidth="1" className="text-foreground/40" />
                    )}
                    {clampedY <= 6 && (
                      <line x1={x - 12} y1={6} x2={x + 12} y2={6} stroke="currentColor" strokeWidth="1" className="text-foreground/40" />
                    )}
                  </>
                )}
                {needsLedgerBelow && (
                  <>
                    {clampedY >= 90 && (
                      <line x1={x - 12} y1={90} x2={x + 12} y2={90} stroke="currentColor" strokeWidth="1" className="text-foreground/40" />
                    )}
                    {clampedY >= 102 && (
                      <line x1={x - 12} y1={102} x2={x + 12} y2={102} stroke="currentColor" strokeWidth="1" className="text-foreground/40" />
                    )}
                  </>
                )}

                {/* Sustenido */}
                {sharp && (
                  <text
                    x={x - 18}
                    y={clampedY + 4}
                    className="fill-foreground font-bold"
                    style={{ fontSize: "14px" }}
                  >
                    ♯
                  </text>
                )}

                {/* Cabeça da nota (elipse inclinada) */}
                <ellipse
                  cx={x}
                  cy={clampedY}
                  rx={isSelected ? 9 : 7}
                  ry={isSelected ? 6 : 5}
                  transform={`rotate(-20 ${x} ${clampedY})`}
                  className={cn(
                    "transition-all",
                    isSelected ? "fill-secondary stroke-secondary" : "fill-primary stroke-primary"
                  )}
                  strokeWidth={isSelected ? 2 : 0}
                />

                {/* Haste da nota */}
                {note.duration !== "whole" && (
                  <line
                    x1={clampedY > 54 ? x - 6 : x + 6}
                    y1={clampedY}
                    x2={clampedY > 54 ? x - 6 : x + 6}
                    y2={clampedY > 54 ? clampedY + 35 : clampedY - 35}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-foreground"
                  />
                )}

                {/* Bandeirola para colcheias */}
                {(note.duration === "eighth" || note.duration === "sixteenth") && (
                  <path
                    d={clampedY > 54 
                      ? `M${x - 6} ${clampedY + 35} Q${x + 5} ${clampedY + 25} ${x - 6} ${clampedY + 20}`
                      : `M${x + 6} ${clampedY - 35} Q${x + 17} ${clampedY - 25} ${x + 6} ${clampedY - 20}`
                    }
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-foreground"
                  />
                )}

                {/* Nome da nota */}
                <text
                  x={x}
                  y="125"
                  textAnchor="middle"
                  className={cn(
                    "fill-muted-foreground",
                    isSelected && "fill-secondary font-bold"
                  )}
                  style={{ fontSize: "11px" }}
                >
                  {note.name}{note.octave}
                </text>
              </g>
            );
          })}

          {/* Barra final */}
          <line
            x1={svgWidth - 40}
            y1={30}
            x2={svgWidth - 40}
            y2={78}
            stroke="currentColor"
            strokeWidth="2"
            className="text-foreground"
          />
          <line
            x1={svgWidth - 35}
            y1={30}
            x2={svgWidth - 35}
            y2={78}
            stroke="currentColor"
            strokeWidth="4"
            className="text-foreground"
          />
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>🎵 {t("sheet.total")}: {notes.length}</span>
        <span>|</span>
        <span>{t("sheet.scroll")}</span>
      </div>

      <EditNoteDialog
        note={selectedNoteIndex !== null ? notes[selectedNoteIndex] : null}
        noteIndex={selectedNoteIndex || 0}
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedNoteIndex(null);
        }}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
      />
    </div>
  );
};

export default ImprovedSheetMusic;
