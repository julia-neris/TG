"""
SinfonIA Backend - API para transcrição musical com separação de instrumentos
Usa FastAPI + Librosa + Demucs/Spleeter para processamento de áudio
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import uuid
import shutil
import tempfile
from enum import Enum

from transcriber import MusicTranscriber
from instrument_separator import InstrumentSeparator, preload_models, get_system_info
from pitch_detector import PitchDetector
from audio_processor import AudioProcessor

# =============== CONFIGURAÇÃO ===============

app = FastAPI(
    title="SinfonIA API",
    description="API para transcrição musical com separação de instrumentos",
    version="1.0.0"
)


# =============== EVENTOS DE INICIALIZAÇÃO ===============

@app.on_event("startup")
async def startup_event():
    """
    Pré-carrega modelos de ML no startup para evitar cold-start.
    Reduz tempo da primeira transcrição de ~30-50s para ~10-20s.
    """
    print("\n" + "="*60)
    print("🎵 INICIANDO SINFONIA API - TRANSCRIPTOR MUSICAL")
    print("="*60 + "\n")
    
    # Pré-carrega modelo Demucs (o mais pesado, ~800MB)
    preload_models(["htdemucs"])
    
    # Mostra informações do sistema
    info = get_system_info()
    print("\n📊 INFORMAÇÕES DO SISTEMA:")
    print(f"   • Demucs disponível: {'✓' if info['demucs_available'] else '✗'}")
    print(f"   • Spleeter disponível: {'✓' if info['spleeter_available'] else '✗'}")
    print(f"   • GPU disponível: {'✓ ' + str(info.get('gpu_name', '')) if info['gpu_available'] else '✗ (usando CPU)'}")
    print(f"   • Dispositivo: {info['device']}")
    print(f"   • Modelos em cache: {info['cached_models']}")
    print("\n" + "="*60)
    print("✓ SERVIDOR PRONTO PARA TRANSCRIÇÕES")
    print("="*60 + "\n")

# CORS para permitir requisições do frontend
# Em produção, defina a variável ALLOWED_ORIGINS com a URL do frontend
# Ex: ALLOWED_ORIGINS=https://sinfonia-frontend.onrender.com
_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [o.strip() for o in _origins_env.split(",")] if _origins_env != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Diretório temporário para uploads
UPLOAD_DIR = tempfile.gettempdir()
os.makedirs(os.path.join(UPLOAD_DIR, "sinfonia_uploads"), exist_ok=True)

# Instância do transcritor
transcriber = MusicTranscriber(sr=22050)


# =============== MODELOS ===============

class InstrumentType(str, Enum):
    GUITAR = "guitar"
    PIANO = "piano"
    BASS = "bass"
    DRUMS = "drums"
    VOCALS = "vocals"
    VIOLIN = "violin"
    FLUTE = "flute"
    SAXOPHONE = "saxophone"
    OTHER = "other"


class NoteInfo(BaseModel):
    note: str
    frequency: float
    duration: float
    intensity: float
    start_time: float
    end_time: float
    cents_offset: Optional[float] = None


class TranscriptionResult(BaseModel):
    success: bool
    notes: List[Dict[str, Any]]
    instrument: str
    duration: float
    total_notes: int
    statistics: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


# =============== ROTAS ===============

@app.get("/")
async def root():
    return {"message": "SinfonIA API - Transcrição Musical", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Backend online e funcionando"}


@app.get("/system")
async def system_info():
    """
    Retorna informações sobre o hardware e otimizações disponíveis.
    Útil para diagnosticar performance.
    """
    info = get_system_info()
    return {
        "status": "ok",
        "hardware": {
            "gpu_available": info["gpu_available"],
            "gpu_name": info.get("gpu_name"),
            "gpu_memory_gb": info.get("gpu_memory_gb"),
            "device": info["device"]
        },
        "separators": {
            "demucs": info["demucs_available"],
            "spleeter": info["spleeter_available"]
        },
        "optimization": {
            "models_cached": info["cached_models"],
            "fp16_enabled": info["device"] == "cuda"
        },
        "performance_tips": [
            "GPU NVIDIA recomendada para melhor performance",
            "Primeira transcrição carrega modelos (~800MB)",
            "Transcrições subsequentes são ~5x mais rápidas",
            "Use /transcribe/quick para áudios de instrumento solo"
        ] if not info["gpu_available"] else [
            f"GPU {info.get('gpu_name')} detectada ✓",
            "FP16 habilitado para máxima velocidade",
            "Performance otimizada"
        ]
    }


@app.get("/instruments")
async def list_instruments():
    """Lista os instrumentos disponíveis para seleção"""
    return {
        "instruments": [
            {"id": "guitar", "name": "Guitarra/Violão", "category": "cordas"},
            {"id": "piano", "name": "Piano/Teclado", "category": "teclas"},
            {"id": "bass", "name": "Baixo", "category": "cordas"},
            {"id": "drums", "name": "Bateria/Percussão", "category": "percussão"},
            {"id": "vocals", "name": "Voz", "category": "vocal"},
            {"id": "violin", "name": "Violino", "category": "cordas"},
            {"id": "flute", "name": "Flauta", "category": "sopro"},
            {"id": "saxophone", "name": "Saxofone", "category": "sopro"},
            {"id": "other", "name": "Outro", "category": "outro"},
        ]
    }


@app.post("/transcribe", response_model=TranscriptionResult)
async def transcribe_audio(
    file: UploadFile = File(..., description="Arquivo de áudio (MP3, WAV, etc.)"),
    instrument: str = Form(..., description="Tipo de instrumento a isolar"),
    separate_instruments: bool = Form(True, description="Se deve separar instrumentos antes de transcrever")
):
    """
    Endpoint principal: recebe áudio, isola o instrumento selecionado e detecta as notas.
    
    - **file**: Arquivo de áudio (MP3, WAV, FLAC, etc.)
    - **instrument**: Instrumento para isolar (guitar, piano, bass, drums, vocals, etc.)
    - **separate_instruments**: Se True, usa Demucs/Spleeter para isolar o instrumento
    """
    
    # Valida extensão
    allowed_extensions = {'.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.wma'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Formato não suportado. Use: {', '.join(allowed_extensions)}"
        )
    
    # Salva arquivo temporariamente
    temp_id = str(uuid.uuid4())
    temp_path = os.path.join(UPLOAD_DIR, "sinfonia_uploads", f"{temp_id}{file_ext}")
    
    try:
        # Salva o upload
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Transcreve com isolamento do instrumento
        result = transcriber.transcribe_instrument(
            file_path=temp_path,
            target_instrument=instrument,
            separate=separate_instruments
        )
        
        return TranscriptionResult(
            success=True,
            notes=result["notes"],
            instrument=instrument,
            duration=result["duration"],
            total_notes=len(result["notes"]),
            statistics=result.get("statistics"),
            message=f"Transcrição concluída para {instrument}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na transcrição: {str(e)}")
    
    finally:
        # Limpa arquivo temporário
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/transcribe/quick")
async def transcribe_quick(
    file: UploadFile = File(...),
    instrument: str = Form("other")
):
    """
    Transcrição rápida sem separação de instrumentos.
    Útil para áudios de um único instrumento.
    """
    file_ext = os.path.splitext(file.filename)[1].lower()
    temp_id = str(uuid.uuid4())
    temp_path = os.path.join(UPLOAD_DIR, "sinfonia_uploads", f"{temp_id}{file_ext}")
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Transcrição direta sem separação
        result = transcriber.transcribe_instrument(
            file_path=temp_path,
            target_instrument=instrument,
            separate=False
        )
        
        return {
            "success": True,
            "notes": result["notes"],
            "instrument": instrument,
            "duration": result["duration"],
            "total_notes": len(result["notes"])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    """
    Analisa o áudio e retorna informações sobre os instrumentos detectados.
    Útil para preview antes de transcrever.
    """
    file_ext = os.path.splitext(file.filename)[1].lower()
    temp_id = str(uuid.uuid4())
    temp_path = os.path.join(UPLOAD_DIR, "sinfonia_uploads", f"{temp_id}{file_ext}")
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        analysis = transcriber.analyze_audio(temp_path)
        
        return {
            "success": True,
            "duration": analysis["duration"],
            "detected_instruments": analysis["detected_instruments"],
            "tempo_bpm": analysis.get("tempo"),
            "key": analysis.get("key")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# =============== INICIALIZAÇÃO ===============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
