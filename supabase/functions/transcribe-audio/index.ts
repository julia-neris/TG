import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, instrument, fileName } = await req.json();
    const PYTHON_API_URL = Deno.env.get("PYTHON_API_URL");

    if (!PYTHON_API_URL) {
      return new Response(
        JSON.stringify({ error: "PYTHON_API_URL não configurada no servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!audio) {
      return new Response(
        JSON.stringify({ error: "Campo 'audio' (base64) é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processando transcrição para: ${fileName}, instrumento: ${instrument}`);

    // Converte base64 → Uint8Array (binário)
    const base64 = (audio as string).replace(/^data:\w+\/\w+;base64,/, "");
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Detecta extensão do arquivo
    const ext = (fileName as string)?.split(".").pop()?.toLowerCase() || "mp3";
    const mimeTypes: Record<string, string> = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      flac: "audio/flac",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
      aac: "audio/aac",
    };
    const mimeType = mimeTypes[ext] || "audio/mpeg";

    // Monta multipart/form-data — mesmo formato que o backend FastAPI espera
    const formData = new FormData();
    formData.append("file", new Blob([bytes], { type: mimeType }), fileName || `audio.${ext}`);
    formData.append("instrument", instrument || "other");
    formData.append("separate_instruments", "true");

    console.log(`Chamando API Python em: ${PYTHON_API_URL}/transcribe`);

    const pythonResponse = await fetch(`${PYTHON_API_URL}/transcribe`, {
      method: "POST",
      body: formData,
    });

    const responseText = await pythonResponse.text();
    console.log(`Resposta do backend (${pythonResponse.status}):`, responseText.slice(0, 300));

    if (!pythonResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Backend retornou ${pythonResponse.status}: ${responseText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pythonData = JSON.parse(responseText);

    // Normaliza o formato das notas para o frontend
    const notes = (pythonData.notes || []).map((n: any) => ({
      name: n.note?.replace(/\d+$/, "") || n.name || "C",
      octave: parseInt(n.note?.match(/(\d+)$/)?.[1] || n.octave || "4"),
      frequency: n.frequency || 440,
      duration: n.duration || 0.5,
      position: n.start_time || 0,
      confidence: n.intensity || 0.8,
    }));

    return new Response(
      JSON.stringify({
        notes,
        instrument: pythonData.instrument || instrument,
        total_notes: notes.length,
        method: "hf_demucs_librosa",
        success: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Erro:", error);
    const message = error instanceof Error ? error.message : "Erro na transcrição";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
