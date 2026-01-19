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
import Enemy from '../components/game/Enemy';
import { AIRoles, createPatrolZones, assignZone } from './ai/EnemyAI';
import { saveScore } from '../services/supabase';

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

// --- Enemy Configuration ---
const DOGHOUSE_POS = { x: 12, z: 14 };
const patrolZones = createPatrolZones(24, 28, 2);

// --- 3D Components ---




// --- Main Component ---

export default function Level1({ onBack, onNextLevel, onLevelComplete, userId }) {
  const [playerPos, setPlayerPos] = useState({ x: 2, z: 2 });
  const [direction, setDirection] = useState({ x: 0, z: 0 });
  const [collectibles, setCollectibles] = useState(initialCollectibles);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [startTime] = useState(Date.now());
  const [enemies, setEnemies] = useState([]);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const enemyIdRef = useRef(1);
  const processingHit = useRef(false);
  const musicRef = useRef(null);
  const videoRef = useRef(null);

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

  const playLoseLifeSound = () => {
    if (isMuted) return;
    const sfx = new Audio('/assets/audio/sfx_lose_life.mp3');
    sfx.volume = 0.6;
    sfx.play().catch(e => console.log("SFX play failed:", e));
  };

  // Enemy spawning
  useEffect(() => {
    if (showIntroVideo) return;

    // Enemigo PURSUER que siempre persigue al jugador y se mantiene visible
    const timerPursuer = setTimeout(() => {
      setEnemies(prev => [
        ...prev,
        {
          id: enemyIdRef.current++,
          x: DOGHOUSE_POS.x,
          z: DOGHOUSE_POS.z,
          role: AIRoles.PURSUER,
          zone: assignZone(0, patrolZones),
          isReturning: false
        }
      ]);
    }, 3000);

    const timer1 = setTimeout(() => {
      setEnemies(prev => [
        ...prev,
        {
          id: enemyIdRef.current++,
          x: DOGHOUSE_POS.x,
          z: DOGHOUSE_POS.z,
          role: AIRoles.PATROL,
          zone: assignZone(1, patrolZones),
          isReturning: false
        }
      ]);
    }, 8000);

    return () => {
      clearTimeout(timerPursuer);
      clearTimeout(timer1);
    };
  }, [showIntroVideo]);

  // Handle enemy position updates and collision
  const handleEnemyPositionUpdate = (id, x, z) => {
    setEnemies(prev => prev.map(e => e.id === id ? { ...e, x, z } : e));

    // Check collision with player
    if (!isInvulnerable && !processingHit.current) {
      const dist = Math.sqrt((x - playerPos.x) ** 2 + (z - playerPos.z) ** 2);
      if (dist < 0.5) {
        const enemy = enemies.find(e => e.id === id);
        if (enemy && !enemy.isReturning) {
          handlePlayerHit();
        }
      }
    }
  };

  const handlePlayerHit = () => {
    processingHit.current = true;
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setIsPaused(true);
        setShowGameOverModal(true);
      }
      return newLives;
    });

    if (lives > 1) {
      playLoseLifeSound();
      setIsInvulnerable(true);
      setTimeout(() => {
        setIsInvulnerable(false);
        processingHit.current = false;
      }, 3000);
    }
  };

  const restartLevel = () => {
    setPlayerPos({ x: 2, z: 2 });
    setDirection({ x: 0, z: 0 });
    setCollectibles(initialCollectibles);
    setScore(0);
    setLives(3);
    setEnemies([]);
    enemyIdRef.current = 1;
    setIsInvulnerable(false);
    processingHit.current = false;
    setIsPaused(false);
    setShowSettingsModal(false);
    setShowGameOverModal(false);
    setShowVictoryModal(false);
    collectedBeersRef.current.clear();
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

  // Global pointer release handler to fix stuck D-pad
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setDirection({ x: 0, z: 0 });
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    window.addEventListener('touchend', handleGlobalPointerUp);
    window.addEventListener('touchcancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      window.removeEventListener('touchend', handleGlobalPointerUp);
      window.removeEventListener('touchcancel', handleGlobalPointerUp);
    };
  }, []);



  // Optimize collectibles check with Ref to avoid closure staleness and dependency issues
  const collectedBeersRef = useRef(new Set());

  const handlePositionUpdate = (x, z) => {
    setPlayerPos({ x, z });

    // Efficient collision check without triggering re-renders unless necessary
    let itemsCollectedNow = 0;

    // Check against current list without needing to access state if we assume initial set + removed set
    // However, simplest is to iterate the current list from state, but that triggers finding "new" collisions
    // We use a Ref to track WHAT has been collected to avoid double-counting if state updates lag

    // Note: In this specific implementation, we iterate 'collectibles'. 
    // Since this function is recreated on every render (due to setPlayerPos triggering render), 
    // 'collectibles' is fresh. The key optimization is NOT calling setCollectibles unless needed.

    // Also using a Ref to debounce/ensure we don't process the same item twice in quick succession

    let hitFound = false;

    // Use a loop to find collisions
    // We iterate backwards to allow safe removal if we were mutating, but we are just flagging.
    // Actually we just need to identify IDs to remove.
    const collectedIds = [];

    for (const c of collectibles) {
      // Skip if already marked (though we remove them from state, so this is just failsafe)
      if (collectedBeersRef.current.has(c.id)) continue;

      const dist = Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(z - c.z, 2));
      if (dist < 0.5) {
        collectedBeersRef.current.add(c.id);
        collectedIds.push(c.id);
        hitFound = true;
      }
    }

    if (hitFound) {
      setScore(s => s + 10 * collectedIds.length);
      playCollectSound();

      // Update state only if hits occurred
      setCollectibles(prev => prev.filter(c => !collectedBeersRef.current.has(c.id)));
    }
  };

  // Check for victory (all collectibles collected)
  useEffect(() => {
    if (collectibles.length === 0 && !showVictoryModal) {
      setIsPaused(true);
      setShowVictoryModal(true);

      // Calculate time played
      const timeSeconds = Math.floor((Date.now() - startTime) / 1000);

      // Save score to Supabase
      if (userId) {
        console.log('💾 [Level1] Guardando puntuación para usuario:', userId);
        saveScore(userId, 0, score, beersCollected, timeSeconds)
          .then(result => {
            if (result.success) {
              console.log('✅ [Level1] Puntuación guardada exitosamente');
            } else {
              console.error('❌ [Level1] Error guardando puntuación:', result.error);
            }
          })
          .catch(err => {
            console.error('❌ [Level1] Error en saveScore:', err);
          });
      } else {
        console.warn('⚠️ [Level1] No hay userId, no se guardó la puntuación');
      }

      if (onLevelComplete) {
        onLevelComplete(0); // Nivel 0 completed (Level1.jsx), unlock Nivel 1 (Medusa)
      }
    }
  }, [collectibles, showVictoryModal, onLevelComplete, userId, score, beersCollected, startTime]);

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

        {enemies.map(enemy => (
          <Enemy
            key={enemy.id}
            enemyId={enemy.id}
            position={{ x: enemy.x, z: enemy.z }}
            playerPos={playerPos}
            playerDirection={direction}
            walls={walls}
            onPositionUpdate={(x, z) => handleEnemyPositionUpdate(enemy.id, x, z)}
            checkCollision={checkCollision}
            isPowerActive={false}
            isPaused={isPaused}
            rotation={playerRotation}
            role={enemy.role}
            assignedZone={enemy.zone}
            doghousePos={DOGHOUSE_POS}
            isReturning={enemy.isReturning}
            spritesheet1Path="/assets/personajes/enemy_type_13.png"
            spritesheet2Path="/assets/personajes/enemy_type_14.png"
            debugMode={false}
          />
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
              onPointerCancel={() => setDirection({ x: 0, z: 0 })}
              onContextMenu={(e) => e.preventDefault()}
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
              onPointerCancel={() => setDirection({ x: 0, z: 0 })}
              onContextMenu={(e) => e.preventDefault()}
            >
              <ArrowLeft size={24} />
            </button>
            <div className="d-pad-center"></div>
            <button
              className="d-pad-button right"
              onPointerDown={() => setDirection({ x: 1, z: 0 })}
              onPointerUp={() => setDirection({ x: 0, z: 0 })}
              onPointerLeave={() => setDirection({ x: 0, z: 0 })}
              onPointerCancel={() => setDirection({ x: 0, z: 0 })}
              onContextMenu={(e) => e.preventDefault()}
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
              onPointerCancel={() => setDirection({ x: 0, z: 0 })}
              onContextMenu={(e) => e.preventDefault()}
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
          onSettingsClick={() => {
            setIsPaused(true);
            setShowSettingsModal(true);
          }}
        />



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
              <h2>🎉 ¡NIVEL COMPLETADO! 🎉</h2>
              <p className="score-text">¡Has conseguido {score} puntos!</p>
              <p className="unlock-text">¡El siguiente nivel está desbloqueado!</p>
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

        {showGameOverModal && (
          <div className="settings-modal game-over-modal">
            <div className="settings-content glass-panel game-over-content">
              <h2>💀 ¡GAME OVER! 💀</h2>
              <p className="score-text">Puntuación: {score}</p>
              <p className="score-text">Cervezas: {beersCollected}/{totalBeers}</p>
              <button className="modal-button restart-button" onClick={restartLevel}>
                <RotateCcw size={20} /> Reintentar
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
            ref={videoRef}
            src="/assets/videos/nivel0 coolcat.mp4"
            autoPlay
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onEnded={() => { setShowIntroVideo(false); setIsPaused(false); }}
            onClick={() => { setShowIntroVideo(false); setIsPaused(false); }}
            onError={() => { setShowIntroVideo(false); setIsPaused(false); }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) {
                if (isVideoPlaying) {
                  videoRef.current.pause();
                } else {
                  videoRef.current.play();
                }
                setIsVideoPlaying(!isVideoPlaying);
              }
            }}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '120px',
              padding: '10px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              color: 'black',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {isVideoPlaying ? <Pause size={16} color="black" /> : <Play size={16} color="black" />}
            {isVideoPlaying ? "Parar" : "Reproducir"}
          </button>
          <button
            onClick={() => { setShowIntroVideo(false); setIsPaused(false); }}
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
