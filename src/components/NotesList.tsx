import { useState } from "react";
import { ChevronDown, ChevronUp, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Note } from "./SheetMusicViewer";

interface NotesListProps {
  notes: Note[];
  showFrequencies?: boolean;
}

/**
 * NotesList Component - Lista detalhada de notas identificadas
 * Mostra nome, oitava, frequência e duração de cada nota
 */
const NotesList = ({ notes, showFrequencies = true }: NotesListProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Agrupar notas por ocorrência
  const noteCount = notes.reduce((acc, note) => {
    const key = `${note.name}${note.octave}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Encontrar a nota mais frequente
  const mostFrequentNote = Object.entries(noteCount)
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-card rounded-lg border border-border overflow-hidden">
      {/* Header colapsável */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Music2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-serif font-semibold text-foreground">
            Notas Identificadas
          </h3>
          <Badge variant="secondary" className="ml-2">
            {notes.length} notas
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div className="p-4 pt-0 animate-fade-in">
          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-accent/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{notes.length}</p>
              <p className="text-xs text-muted-foreground">Total de notas</p>
            </div>
            <div className="p-3 bg-accent/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">
                {Object.keys(noteCount).length}
              </p>
              <p className="text-xs text-muted-foreground">Notas únicas</p>
            </div>
            <div className="p-3 bg-accent/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">
                {mostFrequentNote || "-"}
              </p>
              <p className="text-xs text-muted-foreground">Mais frequente</p>
            </div>
            <div className="p-3 bg-accent/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">
                {notes[0]?.octave || "-"}
              </p>
              <p className="text-xs text-muted-foreground">Oitava inicial</p>
            </div>
          </div>

          {/* Lista de notas em grid */}
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Nota</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Oitava</th>
                  {showFrequencies && (
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Frequência</th>
                  )}
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Duração</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((note, index) => (
                  <tr 
                    key={index}
                    className={cn(
                      "border-b border-border/50 hover:bg-accent/30 transition-colors",
                      index % 2 === 0 && "bg-muted/30"
                    )}
                  >
                    <td className="py-2 px-3 text-muted-foreground">{index + 1}</td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-primary">{note.name}</span>
                    </td>
                    <td className="py-2 px-3">{note.octave}</td>
                    {showFrequencies && (
                      <td className="py-2 px-3 text-muted-foreground">
                        {note.frequency.toFixed(2)} Hz
                      </td>
                    )}
                    <td className="py-2 px-3">
                      <Badge variant="outline" className="text-xs">
                        {note.duration}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesList;
