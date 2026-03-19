import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Language = "pt" | "en" | "es";

interface Translations {
  [key: string]: {
    pt: string;
    en: string;
    es: string;
  };
}

// Todas as traduções do sistema
const translations: Translations = {
  // Header & Navigation
  "nav.home": { pt: "Início", en: "Home", es: "Inicio" },
  "nav.transcribe": { pt: "Transcrever", en: "Transcribe", es: "Transcribir" },
  "nav.history": { pt: "Histórico", en: "History", es: "Historial" },
  "nav.start": { pt: "Começar Agora", en: "Start Now", es: "Comenzar Ahora" },
  "nav.logout": { pt: "Sair", en: "Logout", es: "Cerrar Sesión" },
  "nav.login": { pt: "Entrar", en: "Login", es: "Iniciar Sesión" },
  
  // Auth
  "auth.subtitle": { pt: "Entre para acessar o sistema de transcrição", en: "Sign in to access the transcription system", es: "Inicia sesión para acceder al sistema de transcripción" },
  "auth.login": { pt: "Entrar", en: "Login", es: "Iniciar Sesión" },
  "auth.signup": { pt: "Cadastrar", en: "Sign Up", es: "Registrarse" },
  "auth.email": { pt: "E-mail", en: "Email", es: "Correo" },
  "auth.password": { pt: "Senha", en: "Password", es: "Contraseña" },
  "auth.loginButton": { pt: "Entrar", en: "Sign In", es: "Iniciar Sesión" },
  "auth.signupButton": { pt: "Criar Conta", en: "Create Account", es: "Crear Cuenta" },
  "auth.loading": { pt: "Carregando...", en: "Loading...", es: "Cargando..." },
  "auth.error": { pt: "Erro de autenticação", en: "Authentication error", es: "Error de autenticación" },
  "auth.invalidCredentials": { pt: "E-mail ou senha inválidos", en: "Invalid email or password", es: "Correo o contraseña inválidos" },
  "auth.alreadyRegistered": { pt: "Este e-mail já está cadastrado", en: "This email is already registered", es: "Este correo ya está registrado" },
  "auth.welcomeBack": { pt: "Bem-vindo de volta!", en: "Welcome back!", es: "¡Bienvenido de vuelta!" },
  "auth.accountCreated": { pt: "Conta criada!", en: "Account created!", es: "¡Cuenta creada!" },
  "auth.welcomeNew": { pt: "Bem-vindo ao SinfonIA!", en: "Welcome to SinfonIA!", es: "¡Bienvenido a SinfonIA!" },
  
  // Index Page
  "index.hero.title.prefix": { pt: "Transforme Áudio em", en: "Transform Audio into", es: "Transforma Audio en" },
  "index.hero.title.highlight": { pt: "Partitura", en: "Sheet Music", es: "Partitura" },
  "index.hero.title": { pt: "Transforme Áudio em Partitura", en: "Transform Audio into Sheet Music", es: "Transforma Audio en Partitura" },
  "index.hero.subtitle": { pt: "Sistema inteligente de transcrição musical", en: "Intelligent music transcription system", es: "Sistema inteligente de transcripción musical" },
  "index.hero.cta": { pt: "Iniciar Transcrição", en: "Start Transcription", es: "Iniciar Transcripción" },
  "index.features.title": { pt: "Como Funciona", en: "How It Works", es: "Cómo Funciona" },
  "index.feature1.title": { pt: "Upload ou Gravação", en: "Upload or Record", es: "Subir o Grabar" },
  "index.feature1.desc": { pt: "Envie um arquivo MP3/WAV ou grave diretamente pelo microfone", en: "Upload an MP3/WAV file or record directly with your microphone", es: "Sube un archivo MP3/WAV o graba directamente con tu micrófono" },
  "index.feature2.title": { pt: "Análise de Notação", en: "Notation Analysis", es: "Análisis de Notación" },
  "index.feature2.desc": { pt: "Identificação das notas musicais por sua frequência", en: "Musical note identification by frequency", es: "Identificación de notas musicales por su frecuencia" },
  "index.feature3.title": { pt: "Partitura & Exportação", en: "Sheet Music & Export", es: "Partitura y Exportación" },
  "index.feature3.desc": { pt: "Visualize a partitura e exporte em diversos formatos", en: "View the sheet music and export in various formats", es: "Visualiza la partitura y exporta en varios formatos" },
  
  // Transcribe Page
  "transcribe.title": { pt: "Transcrição Musical", en: "Music Transcription", es: "Transcripción Musical" },
  "transcribe.subtitle": { pt: "Envie um áudio ou grave diretamente para obter a transcrição", en: "Upload an audio file or record directly to get the transcription", es: "Sube un audio o graba directamente para obtener la transcripción" },
  "transcribe.upload.tab": { pt: "Upload de Arquivo", en: "File Upload", es: "Subir Archivo" },
  "transcribe.record.tab": { pt: "Gravar Áudio", en: "Record Audio", es: "Grabar Audio" },
  "transcribe.button": { pt: "Transcrever Áudio", en: "Transcribe Audio", es: "Transcribir Audio" },
  "transcribe.noAudio": { pt: "Envie ou grave um áudio para habilitar a transcrição", en: "Upload or record audio to enable transcription", es: "Sube o graba un audio para habilitar la transcripción" },
  "transcribe.result.title": { pt: "Resultado da Transcrição", en: "Transcription Result", es: "Resultado de la Transcripción" },
  "transcribe.newTranscription": { pt: "Nova Transcrição", en: "New Transcription", es: "Nueva Transcripción" },
  "transcribe.fastMode": { pt: "Modo Rápido", en: "Fast Mode", es: "Modo Rápido" },
  "transcribe.fastMode.desc": { pt: "Pula separação de instrumentos (ideal para solos)", en: "Skip instrument separation (ideal for solos)", es: "Omite separación de instrumentos (ideal para solos)" },
  "transcribe.fullMode": { pt: "Modo Completo", en: "Full Mode", es: "Modo Completo" },
  "transcribe.fullMode.desc": { pt: "Separa instrumentos antes de transcrever (mais preciso para mixes)", en: "Separates instruments before transcribing (more accurate for mixes)", es: "Separa instrumentos antes de transcribir (más preciso para mezclas)" },
  
  // Audio Uploader
  "uploader.drag": { pt: "Arraste seu arquivo de áudio aqui", en: "Drag your audio file here", es: "Arrastra tu archivo de audio aquí" },
  "uploader.drop": { pt: "Solte o arquivo aqui", en: "Drop the file here", es: "Suelta el archivo aquí" },
  "uploader.click": { pt: "ou clique para selecionar", en: "or click to select", es: "o haz clic para seleccionar" },
  "uploader.supported": { pt: "Formatos suportados: MP3, WAV (máx. 20MB)", en: "Supported formats: MP3, WAV (max. 20MB)", es: "Formatos soportados: MP3, WAV (máx. 20MB)" },
  "uploader.or": { pt: "ou", en: "or", es: "o" },
  "uploader.browse": { pt: "Escolher Arquivo", en: "Choose File", es: "Elegir Archivo" },
  "uploader.formats": { pt: "Formatos aceitos: MP3, WAV, M4A, OGG", en: "Accepted formats: MP3, WAV, M4A, OGG", es: "Formatos aceptados: MP3, WAV, M4A, OGG" },
  "uploader.selected": { pt: "Arquivo selecionado", en: "Selected file", es: "Archivo seleccionado" },
  "uploader.remove": { pt: "Remover arquivo", en: "Remove file", es: "Eliminar archivo" },
  
  // Audio Recorder
  "recorder.start": { pt: "Iniciar Gravação", en: "Start Recording", es: "Iniciar Grabación" },
  "recorder.stop": { pt: "Parar Gravação", en: "Stop Recording", es: "Detener Grabación" },
  "recorder.recording": { pt: "Gravando...", en: "Recording...", es: "Grabando..." },
  "recorder.permission": { pt: "Clique para permitir acesso ao microfone", en: "Click to allow microphone access", es: "Haz clic para permitir el acceso al micrófono" },
  "recorder.accessing": { pt: "Acessando microfone...", en: "Accessing microphone...", es: "Accediendo al micrófono..." },
  "recorder.clickToStop": { pt: "Clique para parar a gravação", en: "Click to stop recording", es: "Haz clic para detener la grabación" },
  "recorder.clickToRecord": { pt: "Clique para gravar áudio", en: "Click to record audio", es: "Haz clic para grabar audio" },
  "recorder.discard": { pt: "Descartar gravação", en: "Discard recording", es: "Descartar grabación" },
  
  // Instrument Selector
  "instrument.title": { pt: "Selecione o Instrumento", en: "Select Instrument", es: "Selecciona el Instrumento" },
  "instrument.piano": { pt: "Piano", en: "Piano", es: "Piano" },
  "instrument.guitar": { pt: "Violão", en: "Acoustic Guitar", es: "Guitarra Acústica" },
  "instrument.electricGuitar": { pt: "Guitarra", en: "Electric Guitar", es: "Guitarra Eléctrica" },
  "instrument.bass": { pt: "Baixo", en: "Bass", es: "Bajo" },
  "instrument.flute": { pt: "Flauta", en: "Flute", es: "Flauta" },
  "instrument.violin": { pt: "Violino", en: "Violin", es: "Violín" },
  
  // Sheet Music
  "sheet.title": { pt: "Partitura Musical", en: "Sheet Music", es: "Partitura Musical" },
  "sheet.noNotes": { pt: "Nenhuma nota para exibir", en: "No notes to display", es: "No hay notas para mostrar" },
  "sheet.total": { pt: "Total de notas", en: "Total notes", es: "Total de notas" },
  "sheet.scroll": { pt: "Deslize horizontalmente para ver mais", en: "Scroll horizontally to see more", es: "Desplaza horizontalmente para ver más" },
  "sheet.editMode": { pt: "Modo Edição", en: "Edit Mode", es: "Modo Edición" },
  "sheet.clickToEdit": { pt: "Clique em uma nota para editar", en: "Click on a note to edit", es: "Haz clic en una nota para editar" },
  
  // Tablature
  "tab.title": { pt: "Tablatura", en: "Tablature", es: "Tablatura" },
  "tab.notSupported": { pt: "Tablatura disponível apenas para violão, guitarra e baixo", en: "Tablature only available for guitar and bass", es: "Tablatura solo disponible para guitarra y bajo" },
  "tab.notesOnTab": { pt: "notas na tablatura", en: "notes on tab", es: "notas en tablatura" },
  
  // Notes List
  "notes.title": { pt: "Notas Identificadas", en: "Identified Notes", es: "Notas Identificadas" },
  "notes.totalNotes": { pt: "Total de notas", en: "Total notes", es: "Total de notas" },
  "notes.uniqueNotes": { pt: "Notas únicas", en: "Unique notes", es: "Notas únicas" },
  "notes.mostFrequent": { pt: "Mais frequente", en: "Most frequent", es: "Más frecuente" },
  "notes.initialOctave": { pt: "Oitava inicial", en: "Initial octave", es: "Octava inicial" },
  "notes.position": { pt: "Posição", en: "Position", es: "Posición" },
  "notes.note": { pt: "Nota", en: "Note", es: "Nota" },
  "notes.octave": { pt: "Oitava", en: "Octave", es: "Octava" },
  "notes.frequency": { pt: "Frequência", en: "Frequency", es: "Frecuencia" },
  "notes.duration": { pt: "Duração", en: "Duration", es: "Duración" },
  
  // Export
  "export.title": { pt: "Exportar Resultado", en: "Export Result", es: "Exportar Resultado" },
  "export.txt": { pt: "Exportar como TXT", en: "Export as TXT", es: "Exportar como TXT" },
  "export.csv": { pt: "Exportar como CSV", en: "Export as CSV", es: "Exportar como CSV" },
  "export.json": { pt: "Exportar como JSON", en: "Export as JSON", es: "Exportar como JSON" },
  "export.midi": { pt: "Exportar como MIDI", en: "Export as MIDI", es: "Exportar como MIDI" },
  "export.success": { pt: "Exportado com sucesso!", en: "Exported successfully!", es: "¡Exportado con éxito!" },
  "export.error": { pt: "Erro na exportação", en: "Export error", es: "Error en la exportación" },
  
  // History
  "history.title": { pt: "Histórico de Transcrições", en: "Transcription History", es: "Historial de Transcripciones" },
  "history.empty": { pt: "Nenhuma transcrição no histórico", en: "No transcriptions in history", es: "No hay transcripciones en el historial" },
  "history.load": { pt: "Carregar", en: "Load", es: "Cargar" },
  "history.delete": { pt: "Excluir", en: "Delete", es: "Eliminar" },
  "history.confirmDelete": { pt: "Tem certeza que deseja excluir?", en: "Are you sure you want to delete?", es: "¿Estás seguro de que quieres eliminar?" },
  
  // Progress
  "progress.uploading": { pt: "Enviando áudio...", en: "Uploading audio...", es: "Subiendo audio..." },
  "progress.analyzing": { pt: "Analisando frequências...", en: "Analyzing frequencies...", es: "Analizando frecuencias..." },
  "progress.transcribing": { pt: "Transcrevendo notas...", en: "Transcribing notes...", es: "Transcribiendo notas..." },
  "progress.complete": { pt: "Transcrição completa!", en: "Transcription complete!", es: "¡Transcripción completa!" },
  
  // Toasts
  "toast.fileLoaded": { pt: "Arquivo carregado", en: "File loaded", es: "Archivo cargado" },
  "toast.fileReady": { pt: "está pronto para transcrição", en: "is ready for transcription", es: "está listo para transcripción" },
  "toast.recordingComplete": { pt: "Gravação concluída", en: "Recording complete", es: "Grabación completa" },
  "toast.audioReady": { pt: "Áudio gravado está pronto para transcrição", en: "Recorded audio is ready for transcription", es: "El audio grabado está listo para transcripción" },
  "toast.noAudio": { pt: "Nenhum áudio", en: "No audio", es: "Sin audio" },
  "toast.uploadFirst": { pt: "Por favor, envie um arquivo ou grave um áudio primeiro", en: "Please upload a file or record audio first", es: "Por favor, sube un archivo o graba un audio primero" },
  "toast.transcriptionComplete": { pt: "Transcrição concluída!", en: "Transcription complete!", es: "¡Transcripción completa!" },
  "toast.notesIdentified": { pt: "notas identificadas", en: "notes identified", es: "notas identificadas" },
  "toast.transcriptionError": { pt: "Erro na transcrição", en: "Transcription error", es: "Error en la transcripción" },
  "toast.tryAgain": { pt: "Ocorreu um erro ao processar o áudio. Tente novamente.", en: "An error occurred while processing the audio. Try again.", es: "Ocurrió un error al procesar el audio. Inténtalo de nuevo." },
  "toast.savedToHistory": { pt: "Salvo no histórico", en: "Saved to history", es: "Guardado en el historial" },
  
  // Edit Note Dialog
  "edit.title": { pt: "Editar Nota", en: "Edit Note", es: "Editar Nota" },
  "edit.noteName": { pt: "Nome da Nota", en: "Note Name", es: "Nombre de la Nota" },
  "edit.octave": { pt: "Oitava", en: "Octave", es: "Octava" },
  "edit.duration": { pt: "Duração", en: "Duration", es: "Duración" },
  "edit.save": { pt: "Salvar", en: "Save", es: "Guardar" },
  "edit.cancel": { pt: "Cancelar", en: "Cancel", es: "Cancelar" },
  "edit.delete": { pt: "Excluir Nota", en: "Delete Note", es: "Eliminar Nota" },
  
  // Footer
  "footer.description": { pt: "Sistema inteligente de transcrição musical utilizando Python e Librosa para identificar e transcrever notas musicais a partir de áudio.", en: "Intelligent music transcription system using Python and Librosa to identify and transcribe musical notes from audio.", es: "Sistema inteligente de transcripción musical utilizando Python y Librosa para identificar y transcribir notas musicales a partir de audio." },
  "footer.quickLinks": { pt: "Links Rápidos", en: "Quick Links", es: "Enlaces Rápidos" },
  "footer.homePage": { pt: "Página Inicial", en: "Home Page", es: "Página de Inicio" },
  "footer.transcribeAudio": { pt: "Transcrever Áudio", en: "Transcribe Audio", es: "Transcribir Audio" },
  "footer.aboutProject": { pt: "Sobre o Projeto", en: "About the Project", es: "Sobre el Proyecto" },
  "footer.graduationWork": { pt: "Trabalho de Graduação desenvolvido como requisito para obtenção do título acadêmico.", en: "Graduation project developed as a requirement for obtaining the academic degree.", es: "Trabajo de Graduación desarrollado como requisito para la obtención del título académico." },
  "footer.developed": { pt: "Desenvolvido como Trabalho de Conclusão de Curso", en: "Developed as a Final Course Project", es: "Desarrollado como Trabajo de Fin de Curso" },
  "footer.rights": { pt: "Todos os direitos reservados", en: "All rights reserved", es: "Todos los derechos reservados" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("sinfonia-language");
    return (saved as Language) || "pt";
  });

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("sinfonia-language", lang);
  }, []);

  const t = useCallback((key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
