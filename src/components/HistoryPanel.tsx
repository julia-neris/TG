import { useState, useEffect } from "react";
import { History, Trash2, Upload, Clock, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Note } from "./SheetMusicViewer";

interface HistoryItem {
  id: string;
  created_at: string;
  instrument: string;
  file_name: string | null;
  notes: Note[];
  notes_count: number;
}

interface HistoryPanelProps {
  onLoadTranscription: (notes: Note[], instrument: string) => void;
}

/**
 * HistoryPanel Component - Painel lateral com histórico de transcrições
 */
const HistoryPanel = ({ onLoadTranscription }: HistoryPanelProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Carregar histórico
  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transcription_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Parse notes from JSONB
      const parsed = (data || []).map(item => ({
        ...item,
        notes: Array.isArray(item.notes) ? (item.notes as unknown as Note[]) : [],
      }));
      
      setHistory(parsed);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  // Deletar item do histórico
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("transcription_history")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setHistory(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Excluído",
        description: "Transcrição removida do histórico.",
      });
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir.",
        variant: "destructive",
      });
    }
  };

  // Carregar transcrição
  const handleLoad = (item: HistoryItem) => {
    onLoadTranscription(item.notes, item.instrument);
    setIsOpen(false);
    toast({
      title: t("history.load"),
      description: `${item.notes_count} ${t("toast.notesIdentified")}`,
    });
  };

  // Formatar data
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  };

  // Mapear instrumento para nome
  const instrumentNames: Record<string, string> = {
    piano: t("instrument.piano"),
    violao: t("instrument.guitar"),
    guitarra: t("instrument.electricGuitar"),
    baixo: t("instrument.bass"),
    flauta: t("instrument.flute"),
    violino: t("instrument.violin"),
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">{t("nav.history")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] md:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {t("history.title")}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Music2 className="h-12 w-12 mb-4 opacity-50" />
              <p>{t("history.empty")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {instrumentNames[item.instrument] || item.instrument}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.notes_count} notas
                        </Badge>
                      </div>
                      {item.file_name && (
                        <p className="text-sm text-foreground truncate">
                          {item.file_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleLoad(item)}
                        className="h-8 px-2"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("history.confirmDelete")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("edit.cancel")}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)}>
                              {t("history.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default HistoryPanel;
