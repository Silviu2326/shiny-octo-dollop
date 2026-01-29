import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import * as THREE from 'three';
import './Level3_5.css';
import LevelHeader from '../components/LevelHeader';
import EnemyAdvanced from '../components/game/EnemyAdvanced';
import { AIRoles, createPatrolZones, assignZone } from './ai/EnemyAI';
import { EnemyCoordinator } from './ai/EnemyAI_Advanced';
import { getGameUI } from '../utils/translations';

// Mapa reducido: 18x22 (original era 28x32)
const walls = [
  // Background walls
  { x: -2, z: -10, length: 40, height: 10, thickness: 1, orientation: 'vertical' },
  { x: -10, z: -2, length: 40, height: 10, thickness: 1, orientation: 'horizontal' },

  // SECTION 1: EXTERIOR BORDERS (18x22)
  { x: 0, z: 0, length: 18, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 0, z: 22, length: 18, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 0, z: 0, length: 22, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 18, z: 0, length: 22, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECTION 2: OUTER RING with Choke Points
  { x: 3, z: 3, length: 5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 10, z: 3, length: 5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 3, z: 19, length: 5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 10, z: 19, length: 5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 3, z: 3, length: 16, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 15, z: 3, length: 16, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECTION 3: MIDDLE RING
  { x: 6, z: 6, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 6, z: 16, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 6, z: 6, length: 10, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 12, z: 6, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 12, z: 12, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECTION 4: INNER AREA (con aberturas)
  // Horizontal walls removed
  { x: 8, z: 9, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 8, z: 11.5, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 10.5, z: 9, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 10.5, z: 11.5, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECTION 5: DECORATIVE OBSTACLES - REMOVED
];

// Paredes exteriores (índices 0-3 en el array walls, más las de background)
const EXTERIOR_WALL_INDICES = [0, 1, 2, 3, 4, 5]; // Background walls + border walls

function checkCollision(x, z, walls, ghostMode = false) {
  const playerRadius = 0.3;

  for (let i = 0; i < walls.length; i++) {
    const wall = walls[i];

    // En modo fantasma, solo colisionar con paredes exteriores
    if (ghostMode && !EXTERIOR_WALL_INDICES.includes(i)) {
      continue;
    }

    const isHorizontal = wall.orientation === 'horizontal';

    let wallMinX, wallMaxX, wallMinZ, wallMaxZ;

    if (isHorizontal) {
      wallMinX = wall.x;
      wallMaxX = wall.x + wall.length;
      wallMinZ = wall.z - wall.thickness / 2;
      wallMaxZ = wall.z + wall.thickness / 2;
    } else {
      wallMinX = wall.x - wall.thickness / 2;
      wallMaxX = wall.x + wall.thickness / 2;
      wallMinZ = wall.z;
      wallMaxZ = wall.z + wall.length;
    }

    if (
      x + playerRadius > wallMinX &&
      x - playerRadius < wallMaxX &&
      z + playerRadius > wallMinZ &&
      z - playerRadius < wallMaxZ
    ) {
      return true;
    }
  }

  return false;
}

function generateCollectibles(count) {
  const collectibles = [];
  let id = 1;

  while (collectibles.length < count) {
    const x = Math.random() * 16 + 1;
    const z = Math.random() * 20 + 1;

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

// 35 cervezas para el mapa reducido
const initialCollectibles = generateCollectibles(35);

// Preload enemy textures
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_11.png');
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_12.png');

// --- 3D Components ---

const Wall = React.memo(({ wallData }) => {
  const isHorizontal = wallData.orientation === 'horizontal';
  const centerX = isHorizontal ? wallData.x + wallData.length / 2 : wallData.x;
  const centerZ = isHorizontal ? wallData.z : wallData.z + wallData.length / 2;

  const texture = useLoader(THREE.TextureLoader, '/assets/texturas/wall_texture_2.png');

  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(wallData.length, 1);

  return (
    <mesh position={[centerX, wallData.height / 2, centerZ]}>
      <boxGeometry
        args={isHorizontal
          ? [wallData.length, wallData.height, wallData.thickness]
          : [wallData.thickness, wallData.height, wallData.length]
        }
      />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
});

function Maze({ walls }) {
  const memoizedWalls = useMemo(() => {
    return walls.map((wall, index) => (
      <Wall key={index} wallData={wall} />
    ));
  }, [walls]);

  return <>{memoizedWalls}</>;
}

function Player({ position, direction, onPositionUpdate, onCheckCollisions, walls, rotation, isPaused, isInvulnerable, isGhostMode }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/player.png');
  const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/player_secondary.png');

  const [currentFrame, setCurrentFrame] = useState(0);
  const [pulseTime, setPulseTime] = useState(0);
  const [ghostTime, setGhostTime] = useState(0);
  const [lastDirection, setLastDirection] = useState({ x: 1, z: 0 });

  useMemo(() => {
    spritesheet1.magFilter = THREE.NearestFilter;
    spritesheet1.minFilter = THREE.NearestFilter;
    spritesheet2.magFilter = THREE.NearestFilter;
    spritesheet2.minFilter = THREE.NearestFilter;
  }, [spritesheet1, spritesheet2]);

  const frameCount = 8;
  const animationSpeed = 10;

  useFrame((state, delta) => {
    if (isPaused) return;

    if (isInvulnerable) {
      setPulseTime(prev => prev + delta * 8);
    }

    if (isGhostMode) {
      setGhostTime(prev => prev + delta * 4);
    }

    let currentX = position.x;
    let currentZ = position.z;
    let moved = false;

    if (direction.x !== 0 || direction.z !== 0) {
      setLastDirection(direction);
      const speed = isGhostMode ? 5.0 : 4.5; // Ligeramente más rápido en modo fantasma
      const proposedX = position.x + direction.x * speed * delta;
      const proposedZ = position.z + direction.z * speed * delta;

      // Usar modo fantasma en la colisión
      if (!checkCollision(proposedX, proposedZ, walls, isGhostMode)) {
        onPositionUpdate(proposedX, proposedZ);
        moved = true;
        currentX = proposedX;
        currentZ = proposedZ;
      }

      const time = state.clock.getElapsedTime();
      const newFrame = Math.floor(time * animationSpeed) % frameCount;
      setCurrentFrame(newFrame);
    }

    if (!moved && onCheckCollisions) {
      onCheckCollisions(currentX, currentZ);
    }

    // Animación del aura fantasma
    if (glowRef.current && isGhostMode) {
      glowRef.current.rotation.z += delta * 2;
      const scale = 1.3 + Math.sin(ghostTime) * 0.1;
      glowRef.current.scale.set(scale, scale, 1);
    }
  });

  const getCurrentTexture = () => {
    if (lastDirection.z < 0) return spritesheet1;
    if (lastDirection.x < 0) return spritesheet1;
    if (lastDirection.x > 0) return spritesheet2;
    if (lastDirection.z > 0) return spritesheet2;
    return spritesheet2;
  };

  const getFlipX = () => {
    if (lastDirection.x < 0) return -1;
    if (lastDirection.z > 0) return -1;
    return 1;
  };

  const texture = getCurrentTexture().clone();
  texture.repeat.set(1 / frameCount, 1);
  texture.offset.x = currentFrame / frameCount;

  // Calcular opacidad: invulnerable parpadea, ghost mode es 0.4
  let finalOpacity = 1;
  if (isGhostMode) {
    finalOpacity = 0.4 + Math.sin(ghostTime) * 0.1; // 0.3 - 0.5 oscilante
  } else if (isInvulnerable) {
    finalOpacity = Math.sin(pulseTime) * 0.5 + 0.5;
  }

  // Color del fantasma (azul cian brillante)
  const ghostColor = isGhostMode ? new THREE.Color(0.3, 0.8, 1.0) : new THREE.Color(1, 1, 1);

  return (
    <group position={[position.x, 0.5, position.z]}>
      {/* Aura fantasma */}
      {isGhostMode && (
        <mesh
          ref={glowRef}
          rotation={[-Math.PI / 4, rotation, 0]}
        >
          <ringGeometry args={[0.5, 0.8, 32]} />
          <meshBasicMaterial
            color={0x00ffff}
            transparent={true}
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Jugador */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 4, rotation, 0]}
        scale={[getFlipX(), 1, 1]}
      >
        <planeGeometry args={[1.1, 1.1]} />
        <meshStandardMaterial
          map={texture}
          transparent={true}
          side={THREE.DoubleSide}
          alphaTest={0.3}
          depthWrite={!isGhostMode}
          opacity={finalOpacity}
          color={ghostColor}
          emissive={isGhostMode ? 0x00aaff : 0x000000}
          emissiveIntensity={isGhostMode ? 0.5 : 0}
        />
      </mesh>

      {/* Partículas fantasma */}
      {isGhostMode && (
        <>
          <mesh rotation={[-Math.PI / 4, rotation + ghostTime, 0]} position={[0, 0.2, 0]}>
            <circleGeometry args={[0.1, 8]} />
            <meshBasicMaterial color={0x00ffff} transparent opacity={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 4, rotation - ghostTime * 1.5, 0]} position={[0, -0.1, 0]}>
            <circleGeometry args={[0.08, 8]} />
            <meshBasicMaterial color={0x88ffff} transparent opacity={0.4} />
          </mesh>
        </>
      )}
    </group>
  );
}

function InstancedCollectibles({ collectibles }) {
  const meshRef = useRef();
  const texture = useLoader(THREE.TextureLoader, '/assets/cervezas/collectible_morena.png');

  useMemo(() => {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
  }, [texture]);

  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!meshRef.current) return;

    collectibles.forEach((collectible, index) => {
      tempObject.position.set(collectible.x, 0.4, collectible.z);
      tempObject.rotation.set(-Math.PI / 4, Math.PI / 4.8, 0);

      if (collectible.collected) {
        tempObject.scale.set(0, 0, 0);
      } else {
        tempObject.scale.set(1, 1, 1);
      }

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(index, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, collectibles.length]}>
      <planeGeometry args={[0.6, 0.6]} />
      <meshStandardMaterial
        map={texture}
        transparent={true}
        side={THREE.DoubleSide}
        alphaTest={0.5}
        depthWrite={true}
        depthTest={true}
      />
    </instancedMesh>
  );
}

function Barrel({ position }) {
  const texture = useLoader(THREE.TextureLoader, '/assets/barriles/unnamed__4_-removebg-preview (1).png');

  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  return (
    <mesh position={[position.x, 0.5, position.z]} rotation={[-Math.PI / 8, 0, 0]}>
      <planeGeometry args={[1.0, 1.0]} />
      <meshStandardMaterial
        map={texture}
        transparent={true}
        side={THREE.DoubleSide}
        alphaTest={0.5}
        depthWrite={false}
      />
    </mesh>
  );
}

function Doghouse({ position }) {
  const meshRef = useRef();
  const texture = useLoader(THREE.TextureLoader, '/assets/casetas/image-removebg-preview (6).png');

  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  useFrame(({ camera }) => {
    if (meshRef.current) {
      const direction = new THREE.Vector3();
      direction.subVectors(camera.position, meshRef.current.position);
      direction.y = 0;
      direction.normalize();
      const angle = Math.atan2(direction.x, direction.z);
      meshRef.current.rotation.set(-Math.PI / 6, angle, 0);
    }
  });

  return (
    <mesh ref={meshRef} position={[position.x, 0.6, position.z]}>
      <planeGeometry args={[1.2, 1.2]} />
      <meshStandardMaterial
        map={texture}
        transparent={true}
        side={THREE.DoubleSide}
        alphaTest={0.5}
      />
    </mesh>
  );
}

function Floor() {
  const texture = useLoader(THREE.TextureLoader, '/assets/suelos/floor_texture.jpg');

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(40, 40);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9, -0.1, 11]}>
      <planeGeometry args={[150, 150]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

function SpecialBonus({ position }) {
  const texture = useLoader(THREE.TextureLoader, '/assets/bonus/77ed3edf-ece4-41e1-8707-b34d4ee4834e.png');
  const meshRef = useRef();

  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = 0.5 + Math.sin(clock.getElapsedTime() * 3) * 0.1;
      meshRef.current.rotation.y += 0.02;
    }
  });

  return (
    <mesh ref={meshRef} position={[position.x, 0.5, position.z]} rotation={[0, 0, 0]}>
      <planeGeometry args={[0.8, 0.8]} />
      <meshStandardMaterial
        map={texture}
        transparent={true}
        side={THREE.DoubleSide}
        alphaTest={0.5}
        depthWrite={false}
        emissive={0xffff00}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

function CameraController({ targetX, targetZ, rotation, distance, height }) {
  useFrame(({ camera }) => {
    const offsetX = Math.sin(rotation) * distance;
    const offsetZ = Math.cos(rotation) * distance;

    camera.position.x = targetX + offsetX;
    camera.position.y = height;
    camera.position.z = targetZ + offsetZ;
    camera.lookAt(targetX, 0, targetZ);
  });

  return null;
}

// --- Star Rating Component ---

function StarRating({ stars }) {
  return (
    <div className="star-rating">
      {[...Array(3)].map((_, index) => (
        <Star
          key={index}
          size={32}
          fill={index < stars ? "#FFD700" : "none"}
          color={index < stars ? "#FFD700" : "#555"}
          strokeWidth={index < stars ? 0 : 2}
        />
      ))}
    </div>
  );
}

// --- Main Component ---

const doghousePos = { x: 2.5, z: 3 };

export default function Level3_5({ onBack, onNextLevel, onLevelComplete, language = 'en' }) {
  const gameUI = getGameUI(language);
  const [playerPos, setPlayerPos] = useState({ x: 2, z: 2 });
  const [direction, setDirection] = useState({ x: 0, z: 0 });
  const [collectibles, setCollectibles] = useState(initialCollectibles);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [beersCollected, setBeersCollected] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [specialBonuses, setSpecialBonuses] = useState([]);
  const [bonusFlags, setBonusFlags] = useState({ p30: false, p70: false });
  const [startTime, setStartTime] = useState(Date.now());
  const [finalScoreStats, setFinalScoreStats] = useState({ score: 0, bonus: 0, total: 0 });

  // Patrol zones for smaller map
  const patrolZones = useMemo(() => createPatrolZones(18, 22, 2), []);

  // Enemy coordinator for advanced AI coordination
  const coordinatorRef = useRef(new EnemyCoordinator());

  const [barrels, setBarrels] = useState([
    { id: 1, x: 3, z: 2.5, collected: false },
    { id: 2, x: 5, z: 11, collected: false },
    { id: 3, x: 14, z: 11, collected: false },
  ]);
  const [enemies, setEnemies] = useState([]);
  const enemyIdRef = useRef(1);
  const [powerActive, setPowerActive] = useState(false);
  const [powerTimeLeft, setPowerTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const invulnerabilityTimerRef = useRef(null);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const comboTimerRef = useRef(null);
  const [livesLost, setLivesLost] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(true);

  // Refs for optimization
  const collectedBeersRef = useRef(new Set());
  const collectedBarrelsRef = useRef(new Set());
  const collectedBonusesRef = useRef(new Set());

  // Track pressed keys
  const keysPressed = useRef(new Set());
  const [, forceUpdate] = useState({});

  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [enemyAlert, setEnemyAlert] = useState(null);
  const [powerAlert, setPowerAlert] = useState(null);

  const showEnemyAlert = (text) => {
    setEnemyAlert(text);
    setTimeout(() => {
      setEnemyAlert(null);
    }, 2000);
  };

  const showPowerAlert = (text) => {
    setPowerAlert(text);
    setTimeout(() => {
      setPowerAlert(null);
    }, 2000);
  };

  // --- Sound Functions ---

  const playCollectSound = () => {
    if (isMuted) return;
    const sfx = new Audio('/assets/audio/sfx_collect.mp3');
    sfx.volume = 0.6;
    sfx.play().catch(e => console.log("SFX play failed:", e));
  };

  const playBarrelSound = () => {
    if (isMuted) return;
    const sfx = new Audio('/assets/audio/sfx_barrel.mp3');
    sfx.volume = 1.0;
    sfx.play().catch(e => console.log("SFX play failed:", e));
  };

  const playLoseLifeSound = () => {
    if (isMuted) return;
    const sfx = new Audio('/assets/audio/sfx_lose_life.mp3');
    sfx.volume = 0.6;
    sfx.play().catch(e => console.log("SFX play failed:", e));
  };

  const playGameOverSound = () => {
    if (isMuted) return;
    const sfx = new Audio('/assets/audio/sfx_game_over.mp3');
    sfx.volume = 0.6;
    sfx.play().catch(e => console.log("SFX play failed:", e));
  };

  // Game Loop
  const checkGameInteractions = React.useCallback((x, z) => {
    // Check collision with enemies
    // En modo fantasma (powerActive), el jugador atraviesa enemigos sin daño
    for (const enemy of enemies) {
      const dist = Math.sqrt(Math.pow(x - enemy.x, 2) + Math.pow(z - enemy.z, 2));
      if (dist < 0.8) {
        // En modo fantasma, ignorar completamente la colisión con enemigos
        if (powerActive) {
          continue; // Atravesar sin hacer nada
        }

        if (!isInvulnerable && !enemy.isReturning) {
          const newLives = lives - 1;
          setLivesLost(true);

          if (newLives <= 0) {
            setLives(0);

            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const timeBonus = Math.max(0, Math.floor((180 - elapsedSeconds) * 10));

            let finalBonus = 0;
            if (beersCollected / initialCollectibles.length >= 0.7) {
              finalBonus = timeBonus;
            }

            setFinalScoreStats({
              score: score,
              bonus: finalBonus,
              total: score + finalBonus
            });

            setShowGameOverModal(true);
            setIsPaused(true);
            playGameOverSound();
          } else {
            setLives(newLives);
            playLoseLifeSound();

            setIsInvulnerable(true);

            if (invulnerabilityTimerRef.current) {
              clearTimeout(invulnerabilityTimerRef.current);
            }

            invulnerabilityTimerRef.current = setTimeout(() => {
              setIsInvulnerable(false);
              invulnerabilityTimerRef.current = null;
            }, 3000);
          }
          return;
        }
      }
    }

    // Special Bonuses collision
    let bonusHitId = null;
    for (const bonus of specialBonuses) {
      if (bonus.collected || collectedBonusesRef.current.has(bonus.id)) continue;
      const distance = Math.sqrt(
        Math.pow(x - bonus.x, 2) + Math.pow(z - bonus.z, 2)
      );
      if (distance < 0.6) {
        bonusHitId = bonus.id;
        collectedBonusesRef.current.add(bonus.id);
      }
    }

    if (bonusHitId) {
      setSpecialBonuses(prev => prev.map(b => b.id === bonusHitId ? { ...b, collected: true } : b));
      setScore(p => p + 500);
      playCollectSound();
    }

    // Barrels collision
    let barrelHitId = null;
    for (const barrel of barrels) {
      if (barrel.collected || collectedBarrelsRef.current.has(barrel.id)) continue;
      const distance = Math.sqrt(
        Math.pow(x - barrel.x, 2) + Math.pow(z - barrel.z, 2)
      );
      if (distance < 0.8) {
        barrelHitId = barrel.id;
        collectedBarrelsRef.current.add(barrel.id);
      }
    }

    if (barrelHitId) {
      setBarrels(prev => prev.map(b => b.id === barrelHitId ? { ...b, collected: true } : b));
      setScore(p => p + 50);
      if (tokens < 3) {
        setTokens(p => p + 1);
      }
      playBarrelSound();
    }

    // Collectibles collision
    let collectibleHitId = null;
    for (const collectible of collectibles) {
      if (collectible.collected || collectedBeersRef.current.has(collectible.id)) continue;
      const distance = Math.sqrt(Math.pow(x - collectible.x, 2) + Math.pow(z - collectible.z, 2));
      if (distance < 0.5) {
        collectibleHitId = collectible.id;
        collectedBeersRef.current.add(collectible.id);
      }
    }

    if (collectibleHitId) {
      setCollectibles(prev => prev.map(c => c.id === collectibleHitId ? { ...c, collected: true } : c));

      setComboMultiplier(1.5);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => {
        setComboMultiplier(1);
      }, 3000);

      setScore(p => p + Math.floor(10 * comboMultiplier));
      setBeersCollected(p => p + 1);
      playCollectSound();
    }
  }, [enemies, isPaused, isInvulnerable, specialBonuses, barrels, collectibles, tokens, lives, score, comboMultiplier, powerActive]);

  const handlePositionUpdate = React.useCallback((newX, newZ) => {
    if (isPaused) return;

    setPlayerPos({ x: newX, z: newZ });
    checkGameInteractions(newX, newZ);
  }, [isPaused, checkGameInteractions]);

  const cameraConfig = {
    rotation: Math.PI / 4.8,
    distance: 6,
    height: 4.5,
    fov: 60,
  };

  const playerRotation = 1.1;

  // Audio Ref
  const musicRef = useRef(null);

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
    if (!showIntroVideo) {
      setStartTime(Date.now());
    }
  }, [showIntroVideo]);

  useEffect(() => {
    if (!musicRef.current) return;

    if (isMuted) {
      musicRef.current.pause();
    } else {
      musicRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  }, [isMuted]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!musicRef.current) return;

      if (document.visibilityState === 'hidden') {
        musicRef.current.pause();
      } else if (document.visibilityState === 'visible' && !isMuted) {
        musicRef.current.play().catch(e => console.log("Audio play failed:", e));
      }
    };

    const handlePageHide = () => {
      if (musicRef.current) {
        musicRef.current.pause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const restartLevel = () => {
    setPlayerPos({ x: 2, z: 2 });
    setDirection({ x: 0, z: 0 });
    setCollectibles(initialCollectibles.map(c => ({ ...c, collected: false })));
    setScore(0);
    setLives(3);
    setBeersCollected(0);
    setTokens(0);
    setBarrels([
      { id: 1, x: 3, z: 2.5, collected: false },
      { id: 2, x: 5, z: 11, collected: false },
      { id: 3, x: 14, z: 11, collected: false },
    ]);
    setEnemies([]);
    enemyIdRef.current = 1;
    setPowerActive(false);
    setPowerTimeLeft(0);
    setSpecialBonuses([]);
    setBonusFlags({ p30: false, p70: false });
    setIsInvulnerable(false);
    setIsPaused(false);
    setShowSettingsModal(false);
    setShowGameOverModal(false);
    setShowWinModal(false);
    setComboMultiplier(1);
    setLivesLost(false);
    setStartTime(Date.now());

    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    if (invulnerabilityTimerRef.current) {
      clearTimeout(invulnerabilityTimerRef.current);
      invulnerabilityTimerRef.current = null;
    }

    collectedBeersRef.current.clear();
    collectedBarrelsRef.current.clear();
    collectedBonusesRef.current.clear();
    keysPressed.current.clear();

    // Reset coordinator
    coordinatorRef.current = new EnemyCoordinator();
  };

  const activatePower = () => {
    if (tokens > 0 && !powerActive) {
      setTokens(prev => prev - 1);
      setPowerActive(true);
      setPowerTimeLeft(6);
      showPowerAlert("¡FASE FANTASMA!");
    }
  };

  useEffect(() => {
    let interval;
    if (powerActive && powerTimeLeft > 0) {
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
  }, [powerActive, powerTimeLeft]);

  useEffect(() => {
    return () => {
      if (invulnerabilityTimerRef.current) {
        clearTimeout(invulnerabilityTimerRef.current);
      }
    };
  }, []);

  // Spawn 4 enemies with advanced AI - different roles
  useEffect(() => {
    if (showIntroVideo) return;

    // Enemy 1: CHASER - aggressive pursuer
    const timer1 = setTimeout(() => {
      console.log("Spawning Enemy 1 (CHASER)");
      setEnemies(prevEnemies => {
        console.log("Previous enemies:", prevEnemies);
        return [
          ...prevEnemies,
          {
            id: enemyIdRef.current++,
            x: doghousePos.x,
            z: doghousePos.z,
            role: AIRoles.CHASER,
            zone: assignZone(0, patrolZones),
            isReturning: false
          }
        ];
      });
      showEnemyAlert("¡Apareció un perseguidor!");
    }, 3000);

    // Enemy 2: CUTTER - tries to cut off player path
    const timer2 = setTimeout(() => {
      setEnemies(prevEnemies => [
        ...prevEnemies,
        {
          id: enemyIdRef.current++,
          x: doghousePos.x,
          z: doghousePos.z,
          role: AIRoles.CUTTER,
          zone: assignZone(1, patrolZones),
          isReturning: false
        }
      ]);
      showEnemyAlert("¡Cuidado, otro enemigo!");
    }, 7000);

    // Enemy 3: FLANKER - tries to surround
    const timer3 = setTimeout(() => {
      setEnemies(prevEnemies => [
        ...prevEnemies,
        {
          id: enemyIdRef.current++,
          x: doghousePos.x,
          z: doghousePos.z,
          role: AIRoles.FLANKER,
          zone: assignZone(2, patrolZones),
          isReturning: false
        }
      ]);
      showEnemyAlert("¡Un flanqueador aparece!");
    }, 12000);

    // Enemy 4: AMBUSHER - waits and ambushes
    const timer4 = setTimeout(() => {
      setEnemies(prevEnemies => [
        ...prevEnemies,
        {
          id: enemyIdRef.current++,
          x: doghousePos.x,
          z: doghousePos.z,
          role: AIRoles.AMBUSHER,
          zone: assignZone(3, patrolZones),
          isReturning: false
        }
      ]);
      showEnemyAlert("¡Emboscador en el mapa!");
    }, 18000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [showWinModal, showGameOverModal, showIntroVideo]);

  // Handle enemies returning to base
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused) return;

      setEnemies(prev => prev.map(enemy => {
        if (enemy.isReturning) {
          const distToDoghouse = Math.sqrt(
            Math.pow(enemy.x - doghousePos.x, 2) +
            Math.pow(enemy.z - doghousePos.z, 2)
          );
          if (distToDoghouse < 0.5) {
            return { ...enemy, isReturning: false };
          }
        }
        return enemy;
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    const totalBeers = initialCollectibles.length;
    if (totalBeers === 0) return;

    const percentage = beersCollected / totalBeers;

    const findFreePosition = () => {
      let x, z;
      let valid = false;
      let attempts = 0;
      while (!valid && attempts < 50) {
        x = Math.random() * 16 + 1;
        z = Math.random() * 20 + 1;
        if (!checkCollision(x, z, walls)) {
          valid = true;
        }
        attempts++;
      }
      return valid ? { x, z } : { x: 9, z: 11 };
    };

    if (percentage >= 0.3 && !bonusFlags.p30) {
      const pos = findFreePosition();
      setSpecialBonuses(prev => [...prev, { id: 'bonus30', x: pos.x, z: pos.z, collected: false }]);
      setBonusFlags(prev => ({ ...prev, p30: true }));
    }

    if (percentage >= 0.7 && !bonusFlags.p70) {
      const pos = findFreePosition();
      setSpecialBonuses(prev => [...prev, { id: 'bonus70', x: pos.x, z: pos.z, collected: false }]);
      setBonusFlags(prev => ({ ...prev, p70: true }));
    }

  }, [beersCollected, bonusFlags]);

  // Direction input handlers
  const handleDirectionInput = (dir) => {
    if (!dir) return;
    keysPressed.current.add(dir);
    forceUpdate({});

    switch (dir) {
      case 'up': setDirection({ x: 0, z: -1 }); break;
      case 'down': setDirection({ x: 0, z: 1 }); break;
      case 'left': setDirection({ x: -1, z: 0 }); break;
      case 'right': setDirection({ x: 1, z: 0 }); break;
    }
  };

  const handleDirectionRelease = (dir) => {
    if (!dir) return;
    keysPressed.current.delete(dir);
    forceUpdate({});

    if (keysPressed.current.size === 0) {
      setDirection({ x: 0, z: 0 });
    } else {
      const remaining = Array.from(keysPressed.current);
      const lastActive = remaining[remaining.length - 1];
      switch (lastActive) {
        case 'up': setDirection({ x: 0, z: -1 }); break;
        case 'down': setDirection({ x: 0, z: 1 }); break;
        case 'left': setDirection({ x: -1, z: 0 }); break;
        case 'right': setDirection({ x: 1, z: 0 }); break;
      }
    }
  };

  const isPressed = (dir) => keysPressed.current.has(dir);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showIntroVideo) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      const key = e.key.toLowerCase();
      let newDirection = null;

      if (['arrowup', 'w'].includes(key)) newDirection = 'up';
      if (['arrowdown', 's'].includes(key)) newDirection = 'down';
      if (['arrowleft', 'a'].includes(key)) newDirection = 'left';
      if (['arrowright', 'd'].includes(key)) newDirection = 'right';

      if (newDirection) {
        handleDirectionInput(newDirection);
      }

      if (e.key === ' ') {
        activatePower();
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      let releasedDirection = null;

      if (['arrowup', 'w'].includes(key)) releasedDirection = 'up';
      if (['arrowdown', 's'].includes(key)) releasedDirection = 'down';
      if (['arrowleft', 'a'].includes(key)) releasedDirection = 'left';
      if (['arrowright', 'd'].includes(key)) releasedDirection = 'right';

      if (releasedDirection) {
        handleDirectionRelease(releasedDirection);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [showIntroVideo, activatePower]);

  const handleEnemyPositionUpdate = (id, x, z) => {
    setEnemies(prev => prev.map(enemy =>
      enemy.id === id ? { ...enemy, x, z } : enemy
    ));
  };

  useEffect(() => {
    // Victory condition: Collect all 35 beers
    if (beersCollected >= 35 && !showWinModal) {
      setIsPaused(true);
      setShowWinModal(true);

      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const timeBonus = Math.max(0, Math.floor((180 - elapsedSeconds) * 10));

      setFinalScoreStats({
        score: score,
        bonus: timeBonus,
        total: score + timeBonus
      });

      if (onLevelComplete) {
        onLevelComplete(3); // Level 3.5 completed
      }
    }
  }, [beersCollected, showWinModal, onLevelComplete]);

  return (
    <div className="game-container">
      <Canvas camera={{ position: [9, 12, 18], fov: cameraConfig.fov }} shadows>
        <ambientLight intensity={1.5} />
        <directionalLight position={[9, 15, 11]} intensity={1.0} />

        <Maze walls={walls} />
        <Floor />

        <InstancedCollectibles collectibles={collectibles} />

        {barrels.filter(barrel => !barrel.collected).map(barrel => (
          <Barrel
            key={barrel.id}
            position={{ x: barrel.x, z: barrel.z }}
          />
        ))}

        {specialBonuses.filter(b => !b.collected).map(b => (
          <SpecialBonus key={b.id} position={{ x: b.x, z: b.z }} />
        ))}

        <Doghouse position={doghousePos} />

        {/* 4 Enemies with Advanced AI */}
        {enemies.map(enemy => (
          <EnemyAdvanced
            key={enemy.id}
            enemyId={enemy.id}
            position={{ x: enemy.x, z: enemy.z }}
            playerPos={playerPos}
            playerDirection={direction}
            walls={walls}
            onPositionUpdate={(x, z) => handleEnemyPositionUpdate(enemy.id, x, z)}
            checkCollision={checkCollision}
            isPowerActive={powerActive}
            isPaused={isPaused}
            rotation={playerRotation}
            role={enemy.role}
            assignedZone={enemy.zone}
            doghousePos={doghousePos}
            isReturning={enemy.isReturning}
            coordinator={coordinatorRef.current}
            spritesheet1Path="/assets/personajes/enemy_type_11.png"
            spritesheet2Path="/assets/personajes/enemy_type_12.png"
            debugMode={false}
          />
        ))}

        <Player
          position={playerPos}
          direction={direction}
          onPositionUpdate={handlePositionUpdate}
          onCheckCollisions={checkGameInteractions}
          walls={walls}
          rotation={playerRotation}
          isPaused={isPaused}
          isInvulnerable={isInvulnerable}
          isGhostMode={powerActive}
        />
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
        <LevelHeader
          levelNumber={"3.5"}
          lives={lives}
          score={score}
          beersCollected={beersCollected}
          totalBeers={35}
          onBack={onBack}
          onSettingsClick={() => {
            setIsPaused(true);
            setShowSettingsModal(true);
          }}
          language={language}
        />
        {/* D-Pad Controls */}
        <div className="d-pad-container">
          <div className="d-pad-row">
            <button
              className={`d-pad-button up ${isPressed('up') ? 'active' : ''}`}
              onPointerDown={(e) => { e.preventDefault(); handleDirectionInput('up'); }}
              onPointerUp={(e) => { e.preventDefault(); handleDirectionRelease('up'); }}
              onPointerLeave={(e) => { e.preventDefault(); handleDirectionRelease('up'); }}
              onPointerEnter={(e) => { if (e.buttons > 0) handleDirectionInput('up'); }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <ArrowUp size={24} />
            </button>
          </div>
          <div className="d-pad-row middle">
            <button
              className={`d-pad-button left ${isPressed('left') ? 'active' : ''}`}
              onPointerDown={(e) => { e.preventDefault(); handleDirectionInput('left'); }}
              onPointerUp={(e) => { e.preventDefault(); handleDirectionRelease('left'); }}
              onPointerLeave={(e) => { e.preventDefault(); handleDirectionRelease('left'); }}
              onPointerEnter={(e) => { if (e.buttons > 0) handleDirectionInput('left'); }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <ArrowLeft size={24} />
            </button>
            <div className="d-pad-center">
              <button
                onClick={activatePower}
                disabled={tokens === 0}
                className="power-button"
              >
                <img
                  src="/assets/poderes/image-removebg-preview (11).png"
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
            <button
              className={`d-pad-button right ${isPressed('right') ? 'active' : ''}`}
              onPointerDown={(e) => { e.preventDefault(); handleDirectionInput('right'); }}
              onPointerUp={(e) => { e.preventDefault(); handleDirectionRelease('right'); }}
              onPointerLeave={(e) => { e.preventDefault(); handleDirectionRelease('right'); }}
              onPointerEnter={(e) => { if (e.buttons > 0) handleDirectionInput('right'); }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <ArrowRight size={24} />
            </button>
          </div>
          <div className="d-pad-row">
            <button
              className={`d-pad-button down ${isPressed('down') ? 'active' : ''}`}
              onPointerDown={(e) => { e.preventDefault(); handleDirectionInput('down'); }}
              onPointerUp={(e) => { e.preventDefault(); handleDirectionRelease('down'); }}
              onPointerLeave={(e) => { e.preventDefault(); handleDirectionRelease('down'); }}
              onPointerEnter={(e) => { if (e.buttons > 0) handleDirectionInput('down'); }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <ArrowDown size={24} />
            </button>
          </div>
        </div>

        {showSettingsModal && (
          <div className="settings-modal">
            <div className="settings-content glass-panel">
              <h2>{gameUI.pause}</h2>
              <button className="modal-button" onClick={() => {
                setShowSettingsModal(false);
                setIsPaused(false);
              }}>
                <Play size={20} /> {gameUI.continue}
              </button>
              <button className="modal-button restart-button" onClick={restartLevel}>
                <RotateCcw size={20} /> {gameUI.restart}
              </button>
              <button className="modal-button" onClick={toggleMute}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />} {isMuted ? gameUI.unmute : gameUI.mute}
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                <Home size={20} /> {gameUI.exit}
              </button>
            </div>
          </div>
        )}

        {showGameOverModal && (
          <div className="game-over-modal">
            <div className="game-over-content glass-panel">
              <h2 className="game-over-title">
                {beersCollected / initialCollectibles.length >= 0.7 ? gameUI.goodTry : gameUI.youLost}
              </h2>
              <p className="game-over-subtitle">
                {beersCollected / initialCollectibles.length >= 0.7 ? gameUI.canAdvance : gameUI.noLives}
              </p>

              {beersCollected / initialCollectibles.length >= 0.7 && (
                <StarRating stars={
                  beersCollected / initialCollectibles.length >= 0.85 ? 2 : 1
                } />
              )}

              <div className="game-over-stats">
                <p>{gameUI.baseScore}: {finalScoreStats.score}</p>
                <p>{gameUI.timeBonus}: {finalScoreStats.bonus}</p>
                <p style={{ fontSize: '1.2em', color: '#FFD700' }}>{gameUI.total}: {finalScoreStats.total}</p>
                <p>{gameUI.beersCollected}: {beersCollected}/35</p>
                {beersCollected / initialCollectibles.length >= 0.7 && (
                  <p style={{ color: '#48BB78', marginTop: '10px' }}>{gameUI.minObjectiveComplete}</p>
                )}
              </div>

              {beersCollected / initialCollectibles.length >= 0.7 && onNextLevel && (
                <button className="modal-button" onClick={onNextLevel} style={{ backgroundColor: '#48BB78', marginBottom: '15px' }}>
                  <Play size={20} /> {gameUI.nextLevel}
                </button>
              )}

              <button className="modal-button restart-button" onClick={restartLevel}>
                <RotateCcw size={20} /> {gameUI.retry}
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                <Home size={20} /> {gameUI.backToMenu}
              </button>
            </div>
          </div>
        )}

        {showWinModal && (
          <div className="victory-modal">
            <div className="victory-content glass-panel">
              <h2 className="victory-title">{gameUI.victory}</h2>
              <p className="victory-subtitle">{gameUI.levelComplete.replace('{level}', '3.5')}</p>

              <StarRating stars={3} />

              <div className="victory-stats">
                <p>{gameUI.baseScore}: {finalScoreStats.score}</p>
                <p>{gameUI.timeBonus}: {finalScoreStats.bonus}</p>
                <p style={{ fontSize: '1.4em', color: '#FFD700', fontWeight: 'bold' }}>{gameUI.total}: {finalScoreStats.total}</p>
              </div>

              {onNextLevel && (
                <button className="modal-button" onClick={onNextLevel} style={{ backgroundColor: '#48BB78' }}>
                  <Play size={20} /> {gameUI.nextLevel}
                </button>
              )}
              <button className="modal-button restart-button" onClick={restartLevel}>
                <RotateCcw size={20} /> {gameUI.playAgain}
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                <Home size={20} /> {gameUI.backToMenu}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ghost Mode Visual Effects */}
      {powerActive && (
        <>
          <div className="ghost-mode-overlay" />
          <div className="ghost-mode-indicator">
            👻 Fase Fantasma: {powerTimeLeft}s 👻
          </div>
        </>
      )}

      {enemyAlert && (
        <div className="enemy-alert">
          {enemyAlert}
        </div>
      )}

      {powerAlert && (
        <div className="enemy-alert ghost-power-alert" style={{
          background: 'linear-gradient(135deg, rgba(0, 200, 255, 0.8), rgba(100, 0, 255, 0.8))',
          borderColor: '#00ffff',
          textShadow: '0 0 10px rgba(0, 255, 255, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8)',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.2)',
          animation: 'ghostPulse 0.5s ease-in-out infinite alternate'
        }}>
          👻 {powerAlert} 👻
        </div>
      )}

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
          {isVideoLoading && (
            <div style={{
              position: 'absolute',
              zIndex: 2001,
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div className="spinner" style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(255,255,255,0.3)',
                borderTop: '4px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <div>Cargando...</div>
            </div>
          )}
          <video
            ref={videoRef}
            src={language === 'es' ? "/assets/videos/NIVEL 2 FINAL.mp4" : "/assets/videosingles/LEVEL 2 (1).mp4"}
            autoPlay
            playsInline

            onLoadStart={() => setIsVideoLoading(true)}
            onWaiting={() => setIsVideoLoading(true)}
            onCanPlay={() => setIsVideoLoading(false)}
            onPlaying={() => setIsVideoLoading(false)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isVideoLoading ? 0.5 : 1 }}
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
              gap: '5px',
              zIndex: 2002
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
              fontWeight: 'bold',
              zIndex: 2002
            }}
          >
            Saltar
          </button>
        </div>
      )}
    </div>
  );
}
