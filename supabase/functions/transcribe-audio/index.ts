import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Fallback: Frequências base das notas musicais (oitava 4)
const noteFrequencies: Record<string, number> = {
  "C": 261.63, "C#": 277.18, "D": 293.66, "D#": 311.13,
  "E": 329.63, "F": 349.23, "F#": 369.99, "G": 392.00,
  "G#": 415.30, "A": 440.00, "A#": 466.16, "B": 493.88,
};

const durations = ["whole", "half", "quarter", "eighth"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, instrument, fileName } = await req.json();
    const PYTHON_API_URL = Deno.env.get("PYTHON_API_URL");

    console.log(`Processando transcrição para: ${fileName}, instrumento: ${instrument}`);

    // Tenta usar API Python com FFT/Librosa primeiro
    if (PYTHON_API_URL) {
      try {
        console.log(`Chamando API Python em: ${PYTHON_API_URL}/transcribe`);
        
        const pythonResponse = await fetch(`${PYTHON_API_URL}/transcribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audio,
            instrument,
            fileName,
          }),
        });

        if (pythonResponse.ok) {
          const pythonData = await pythonResponse.json();
          
          if (pythonData.success && pythonData.notes) {
            console.log(`Transcrição Python FFT concluída: ${pythonData.notes.length} notas`);
            console.log(`Características detectadas:`, pythonData.detected_characteristics);
            
            return new Response(JSON.stringify({
              notes: pythonData.notes,
              instrument: pythonData.instrument,
              detected_characteristics: pythonData.detected_characteristics,
              audio_info: pythonData.audio_info,
              method: "fft_librosa"
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          const errorText = await pythonResponse.text();
          console.error("Erro na API Python:", pythonResponse.status, errorText);
        }
      } catch (pythonError) {
        console.error("Falha ao conectar com API Python:", pythonError);
      }
    } else {
      console.log("PYTHON_API_URL não configurada");
    }

    // Fallback: Gerar notas básicas se API Python não disponível
    console.log("Usando fallback (simulação básica)...");

    const fallbackNotes = [
      { name: "C", octave: 4 },
      { name: "E", octave: 4 },
      { name: "G", octave: 4 },
      { name: "C", octave: 5 },
    ];

    const notes = fallbackNotes.map((note: any, index: number) => {
      const baseFreq = noteFrequencies[note.name] || 440;
      const octaveDiff = (note.octave || 4) - 4;
      const frequency = baseFreq * Math.pow(2, octaveDiff);

      return {
        name: note.name,
        octave: note.octave || 4,
        frequency: Math.round(frequency * 100) / 100,
        duration: durations[Math.floor(Math.random() * durations.length)],
        position: index,
        confidence: 0.7 + Math.random() * 0.3,
      };
    });

    console.log(`Fallback concluído: ${notes.length} notas`);

    return new Response(JSON.stringify({ 
      notes, 
      instrument,
      method: "fallback_simulation",
      warning: "API Python não configurada. Configure PYTHON_API_URL para análise FFT real.",
      detected_characteristics: {
        suggested_instrument: instrument,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Erro:", error);
    const message = error instanceof Error ? error.message : "Erro na transcrição";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
