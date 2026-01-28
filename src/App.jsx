import { useState, useEffect } from 'react';
import { Home, Ghost, Cookie, Sun, WheatOff, Flame, Palmtree, PartyPopper, Play, Lock, Trophy } from 'lucide-react';
import './App.css';
import Level1 from './game/Level1';
import Level2 from './game/Level2';

import Level3 from './game/Level3';
import Level3_5 from './game/Level3_5';
import Level4 from './game/Level4';
import Level5 from './game/Level5';
import Level6 from './game/Level6';
import Level7 from './game/Level7';
import Level8 from './game/Level8';
import PacmanLevel from './game/PacmanLevel';
import Ranking from './components/Ranking';
import LoadingScreen from './components/LoadingScreen';

console.log('App.jsx loaded successfully');

// Datos de los niveles definidos externamente para uso global
const LEVEL_DATA = [
  { id: 0, image: '/assets/drive-download-20260109T123100Z-1-001/COOL CAT.png', name: 'Nivel 0', desc: 'La Casa del Gato (Tutorial)', color: '#F3E9C6' },
  { id: 1, image: '/assets/drive-download-20260109T123100Z-1-001/MEDUSA.png', name: 'Nivel 1', desc: 'Medusa 0,0', color: '#7EC8E3' },
  { id: 2, image: '/assets/drive-download-20260109T123100Z-1-001/morena.png', name: 'Nivel 2', desc: 'La Tostada (Morena)', color: '#8A5A2B' },
  { id: 2.5, image: '/assets/drive-download-20260109T123100Z-1-001/morena.png', name: 'Nivel 2.5', desc: 'Desafío Extra Morena', color: '#8A5A2B' },
  { id: 3, image: '/assets/drive-download-20260109T123100Z-1-001/CATIRA.png', name: 'Nivel 3', desc: 'La Rubia (Catira)', color: '#F2C94C' },
  { id: 4, image: '/assets/drive-download-20260109T123100Z-1-001/SIFRINA.png', name: 'Nivel 4', desc: 'Sin Gluten (Sifrina)', color: '#D4AF37' },
  { id: 5, image: '/assets/drive-download-20260109T123100Z-1-001/CANDELA.png', name: 'Nivel 5', desc: 'La Oscura (Candela)', color: '#8B1E1E' },
  { id: 6, image: '/assets/drive-download-20260109T123100Z-1-001/GUAJIRA.png', name: 'Nivel 6', desc: 'La Tropical (Guajira)', color: '#2ECC71' },
  { id: 7, image: '/assets/drive-download-20260109T123100Z-1-001/BUCK.png', name: 'Nivel 7', desc: 'El Final (Fiesta del Gato)', color: '#56CCF2' },
  { id: 8, image: '/assets/drive-download-20260109T123100Z-1-001/COOL CAT.png', name: 'Nivel 8', desc: 'Pac-Man 2D (Bonus)', color: '#FFFF00' },
];

// Utility functions for level progression
const getUnlockedLevels = () => {
  // Habilitar todos los niveles para pruebas
  return LEVEL_DATA.map(l => l.id);
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

function LevelSelector({ onSelectLevel, userId }) {
  const [unlockedLevels, setUnlockedLevels] = useState(getUnlockedLevels());
  const [showRanking, setShowRanking] = useState(false);

  // Update unlocked levels when component mounts or when returning from a level
  useEffect(() => {
    setUnlockedLevels(getUnlockedLevels());
  }, []);

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

        <button
          className="ranking-button"
          onClick={() => setShowRanking(true)}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
          }}
        >
          <Trophy size={20} />
          Ver Ranking
        </button>
      </div>

      <div className="scroll-view">
        <div className="levels-container">
          {LEVEL_DATA.map((level) => {
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

      {showRanking && (
        <Ranking
          onClose={() => setShowRanking(false)}
          userId={userId}
        />
      )}
    </div>
  );
}

function Game({ level, onBack, onNextLevel, onLevelComplete, userId }) {
  // Mapping with off-by-one: Nivel 0 (selector) = Level1.jsx, Nivel 1 = Level2.jsx, etc.
  if (level === 0) return <Level1 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} userId={userId} />;
  if (level === 1) return <Level2 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} userId={userId} />;

  if (level === 2) return <Level3 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} userId={userId} />;
  if (level === 2.5) return <Level3_5 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} userId={userId} />;
  if (level === 3) return <Level4 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} userId={userId} />;
  if (level === 4) return <Level5 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} userId={userId} />;
  if (level === 5) return <Level6 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} userId={userId} />;
  if (level === 6) return <Level7 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} userId={userId} />;
  if (level === 7) return <Level8 onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} userId={userId} />;
  if (level === 8) return <PacmanLevel onBack={onBack} onNextLevel={onNextLevel} onLevelComplete={onLevelComplete} userId={userId} />;

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
  const [showIntro, setShowIntro] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userId, setUserId] = useState(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  console.log('App rendering, selectedLevel:', selectedLevel);

  // Obtener userId de los parámetros URL
  useEffect(() => {
    // BORRAR CACHÉ DEL JUEGO (Código temporal)
    localStorage.removeItem('beerRunProgress');
    console.log('🗑️ Caché del juego borrada para pruebas');

    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');

    if (userIdParam) {
      setUserId(userIdParam);
      console.log('👤 [App] Usuario identificado:', userIdParam);
    } else {
      // Si no hay userId, usar uno genérico
      const guestId = 'guest_' + Date.now();
      setUserId(guestId);
      console.warn('⚠️ [App] No se proporcionó userId, usando:', guestId);
    }
  }, []);

  const handleNextLevel = () => {
    console.log('handleNextLevel called');
    const currentIndex = LEVEL_DATA.findIndex(l => l.id === selectedLevel);
    if (currentIndex >= 0 && currentIndex < LEVEL_DATA.length - 1) {
      setSelectedLevel(LEVEL_DATA[currentIndex + 1].id);
    }
  };

  const handleLevelComplete = (currentLevel) => {
    console.log('handleLevelComplete called for level:', currentLevel);
    const currentIndex = LEVEL_DATA.findIndex(l => l.id === currentLevel);
    if (currentIndex >= 0 && currentIndex < LEVEL_DATA.length - 1) {
      const nextLevelId = LEVEL_DATA[currentIndex + 1].id;
      unlockLevel(nextLevelId);
      setRefreshKey(k => k + 1); // Force update to refresh unlocked levels
    }
  };

  const handleBack = () => {
    console.log('handleBack called');
    setSelectedLevel(null);
    setRefreshKey(k => k + 1); // Force update to refresh unlocked levels in selector
  };

  const handleIntroFinish = () => {
    setShowIntro(false);
  };

  if (showIntro) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        zIndex: 9999,
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10002,
          opacity: isVideoLoaded ? 0 : 1,
          transition: 'opacity 1s ease-out',
          pointerEvents: isVideoLoaded ? 'none' : 'all',
        }}>
          <LoadingScreen />
        </div>
        <video
          src="/assets/videos/intro.mp4"
          autoPlay
          playsInline
          muted={false}
          onLoadedData={() => {
            console.log('Video data loaded');
            setIsVideoLoaded(true);
          }}
          onCanPlay={() => {
            console.log('Video can play');
            setIsVideoLoaded(true);
          }}
          onEnding={handleIntroFinish}
          onEnded={handleIntroFinish}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: isVideoLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease-in'
          }}
        />
        <button
          onClick={handleIntroFinish}
          style={{
            position: 'absolute',
            bottom: '30px',
            right: '30px',
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            borderRadius: '30px',
            cursor: 'pointer',
            fontSize: '16px',
            backdropFilter: 'blur(5px)',
            transition: 'all 0.3s ease',
            zIndex: 10000
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Saltar Intro
        </button>
      </div>
    );
  }

  if (selectedLevel === null) {
    console.log('Rendering LevelSelector');
    return <LevelSelector key={refreshKey} onSelectLevel={setSelectedLevel} userId={userId} />;
  }

  console.log('Rendering Game with level:', selectedLevel);
  return <Game
    level={selectedLevel}
    onBack={handleBack}
    onNextLevel={handleNextLevel}
    onLevelComplete={handleLevelComplete}
    userId={userId}
  />;
}

export default App;
