"""
Módulo de detecção de pitch e extração de notas musicais
Usa Librosa para análise de frequência fundamental (F0)
"""

import numpy as np
import librosa
from typing import List, Dict, Tuple, Optional
from collections import Counter


class PitchDetector:
    """
    Detecta pitch (frequência fundamental) e extrai notas musicais de áudio.
    
    Suporta múltiplos métodos de detecção:
    - PYIN: Robusto para instrumentos melódicos
    - YIN: Rápido, bom para tempo real
    - CQT: Bom para múltiplas notas (acordes)
    """
    
    # Nomes das notas
    NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    # Frequência de referência (A4 = 440 Hz)
    A4_FREQ = 440.0
    A4_MIDI = 69
    
    def __init__(self, sr: int = 22050, hop_length: int = 512, fmin: float = 65.41, fmax: float = 2093.0):
        """
        Inicializa o detector de pitch.
        
        Args:
            sr: Sample rate
            hop_length: Hop length para análise (afeta resolução temporal)
            fmin: Frequência mínima (padrão: C2 = 65.41 Hz)
            fmax: Frequência máxima (padrão: C7 = 2093 Hz)
        """
        self.sr = sr
        self.hop_length = hop_length
        self.fmin = fmin
        self.fmax = fmax
    
    def freq_to_note(self, freq: float) -> Tuple[Optional[str], Optional[int], Optional[float]]:
        """
        Converte frequência em nota musical.
        
        Args:
            freq: Frequência em Hz
            
        Returns:
            Tuple (nome_da_nota, oitava, cents_offset)
        """
        if freq <= 0 or np.isnan(freq):
            return None, None, None
        
        # Calcula número MIDI
        midi_num = 12 * np.log2(freq / self.A4_FREQ) + self.A4_MIDI
        
        # Nota mais próxima
        midi_round = int(round(midi_num))
        
        # Calcula offset em cents (-50 a +50)
        cents = (midi_num - midi_round) * 100
        
        # Extrai nota e oitava
        note_index = midi_round % 12
        octave = (midi_round // 12) - 1
        
        note_name = self.NOTE_NAMES[note_index]
        
        return f"{note_name}{octave}", octave, cents
    
    def note_to_freq(self, note: str) -> float:
        """Converte nota musical para frequência"""
        return librosa.note_to_hz(note)
    
    def detect_pitch_pyin(self, audio: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Detecta pitch usando PYIN (Probabilistic YIN).
        Mais robusto que YIN, melhor para notas sustentadas.
        
        Returns:
            Tuple (f0, voiced_flag, voiced_probs)
        """
        f0, voiced_flag, voiced_probs = librosa.pyin(
            audio,
            fmin=self.fmin,
            fmax=self.fmax,
            sr=self.sr,
            hop_length=self.hop_length
        )
        return f0, voiced_flag, voiced_probs
    
    def detect_pitch_yin(self, audio: np.ndarray) -> np.ndarray:
        """
        Detecta pitch usando YIN (mais rápido que PYIN).
        Bom para processamento em tempo real.
        """
        f0 = librosa.yin(
            audio,
            fmin=self.fmin,
            fmax=self.fmax,
            sr=self.sr,
            hop_length=self.hop_length
        )
        return f0
    
    def detect_pitch_cqt(self, audio: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Detecta pitch usando CQT (Constant-Q Transform).
        Útil para detectar múltiplas notas simultaneamente (acordes).
        
        Returns:
            Tuple (pitch_frequencies, magnitudes)
        """
        C = librosa.cqt(
            audio, 
            sr=self.sr, 
            hop_length=self.hop_length,
            fmin=librosa.note_to_hz('C2')
        )
        magnitude = np.abs(C)
        
        # Frequências CQT
        freqs = librosa.cqt_frequencies(C.shape[0], fmin=librosa.note_to_hz('C2'))
        
        # Para cada frame, encontra as frequências dominantes
        pitch = np.zeros(C.shape[1])
        for i in range(C.shape[1]):
            frame_mag = magnitude[:, i]
            if np.max(frame_mag) > 0.01:  # Threshold de silêncio
                pitch[i] = freqs[np.argmax(frame_mag)]
        
        return pitch, magnitude
    
    def extract_notes(self, audio: np.ndarray, min_duration: float = 0.05, 
                      min_confidence: float = 0.5) -> List[Dict]:
        """
        Extrai notas individuais do áudio com timing e intensidade.
        
        Args:
            audio: Array de áudio
            min_duration: Duração mínima da nota em segundos
            min_confidence: Confiança mínima para aceitar nota
            
        Returns:
            Lista de dicionários com informações das notas
        """
        if len(audio) < self.sr * 0.1:  # Menos de 100ms
            return []
        
        # Normaliza áudio
        audio = audio / (np.max(np.abs(audio)) + 1e-8)
        
        # Detecta onsets (início de notas)
        onset_frames = librosa.onset.onset_detect(
            y=audio, 
            sr=self.sr,
            hop_length=self.hop_length,
            units='frames',
            backtrack=True
        )
        
        # Converte para samples
        onset_samples = librosa.frames_to_samples(onset_frames, hop_length=self.hop_length)
        
        # Adiciona início e fim do áudio
        if len(onset_samples) == 0:
            onset_samples = np.array([0])
        if onset_samples[0] != 0:
            onset_samples = np.insert(onset_samples, 0, 0)
        onset_samples = np.append(onset_samples, len(audio))
        
        # Detecta pitch do áudio completo
        f0, voiced_flag, voiced_probs = self.detect_pitch_pyin(audio)
        
        notes = []
        
        for i in range(len(onset_samples) - 1):
            start_sample = onset_samples[i]
            end_sample = onset_samples[i + 1]
            
            duration = (end_sample - start_sample) / self.sr
            
            # Ignora notas muito curtas
            if duration < min_duration:
                continue
            
            # Extrai segmento
            segment = audio[start_sample:end_sample]
            
            # Frames correspondentes a este segmento
            start_frame = librosa.samples_to_frames(start_sample, hop_length=self.hop_length)
            end_frame = librosa.samples_to_frames(end_sample, hop_length=self.hop_length)
            end_frame = min(end_frame, len(f0))
            
            if start_frame >= end_frame:
                continue
            
            # Extrai pitch do segmento
            segment_f0 = f0[start_frame:end_frame]
            segment_probs = voiced_probs[start_frame:end_frame]
            
            # Filtra valores válidos (não-NaN e com alta probabilidade)
            valid_mask = ~np.isnan(segment_f0) & (segment_probs > min_confidence)
            valid_f0 = segment_f0[valid_mask]
            
            if len(valid_f0) == 0:
                continue
            
            # Usa a frequência mediana (mais robusta que média)
            pitch = float(np.median(valid_f0))
            
            # Converte para nota
            note_name, octave, cents = self.freq_to_note(pitch)
            
            if note_name is None:
                continue
            
            # Calcula intensidade (RMS do segmento)
            intensity = float(np.sqrt(np.mean(segment ** 2)))
            
            # Confiança média
            confidence = float(np.mean(segment_probs[valid_mask]))
            
            notes.append({
                'note': note_name,
                'frequency': pitch,
                'duration': round(duration, 3),
                'intensity': round(intensity, 4),
                'start_time': round(start_sample / self.sr, 3),
                'end_time': round(end_sample / self.sr, 3),
                'cents_offset': round(cents, 1) if cents else 0,
                'confidence': round(confidence, 2),
                'octave': octave
            })
        
        return notes
    
    def extract_chords(self, audio: np.ndarray, min_duration: float = 0.1) -> List[Dict]:
        """
        Detecta acordes (múltiplas notas simultâneas) usando CQT.
        """
        # Usa CQT para detectar múltiplas frequências
        pitch, magnitude = self.detect_pitch_cqt(audio)
        
        # Frequências CQT
        cqt_freqs = librosa.cqt_frequencies(magnitude.shape[0], fmin=librosa.note_to_hz('C2'))
        
        chords = []
        current_chord = []
        chord_start = 0
        
        for frame_idx in range(magnitude.shape[1]):
            frame_mag = magnitude[:, frame_idx]
            
            # Encontra picos (frequências dominantes)
            threshold = np.max(frame_mag) * 0.3
            peaks = np.where(frame_mag > threshold)[0]
            
            # Converte para notas
            frame_notes = []
            for peak_idx in peaks[:6]:  # Máximo 6 notas por acorde
                freq = cqt_freqs[peak_idx]
                note_name, _, _ = self.freq_to_note(freq)
                if note_name:
                    frame_notes.append(note_name)
            
            # Verifica se é mesmo acorde ou novo
            frame_notes_set = set(frame_notes)
            if frame_notes_set != set(current_chord):
                # Salva acorde anterior se válido
                if current_chord and (frame_idx - chord_start) > min_duration * self.sr / self.hop_length:
                    chords.append({
                        'notes': list(set(current_chord)),
                        'start_time': chord_start * self.hop_length / self.sr,
                        'end_time': frame_idx * self.hop_length / self.sr
                    })
                
                current_chord = frame_notes
                chord_start = frame_idx
        
        return chords
    
    def smooth_pitch(self, pitch: np.ndarray, window_size: int = 5) -> np.ndarray:
        """Suaviza a curva de pitch para remover ruído"""
        # Substitui NaN por 0 temporariamente
        pitch_clean = np.nan_to_num(pitch, nan=0)
        
        # Aplica filtro de média móvel
        kernel = np.ones(window_size) / window_size
        smoothed = np.convolve(pitch_clean, kernel, mode='same')
        
        # Restaura NaN onde havia zeros
        smoothed[pitch_clean == 0] = np.nan
        
        return smoothed
    
    def get_key_signature(self, notes: List[Dict]) -> Dict:
        """
        Estima a tonalidade baseado nas notas detectadas.
        """
        if not notes:
            return {"key": "C", "mode": "major", "confidence": 0}
        
        # Conta ocorrências de cada nota (sem oitava)
        note_counts = Counter()
        for note in notes:
            note_name = note['note'][:-1]  # Remove número da oitava
            note_counts[note_name] += 1
        
        # Perfis de tonalidade (Krumhansl-Schmuckler)
        major_profile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
        minor_profile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
        
        best_key = "C"
        best_mode = "major"
        best_correlation = -1
        
        for key_idx, key_name in enumerate(self.NOTE_NAMES):
            # Rotaciona perfil para esta tonalidade
            major_rotated = major_profile[-key_idx:] + major_profile[:-key_idx]
            minor_rotated = minor_profile[-key_idx:] + minor_profile[:-key_idx]
            
            # Constrói vetor de contagens alinhado
            count_vector = [note_counts.get(self.NOTE_NAMES[i], 0) for i in range(12)]
            
            # Correlação com perfil major
            if sum(count_vector) > 0:
                major_corr = np.corrcoef(count_vector, major_rotated)[0, 1]
                minor_corr = np.corrcoef(count_vector, minor_rotated)[0, 1]
                
                if major_corr > best_correlation:
                    best_correlation = major_corr
                    best_key = key_name
                    best_mode = "major"
                
                if minor_corr > best_correlation:
                    best_correlation = minor_corr
                    best_key = key_name
                    best_mode = "minor"
        
        return {
            "key": best_key,
            "mode": best_mode,
            "confidence": round(best_correlation, 2) if best_correlation > 0 else 0
        }
    
    def get_tempo(self, audio: np.ndarray) -> Tuple[float, np.ndarray]:
        """
        Estima o tempo (BPM) do áudio.
        
        Returns:
            Tuple (tempo_bpm, beat_times)
        """
        tempo, beat_frames = librosa.beat.beat_track(y=audio, sr=self.sr)
        beat_times = librosa.frames_to_time(beat_frames, sr=self.sr)
        
        return float(tempo), beat_times
