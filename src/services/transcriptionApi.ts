/**
 * API de transcrição musical - SinfonIA Backend
 * Conecta o frontend React com o backend Python (FastAPI)
 */

// Vite usa import.meta.env, NÃO process.env (process não existe no browser)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// =============== INTERFACES ===============

export interface ApiNoteInfo {
  note: string;        // ex: "C4", "D#5"
  frequency: number;
  duration: number;    // em segundos
  intensity: number;
  start_time: number;
  end_time: number;
  cents_offset?: number;
  octave?: number;
}

export interface TranscriptionApiResult {
  success: boolean;
  notes: ApiNoteInfo[];
  instrument: string;
  duration: number;
  total_notes: number;
  statistics?: Record<string, any>;
  message?: string;
}

export interface HealthResponse {
  status: string;
  message: string;
}

// =============== FUNÇÕES DA API ===============

/**
 * Verifica se a API backend está online.
 * Retorna true/false para uso direto como booleano.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return false;

    const data: HealthResponse = await response.json();
    return data.status === 'ok';
  } catch {
    console.warn('Backend não disponível');
    return false;
  }
}

/**
 * Transcreve um arquivo de áudio para notação musical.
 * 
 * @param audioFile - Arquivo de áudio (MP3, WAV, etc.)
 * @param instrument - Tipo de instrumento (piano, guitar, bass, etc.)
 * @param separateInstruments - Se deve separar instrumentos antes de transcrever
 * @param onProgress - Callback de progresso (0.0 a 1.0)
 */
export async function transcribeAudio(
  audioFile: File,
  instrument: string = 'other',
  separateInstruments: boolean = true,
  onProgress?: (progress: number) => void
): Promise<TranscriptionApiResult> {
  try {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('instrument', instrument);

    // Escolhe endpoint: com separação (/transcribe) ou rápido (/transcribe/quick)
    let endpoint: string;
    if (separateInstruments) {
      formData.append('separate_instruments', 'true');
      endpoint = '/transcribe';
    } else {
      endpoint = '/transcribe/quick';
    }

    onProgress?.(0.1);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    onProgress?.(0.5);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    onProgress?.(1.0);

    return result as TranscriptionApiResult;
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error);
    throw error;
  }
}

/**
 * Analisa um arquivo de áudio sem fazer transcrição completa
 */
export async function analyzeAudio(audioFile: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('file', audioFile);

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao analisar áudio:', error);
    throw error;
  }
}

/**
 * Obtém informações do sistema da API
 */
export async function getSystemInfo(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/system`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter informações do sistema:', error);
    throw error;
  }
}

/**
 * Obtém lista de instrumentos suportados
 */
export async function getSupportedInstruments(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/instruments`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.instruments || [];
  } catch (error) {
    console.error('Erro ao obter instrumentos suportados:', error);
    throw error;
  }
}
