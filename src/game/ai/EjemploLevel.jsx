/**
 * EJEMPLO DE NIVEL USANDO EL SISTEMA DE IA CENTRALIZADO
 *
 * Este archivo muestra cómo quedaría un nivel completo usando el nuevo sistema.
 * Puedes usar esto como referencia para migrar los niveles existentes.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import * as THREE from 'three';

// NUEVO: Importar sistema de IA centralizado
import Enemy from '../../components/game/Enemy';
import { AIRoles, createPatrolZones, assignZone } from './EnemyAI';

// Importar componentes reutilizables existentes
import LevelHeader from '../../components/LevelHeader';
import MazeWalls from '../../components/game/MazeWalls';
import GameFloor from '../../components/game/GameFloor';
import GamePlayer from '../../components/game/GamePlayer';
import CameraController from '../../components/game/CameraController';
import Collectible from '../../components/game/Collectible';

// ============================================================================
// CONFIGURACIÓN DEL NIVEL
// ============================================================================

const LEVEL_CONFIG = {
  mapWidth: 28,
  mapHeight: 32,
  totalCollectibles: 140,
  targetScore: 150,
  levelNumber: 3,
  cameraConfig: {
    rotation: Math.PI / 4.8,
    distance: 7,
    height: 5,
    fov: 60,
  },
  playerRotation: 1.1,
  doghousePos: { x: 2.5, z: 4 }
};

// Configuración de enemigos del nivel
const ENEMY_CONFIGS = [
  {
    spawnTime: 5000,
    role: AIRoles.PATROL,
    spritesheets: {
      primary: '/assets/personajes/enemy_type_11.png',
      secondary: '/assets/personajes/enemy_type_12.png'
    }
  },
  {
    spawnTime: 10000,
    role: AIRoles.CHASER,
    spritesheets: {
      primary: '/assets/personajes/enemy_type_11.png',
      secondary: '/assets/personajes/enemy_type_12.png'
    }
  }
];

// Crear zonas de patrulla (fuera del componente para no recrear)
const patrolZones = createPatrolZones(
  LEVEL_CONFIG.mapWidth,
  LEVEL_CONFIG.mapHeight,
  2 // 2x2 = 4 zonas
);

// Walls (tu configuración existente)
const walls = [
  // Copiar tu configuración de muros aquí...
  { x: 0, z: 0, length: 28, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  // ... etc
];

// Función de colisión (tu función existente)
function checkCollision(x, z, walls) {
  const playerRadius = 0.3;
  for (const wall of walls) {
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

    if (
      x + playerRadius > minX &&
      x - playerRadius < maxX &&
      z + playerRadius > minZ &&
      z - playerRadius < maxZ
    ) {
      return true;
    }
  }
  return false;
}

// Generar coleccionables (tu función existente)
function generateCollectibles(count) {
  const collectibles = [];
  let id = 1;

  while (collectibles.length < count) {
    const x = Math.random() * (LEVEL_CONFIG.mapWidth - 2) + 1;
    const z = Math.random() * (LEVEL_CONFIG.mapHeight - 2) + 1;

    if (!checkCollision(x, z, walls)) {
      const tooClose = collectibles.some(c => {
        const distance = Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(z - c.z, 2));
        return distance < 0.8;
      });

      if (!tooClose) {
        collectibles.push({ id: id++, x, z, collected: false });
      }
    }
  }

  return collectibles;
}

const initialCollectibles = generateCollectibles(LEVEL_CONFIG.totalCollectibles);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function EjemploLevel({ onBack, onNextLevel, onLevelComplete }) {
  // Estado del juego
  const [playerPos, setPlayerPos] = useState({ x: 2, z: 2 });
  const [direction, setDirection] = useState({ x: 0, z: 0 });
  const [collectibles, setCollectibles] = useState(initialCollectibles);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [tokens, setTokens] = useState(0);

  // Estado de UI
  const [isPaused, setIsPaused] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Estado de poder
  const [powerActive, setPowerActive] = useState(false);
  const [powerTimeLeft, setPowerTimeLeft] = useState(0);
  const [isInvulnerable, setIsInvulnerable] = useState(false);

  // NUEVO: Estado de enemigos usando el sistema centralizado
  const [enemies, setEnemies] = useState([]);
  const enemyIdRef = useRef(1);
  const invulnerabilityTimerRef = useRef(null);
  const musicRef = useRef(null);

  // Calcular estadísticas
  const beersCollected = LEVEL_CONFIG.totalCollectibles - collectibles.filter(c => !c.collected).length;

  // =========================================================================
  // SPAWN DE ENEMIGOS CON ROLES
  // =========================================================================

  useEffect(() => {
    const timers = ENEMY_CONFIGS.map((config, index) => {
      return setTimeout(() => {
        setEnemies(prev => [
          ...prev,
          {
            id: enemyIdRef.current++,
            x: LEVEL_CONFIG.doghousePos.x,
            z: LEVEL_CONFIG.doghousePos.z,
            role: config.role,
            zone: assignZone(index, patrolZones),
            isReturning: false,
            spritesheets: config.spritesheets
          }
        ]);
      }, config.spawnTime);
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [showWinModal, showGameOverModal]);

  // =========================================================================
  // MANEJO DE ENEMIGOS
  // =========================================================================

  const handleEnemyPositionUpdate = (enemyId, x, z) => {
    setEnemies(prev => prev.map(enemy =>
      enemy.id === enemyId ? { ...enemy, x, z } : enemy
    ));
  };

  // Detección de colisión con jugador
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused || isInvulnerable) return;

      setEnemies(prev => prev.map(enemy => {
        const dist = Math.sqrt(
          (playerPos.x - enemy.x) ** 2 +
          (playerPos.z - enemy.z) ** 2
        );

        // Si el jugador tiene poder activo y toca al enemigo
        if (dist < 0.6 && powerActive && !enemy.isReturning) {
          setScore(s => s + 200);
          playSound('/assets/audio/sfx_eat_enemy.mp3');
          return { ...enemy, isReturning: true };
        }

        // Si el enemigo toca al jugador sin poder
        if (dist < 0.6 && !powerActive && !enemy.isReturning) {
          handleLoseLife();
        }

        // Si el enemigo llegó a casa
        if (enemy.isReturning) {
          const distToDoghouse = Math.sqrt(
            (enemy.x - LEVEL_CONFIG.doghousePos.x) ** 2 +
            (enemy.z - LEVEL_CONFIG.doghousePos.z) ** 2
          );
          if (distToDoghouse < 0.5) {
            return { ...enemy, isReturning: false };
          }
        }

        return enemy;
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [enemies, playerPos, powerActive, isPaused, isInvulnerable]);

  // =========================================================================
  // MANEJO DE VIDAS
  // =========================================================================

  const handleLoseLife = () => {
    const newLives = lives - 1;

    if (newLives <= 0) {
      setLives(0);
      setShowGameOverModal(true);
      setIsPaused(true);
      playSound('/assets/audio/sfx_game_over.mp3');
    } else {
      setLives(newLives);
      playSound('/assets/audio/sfx_lose_life.mp3');
      setIsInvulnerable(true);

      if (invulnerabilityTimerRef.current) {
        clearTimeout(invulnerabilityTimerRef.current);
      }

      invulnerabilityTimerRef.current = setTimeout(() => {
        setIsInvulnerable(false);
        invulnerabilityTimerRef.current = null;
      }, 3000);
    }
  };

  // =========================================================================
  // AUDIO
  // =========================================================================

  useEffect(() => {
    if (showIntroVideo) return;

    musicRef.current = new Audio('/assets/audio/music_funky.wav');
    musicRef.current.loop = true;
    musicRef.current.volume = 0.3;

    if (!isMuted) {
      musicRef.current.play().catch(e => console.log("Audio play failed:", e));
    }

    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, [showIntroVideo]);

  useEffect(() => {
    if (!musicRef.current) return;

    if (isMuted) {
      musicRef.current.pause();
    } else {
      musicRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  }, [isMuted]);

  const playSound = (path) => {
    if (isMuted) return;
    const sfx = new Audio(path);
    sfx.volume = 0.6;
    sfx.play().catch(e => console.log("SFX play failed:", e));
  };

  const toggleMute = () => setIsMuted(prev => !prev);

  // =========================================================================
  // MANEJO DE COLECCIONABLES
  // =========================================================================

  const handlePositionUpdate = (x, z) => {
    setPlayerPos({ x, z });

    setCollectibles(prev => {
      let changed = false;
      const next = prev.map(c => {
        if (!c.collected && Math.sqrt((x - c.x) ** 2 + (z - c.z) ** 2) < 0.5) {
          setScore(s => s + 10);
          playSound('/assets/audio/sfx_collect.mp3');
          changed = true;
          return { ...c, collected: true };
        }
        return c;
      });
      return changed ? next : prev;
    });
  };

  // =========================================================================
  // PODER
  // =========================================================================

  const activatePower = () => {
    if (tokens > 0 && !powerActive) {
      setTokens(prev => prev - 1);
      setPowerActive(true);
      setPowerTimeLeft(6);
    }
  };

  useEffect(() => {
    let interval;
    if (powerActive && powerTimeLeft > 0 && !isPaused) {
      interval = setInterval(() => {
        setPowerTimeLeft((prev) => {
          if (prev <= 1) {
            setPowerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [powerActive, powerTimeLeft, isPaused]);

  // =========================================================================
  // CONDICIONES DE VICTORIA
  // =========================================================================

  useEffect(() => {
    if (score >= LEVEL_CONFIG.targetScore && !showWinModal) {
      setIsPaused(true);
      setShowWinModal(true);
      if (onLevelComplete) {
        onLevelComplete(LEVEL_CONFIG.levelNumber - 1);
      }
    }
  }, [score, showWinModal, onLevelComplete]);

  // =========================================================================
  // CONTROLES
  // =========================================================================

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isPaused) return;

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
        case ' ':
          e.preventDefault();
          activatePower();
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
        (e.key === 'ArrowUp' && currentDir.z === -1) ||
        (e.key === 'ArrowDown' && currentDir.z === 1) ||
        (e.key === 'ArrowLeft' && currentDir.x === -1) ||
        (e.key === 'ArrowRight' && currentDir.x === 1)
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
  }, [direction, isPaused, tokens, powerActive]);

  // =========================================================================
  // REINICIAR NIVEL
  // =========================================================================

  const restartLevel = () => {
    setPlayerPos({ x: 2, z: 2 });
    setDirection({ x: 0, z: 0 });
    setCollectibles(initialCollectibles.map(c => ({ ...c, collected: false })));
    setScore(0);
    setLives(3);
    setTokens(0);
    setEnemies([]);
    enemyIdRef.current = 1;
    setPowerActive(false);
    setPowerTimeLeft(0);
    setIsInvulnerable(false);
    setIsPaused(false);
    setShowSettingsModal(false);
    setShowGameOverModal(false);
    setShowWinModal(false);

    if (invulnerabilityTimerRef.current) {
      clearTimeout(invulnerabilityTimerRef.current);
      invulnerabilityTimerRef.current = null;
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="game-container">
      <Canvas
        camera={{
          position: [14, 16, 24],
          fov: LEVEL_CONFIG.cameraConfig.fov
        }}
        shadows
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[14, 20, 16]} intensity={1.0} />

        <MazeWalls walls={walls} />
        <GameFloor
          position={[14, -0.1, 16]}
          width={50}
          depth={50}
          textureRepeat={[10, 10]}
        />

        <GamePlayer
          position={playerPos}
          direction={direction}
          onPositionUpdate={handlePositionUpdate}
          checkCollision={(x, z) => checkCollision(x, z, walls)}
          rotation={LEVEL_CONFIG.playerRotation}
          isPaused={isPaused}
          isInvulnerable={isInvulnerable}
        />

        {collectibles.filter(c => !c.collected).map(c => (
          <Collectible key={c.id} position={c} />
        ))}

        {/* NUEVO: Renderizado simplificado de enemigos */}
        {enemies.map(enemy => (
          <Enemy
            key={enemy.id}
            enemyId={enemy.id}
            position={{ x: enemy.x, z: enemy.z }}
            playerPos={playerPos}
            playerDirection={direction}
            walls={walls}
            onPositionUpdate={(x, z) => handleEnemyPositionUpdate(enemy.id, x, z)}
            checkCollision={(x, z) => checkCollision(x, z, walls)}
            isPowerActive={powerActive}
            isPaused={isPaused}
            rotation={LEVEL_CONFIG.playerRotation}
            role={enemy.role}
            assignedZone={enemy.zone}
            doghousePos={LEVEL_CONFIG.doghousePos}
            isReturning={enemy.isReturning}
            spritesheet1Path={enemy.spritesheets.primary}
            spritesheet2Path={enemy.spritesheets.secondary}
            debugMode={false} // Cambiar a true para debug
          />
        ))}

        <CameraController
          targetX={playerPos.x}
          targetZ={playerPos.z}
          rotation={LEVEL_CONFIG.cameraConfig.rotation}
          distance={LEVEL_CONFIG.cameraConfig.distance}
          height={LEVEL_CONFIG.cameraConfig.height}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="ui-overlay">
        <LevelHeader
          lives={lives}
          levelNumber={LEVEL_CONFIG.levelNumber}
          beersCollected={beersCollected}
          score={score}
        />

        {/* Botón de poder */}
        <div className="power-button-container">
          <button
            onClick={activatePower}
            disabled={tokens === 0}
            className="power-button"
          >
            <img
              src="/assets/poderes/power_icon.png"
              alt="Power"
              className={`power-button-image ${tokens === 0 ? 'disabled' : ''}`}
            />
            <div className="token-badge">
              <span className="token-text">{tokens}</span>
            </div>
            {powerActive && (
              <div className="timer-overlay">
                <span className="timer-text">{powerTimeLeft}</span>
              </div>
            )}
          </button>
        </div>

        {/* Botón de pausa */}
        <button
          className="settings-button"
          onClick={() => {
            setIsPaused(true);
            setShowSettingsModal(true);
          }}
        >
          <Pause size={24} />
        </button>

        {/* Modales (Settings, GameOver, Victory) - Tu código existente */}
        {/* ... */}
      </div>

      {/* Video de introducción */}
      {showIntroVideo && (
        <div className="intro-video-overlay">
          <video
            src="/assets/videos/intro_level.mp4"
            autoPlay
            onEnded={() => setShowIntroVideo(false)}
            onClick={() => setShowIntroVideo(false)}
            onError={() => setShowIntroVideo(false)}
          />
        </div>
      )}
    </div>
  );
}
