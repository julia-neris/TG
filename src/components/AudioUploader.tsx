import { useCallback, useState } from "react";
import { Upload, X, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

/**
 * AudioUploader Component - Upload de arquivos de áudio
 * Suporta drag & drop e seleção manual de arquivos MP3/WAV
 */
const AudioUploader = ({ onFileSelect, selectedFile, onClear }: AudioUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useLanguage();

  // Formatos de áudio aceitos
  const acceptedFormats = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/wave"];
  const acceptedExtensions = ".mp3,.wav";

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (acceptedFormats.includes(file.type)) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        // Área de drop
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300",
            isDragging
              ? "border-primary bg-primary/10 scale-[1.02]"
              : "border-border hover:border-primary/50 hover:bg-accent/50"
          )}
        >
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            <div className={cn(
              "p-4 rounded-full mb-4 transition-colors",
              isDragging ? "bg-primary/20" : "bg-muted"
            )}>
              <Upload className={cn(
                "h-8 w-8 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <p className="text-sm text-foreground font-medium mb-1">
              {isDragging ? t("uploader.drop") : t("uploader.drag")}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              {t("uploader.click")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("uploader.supported")}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={acceptedExtensions}
            onChange={handleFileInput}
          />
        </label>
      ) : (
        // Arquivo selecionado
        <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg border border-border animate-scale-in">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Music2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;