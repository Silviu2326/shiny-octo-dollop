import { useState } from 'react';
import './App.css';
import Level0 from './game/Level0';
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
    { id: 0, emoji: '🏠', name: 'Nivel 0', desc: 'La Casa del Gato (Tutorial)', color: '#F3E9C6' },
    { id: 1, emoji: '🐙', name: 'Nivel 1', desc: 'Medusa 0,0', color: '#7EC8E3' },
    { id: 2, emoji: '🍞', name: 'Nivel 2', desc: 'La Tostada (Morena)', color: '#8A5A2B' },
    { id: 3, emoji: '👩', name: 'Nivel 3', desc: 'La Rubia (Catira)', color: '#F2C94C' },
    { id: 4, emoji: '🌾', name: 'Nivel 4', desc: 'Sin Gluten (Sifrina)', color: '#D4AF37' },
    { id: 5, emoji: '🕯️', name: 'Nivel 5', desc: 'La Oscura (Candela)', color: '#8B1E1E' },
    { id: 6, emoji: '🌴', name: 'Nivel 6', desc: 'La Tropical (Guajira)', color: '#2ECC71' },
    { id: 7, emoji: '🎉', name: 'Nivel 7', desc: 'El Final (Fiesta del Gato)', color: '#56CCF2' },
    // Level 8 is missing in the list in Juego.js but Level8 import exists and logic exists. 
    // Checking Juego.js again: imports Level8, has if(level===7) -> Level8? Wait.
    // In Juego.js:
    // { id: 7, emoji: '🎉', name: 'Nivel 7', desc: 'El Final (Fiesta del Gato)', color: '#56CCF2' }
    // if (level === 7) return <Level8 ... />
    // It seems Level 7 in the menu maps to Level8 component? Or maybe Level 7 IS the final level?
    // Let's stick to the menu list from Juego.js exactly for now.
    // Wait, let me check Juego.js content I read.
    // Line 24: { id: 7 ... name: 'Nivel 7' ... }
    // Line 101: if (level === 7) { return <Level8 ... />; }
    // This looks like an off-by-one or intentional mapping in the original. I will reproduce strictly.
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
                <span className="level-emoji">{level.emoji}</span>
              </div>
              <div className="level-info">
                <h3 className="level-text">{level.name}</h3>
                <p className="level-description">{level.desc}</p>
              </div>
              <div className="level-arrow">
                <span className="arrow-text">▶</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Game({ level, onBack }) {
  if (level === 0) return <Level0 onBack={onBack} />;
  if (level === 1) return <Level1 onBack={onBack} />;
  if (level === 2) return <Level2 onBack={onBack} />;
  if (level === 3) return <Level3 onBack={onBack} />;
  if (level === 4) return <Level4 onBack={onBack} />;
  if (level === 5) return <Level5 onBack={onBack} />;
  if (level === 6) return <Level6 onBack={onBack} />;

  // Mapping level 7 to Level8 component as per Juego.js logic
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
