import { Music } from "lucide-react";

/**
 * MusicNotes Component - Decoração visual com notas musicais animadas
 * Usado como background decorativo nas páginas
 */
const MusicNotes = () => {
  const notes = [
    { symbol: "♪", x: "10%", y: "20%", delay: "0s", size: "text-5xl", color: "text-purple-400/50" },
    { symbol: "♫", x: "85%", y: "15%", delay: "1s", size: "text-4xl", color: "text-violet-400/60" },
    { symbol: "♩", x: "75%", y: "70%", delay: "2s", size: "text-6xl", color: "text-indigo-400/55" },
    { symbol: "♬", x: "15%", y: "75%", delay: "0.5s", size: "text-4xl", color: "text-fuchsia-400/50" },
    { symbol: "♪", x: "90%", y: "45%", delay: "1.5s", size: "text-5xl", color: "text-purple-500/45" },
    { symbol: "♫", x: "5%", y: "50%", delay: "2.5s", size: "text-3xl", color: "text-violet-500/55" },
    { symbol: "𝄞", x: "20%", y: "40%", delay: "0.8s", size: "text-7xl", color: "text-indigo-300/40" },
    { symbol: "𝄢", x: "80%", y: "85%", delay: "1.8s", size: "text-6xl", color: "text-purple-300/45" },
    { symbol: "♯", x: "45%", y: "10%", delay: "2.2s", size: "text-4xl", color: "text-fuchsia-300/50" },
    { symbol: "♭", x: "55%", y: "90%", delay: "1.2s", size: "text-4xl", color: "text-violet-300/55" },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {notes.map((note, index) => (
        <span
          key={index}
          className={`absolute ${note.size} ${note.color} floating-note select-none drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]`}
          style={{
            left: note.x,
            top: note.y,
            animationDelay: note.delay,
          }}
        >
          {note.symbol}
        </span>
      ))}
    </div>
  );
};

export default MusicNotes;
