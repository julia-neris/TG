"""
Módulo de separação de instrumentos usando Demucs/Spleeter
Isola instrumentos específicos de áudios com múltiplas faixas
"""

import numpy as np
import librosa
import soundfile as sf
from typing import Dict, Optional, Tuple, Any
import os
import tempfile
import subprocess
import time

# Tenta importar Demucs (preferido)
try:
    import torch
    import torchaudio
    import demucs.separate
    from demucs.pretrained import get_model
    DEMUCS_AVAILABLE = True
except ImportError:
    DEMUCS_AVAILABLE = False
    torch = None
    torchaudio = None

# Fallback para Spleeter
try:
    from spleeter.separator import Separator as SpleeterSeparator
    SPLEETER_AVAILABLE = True
except ImportError:
    SPLEETER_AVAILABLE = False


# =============== CACHE GLOBAL DE MODELOS ===============
# Evita recarregar modelos de ~800MB-1.2GB a cada requisição
_MODEL_CACHE: Dict[str, Any] = {}
_MODEL_DEVICE: Optional[str] = None


def get_cached_model(model_name: str):
    """
    Obtém modelo do cache ou carrega se não estiver em cache.
    Reduz tempo de cold-start de ~5-15s para <100ms em requisições subsequentes.
    """
    global _MODEL_CACHE, _MODEL_DEVICE
    
    if not DEMUCS_AVAILABLE:
        return None
    
    if model_name in _MODEL_CACHE:
        print(f"✓ Modelo '{model_name}' carregado do cache")
        return _MODEL_CACHE[model_name]
    
    print(f"⏳ Carregando modelo '{model_name}'... (primeira vez, pode demorar)")
    start_time = time.time()
    
    model = get_model(model_name)
    model.eval()
    
    # Detecta e configura dispositivo (GPU/CPU)
    if _MODEL_DEVICE is None:
        if torch.cuda.is_available():
            _MODEL_DEVICE = "cuda"
            gpu_name = torch.cuda.get_device_name(0)
            print(f"✓ GPU detectada: {gpu_name}")
        else:
            _MODEL_DEVICE = "cpu"
            print("⚠ GPU não disponível, usando CPU (mais lento)")
    
    device = torch.device(_MODEL_DEVICE)
    model.to(device)
    
    _MODEL_CACHE[model_name] = model
    load_time = time.time() - start_time
    print(f"✓ Modelo '{model_name}' carregado em {load_time:.1f}s")
    
    return model


def preload_models(models: list = None):
    """
    Pré-carrega modelos no startup para evitar cold-start.
    Chamado pelo app.py no evento de inicialização.
    """
    if not DEMUCS_AVAILABLE:
        print("⚠ Demucs não disponível, skip de pré-carregamento")
        return
    
    if models is None:
        models = ["htdemucs"]  # Modelo padrão
    
    print("="*50)
    print("INICIALIZANDO MODELOS DE SEPARAÇÃO DE INSTRUMENTOS")
    print("="*50)
    
    for model_name in models:
        try:
            get_cached_model(model_name)
        except Exception as e:
            print(f"⚠ Erro ao carregar '{model_name}': {e}")
    
    print("="*50)
    print("MODELOS PRONTOS - Sistema otimizado para transcrições rápidas")
    print("="*50)


def get_system_info() -> Dict:
    """Retorna informações sobre o hardware disponível"""
    info = {
        "demucs_available": DEMUCS_AVAILABLE,
        "spleeter_available": SPLEETER_AVAILABLE,
        "gpu_available": False,
        "gpu_name": None,
        "cached_models": list(_MODEL_CACHE.keys()),
        "device": _MODEL_DEVICE or "not_initialized"
    }
    
    if DEMUCS_AVAILABLE and torch and torch.cuda.is_available():
        info["gpu_available"] = True
        info["gpu_name"] = torch.cuda.get_device_name(0)
        info["gpu_memory_gb"] = torch.cuda.get_device_properties(0).total_memory / (1024**3)
    
    return info


class InstrumentSeparator:
    """
    Classe para separação de instrumentos usando Demucs (preferido) ou Spleeter (fallback).
    
    Suporta separação em:
    - 2 stems: vocals, accompaniment
    - 4 stems: vocals, drums, bass, other
    - 5 stems: vocals, drums, bass, piano, other (Spleeter) ou 6 stems no Demucs
    """
    
    # Mapeamento de instrumentos para stems
    INSTRUMENT_TO_STEM = {
        "vocals": ["vocals"],
        "guitar": ["other", "guitar"],  # Demucs htdemucs_6s tem guitar separado
        "piano": ["piano", "other"],
        "bass": ["bass"],
        "drums": ["drums"],
        "violin": ["other"],
        "flute": ["other"],
        "saxophone": ["other"],
        "other": ["other"],
    }
    
    def __init__(self, model: str = "htdemucs"):
        """
        Inicializa o separador.
        
        Args:
            model: Modelo Demucs a usar ("htdemucs", "htdemucs_ft", "htdemucs_6s")
        """
        self.model_name = model
        self.sr = 44100  # Sample rate padrão do Demucs
        self.separator = None
        self.output_dir = os.path.join(tempfile.gettempdir(), "sinfonia_separated")
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Inicializa separador disponível
        if DEMUCS_AVAILABLE:
            print("✓ Demucs disponível - usando separação de alta qualidade")
        elif SPLEETER_AVAILABLE:
            print("✓ Spleeter disponível - usando como alternativa")
            self.separator = SpleeterSeparator('spleeter:4stems')
        else:
            print("⚠ Nenhum separador disponível - usando separação por frequência")
    
    def separate(self, audio_path: str, target_instrument: Optional[str] = None) -> Dict[str, np.ndarray]:
        """
        Separa o áudio em diferentes instrumentos.
        
        Args:
            audio_path: Caminho para o arquivo de áudio
            target_instrument: Instrumento específico a isolar (opcional)
            
        Returns:
            Dicionário com arrays de áudio separados por instrumento
        """
        if DEMUCS_AVAILABLE:
            return self._separate_demucs(audio_path, target_instrument)
        elif SPLEETER_AVAILABLE:
            return self._separate_spleeter(audio_path, target_instrument)
        else:
            return self._separate_frequency(audio_path, target_instrument)
    
    def get_instrument_audio(self, audio_path: str, instrument: str) -> Tuple[np.ndarray, int]:
        """
        Obtém apenas o áudio do instrumento especificado.
        
        Args:
            audio_path: Caminho para o arquivo de áudio
            instrument: Nome do instrumento (guitar, piano, bass, drums, vocals, etc.)
            
        Returns:
            Tuple (audio_array, sample_rate)
        """
        separated = self.separate(audio_path, target_instrument=instrument)
        
        # Encontra o stem correspondente ao instrumento
        stems = self.INSTRUMENT_TO_STEM.get(instrument, ["other"])
        
        for stem in stems:
            if stem in separated:
                return separated[stem], self.sr
        
        # Se não encontrar o stem específico, retorna "other" ou o primeiro disponível
        if "other" in separated:
            return separated["other"], self.sr
        
        # Fallback: retorna o primeiro stem disponível
        first_key = list(separated.keys())[0]
        return separated[first_key], self.sr
    
    def _separate_demucs(self, audio_path: str, target_instrument: Optional[str] = None) -> Dict[str, np.ndarray]:
        """Separação usando Demucs (melhor qualidade) - OTIMIZADO com cache de modelo"""
        
        # Usa htdemucs_6s se precisar de piano/guitar separados
        use_6stems = target_instrument in ["piano", "guitar"]
        model_name = "htdemucs_6s" if use_6stems else self.model_name
        
        try:
            start_time = time.time()
            
            # Usa modelo do cache (evita recarregar ~800MB por requisição)
            model = get_cached_model(model_name)
            
            load_time = time.time() - start_time
            print(f"⏱ Modelo pronto em {load_time:.2f}s")
            
            # Carrega áudio com torchaudio (compatível com demucs 4.x)
            audio_start = time.time()
            wav, orig_sr = torchaudio.load(audio_path)
            # Resample se necessário
            if orig_sr != model.samplerate:
                wav = torchaudio.functional.resample(wav, orig_sr, model.samplerate)
            # Ajusta canais
            if wav.shape[0] == 1 and model.audio_channels == 2:
                wav = wav.expand(2, -1)
            elif wav.shape[0] > model.audio_channels:
                wav = wav[:model.audio_channels]
            print(f"⏱ Áudio carregado em {time.time() - audio_start:.2f}s")
            
            # Move áudio para mesmo dispositivo do modelo
            device = next(model.parameters()).device
            wav = wav.to(device)
            
            # Converte para fp16 se modelo está em fp16
            if next(model.parameters()).dtype == torch.float16:
                wav = wav.half()
            
            # Separa com otimizações
            sep_start = time.time()
            with torch.no_grad():
                # Usa autocast para mixed-precision em GPU (ainda mais rápido)
                if device.type == "cuda":
                    with torch.cuda.amp.autocast():
                        sources = model(wav[None])[0]
                else:
                    sources = model(wav[None])[0]
            
            print(f"⏱ Separação concluída em {time.time() - sep_start:.2f}s")
            
            # Converte para numpy (volta para fp32 se necessário)
            separated = {}
            for i, name in enumerate(model.sources):
                audio_data = sources[i].float().cpu().numpy()
                # Converte para mono se necessário
                if len(audio_data.shape) > 1:
                    audio_data = np.mean(audio_data, axis=0)
                separated[name] = audio_data
            
            total_time = time.time() - start_time
            print(f"✓ Processamento total Demucs: {total_time:.2f}s")
            
            return separated
            
        except Exception as e:
            print(f"Erro no Demucs: {e}, tentando Spleeter...")
            if SPLEETER_AVAILABLE:
                return self._separate_spleeter(audio_path, target_instrument)
            return self._separate_frequency(audio_path, target_instrument)
    
    def _separate_spleeter(self, audio_path: str, target_instrument: Optional[str] = None) -> Dict[str, np.ndarray]:
        """Separação usando Spleeter"""
        try:
            # Usa 5stems se precisar de piano
            if target_instrument == "piano":
                self.separator = SpleeterSeparator('spleeter:5stems')
            else:
                self.separator = SpleeterSeparator('spleeter:4stems')
            
            # Cria diretório de saída único
            output_path = os.path.join(self.output_dir, os.path.basename(audio_path).rsplit('.', 1)[0])
            
            # Separa
            self.separator.separate_to_file(audio_path, self.output_dir)
            
            # Carrega arquivos separados
            separated = {}
            for filename in os.listdir(output_path):
                if filename.endswith('.wav'):
                    stem_name = filename.replace('.wav', '')
                    audio, sr = librosa.load(os.path.join(output_path, filename), sr=self.sr)
                    separated[stem_name] = audio
            
            return separated
            
        except Exception as e:
            print(f"Erro no Spleeter: {e}")
            return self._separate_frequency(audio_path, target_instrument)
    
    def _separate_frequency(self, audio_path: str, target_instrument: Optional[str] = None) -> Dict[str, np.ndarray]:
        """
        Separação simples por faixas de frequência (fallback quando Demucs/Spleeter não disponíveis).
        Menos precisa, mas funciona sempre.
        """
        # Carrega áudio
        y, sr = librosa.load(audio_path, sr=self.sr)
        
        # STFT
        D = librosa.stft(y, n_fft=4096, hop_length=1024)
        magnitude = np.abs(D)
        phase = np.angle(D)
        
        # Frequências para cada bin
        freqs = librosa.fft_frequencies(sr=sr, n_fft=4096)
        
        # Máscaras de frequência para diferentes instrumentos
        # Bass: 20-200 Hz
        bass_mask = (freqs >= 20) & (freqs <= 200)
        
        # Drums: 20-500 Hz (graves) + transientes
        drums_low_mask = (freqs >= 20) & (freqs <= 500)
        
        # Mid instruments (guitar, piano, vocals): 200-4000 Hz
        mid_mask = (freqs >= 200) & (freqs <= 4000)
        
        # Vocals: 300-3400 Hz (faixa principal da voz humana)
        vocals_mask = (freqs >= 300) & (freqs <= 3400)
        
        # High (flute, violin harmonics): 2000-8000 Hz
        high_mask = (freqs >= 2000) & (freqs <= 8000)
        
        def apply_mask(mask):
            filtered = magnitude.copy()
            filtered[~mask, :] = 0
            return librosa.istft(filtered * np.exp(1j * phase), hop_length=1024)
        
        separated = {
            "bass": apply_mask(bass_mask),
            "drums": apply_mask(drums_low_mask),
            "vocals": apply_mask(vocals_mask),
            "other": apply_mask(mid_mask),
        }
        
        # Adiciona instrumentos derivados
        separated["guitar"] = apply_mask(mid_mask)
        separated["piano"] = apply_mask(mid_mask)
        
        return separated
    
    def identify_instrument_characteristics(self, audio: np.ndarray, sr: int) -> Dict:
        """Identifica características espectrais do áudio (útil para classificação)"""
        
        # Centroide espectral (brilho)
        centroid = np.mean(librosa.feature.spectral_centroid(y=audio, sr=sr))
        
        # Rolloff (frequência abaixo da qual está 85% da energia)
        rolloff = np.mean(librosa.feature.spectral_rolloff(y=audio, sr=sr))
        
        # Zero crossing rate (transientes)
        zcr = np.mean(librosa.feature.zero_crossing_rate(audio))
        
        # MFCC (timbre)
        mfcc = np.mean(librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13), axis=1)
        
        # RMS (energia)
        rms = np.mean(librosa.feature.rms(y=audio))
        
        # Bandwidth espectral
        bandwidth = np.mean(librosa.feature.spectral_bandwidth(y=audio, sr=sr))
        
        # Classifica o instrumento estimado
        instrument_type = self._classify_instrument(centroid, rolloff, zcr, bandwidth)
        
        return {
            'spectral_centroid': float(centroid),
            'spectral_rolloff': float(rolloff),
            'zero_crossing_rate': float(zcr),
            'spectral_bandwidth': float(bandwidth),
            'rms_energy': float(rms),
            'mfcc': mfcc.tolist(),
            'estimated_instrument': instrument_type
        }
    
    def _classify_instrument(self, centroid: float, rolloff: float, zcr: float, bandwidth: float) -> str:
        """Classifica instrumento baseado em características espectrais"""
        
        # Classificação heurística baseada em características espectrais
        if centroid < 800 and zcr < 0.05:
            return "bass"
        elif zcr > 0.15 and bandwidth > 3000:
            return "drums"
        elif centroid > 2000 and zcr < 0.08:
            return "vocals"
        elif centroid > 1500 and centroid < 3000:
            return "guitar"
        elif centroid > 1000 and zcr < 0.06:
            return "piano"
        elif centroid > 3000:
            return "flute/violin"
        else:
            return "other"
    
    def cleanup(self):
        """Limpa arquivos temporários"""
        import shutil
        if os.path.exists(self.output_dir):
            shutil.rmtree(self.output_dir)
            os.makedirs(self.output_dir, exist_ok=True)
