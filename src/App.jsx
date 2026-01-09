import { useState } from 'react';
import { Home, Ghost, Cookie, Sun, WheatOff, Flame, Palmtree, PartyPopper, Play } from 'lucide-react';
import './App.css';
import Level1 from './game/Level1';
import Level2 from './game/Level2';
import Level3 from './game/Level3';
import Level4 from './game/Level4';
import Level5 from './game/Level5';
import Level6 from './game/Level6';
import Level7 from './game/Level7';
import Level8 from './game/Level8';

function LevelSelector({ onSelectLevel }) {
  const levels = [
    { id: 0, icon: <Home size={28} />, name: 'Nivel 0', desc: 'La Casa del Gato (Tutorial)', color: '#F3E9C6' },
    { id: 1, icon: <Ghost size={28} />, name: 'Nivel 1', desc: 'Medusa 0,0', color: '#7EC8E3' },
    { id: 2, icon: <Cookie size={28} />, name: 'Nivel 2', desc: 'La Tostada (Morena)', color: '#8A5A2B' },
    { id: 3, icon: <Sun size={28} />, name: 'Nivel 3', desc: 'La Rubia (Catira)', color: '#F2C94C' },
    { id: 4, icon: <WheatOff size={28} />, name: 'Nivel 4', desc: 'Sin Gluten (Sifrina)', color: '#D4AF37' },
    { id: 5, icon: <Flame size={28} />, name: 'Nivel 5', desc: 'La Oscura (Candela)', color: '#8B1E1E' },
    { id: 6, icon: <Palmtree size={28} />, name: 'Nivel 6', desc: 'La Tropical (Guajira)', color: '#2ECC71' },
    { id: 7, icon: <PartyPopper size={28} />, name: 'Nivel 7', desc: 'El Final (Fiesta del Gato)', color: '#56CCF2' },
  ];

  return (
    <div className="app-container">
      <div className="title-container">
        <h1 className="title">🍺 LABERINTO 🍺</h1>
        <p className="subtitle">Selecciona tu nivel</p>
        <div className="title-underline" />
      </div>

      <div className="scroll-view">
        <div className="levels-container">
          {levels.map((level) => (
            <div
              key={level.id}
              className="level-button"
              style={{ borderLeftColor: level.color }}
              onClick={() => onSelectLevel(level.id)}
            >
              <div className="level-icon-container">
                <span className="level-icon" style={{ color: level.color }}>
                  {level.icon}
                </span>
              </div>
              <div className="level-info">
                <h3 className="level-text">{level.name}</h3>
                <p className="level-description">{level.desc}</p>
              </div>
              <div className="level-arrow">
                <Play size={20} fill="#666" stroke="none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Game({ level, onBack }) {
  // Mapping matches Juego.js (off-by-one logic)
  if (level === 0) return <Level1 onBack={onBack} />;
  if (level === 1) return <Level2 onBack={onBack} />;
  if (level === 2) return <Level3 onBack={onBack} />;
  if (level === 3) return <Level4 onBack={onBack} />;
  if (level === 4) return <Level5 onBack={onBack} />;
  if (level === 5) return <Level6 onBack={onBack} />;
  if (level === 6) return <Level7 onBack={onBack} />;
  if (level === 7) return <Level8 onBack={onBack} />;

  return (
    <div className="app-container">
      <h1 className="title">Nivel {level}</h1>
      <p className="subtitle">Próximamente...</p>
      <button onClick={onBack} style={{ padding: '10px 20px', fontSize: '16px', background: '#ff6b35', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
        Volver
      </button>
    </div>
  );
}

function App() {
  const [selectedLevel, setSelectedLevel] = useState(null);

  if (selectedLevel === null) {
    return <LevelSelector onSelectLevel={setSelectedLevel} />;
  }

  return <Game level={selectedLevel} onBack={() => setSelectedLevel(null)} />;
}

export default App;
