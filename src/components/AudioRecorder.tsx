import { useState, useRef, useCallback } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isDisabled?: boolean;
}

/**
 * AudioRecorder Component - Gravação de áudio via microfone
 * Usa a Web Audio API para capturar áudio em tempo real
 */
const AudioRecorder = ({ onRecordingComplete, isDisabled }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const { t } = useLanguage();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Formatar tempo de gravação
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Iniciar gravação
  const startRecording = useCallback(async () => {
    try {
      setIsInitializing(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") 
          ? "audio/webm" 
          : "audio/mp4"
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        onRecordingComplete(audioBlob);
        
        // Parar todas as tracks do stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Coleta dados a cada 100ms
      setIsRecording(true);
      setIsInitializing(false);
      
      // Timer para mostrar duração
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Erro ao acessar microfone:", error);
      setIsInitializing(false);
    }
  }, [onRecordingComplete]);

  // Parar gravação
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Visualização de ondas durante gravação */}
      {isRecording && (
        <div className="flex items-end gap-1 h-12 animate-fade-in">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-primary rounded-full animate-wave-bar"
              style={{
                height: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Timer de gravação */}
      {isRecording && (
        <p className="text-2xl font-mono text-primary font-semibold animate-pulse-soft">
          {formatTime(recordingTime)}
        </p>
      )}

      {/* Botão de gravação */}
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isDisabled || isInitializing}
        size="lg"
        className={cn(
          "relative h-16 w-16 rounded-full transition-all duration-300",
          isRecording 
            ? "bg-destructive hover:bg-destructive/90 pulse-recording" 
            : "bg-primary hover:bg-primary/90"
        )}
      >
        {isInitializing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : isRecording ? (
          <Square className="h-6 w-6 fill-current" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
        
        {/* Anel pulsante durante gravação */}
        {isRecording && (
          <span className="absolute inset-0 rounded-full border-2 border-destructive animate-ping opacity-75" />
        )}
      </Button>

      {/* Texto de instrução */}
      <p className="text-sm text-muted-foreground text-center">
        {isInitializing 
          ? t("recorder.accessing")
          : isRecording 
            ? t("recorder.clickToStop")
            : t("recorder.clickToRecord")
        }
      </p>
    </div>
  );
};

export default AudioRecorder;