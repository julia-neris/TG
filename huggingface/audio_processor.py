"""
Módulo de processamento de áudio
Carregamento, normalização e extração de features
"""

import numpy as np
import librosa
import soundfile as sf
from typing import Tuple, Dict, List, Optional
import os


class AudioProcessor:
    """
    Processa arquivos de áudio para análise.
    
    Responsabilidades:
    - Carregar áudio de diferentes formatos
    - Normalizar e pré-processar
    - Extrair features espectrais
    """
    
    SUPPORTED_FORMATS = {'.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.wma', '.aiff'}
    
    def __init__(self, sr: int = 22050):
        """
        Inicializa o processador.
        
        Args:
            sr: Sample rate alvo (22050 é bom para análise de música)
        """
        self.sr = sr
    
    def load_audio(self, file_path: str, mono: bool = True) -> Tuple[np.ndarray, int]:
        """
        Carrega arquivo de áudio.
        
        Args:
            file_path: Caminho para o arquivo
            mono: Se True, converte para mono
            
        Returns:
            Tuple (audio_array, sample_rate)
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Arquivo não encontrado: {file_path}")
        
        ext = os.path.splitext(file_path)[1].lower()
        if ext not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Formato não suportado: {ext}")
        
        try:
            # Librosa é mais robusto para diferentes formatos
            y, sr = librosa.load(file_path, sr=self.sr, mono=mono)
            return y, sr
        except Exception as e:
            # Fallback para soundfile
            try:
                data, sr = sf.read(file_path)
                if mono and len(data.shape) > 1:
                    data = np.mean(data, axis=1)
                # Reamostra se necessário
                if sr != self.sr:
                    data = librosa.resample(data, orig_sr=sr, target_sr=self.sr)
                    sr = self.sr
                return data, sr
            except Exception as e2:
                raise RuntimeError(f"Não foi possível carregar o áudio: {e}, {e2}")
    
    def extract_features(self, audio: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Extrai features espectrais do áudio.
        
        Retorna:
            Dicionário com STFT, mel-spectrogram, centroide, etc.
        """
        features = {}
        
        # STFT para análise de frequência
        D = librosa.stft(audio, n_fft=2048, hop_length=512)
        features['stft'] = np.abs(D)
        
        # Mel-spectrogram (mais próximo da percepção humana)
        S = librosa.feature.melspectrogram(y=audio, sr=self.sr, n_mels=128, hop_length=512)
        features['mel_spectrogram'] = librosa.power_to_db(S, ref=np.max)
        
        # Centroide espectral (brilho)
        features['spectral_centroid'] = librosa.feature.spectral_centroid(y=audio, sr=self.sr, hop_length=512)[0]
        
        # Rolloff espectral (frequência abaixo da qual está 85% da energia)
        features['spectral_rolloff'] = librosa.feature.spectral_rolloff(y=audio, sr=self.sr, hop_length=512)[0]
        
        # Bandwidth espectral
        features['spectral_bandwidth'] = librosa.feature.spectral_bandwidth(y=audio, sr=self.sr, hop_length=512)[0]
        
        # Zero crossing rate (transientes)
        features['zero_crossing_rate'] = librosa.feature.zero_crossing_rate(audio, hop_length=512)[0]
        
        # MFCC (características timbrais)
        features['mfcc'] = librosa.feature.mfcc(y=audio, sr=self.sr, n_mfcc=13, hop_length=512)
        
        # RMS (energia/volume)
        features['rms'] = librosa.feature.rms(y=audio, hop_length=512)[0]
        
        # Chroma (distribuição de notas)
        features['chroma'] = librosa.feature.chroma_stft(y=audio, sr=self.sr, hop_length=512)
        
        return features
    
    def segment_audio(self, audio: np.ndarray, onset_frames: np.ndarray, 
                      hop_length: int = 512) -> List[np.ndarray]:
        """
        Segmenta áudio baseado em frames de onset.
        
        Args:
            audio: Array de áudio
            onset_frames: Frames onde notas começam
            hop_length: Hop length usado na análise
            
        Returns:
            Lista de segmentos de áudio
        """
        # Converte frames para samples
        onset_samples = librosa.frames_to_samples(onset_frames, hop_length=hop_length)
        
        segments = []
        for i in range(len(onset_samples)):
            start = onset_samples[i]
            end = onset_samples[i + 1] if i < len(onset_samples) - 1 else len(audio)
            segment = audio[start:end]
            if len(segment) > 0:
                segments.append(segment)
        
        return segments
    
    def normalize_audio(self, audio: np.ndarray) -> np.ndarray:
        """
        Normaliza áudio para amplitude máxima de 1.0.
        """
        max_val = np.max(np.abs(audio))
        if max_val > 0:
            return audio / max_val
        return audio
    
    def remove_silence(self, audio: np.ndarray, top_db: int = 30) -> np.ndarray:
        """
        Remove silêncio do início e fim do áudio.
        
        Args:
            audio: Array de áudio
            top_db: Threshold em dB para considerar silêncio
            
        Returns:
            Áudio sem silêncio nas bordas
        """
        trimmed, _ = librosa.effects.trim(audio, top_db=top_db)
        return trimmed
    
    def split_on_silence(self, audio: np.ndarray, top_db: int = 30, 
                         min_silence_len: float = 0.3) -> List[np.ndarray]:
        """
        Divide áudio em segmentos baseado em silêncio.
        
        Args:
            audio: Array de áudio
            top_db: Threshold para silêncio
            min_silence_len: Duração mínima de silêncio (segundos)
            
        Returns:
            Lista de segmentos não-silenciosos
        """
        # Encontra intervalos não-silenciosos
        intervals = librosa.effects.split(audio, top_db=top_db)
        
        # Filtra por duração mínima
        min_samples = int(min_silence_len * self.sr)
        segments = []
        
        for start, end in intervals:
            if end - start > min_samples:
                segments.append(audio[start:end])
        
        return segments
    
    def get_duration(self, audio: np.ndarray) -> float:
        """Retorna duração do áudio em segundos"""
        return len(audio) / self.sr
    
    def resample(self, audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
        """
        Reamostra áudio para novo sample rate.
        """
        return librosa.resample(audio, orig_sr=orig_sr, target_sr=target_sr)
    
    def convert_stereo_to_mono(self, audio: np.ndarray) -> np.ndarray:
        """
        Converte áudio estéreo para mono.
        """
        if len(audio.shape) > 1:
            return np.mean(audio, axis=0)
        return audio
    
    def apply_lowpass_filter(self, audio: np.ndarray, cutoff_hz: float) -> np.ndarray:
        """
        Aplica filtro passa-baixa.
        
        Args:
            audio: Array de áudio
            cutoff_hz: Frequência de corte em Hz
        """
        from scipy.signal import butter, filtfilt
        
        nyquist = self.sr / 2
        normalized_cutoff = cutoff_hz / nyquist
        b, a = butter(4, normalized_cutoff, btype='low')
        
        return filtfilt(b, a, audio)
    
    def apply_highpass_filter(self, audio: np.ndarray, cutoff_hz: float) -> np.ndarray:
        """
        Aplica filtro passa-alta.
        
        Args:
            audio: Array de áudio
            cutoff_hz: Frequência de corte em Hz
        """
        from scipy.signal import butter, filtfilt
        
        nyquist = self.sr / 2
        normalized_cutoff = cutoff_hz / nyquist
        b, a = butter(4, normalized_cutoff, btype='high')
        
        return filtfilt(b, a, audio)
    
    def save_audio(self, audio: np.ndarray, file_path: str, sr: Optional[int] = None) -> str:
        """
        Salva áudio em arquivo.
        
        Args:
            audio: Array de áudio
            file_path: Caminho de saída
            sr: Sample rate (usa self.sr se não especificado)
            
        Returns:
            Caminho do arquivo salvo
        """
        sr = sr or self.sr
        sf.write(file_path, audio, sr)
        return file_path
