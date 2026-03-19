import { Loader2, Music, Wand2, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TranscriptionProgressProps {
  progress: number;
  status: "uploading" | "analyzing" | "transcribing" | "complete";
}

/**
 * TranscriptionProgress Component - Barra de progresso animada
 * Mostra o status do processamento da transcrição
 */
const TranscriptionProgress = ({ progress, status }: TranscriptionProgressProps) => {
  // Etapas do processamento
  const steps = [
    { 
      id: "uploading", 
      label: "Enviando áudio", 
      icon: <Music className="h-5 w-5" />,
      description: "Preparando arquivo para análise..."
    },
    { 
      id: "analyzing", 
      label: "Analisando", 
      icon: <Wand2 className="h-5 w-5" />,
      description: "Processando frequências sonoras..."
    },
    { 
      id: "transcribing", 
      label: "Transcrevendo", 
      icon: <FileText className="h-5 w-5" />,
      description: "Convertendo notas musicais..."
    },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === status);
  const currentStep = steps[currentStepIndex] || steps[0];

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
      {/* Ícone animado */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="p-6 bg-primary/10 rounded-full">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
          <div className="absolute -bottom-2 -right-2 p-2 bg-secondary rounded-full animate-float">
            {currentStep.icon}
          </div>
        </div>
      </div>

      {/* Status atual */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-serif font-semibold text-foreground">
          {currentStep.label}
        </h3>
        <p className="text-sm text-muted-foreground">
          {currentStep.description}
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="space-y-2">
        <Progress value={progress} className="h-3" />
        <p className="text-center text-sm font-medium text-primary">
          {progress}%
        </p>
      </div>

      {/* Indicadores de etapas */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                index < currentStepIndex
                  ? "bg-primary border-primary text-primary-foreground"
                  : index === currentStepIndex
                    ? "border-primary text-primary animate-pulse"
                    : "border-muted text-muted-foreground"
              )}
            >
              {index < currentStepIndex ? (
                <span className="text-xs">✓</span>
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-12 sm:w-20 h-0.5 mx-1",
                  index < currentStepIndex ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TranscriptionProgress;
