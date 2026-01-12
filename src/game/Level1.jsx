import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import './Level1.css';
import LevelHeader from '../components/LevelHeader';
import GamePlayer from '../components/game/GamePlayer';
import MazeWalls from '../components/game/MazeWalls';
import Collectible from '../components/game/Collectible';
import GameFloor from '../components/game/GameFloor';
import CameraController from '../components/game/CameraController';

// --- Configuration & Constants ---
const CELL_SIZE = 5;

const walls = [
  // Background walls
  { x: -2, z: -10, length: 60, height: 10, thickness: 1, orientation: 'vertical' },
  { x: -10, z: -2, length: 60, height: 10, thickness: 1, orientation: 'horizontal' },

  // Exterior walls (24×28)
  { x: 0, z: 0, length: 24, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 0, z: 28, length: 24, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 0, z: 0, length: 28, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 24, z: 0, length: 28, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // Main vertical corridors
  { x: 6, z: 3, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 6, z: 17, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  { x: 12, z: 3, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 12, z: 17, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  { x: 18, z: 3, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 18, z: 17, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // Horizontal corridors
  { x: 3, z: 7, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 9, z: 7, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 15, z: 7, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

  { x: 3, z: 14, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 9, z: 14, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 15, z: 14, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

  { x: 3, z: 21, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 9, z: 21, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 15, z: 21, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

  // Extra complexity walls
  { x: 3, z: 3, length: 5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 15, z: 3, length: 5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 9, z: 10, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 21, z: 10, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },
];

// ===== Spatial Partitioning Optimization =====
function getWallBounds(wall) {
  const isHorizontal = wall.orientation === 'horizontal';
  let minX, maxX, minZ, maxZ;

  if (isHorizontal) {
    minX = wall.x;
    maxX = wall.x + wall.length;
    minZ = wall.z - wall.thickness / 2;
    maxZ = wall.z + wall.thickness / 2;
  } else {
    minX = wall.x - wall.thickness / 2;
    maxX = wall.x + wall.thickness / 2;
    minZ = wall.z;
    maxZ = wall.z + wall.length;
  }
  return { minX, maxX, minZ, maxZ };
}

function buildSpatialGrid(walls) {
  const grid = {};

  walls.forEach(wall => {
    const bounds = getWallBounds(wall);

    const startX = Math.floor(bounds.minX / CELL_SIZE);
    const endX = Math.floor(bounds.maxX / CELL_SIZE);
    const startZ = Math.floor(bounds.minZ / CELL_SIZE);
    const endZ = Math.floor(bounds.maxZ / CELL_SIZE);

    for (let x = startX; x <= endX; x++) {
      for (let z = startZ; z <= endZ; z++) {
        const key = `${x},${z}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push({ ...wall, bounds });
      }
    }
  });

  return grid;
}

const spatialGrid = buildSpatialGrid(walls);

function checkCollision(x, z) {
  const playerRadius = 0.3;

  const minCellX = Math.floor((x - playerRadius) / CELL_SIZE);
  const maxCellX = Math.floor((x + playerRadius) / CELL_SIZE);
  const minCellZ = Math.floor((z - playerRadius) / CELL_SIZE);
  const maxCellZ = Math.floor((z + playerRadius) / CELL_SIZE);

  for (let cx = minCellX; cx <= maxCellX; cx++) {
    for (let cz = minCellZ; cz <= maxCellZ; cz++) {
      const cellWalls = spatialGrid[`${cx},${cz}`];

      if (cellWalls) {
        for (const wallItem of cellWalls) {
          const { minX, maxX, minZ, maxZ } = wallItem.bounds;

          if (
            x + playerRadius > minX &&
            x - playerRadius < maxX &&
            z + playerRadius > minZ &&
            z - playerRadius < maxZ
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

function generateCollectibles(count) {
  const collectibles = [];
  let id = 1;

  while (collectibles.length < count) {
    const x = Math.random() * 22 + 1;
    const z = Math.random() * 26 + 1;

    if (!checkCollision(x, z)) {
      const tooClose = collectibles.some(c => {
        const distance = Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(z - c.z, 2));
        return distance < 1;
      });

      if (!tooClose) {
        collectibles.push({ id: id++, x, z });
      }
    }
  }

  return collectibles;
}

const initialCollectibles = generateCollectibles(40);

// --- 3D Components ---




// --- Main Component ---

export default function Level1({ onBack, onNextLevel, onLevelComplete }) {
  const [playerPos, setPlayerPos] = useState({ x: 2, z: 2 });
  const [direction, setDirection] = useState({ x: 0, z: 0 });
  const [collectibles, setCollectibles] = useState(initialCollectibles);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const musicRef = useRef(null);

  const totalBeers = initialCollectibles.length;
  const beersCollected = totalBeers - collectibles.length;

  // Camera configuration
  const cameraConfig = {
    rotation: Math.PI / 4.8,
    distance: 7,
    height: 5,
    fov: 60,
  };

  const playerRotation = 1.1;

  // Audio
  useEffect(() => {
    if (showIntroVideo) return;

    musicRef.current = new Audio('/assets/audio/music_background.mp3');
    musicRef.current.loop = true;
    musicRef.current.volume = 0.4;

    // Only play if not muted initially
    if (!isMuted) {
      musicRef.current.play().catch(e => console.log("Audio play failed (user interaction required):", e));
    }

    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, [showIntroVideo]);

  // Handle mute toggle for bg music
  useEffect(() => {
    if (!musicRef.current) return;

    if (isMuted) {
      musicRef.current.pause();
    } else {
      musicRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  }, [isMuted]);

  const playCollectSound = () => {
    if (isMuted) return;
    const sfx = new Audio('/assets/audio/sfx_collect.mp3');
    sfx.volume = 0.6;
    sfx.play().catch(e => console.log("SFX play failed:", e));
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const restartLevel = () => {
    setPlayerPos({ x: 2, z: 2 });
    setDirection({ x: 0, z: 0 });
    setCollectibles(initialCollectibles);
    setScore(0);
    setLives(3);
    setIsPaused(false);
    setShowSettingsModal(false);
    setIsPaused(false);
    setShowSettingsModal(false);
    setShowGameOverModal(false);
    // Tutorial removed
  };

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Tutorial check removed
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setDirection({ x: 0, z: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setDirection({ x: 0, z: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setDirection({ x: -1, z: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setDirection({ x: 1, z: 0 });
          break;
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      const currentDir = direction;
      if (
        (key === 'w' && currentDir.z === -1) ||
        (key === 's' && currentDir.z === 1) ||
        (key === 'a' && currentDir.x === -1) ||
        (key === 'd' && currentDir.x === 1) ||
        (key === 'arrowup' && currentDir.z === -1) ||
        (key === 'arrowdown' && currentDir.z === 1) ||
        (key === 'arrowleft' && currentDir.x === -1) ||
        (key === 'arrowright' && currentDir.x === 1)
      ) {
        setDirection({ x: 0, z: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [direction]);



  const handlePositionUpdate = (x, z) => {
    setPlayerPos({ x, z });

    setCollectibles(prev => {
      const remaining = prev.filter(c => {
        const dist = Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(z - c.z, 2));
        if (dist < 0.5) {
          setScore(s => s + 10);
          playCollectSound();
          return false;
        }
        return true;
      });
      return remaining;
    });
  };

  // Check for victory (all collectibles collected)
  useEffect(() => {
    if (collectibles.length === 0 && !showVictoryModal) {
      setIsPaused(true);
      setShowVictoryModal(true);
      if (onLevelComplete) {
        onLevelComplete(0); // Nivel 0 completed (Level1.jsx), unlock Nivel 1 (Medusa)
      }
    }
  }, [collectibles, showVictoryModal, onLevelComplete]);

  return (
    <div className="game-container">
      <Canvas camera={{ position: [12, 15, 20], fov: cameraConfig.fov }} shadows>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2.0} />

        <MazeWalls walls={walls} />
        <GameFloor position={[12, -0.1, 14]} width={40} depth={45} textureRepeat={[40 / 5, 45 / 5]} />
        <GamePlayer
          position={playerPos}
          direction={direction}
          onPositionUpdate={handlePositionUpdate}
          checkCollision={checkCollision}
          rotation={playerRotation}
          isPaused={isPaused}
        />

        {collectibles.map(c => (
          <Collectible key={c.id} position={c} />
        ))}

        <CameraController
          targetX={playerPos.x}
          targetZ={playerPos.z}
          rotation={cameraConfig.rotation}
          distance={cameraConfig.distance}
          height={cameraConfig.height}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="ui-overlay">
        {/* D-Pad Controls */}
        <div className="d-pad-container">
          <div className="d-pad-row">
            <button
              className="d-pad-button up"
              onPointerDown={() => setDirection({ x: 0, z: -1 })}
              onPointerUp={() => setDirection({ x: 0, z: 0 })}
              onPointerLeave={() => setDirection({ x: 0, z: 0 })}
            >
              <ArrowUp size={24} />
            </button>
          </div>
          <div className="d-pad-row middle">
            <button
              className="d-pad-button left"
              onPointerDown={() => setDirection({ x: -1, z: 0 })}
              onPointerUp={() => setDirection({ x: 0, z: 0 })}
              onPointerLeave={() => setDirection({ x: 0, z: 0 })}
            >
              <ArrowLeft size={24} />
            </button>
            <div className="d-pad-center"></div>
            <button
              className="d-pad-button right"
              onPointerDown={() => setDirection({ x: 1, z: 0 })}
              onPointerUp={() => setDirection({ x: 0, z: 0 })}
              onPointerLeave={() => setDirection({ x: 0, z: 0 })}
            >
              <ArrowRight size={24} />
            </button>
          </div>
          <div className="d-pad-row">
            <button
              className="d-pad-button down"
              onPointerDown={() => setDirection({ x: 0, z: 1 })}
              onPointerUp={() => setDirection({ x: 0, z: 0 })}
              onPointerLeave={() => setDirection({ x: 0, z: 0 })}
            >
              <ArrowDown size={24} />
            </button>
          </div>
        </div>
        <LevelHeader
          lives={lives}
          levelNumber={1}
          beersCollected={beersCollected}
          score={score}
        />

        {!showSettingsModal && (
          <button className="settings-button" onClick={() => {
            setIsPaused(true);
            setShowSettingsModal(true);
          }}>
            <Pause size={24} />
          </button>
        )}

        {showSettingsModal && (
          <div className="settings-modal">
            <div className="settings-content glass-panel">
              <h2>PAUSA</h2>
              <button className="modal-button" onClick={() => {
                setShowSettingsModal(false);
                setIsPaused(false);
              }}>
                <Play size={20} /> Seguir
              </button>
              <button className="modal-button restart-button" onClick={restartLevel}>
                <RotateCcw size={20} /> Reiniciar
              </button>
              <button className="modal-button" onClick={toggleMute}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />} {isMuted ? 'Activar Sonido' : 'Silenciar'}
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                <Home size={20} /> Salir
              </button>
            </div>
          </div>
        )}

        {showVictoryModal && (
          <div className="settings-modal victory-modal">
            <div className="settings-content glass-panel victory-content">
              <h2 style={{ fontSize: '2.5em', marginBottom: '20px' }}>🎉 ¡NIVEL COMPLETADO! 🎉</h2>
              <p style={{ fontSize: '1.2em', marginBottom: '10px' }}>¡Has conseguido {score} puntos!</p>
              <p style={{ fontSize: '1em', marginBottom: '30px', color: '#4CAF50' }}>¡El siguiente nivel está desbloqueado!</p>
              <button className="modal-button" onClick={() => {
                if (onNextLevel) onNextLevel();
              }}>
                Siguiente Nivel
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                <Home size={20} /> Volver al Menú
              </button>
            </div>
          </div>
        )}
      </div>

      {showIntroVideo && (
        <div className="intro-video-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'black',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}>
          <video
            src="/assets/videos/nivel0 coolcat.mp4"
            autoPlay
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onEnded={() => setShowIntroVideo(false)}
            onClick={() => setShowIntroVideo(false)}
            onError={() => setShowIntroVideo(false)}
          />
          <button
            onClick={() => setShowIntroVideo(false)}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              padding: '10px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              color: 'black',
              fontWeight: 'bold'
            }}
          >
            Saltar
          </button>
        </div>
      )}
    </div>
  );
}
