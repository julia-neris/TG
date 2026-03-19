import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Note } from "./SheetMusicViewer";

const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const octaves = [1, 2, 3, 4, 5, 6, 7, 8];
const durations = ["whole", "half", "quarter", "eighth", "sixteenth"];

// Frequências base para cálculo
const baseFrequencies: Record<string, number> = {
  "C": 16.35,
  "C#": 17.32,
  "D": 18.35,
  "D#": 19.45,
  "E": 20.60,
  "F": 21.83,
  "F#": 23.12,
  "G": 24.50,
  "G#": 25.96,
  "A": 27.50,
  "A#": 29.14,
  "B": 30.87,
};

interface EditNoteDialogProps {
  note: Note | null;
  noteIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (index: number, updatedNote: Note) => void;
  onDelete: (index: number) => void;
}

/**
 * EditNoteDialog Component - Modal para editar notas
 */
const EditNoteDialog = ({
  note,
  noteIndex,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EditNoteDialogProps) => {
  const { t } = useLanguage();
  const [editedNote, setEditedNote] = useState<Note | null>(null);

  useEffect(() => {
    if (note) {
      setEditedNote({ ...note });
    }
  }, [note]);

  if (!editedNote) return null;

  const handleSave = () => {
    // Recalcular frequência baseada na nota e oitava
    const baseName = editedNote.name.replace("#", "#");
    const baseFreq = baseFrequencies[baseName] || 261.63;
    const frequency = baseFreq * Math.pow(2, editedNote.octave);
    
    onSave(noteIndex, {
      ...editedNote,
      frequency,
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete(noteIndex);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎵 {t("edit.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Nome da Nota */}
          <div className="grid gap-2">
            <Label htmlFor="noteName">{t("edit.noteName")}</Label>
            <Select
              value={editedNote.name}
              onValueChange={(value) => setEditedNote({ ...editedNote, name: value })}
            >
              <SelectTrigger id="noteName">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {noteNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Oitava */}
          <div className="grid gap-2">
            <Label htmlFor="octave">{t("edit.octave")}</Label>
            <Select
              value={editedNote.octave.toString()}
              onValueChange={(value) => setEditedNote({ ...editedNote, octave: parseInt(value) })}
            >
              <SelectTrigger id="octave">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {octaves.map((oct) => (
                  <SelectItem key={oct} value={oct.toString()}>
                    {oct}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duração */}
          <div className="grid gap-2">
            <Label htmlFor="duration">{t("edit.duration")}</Label>
            <Select
              value={editedNote.duration}
              onValueChange={(value) => setEditedNote({ ...editedNote, duration: value })}
            >
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map((dur) => (
                  <SelectItem key={dur} value={dur}>
                    {dur === "whole" && "Semibreve"}
                    {dur === "half" && "Mínima"}
                    {dur === "quarter" && "Semínima"}
                    {dur === "eighth" && "Colcheia"}
                    {dur === "sixteenth" && "Semicolcheia"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="gap-1"
          >
            <Trash2 className="h-4 w-4" />
            {t("edit.delete")}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {t("edit.cancel")}
            </Button>
            <Button onClick={handleSave}>
              {t("edit.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditNoteDialog;
