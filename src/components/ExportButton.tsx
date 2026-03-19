import { useState } from "react";
import { Download, FileText, FileMusic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Note } from "./SheetMusicViewer";
import type { InstrumentType } from "./InstrumentSelector";

interface ExportButtonProps {
  notes: Note[];
  instrument: InstrumentType;
}

/**
 * ExportButton Component - Exportação dos resultados
 * Permite exportar a transcrição em diferentes formatos incluindo MIDI
 */
const ExportButton = ({ notes, instrument }: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Nomes dos instrumentos
  const instrumentNames: Record<InstrumentType, string> = {
    piano: "Piano",
    violao: "Violão",
    guitarra: "Guitarra",
    baixo: "Baixo",
    flauta: "Flauta",
    violino: "Violino",
  };

  // Exportar como TXT
  const exportAsTxt = () => {
    setIsExporting(true);
    
    try {
      const content = generateTextContent();
      downloadFile(content, "sinfonia-transcricao.txt", "text/plain");
      
      toast({
        title: t("export.success"),
        description: "Arquivo TXT baixado.",
      });
    } catch (error) {
      toast({
        title: t("export.error"),
        description: "Não foi possível exportar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar como CSV
  const exportAsCsv = () => {
    setIsExporting(true);
    
    try {
      const headers = "Posição,Nota,Oitava,Frequência (Hz),Duração\n";
      const rows = notes
        .map((note, i) => 
          `${i + 1},${note.name},${note.octave},${note.frequency.toFixed(2)},${note.duration}`
        )
        .join("\n");
      
      downloadFile(headers + rows, "sinfonia-transcricao.csv", "text/csv");
      
      toast({
        title: t("export.success"),
        description: "Arquivo CSV baixado.",
      });
    } catch (error) {
      toast({
        title: t("export.error"),
        description: "Não foi possível exportar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar como JSON
  const exportAsJson = () => {
    setIsExporting(true);
    
    try {
      const data = {
        sistema: "SinfonIA",
        dataExportacao: new Date().toISOString(),
        instrumento: instrumentNames[instrument],
        totalNotas: notes.length,
        notas: notes,
      };
      
      downloadFile(JSON.stringify(data, null, 2), "sinfonia-transcricao.json", "application/json");
      
      toast({
        title: t("export.success"),
        description: "Arquivo JSON baixado.",
      });
    } catch (error) {
      toast({
        title: t("export.error"),
        description: "Não foi possível exportar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar como MIDI
  const exportAsMidi = () => {
    setIsExporting(true);
    
    try {
      const midiBytes = generateMidiFile(notes);
      const blob = new Blob([new Uint8Array(midiBytes)], { type: "audio/midi" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sinfonia-transcricao.mid";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: t("export.success"),
        description: "Arquivo MIDI baixado.",
      });
    } catch (error) {
      console.error("MIDI export error:", error);
      toast({
        title: t("export.error"),
        description: "Não foi possível exportar o arquivo MIDI.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Gerar arquivo MIDI
  const generateMidiFile = (notes: Note[]): Uint8Array => {
    // MIDI note mapping
    const noteToMidi: Record<string, number> = {
      "C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5,
      "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11
    };

    // Duration to ticks (480 ticks per quarter note)
    const durationToTicks: Record<string, number> = {
      "whole": 1920,
      "half": 960,
      "quarter": 480,
      "eighth": 240,
      "sixteenth": 120
    };

    // Header chunk
    const header = [
      0x4D, 0x54, 0x68, 0x64, // MThd
      0x00, 0x00, 0x00, 0x06, // Header length
      0x00, 0x00,             // Format 0
      0x00, 0x01,             // 1 track
      0x01, 0xE0              // 480 ticks per quarter note
    ];

    // Track data
    const trackData: number[] = [];

    // Tempo meta event (120 BPM)
    trackData.push(0x00, 0xFF, 0x51, 0x03, 0x07, 0xA1, 0x20);

    // Program change (instrument)
    trackData.push(0x00, 0xC0, 0x00); // Piano

    // Add notes
    let currentTime = 0;
    for (const note of notes) {
      const midiNote = noteToMidi[note.name] + (note.octave + 1) * 12;
      const velocity = 100;
      const duration = durationToTicks[note.duration] || 480;

      // Note on (delta time 0 for first, then 0 between on/off)
      trackData.push(...encodeVarLen(0));
      trackData.push(0x90, midiNote, velocity);

      // Note off
      trackData.push(...encodeVarLen(duration));
      trackData.push(0x80, midiNote, 0);

      currentTime += duration;
    }

    // End of track
    trackData.push(0x00, 0xFF, 0x2F, 0x00);

    // Track chunk
    const trackLength = trackData.length;
    const track = [
      0x4D, 0x54, 0x72, 0x6B, // MTrk
      (trackLength >> 24) & 0xFF,
      (trackLength >> 16) & 0xFF,
      (trackLength >> 8) & 0xFF,
      trackLength & 0xFF,
      ...trackData
    ];

    return new Uint8Array([...header, ...track]);
  };

  // Encode variable length quantity for MIDI
  const encodeVarLen = (value: number): number[] => {
    if (value < 128) return [value];
    
    const result: number[] = [];
    let v = value;
    result.unshift(v & 0x7F);
    v >>= 7;
    
    while (v > 0) {
      result.unshift((v & 0x7F) | 0x80);
      v >>= 7;
    }
    
    return result;
  };

  // Gerar conteúdo de texto formatado
  const generateTextContent = () => {
    const date = new Date().toLocaleDateString("pt-BR");
    const time = new Date().toLocaleTimeString("pt-BR");
    
    let content = "╔════════════════════════════════════════════════════════════╗\n";
    content += "║                       SINFONIA                              ║\n";
    content += "║           Sistema de Transcrição Musical                    ║\n";
    content += "╚════════════════════════════════════════════════════════════╝\n\n";
    content += `Data: ${date} às ${time}\n`;
    content += `Instrumento: ${instrumentNames[instrument]}\n`;
    content += `Total de notas: ${notes.length}\n\n`;
    content += "───────────────────────────────────────────────────────────────\n";
    content += "NOTAS IDENTIFICADAS:\n";
    content += "───────────────────────────────────────────────────────────────\n\n";
    
    notes.forEach((note, index) => {
      content += `${(index + 1).toString().padStart(3, " ")}. ${note.name}${note.octave}`;
      content += ` | ${note.frequency.toFixed(2).padStart(8, " ")} Hz`;
      content += ` | ${note.duration}\n`;
    });
    
    content += "\n───────────────────────────────────────────────────────────────\n";
    content += "Gerado por SinfonIA - TCC\n";
    
    return content;
  };

  // Função auxiliar para download
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (notes.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {t("export.title")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportAsTxt} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          {t("export.txt")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsCsv} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          {t("export.csv")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsJson} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          {t("export.json")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsMidi} className="cursor-pointer">
          <FileMusic className="h-4 w-4 mr-2" />
          {t("export.midi")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
