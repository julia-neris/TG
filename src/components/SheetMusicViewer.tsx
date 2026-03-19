import { useState } from "react";
import { Music, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import EditNoteDialog from "./EditNoteDialog";

export interface Note {
  name: string;
  octave: number;
  frequency: number;
  duration: string;
  position: number;
}

interface SheetMusicViewerProps {
  notes: Note[];
  onNotesChange?: (notes: Note[]) => void;
  editable?: boolean;
}

/**
 * SheetMusicViewer Component - Visualização de partitura musical
 * Renderiza as notas identificadas em formato visual de pauta
 * Permite edição quando habilitado
 */
const SheetMusicViewer = ({ notes, onNotesChange, editable = false }: SheetMusicViewerProps) => {
  const { t } = useLanguage();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Mapeamento de notas para posições na pauta (linha central = Si3)
  const notePositions: Record<string, number> = {
    "C": 0, "C#": 0.5, "D": 1, "D#": 1.5, "E": 2, "F": 3, "F#": 3.5, "G": 4, "G#": 4.5, "A": 5, "A#": 5.5, "B": 6
  };

  // Calcular posição vertical da nota na pauta
  const getNoteYPosition = (note: Note) => {
    const basePosition = notePositions[note.name] || 0;
    const octaveOffset = (note.octave - 4) * 7;
    return 50 - (basePosition + octaveOffset) * 5;
  };

  // Obter cor da nota baseada na duração
  const getNoteColor = (duration: string, index: number) => {
    if (isEditMode && selectedNoteIndex === index) {
      return "fill-secondary";
    }
    switch (duration) {
      case "whole": return "fill-primary";
      case "half": return "fill-primary/80";
      default: return "fill-primary";
    }
  };

  // Clique na nota para edição
  const handleNoteClick = (index: number) => {
    if (isEditMode && editable) {
      setSelectedNoteIndex(index);
      setEditDialogOpen(true);
    }
  };

  // Salvar nota editada
  const handleSaveNote = (index: number, updatedNote: Note) => {
    if (onNotesChange) {
      const newNotes = [...notes];
      newNotes[index] = updatedNote;
      onNotesChange(newNotes);
    }
  };

  // Deletar nota
  const handleDeleteNote = (index: number) => {
    if (onNotesChange) {
      const newNotes = notes.filter((_, i) => i !== index);
      onNotesChange(newNotes);
    }
  };

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Music className="h-12 w-12 mb-4 opacity-50" />
        <p>{t("sheet.noNotes")}</p>
      </div>
    );
  }

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
        <p className="text-sm text-muted-foreground mb-3">
          {t("sheet.clickToEdit")}
        </p>
      )}
      
      {/* Container da partitura */}
      <div className="min-w-[600px]">
        <svg 
          viewBox={`0 0 ${Math.max(800, 100 + notes.length * 60)} 120`}
          className="w-full h-32"
          aria-label="Partitura musical com notas transcritas"
        >
          {/* Clave de Sol */}
          <text 
            x="20" 
            y="70" 
            className="fill-foreground text-4xl font-serif"
            style={{ fontSize: "50px" }}
          >
            𝄞
          </text>

          {/* Linhas da pauta */}
          {[30, 45, 60, 75, 90].map((y, i) => (
            <line
              key={i}
              x1="60"
              y1={y}
              x2={Math.max(780, 80 + notes.length * 60)}
              y2={y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
            />
          ))}

          {/* Notas musicais */}
          {notes.map((note, index) => {
            const x = 100 + index * 60;
            const y = getNoteYPosition(note);
            const clampedY = Math.max(15, Math.min(105, y));
            const isSelected = isEditMode && selectedNoteIndex === index;
            
            return (
              <g 
                key={index} 
                className={cn(
                  "animate-fade-in",
                  isEditMode && "cursor-pointer hover:opacity-80"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleNoteClick(index)}
              >
                {/* Linhas suplementares se necessário */}
                {clampedY < 30 && (
                  <line
                    x1={x - 15}
                    y1={clampedY}
                    x2={x + 15}
                    y2={clampedY}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground"
                  />
                )}
                {clampedY > 90 && (
                  <line
                    x1={x - 15}
                    y1={clampedY}
                    x2={x + 15}
                    y2={clampedY}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground"
                  />
                )}
                
                {/* Nota (elipse) */}
                <ellipse
                  cx={x}
                  cy={clampedY}
                  rx={isSelected ? 10 : 8}
                  ry={isSelected ? 7 : 6}
                  className={cn(
                    getNoteColor(note.duration, index),
                    "transition-all",
                    isSelected && "stroke-secondary stroke-2"
                  )}
                  style={{ transformOrigin: `${x}px ${clampedY}px` }}
                />
                
                {/* Haste da nota */}
                <line
                  x1={x + 7}
                  y1={clampedY}
                  x2={x + 7}
                  y2={clampedY - 30}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-foreground"
                />
                
                {/* Nome da nota abaixo */}
                <text
                  x={x}
                  y="115"
                  textAnchor="middle"
                  className={cn(
                    "fill-muted-foreground text-xs",
                    isSelected && "fill-secondary font-bold"
                  )}
                  style={{ fontSize: "10px" }}
                >
                  {note.name}{note.octave}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legenda */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>🎵 {t("sheet.total")}: {notes.length}</span>
        <span>|</span>
        <span>{t("sheet.scroll")}</span>
      </div>

      {/* Dialog de edição */}
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

export default SheetMusicViewer;
