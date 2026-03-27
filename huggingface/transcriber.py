"""
Módulo principal de transcrição musical
Orquestra separação de instrumentos + detecção de notas
"""

import numpy as np
from typing import Dict, List, Optional, Any
from audio_processor import AudioProcessor
from pitch_detector import PitchDetector
from instrument_separator import InstrumentSeparator


class MusicTranscriber:
    """
    Pipeline completo de transcrição musical.
    
    Responsabilidades:
    1. Carregar e pré-processar áudio
    2. Separar instrumento selecionado (se necessário)
    3. Detectar notas do instrumento isolado
    4. Gerar estatísticas e metadados
    """
    
    def __init__(self, sr: int = 22050):
        """
        Inicializa o transcritor.
        
        Args:
            sr: Sample rate para processamento (22050 é bom para análise)
        """
        self.sr = sr
        self.audio_processor = AudioProcessor(sr=sr)
        self.pitch_detector = PitchDetector(sr=sr)
        self.separator = InstrumentSeparator(model="htdemucs")
    
    def transcribe_instrument(self, file_path: str, target_instrument: str, 
                              separate: bool = True) -> Dict[str, Any]:
        """
        Pipeline principal: transcreve um instrumento específico de um áudio.
        
        Args:
            file_path: Caminho para o arquivo de áudio
            target_instrument: Instrumento a transcrever (guitar, piano, bass, drums, vocals, etc.)
            separate: Se True, isola o instrumento antes de transcrever
            
        Returns:
            Dicionário com notas, duração, estatísticas, etc.
        """
        result = {
            "file": file_path,
            "instrument": target_instrument,
            "notes": [],
            "duration": 0,
            "sample_rate": self.sr,
            "statistics": {}
        }
        
        try:
            # 1. Carrega áudio original
            audio, sr = self.audio_processor.load_audio(file_path)
            audio = self.audio_processor.normalize_audio(audio)
            result["duration"] = len(audio) / sr
            
            # 2. Separa instrumento (se solicitado)
            if separate and target_instrument != "other":
                try:
                    instrument_audio, _ = self.separator.get_instrument_audio(file_path, target_instrument)
                    
                    # Reamostra se necessário
                    if len(instrument_audio) > 0:
                        # Reamostra para o sample rate de análise
                        import librosa
                        instrument_audio = librosa.resample(
                            instrument_audio, 
                            orig_sr=self.separator.sr, 
                            target_sr=self.sr
                        )
                        audio = self.audio_processor.normalize_audio(instrument_audio)
                except Exception as e:
                    print(f"Aviso: Não foi possível separar instrumento: {e}")
                    print("Usando áudio completo...")
            
            # 3. Extrai notas
            notes = self.pitch_detector.extract_notes(audio)
            result["notes"] = notes
            
            # 4. Calcula estatísticas
            result["statistics"] = self._calculate_statistics(notes, audio)
            
            # 5. Detecta tonalidade e tempo
            key_info = self.pitch_detector.get_key_signature(notes)
            tempo, _ = self.pitch_detector.get_tempo(audio)
            
            result["key"] = key_info
            result["tempo"] = tempo
            
        except Exception as e:
            result["error"] = str(e)
            print(f"Erro na transcrição: {e}")
        
        return result
    
    def transcribe_file(self, file_path: str, separate_instruments: bool = True) -> Dict[str, Any]:
        """
        Transcreve arquivo completo (todos os instrumentos).
        Mantido para compatibilidade.
        """
        return self.transcribe_instrument(file_path, "other", separate=separate_instruments)
    
    def analyze_audio(self, file_path: str) -> Dict[str, Any]:
        """
        Analisa áudio e retorna informações gerais.
        Útil para preview antes de transcrever.
        """
        # Carrega áudio
        audio, sr = self.audio_processor.load_audio(file_path)
        audio = self.audio_processor.normalize_audio(audio)
        
        # Extrai features
        features = self.audio_processor.extract_features(audio)
        
        # Detecta tempo
        tempo, _ = self.pitch_detector.get_tempo(audio)
        
        # Tenta detectar instrumentos presentes
        detected_instruments = self._detect_present_instruments(audio, features)
        
        # Extrai algumas notas para amostragem
        sample_notes = self.pitch_detector.extract_notes(audio[:min(len(audio), self.sr * 10)])  # Primeiros 10s
        key_info = self.pitch_detector.get_key_signature(sample_notes)
        
        return {
            "duration": len(audio) / sr,
            "sample_rate": sr,
            "tempo": tempo,
            "key": key_info.get("key", "C") + " " + key_info.get("mode", "major"),
            "detected_instruments": detected_instruments,
            "spectral_centroid_mean": float(np.mean(features.get("spectral_centroid", [0]))),
            "sample_notes_count": len(sample_notes)
        }
    
    def _detect_present_instruments(self, audio: np.ndarray, features: Dict) -> List[str]:
        """
        Detecta quais instrumentos provavelmente estão presentes no áudio.
        Baseado em características espectrais.
        """
        instruments = []
        
        # Características
        centroid = np.mean(features.get("spectral_centroid", [1000]))
        zcr = np.mean(features.get("zero_crossing_rate", [0.05]))
        
        # Heurísticas simples
        if centroid < 1000:
            instruments.append("bass")
        if zcr > 0.1:
            instruments.append("drums")
        if 1000 < centroid < 3000:
            instruments.append("guitar")
            instruments.append("piano")
        if 800 < centroid < 3500:
            instruments.append("vocals")
        if centroid > 2500:
            instruments.append("violin")
            instruments.append("flute")
        
        # Sempre inclui "other" como fallback
        if not instruments:
            instruments = ["other"]
        
        return instruments
    
    def _calculate_statistics(self, notes: List[Dict], audio: np.ndarray) -> Dict[str, Any]:
        """
        Calcula estatísticas das notas extraídas.
        """
        if not notes:
            return {
                "total_notes": 0,
                "message": "Nenhuma nota detectada"
            }
        
        frequencies = [n["frequency"] for n in notes if "frequency" in n]
        durations = [n["duration"] for n in notes if "duration" in n]
        intensities = [n["intensity"] for n in notes if "intensity" in n]
        
        # Encontra nota mais comum
        from collections import Counter
        note_names = [n["note"] for n in notes if "note" in n]
        note_counts = Counter(note_names)
        most_common = note_counts.most_common(1)
        
        return {
            "total_notes": len(notes),
            "avg_frequency": round(float(np.mean(frequencies)), 2) if frequencies else 0,
            "min_frequency": round(float(np.min(frequencies)), 2) if frequencies else 0,
            "max_frequency": round(float(np.max(frequencies)), 2) if frequencies else 0,
            "avg_duration": round(float(np.mean(durations)), 3) if durations else 0,
            "total_duration": round(float(np.sum(durations)), 2) if durations else 0,
            "avg_intensity": round(float(np.mean(intensities)), 4) if intensities else 0,
            "most_common_note": most_common[0][0] if most_common else None,
            "unique_notes": len(set(note_names))
        }
    
    def get_statistics(self, transcription: Dict) -> Dict:
        """
        Calcula estatísticas de uma transcrição.
        Mantido para compatibilidade.
        """
        return transcription.get("statistics", self._calculate_statistics(transcription.get("notes", []), np.array([])))
