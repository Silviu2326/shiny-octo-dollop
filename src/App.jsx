import { useState, useEffect } from 'react';
import { Home, Ghost, Cookie, Sun, WheatOff, Flame, Palmtree, PartyPopper, Play, Lock } from 'lucide-react';
import './App.css';
import Level1 from './game/Level1';
import Level2 from './game/Level2';
import Level3 from './game/Level3';
import Level4 from './game/Level4';
import Level5 from './game/Level5';
import Level6 from './game/Level6';
import Level7 from './game/Level7';
import Level8 from './game/Level8';

console.log('App.jsx loaded successfully');

// Utility functions for level progression
const getUnlockedLevels = () => {
  try {
    const saved = localStorage.getItem('beerRunProgress');
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        return Array.isArray(progress.unlockedLevels) ? progress.unlockedLevels : [0];
      } catch (e) {
        console.error('Error parsing progress:', e);
        localStorage.removeItem('beerRunProgress');
        return [0];
      }
    }
    return [0]; // Only level 0 unlocked by default
  } catch (e) {
    console.error('Error accessing localStorage:', e);
    return [0];
  }
};

const unlockLevel = (levelId) => {
  try {
    const current = getUnlockedLevels();
    if (!current.includes(levelId)) {
      const updated = [...current, levelId].sort((a, b) => a - b);
      localStorage.setItem('beerRunProgress', JSON.stringify({ unlockedLevels: updated }));
      console.log('Level unlocked:', levelId, 'All unlocked:', updated);
    }
  } catch (e) {
    console.error('Error unlocking level:', e);
  }
};

const isLevelUnlocked = (levelId) => {
  const unlocked = getUnlockedLevels();
  return unlocked.includes(levelId);
};

function LevelSelector({ onSelectLevel }) {
  const [unlockedLevels, setUnlockedLevels] = useState(getUnlockedLevels());

  // Update unlocked levels when component mounts or when returning from a level
  useEffect(() => {
    setUnlockedLevels(getUnlockedLevels());
  }, []);

  const levels = [
    { id: 0, image: '/assets/drive-download-20260109T123100Z-1-001/COOL CAT.png', name: 'Nivel 0', desc: 'La Casa del Gato (Tutorial)', color: '#F3E9C6' },
    { id: 1, image: '/assets/drive-download-20260109T123100Z-1-001/MEDUSA.png', name: 'Nivel 1', desc: 'Medusa 0,0', color: '#7EC8E3' },
    { id: 2, image: '/assets/drive-download-20260109T123100Z-1-001/morena.png', name: 'Nivel 2', desc: 'La Tostada (Morena)', color: '#8A5A2B' },
    { id: 3, image: '/assets/drive-download-20260109T123100Z-1-001/CATIRA.png', name: 'Nivel 3', desc: 'La Rubia (Catira)', color: '#F2C94C' },
    { id: 4, image: '/assets/drive-download-20260109T123100Z-1-001/SIFRINA.png', name: 'Nivel 4', desc: 'Sin Gluten (Sifrina)', color: '#D4AF37' },
    { id: 5, image: '/assets/drive-download-20260109T123100Z-1-001/CANDELA.png', name: 'Nivel 5', desc: 'La Oscura (Candela)', color: '#8B1E1E' },
    { id: 6, image: '/assets/drive-download-20260109T123100Z-1-001/GUAJIRA.png', name: 'Nivel 6', desc: 'La Tropical (Guajira)', color: '#2ECC71' },
    { id: 7, image: '/assets/drive-download-20260109T123100Z-1-001/BUCK.png', name: 'Nivel 7', desc: 'El Final (Fiesta del Gato)', color: '#56CCF2' },
  ];

  const handleLevelClick = (levelId) => {
    if (unlockedLevels.includes(levelId)) {
      onSelectLevel(levelId);
    }
  };

  return (
    <div className="app-container">
      <div className="title-container">
        <img src="/assets/drive-download-20260109T123100Z-1-001/logo pixel art.png" alt="Beer Run Logo" className="game-logo" />
        <h1 className="title">BEER RUN</h1>
        <p className="subtitle">Selecciona tu nivel</p>
        <div className="title-underline" />
      </div>

      <div className="scroll-view">
        <div className="levels-container">
          {levels.map((level) => {
            const isUnlocked = unlockedLevels.includes(level.id);
            return (
              <div
                key={level.id}
                className={`level-button ${!isUnlocked ? 'level-locked' : ''}`}
                style={{
                  borderLeftColor: level.color,
                  opacity: isUnlocked ? 1 : 0.5,
                  cursor: isUnlocked ? 'pointer' : 'not-allowed'
                }}
                onClick={() => handleLevelClick(level.id)}
              >
                <div className="level-image-container">
                  <img
                    src={level.image}
                    alt={level.name}
                    className="level-image"
                    style={{ filter: isUnlocked ? 'none' : 'grayscale(100%)' }}
                  />
                  {!isUnlocked && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderRadius: '50%',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Lock size={24} color="white" />
                    </div>
                  )}
                </div>
                <div className="level-info">
                  <h3 className="level-text">{level.name}</h3>
                  <p className="level-description">
                    {isUnlocked ? level.desc : 'Completa el nivel anterior'}
                  </p>
                </div>
                <div className="level-arrow">
                  {isUnlocked ? (
                    <Play size={20} fill="#666" stroke="none" />
                  ) : (
                    <Lock size={20} color="#666" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Game({ level, onBack, onNextLevel, onLevelComplete }) {
  // Mapping with off-by-one: Nivel 0 (selector) = Level1.jsx, Nivel 1 = Level2.jsx, etc.
  if (level === 0) return <Level1 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} />;
  if (level === 1) return <Level2 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} />;
  if (level === 2) return <Level3 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} />;
  if (level === 3) return <Level4 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} />;
  if (level === 4) return <Level5 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} />;
  if (level === 5) return <Level6 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} />;
  if (level === 6) return <Level7 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} />;
  if (level === 7) return <Level8 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} />;

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
  const [refreshKey, setRefreshKey] = useState(0);

  console.log('App rendering, selectedLevel:', selectedLevel);

  const handleNextLevel = () => {
    console.log('handleNextLevel called');
    setSelectedLevel(prev => prev + 1);
  };

  const handleLevelComplete = (currentLevel) => {
    console.log('handleLevelComplete called for level:', currentLevel);
    const nextLevel = currentLevel + 1;
    unlockLevel(nextLevel);
    setRefreshKey(k => k + 1); // Force update to refresh unlocked levels
  };

  const handleBack = () => {
    console.log('handleBack called');
    setSelectedLevel(null);
    setRefreshKey(k => k + 1); // Force update to refresh unlocked levels in selector
  };

  if (selectedLevel === null) {
    console.log('Rendering LevelSelector');
    return <LevelSelector key={refreshKey} onSelectLevel={setSelectedLevel} />;
  }

  console.log('Rendering Game with level:', selectedLevel);
  return <Game
    level={selectedLevel}
    onBack={handleBack}
    onNextLevel={handleNextLevel}
    onLevelComplete={handleLevelComplete}
  />;
}

export default App;
