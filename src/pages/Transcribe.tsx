import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Upload, Mic, Wand2, RotateCcw, Zap, Settings2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MusicNotes from "@/components/MusicNotes";
import AudioUploader from "@/components/AudioUploader";
import AudioRecorder from "@/components/AudioRecorder";
import InstrumentSelector, { type InstrumentType } from "@/components/InstrumentSelector";
import TranscriptionProgress from "@/components/TranscriptionProgress";
import ImprovedSheetMusic from "@/components/ImprovedSheetMusic";
import TablatureViewer from "@/components/TablatureViewer";
import NotesList from "@/components/NotesList";
import ExportButton from "@/components/ExportButton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { transcribeAudio, checkHealth } from "@/services/transcriptionApi";
import type { Note } from "@/components/SheetMusicViewer";

type TranscriptionStatus = "idle" | "uploading" | "analyzing" | "transcribing" | "complete" | "error";

const Transcribe = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>("piano");
  const [fastMode, setFastMode] = useState<boolean>(false);
  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [transcribedNotes, setTranscribedNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState("upload");

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setRecordedAudio(null);
    toast({
      title: t("toast.fileLoaded"),
      description: `${file.name} ${t("toast.fileReady")}`,
    });
  }, [toast, t]);

  const handleRecordingComplete = useCallback((audioBlob: Blob) => {
    setRecordedAudio(audioBlob);
    setSelectedFile(null);
    toast({
      title: t("toast.recordingComplete"),
      description: t("toast.audioReady"),
    });
  }, [toast, t]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setRecordedAudio(null);
  }, []);

  const saveToHistory = async (notes: Note[], instrument: string, fileName?: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("transcription_history").insert({
        instrument,
        file_name: fileName || "recorded-audio",
        notes: JSON.parse(JSON.stringify(notes)),
        notes_count: notes.length,
        user_id: user.id,
      });
      if (error) console.error("Error saving to history:", error);
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  };

  const handleTranscribe = async () => {
    const audioSource = selectedFile || recordedAudio;
    
    if (!audioSource) {
      toast({
        title: t("toast.noAudio"),
        description: t("toast.uploadFirst"),
        variant: "destructive",
      });
      return;
    }

    try {
      setStatus("uploading");
      setProgress(10);

      // Prepara o arquivo
      let file: File;
      if (audioSource instanceof File) {
        file = audioSource;
      } else {
        // Converte Blob para File
        file = new File([audioSource], "recorded-audio.wav", { type: "audio/wav" });
      }

      setProgress(20);
      setStatus("analyzing");

      // Tenta usar a API local do Python primeiro
      const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      let notes: Note[] = [];
      let apiUsed = "";

      if (isLocalDev) {
        try {
          // Verifica se o backend está online
          const isBackendOnline = await checkHealth();
          
          if (isBackendOnline) {
            // Usa a nova API Python com separação de instrumentos
            const result = await transcribeAudio(
              file,
              selectedInstrument,
              !fastMode, // separar instrumentos apenas se NÃO estiver em modo rápido
              (p) => setProgress(20 + p * 0.5) // progresso de 20% a 70%
            );
            
            console.log("Resultado da API:", result);
            
            if (result.success && result.notes) {
              console.log("Notas recebidas:", result.notes);
              // Converte notas do formato da API para o formato do frontend
              notes = result.notes.map((n, idx) => {
                // Extrai nome da nota sem o número da oitava (ex: "C4" -> "C", "D#5" -> "D#")
                const noteName = n.note.replace(/[0-9]/g, "");
                const octave = n.octave || parseInt(n.note.replace(/[^0-9]/g, "")) || 4;
                const durationStr = n.duration > 0.5 ? "half" : n.duration > 0.25 ? "quarter" : "eighth";
                
                return {
                  name: noteName,
                  octave: octave,
                  frequency: n.frequency || 440,
                  duration: durationStr,
                  position: idx,
                };
              });
              console.log("Notas convertidas:", notes);
              apiUsed = "local";
            }
          }
        } catch (localError) {
          console.warn("API local não disponível:", localError);
        }
      }

      // Fallback para Supabase Edge Function se API local não funcionou
      if (notes.length === 0) {
        setProgress(40);
        
        // Converte para base64 para Edge Function
        const audioBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
        });

        const { data, error } = await supabase.functions.invoke("transcribe-audio", {
          body: {
            audio: audioBase64,
            instrument: selectedInstrument,
            fileName: file.name,
          },
        });

        if (error) throw error;
        notes = data?.notes || [];
        apiUsed = "edge";
      }

      setProgress(90);
      setStatus("transcribing");

      await new Promise(resolve => setTimeout(resolve, 300));
      
      setProgress(100);
      setStatus("complete");
      setTranscribedNotes(notes);

      await saveToHistory(notes, selectedInstrument, selectedFile?.name);

      toast({
        title: t("toast.transcriptionComplete"),
        description: `${notes.length} ${t("toast.notesIdentified")}${apiUsed === "local" ? " (Python + Librosa)" : ""}`,
      });

    } catch (error) {
      console.error("Erro na transcrição:", error);
      setStatus("error");
      toast({
        title: t("toast.transcriptionError"),
        description: t("toast.tryAgain"),
        variant: "destructive",
      });
    }
  };

  const handleNewTranscription = () => {
    setStatus("idle");
    setProgress(0);
    setTranscribedNotes([]);
    setSelectedFile(null);
    setRecordedAudio(null);
  };

  const handleLoadFromHistory = (notes: Note[], instrument: string) => {
    setTranscribedNotes(notes);
    setSelectedInstrument(instrument as InstrumentType);
    setStatus("complete");
    setProgress(100);
  };

  const handleNotesChange = (newNotes: Note[]) => {
    setTranscribedNotes(newNotes);
  };

  const canTranscribe = (selectedFile || recordedAudio) && status === "idle";
  const isProcessing = ["uploading", "analyzing", "transcribing"].includes(status);
  const showTablature = ["guitar", "electricGuitar", "bass"].includes(selectedInstrument);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <MusicNotes />
      <Header onLoadTranscription={handleLoadFromHistory} />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
              {t("transcribe.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("transcribe.subtitle")}
            </p>
          </div>

          {status === "idle" && (
            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
              <div className="glass-card rounded-xl p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {t("transcribe.upload.tab")}
                    </TabsTrigger>
                    <TabsTrigger value="record" className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      {t("transcribe.record.tab")}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="mt-0">
                    <AudioUploader
                      onFileSelect={handleFileSelect}
                      selectedFile={selectedFile}
                      onClear={handleClear}
                    />
                  </TabsContent>
                  
                  <TabsContent value="record" className="mt-0">
                    <div className="py-4">
                      <AudioRecorder
                        onRecordingComplete={handleRecordingComplete}
                        isDisabled={isProcessing}
                      />
                      {recordedAudio && (
                        <div className="mt-4 p-4 bg-accent/50 rounded-lg text-center animate-scale-in">
                          <p className="text-sm text-foreground">
                            ✓ {t("toast.recordingComplete")} ({(recordedAudio.size / 1024).toFixed(1)} KB)
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="mt-2 text-muted-foreground hover:text-destructive"
                          >
                            {t("recorder.discard")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="glass-card rounded-xl p-6">
                <InstrumentSelector
                  selectedInstrument={selectedInstrument}
                  onSelect={setSelectedInstrument}
                />
              </div>

              {/* Toggle Modo Rápido */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {fastMode ? (
                      <Zap className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Settings2 className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <Label htmlFor="fast-mode" className="text-base font-medium cursor-pointer">
                        {fastMode ? t("transcribe.fastMode") : t("transcribe.fullMode")}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {fastMode ? t("transcribe.fastMode.desc") : t("transcribe.fullMode.desc")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="fast-mode"
                    checked={fastMode}
                    onCheckedChange={setFastMode}
                  />
                </div>
              </div>

              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleTranscribe}
                  disabled={!canTranscribe}
                  className="bg-primary hover:bg-primary/90 text-lg px-12 py-6 glow-primary"
                >
                  <Wand2 className="mr-2 h-5 w-5" />
                  {t("transcribe.button")}
                </Button>
                {!canTranscribe && !isProcessing && (
                  <p className="text-sm text-muted-foreground mt-3">
                    {t("transcribe.noAudio")}
                  </p>
                )}
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="max-w-lg mx-auto py-12">
              <TranscriptionProgress
                progress={progress}
                status={status as "uploading" | "analyzing" | "transcribing" | "complete"}
              />
            </div>
          )}

          {status === "complete" && (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 glass-card rounded-xl p-4">
                <h2 className="text-xl font-serif font-semibold">
                  {t("transcribe.result.title")}
                </h2>
                <div className="flex items-center gap-3">
                  <ExportButton notes={transcribedNotes} instrument={selectedInstrument} />
                  <Button
                    variant="outline"
                    onClick={handleNewTranscription}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t("transcribe.newTranscription")}
                  </Button>
                </div>
              </div>

              {/* Improved Sheet Music */}
              <ImprovedSheetMusic 
                notes={transcribedNotes} 
                onNotesChange={handleNotesChange}
                editable={true}
              />

              {/* Tablature (for guitar/bass) */}
              {showTablature && (
                <TablatureViewer 
                  notes={transcribedNotes} 
                  instrument={selectedInstrument} 
                />
              )}

              {/* Notes List */}
              <NotesList notes={transcribedNotes} showFrequencies={true} />
            </div>
          )}

          {status === "error" && (
            <div className="max-w-md mx-auto text-center py-12 animate-fade-in">
              <div className="p-6 bg-destructive/10 rounded-xl border border-destructive/30">
                <p className="text-lg font-medium text-destructive mb-4">
                  {t("toast.transcriptionError")}
                </p>
                <Button onClick={handleNewTranscription} variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t("transcribe.newTranscription")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Transcribe;
