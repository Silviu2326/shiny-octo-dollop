import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import './Level4_5.css';
import LevelHeader from '../components/LevelHeader';
import EnemyAdvanced from '../components/game/EnemyAdvanced';
import { AIRoles, createPatrolZones, assignZone } from './ai/EnemyAI';
import { EnemyCoordinator } from './ai/EnemyAI_Advanced';
import { getGameUI } from '../utils/translations';

// Mapa reducido: 18x22 (original Level4 era 28x34)
const walls = [
  // Muros de fondo (Background)
  { x: -2, z: -10, length: 40, height: 10, thickness: 1, orientation: 'vertical' },
  { x: -10, z: -2, length: 40, height: 10, thickness: 1, orientation: 'horizontal' },

  // SECCION 1: BORDES EXTERNOS DEL MAPA (18x22)
  { x: 0, z: 0, length: 18, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 0, z: 22, length: 18, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 0, z: 0, length: 22, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 18, z: 0, length: 22, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECCION 2: ZIG-ZAG LADO IZQUIERDO
  { x: 2, z: 2, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 6, z: 2, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 2, z: 5, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 2, z: 5, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  { x: 2, z: 8, length: 5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 7, z: 8, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 3, z: 11, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 3, z: 11, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  { x: 2, z: 14, length: 5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 7, z: 14, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 2, z: 17, length: 5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 2, z: 17, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECCION 3: ZIG-ZAG CENTRAL
  { x: 9, z: 2, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 9, z: 6, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 12, z: 6, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 9, z: 10, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 9, z: 10, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 9, z: 14, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 13, z: 14, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 10, z: 18, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 10, z: 18, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECCION 4: ZIG-ZAG LADO DERECHO
  { x: 14, z: 2, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 14, z: 2, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 14, z: 5, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 17, z: 5, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  { x: 13, z: 8, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 13, z: 8, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 14, z: 11, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 17, z: 11, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  { x: 14, z: 14, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 14, z: 17, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 17, z: 17, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECCION 5: OBSTACULOS ADICIONALES
  { x: 4, z: 3, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 5, z: 7, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 4, z: 10, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 5, z: 13, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 4, z: 16, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 5, z: 19, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

  { x: 15, z: 3, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 14, z: 7, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 16, z: 10, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 15, z: 13, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 15, z: 16, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 14, z: 19, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
];

// Spatial partitioning
const CELL_SIZE = 4;
const grid = {};

const getCellKey = (x, z) => `${Math.floor(x / CELL_SIZE)},${Math.floor(z / CELL_SIZE)}`;

walls.forEach(wall => {
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

  const startCellX = Math.floor(minX / CELL_SIZE);
  const endCellX = Math.floor(maxX / CELL_SIZE);
  const startCellZ = Math.floor(minZ / CELL_SIZE);
  const endCellZ = Math.floor(maxZ / CELL_SIZE);

  for (let cx = startCellX; cx <= endCellX; cx++) {
    for (let cz = startCellZ; cz <= endCellZ; cz++) {
      const key = `${cx},${cz}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push({ ...wall, minX, maxX, minZ, maxZ });
    }
  }
});

function checkCollision(x, z) {
  const playerRadius = 0.3;
  const key = getCellKey(x, z);
  const nearbyWalls = grid[key] || [];

  for (const wall of nearbyWalls) {
    if (
      x + playerRadius > wall.minX &&
      x - playerRadius < wall.maxX &&
      z + playerRadius > wall.minZ &&
      z - playerRadius < wall.maxZ
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

    if (!checkCollision(x, z)) {
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

// 40 cervezas para el mapa reducido
const initialCollectibles = generateCollectibles(40);

function Maze({ walls }) {
  const { bgHorizGeom, bgVertGeom, wallGeom } = useMemo(() => {
    const bgHorizGeoms = [];
    const bgVertGeoms = [];
    const wallGeoms = [];

    walls.forEach(wall => {
      const isHorizontal = wall.orientation === 'horizontal';
      const width = isHorizontal ? wall.length : wall.thickness;
      const depth = isHorizontal ? wall.thickness : wall.length;

      const geometry = new THREE.BoxGeometry(width, wall.height, depth);

      const centerX = isHorizontal ? wall.x + wall.length / 2 : wall.x;
      const centerZ = isHorizontal ? wall.z : wall.z + wall.length / 2;

      geometry.translate(centerX, wall.height / 2, centerZ);

      if (wall.height > 2) {
        if (wall.orientation === 'horizontal') {
          bgHorizGeoms.push(geometry);
        } else {
          bgVertGeoms.push(geometry);
        }
      } else {
        wallGeoms.push(geometry);
      }
    });

    return {
      bgHorizGeom: bgHorizGeoms.length > 0 ? mergeBufferGeometries(bgHorizGeoms) : null,
      bgVertGeom: bgVertGeoms.length > 0 ? mergeBufferGeometries(bgVertGeoms) : null,
      wallGeom: wallGeoms.length > 0 ? mergeBufferGeometries(wallGeoms) : null
    };
  }, [walls]);

  const wallTex = useLoader(THREE.TextureLoader, '/assets/texturas/wall_texture_2.png');
  wallTex.wrapS = THREE.RepeatWrapping;
  wallTex.wrapT = THREE.RepeatWrapping;
  wallTex.magFilter = THREE.NearestFilter;
  wallTex.minFilter = THREE.NearestFilter;

  return (
    <>
      {bgHorizGeom && (
        <mesh geometry={bgHorizGeom}>
          <meshBasicMaterial map={wallTex} />
        </mesh>
      )}

      {bgVertGeom && (
        <mesh geometry={bgVertGeom}>
          <meshBasicMaterial map={wallTex} />
        </mesh>
      )}

      {wallGeom && (
        <mesh geometry={wallGeom}>
          <meshBasicMaterial map={wallTex} />
        </mesh>
      )}
    </>
  );
}

function Player({ position, direction, onPositionUpdate, isPaused, isPowerActive, isInvulnerable }) {
  const meshRef = useRef();
  const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/player.png');
  const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/player_secondary.png');

  const [currentFrame, setCurrentFrame] = useState(0);
  const [animationTime, setAnimationTime] = useState(0);
  const [trail, setTrail] = useState([]);
  const [pulseTime, setPulseTime] = useState(0);
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

    if (direction.x !== 0 || direction.z !== 0) {
      setLastDirection(direction);
      const baseSpeed = 4.5;
      const speed = isPowerActive ? baseSpeed * 2.5 : baseSpeed;
      const newX = position.x + direction.x * speed * delta;
      const newZ = position.z + direction.z * speed * delta;

      if (!checkCollision(newX, newZ)) {
        onPositionUpdate(newX, newZ);

        if (isPowerActive) {
          setTrail(prev => {
            const newTrail = [{ x: position.x, z: position.z, frame: currentFrame }, ...prev];
            return newTrail.slice(0, 5);
          });
        }
      }

      setAnimationTime(prev => {
        const newTime = prev + delta * animationSpeed;
        const newFrame = Math.floor(newTime) % frameCount;
        setCurrentFrame(newFrame);
        return newTime;
      });
    }

    if (!isPowerActive && trail.length > 0) {
      setTrail([]);
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

  const pulseOpacity = isInvulnerable ? (Math.sin(pulseTime) * 0.5 + 0.5) : 1;

  return (
    <>
      {isPowerActive && trail.map((pos, index) => {
        const trailTexture = getCurrentTexture().clone();
        trailTexture.repeat.set(1 / frameCount, 1);
        trailTexture.offset.x = pos.frame / frameCount;

        return (
          <mesh
            key={index}
            position={[pos.x, 0.5, pos.z]}
            rotation={[-Math.PI / 4, 1.1, 0]}
            scale={[getFlipX(), 1, 1]}
          >
            <planeGeometry args={[0.8, 0.8]} />
            <meshStandardMaterial
              map={trailTexture}
              transparent={true}
              side={THREE.DoubleSide}
              opacity={(0.6 - index * 0.1) * pulseOpacity}
              alphaTest={0.1}
              emissive="#FFD700"
              emissiveIntensity={1.5 - index * 0.3}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      <mesh
        ref={meshRef}
        position={[position.x, 0.5, position.z]}
        rotation={[-Math.PI / 4, 1.1, 0]}
        scale={[getFlipX(), 1, 1]}
      >
        <planeGeometry args={[1.1, 1.1]} />
        <meshStandardMaterial
          map={texture}
          transparent={true}
          side={THREE.DoubleSide}
          alphaTest={0.5}
          emissive={isPowerActive ? "#FFD700" : "#000000"}
          emissiveIntensity={isPowerActive ? 0.8 : 0}
          opacity={pulseOpacity}
          depthWrite={true}
        />
      </mesh>
    </>
  );
}

function InstancedCollectibles({ collectibles }) {
  const meshRef = useRef();
  const texture = useLoader(THREE.TextureLoader, '/assets/cervezas/collectible_bottle.png');

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
  const texture = useLoader(THREE.TextureLoader, '/assets/barriles/image-removebg-preview (21) (2).png');

  useMemo(() => {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
  }, [texture]);

  return (
    <mesh position={[position.x, 0.5, position.z]} rotation={[-Math.PI / 8, 0, 0]}>
      <planeGeometry args={[1.0, 1.0]} />
      <meshStandardMaterial
        map={texture}
        transparent={true}
        side={THREE.DoubleSide}
        alphaTest={0.5}
        depthWrite={true}
      />
    </mesh>
  );
}

function Doghouse({ position }) {
  const meshRef = useRef();
  const texture = useLoader(THREE.TextureLoader, '/assets/casetas/image-removebg-preview (5).png');

  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  return (
    <mesh ref={meshRef} position={[position.x, 0.6, position.z]} rotation={[-Math.PI / 8, 0, 0]}>
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
  const texture = useLoader(THREE.TextureLoader, '/assets/suelos/floor_texture_2.png');

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9, -0.1, 11]}>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

function PreloadTextures() {
  const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_9.png');
  const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_10.png');

  useMemo(() => {
    spritesheet1.magFilter = THREE.NearestFilter;
    spritesheet1.minFilter = THREE.NearestFilter;
    spritesheet2.magFilter = THREE.NearestFilter;
    spritesheet2.minFilter = THREE.NearestFilter;
  }, [spritesheet1, spritesheet2]);

  return null;
}

function SpecialBonus({ position }) {
  const texture = useLoader(THREE.TextureLoader, '/assets/bonus/a73714b6-82b3-46ed-8eda-28c6415e03b0.png');
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

function Camera({ targetX, targetZ, rotation, distance, height }) {
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

// Crear zonas de patrulla para el mapa reducido (18x22)
const patrolZones = createPatrolZones(18, 22, 2);

export default function Level4_5({ onBack, onNextLevel, onLevelComplete, language = 'en' }) {
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

  // Enemy coordinator for advanced AI coordination
  const coordinatorRef = useRef(new EnemyCoordinator());

  const [barrels, setBarrels] = useState([
    { id: 1, x: 3, z: 3, collected: false },
    { id: 2, x: 6, z: 10, collected: false },
    { id: 3, x: 12, z: 15, collected: false },
  ]);
  const collectedBarrelsRef = useRef(new Set());
  const collectedBeersRef = useRef(new Set());

  const keysPressed = useRef(new Set());
  const [, forceUpdate] = useState({});

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
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const musicRef = useRef(null);
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

  const doghousePos = { x: 2.5, z: 3 };

  // Audio Helpers
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

  // Audio Effects
  useEffect(() => {
    if (showIntroVideo) return;

    musicRef.current = new Audio('/assets/audio/music_golden.wav');
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

  const cameraConfig = {
    rotation: Math.PI / 4.8,
    distance: 6,
    height: 4.5,
    fov: 60,
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
      { id: 1, x: 3, z: 3, collected: false },
      { id: 2, x: 6, z: 10, collected: false },
      { id: 3, x: 12, z: 15, collected: false },
    ]);
    collectedBarrelsRef.current.clear();
    collectedBeersRef.current.clear();
    keysPressed.current.clear();
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

    // Reset coordinator
    coordinatorRef.current = new EnemyCoordinator();
  };

  const activatePower = () => {
    if (tokens > 0 && !powerActive) {
      setTokens(prev => prev - 1);
      setPowerActive(true);
      setPowerTimeLeft(6);
      showPowerAlert("¡SUPER VELOCIDAD!");
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
      setEnemies(prevEnemies => [
        ...prevEnemies,
        {
          id: enemyIdRef.current++,
          x: doghousePos.x,
          z: doghousePos.z,
          role: AIRoles.CHASER,
          zone: assignZone(0, patrolZones),
          isReturning: false
        }
      ]);
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
  }, [showIntroVideo, showWinModal, showGameOverModal]);

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
        if (!checkCollision(x, z)) {
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

  const handleEnemyPositionUpdate = (enemyId, x, z) => {
    setEnemies(prevEnemies =>
      prevEnemies.map(enemy =>
        enemy.id === enemyId ? { ...enemy, x, z } : enemy
      )
    );
  };

  const checkEnemyCollisions = (x, z) => {
    if (!isInvulnerable) {
      enemies.forEach(enemy => {
        const distance = Math.sqrt(
          Math.pow(x - enemy.x, 2) + Math.pow(z - enemy.z, 2)
        );

        if (distance < 0.6 && powerActive && !enemy.isReturning) {
          setScore(s => s + 200);
          setEnemies(prev => prev.map(e =>
            e.id === enemy.id ? { ...e, isReturning: true } : e
          ));
          return;
        }

        if (distance < 0.4 && !powerActive && !enemy.isReturning) {
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
        }
      });
    }

    setEnemies(prev => prev.map(enemy => {
      if (enemy.isReturning) {
        const distToDoghouse = Math.sqrt(
          (enemy.x - doghousePos.x) ** 2 +
          (enemy.z - doghousePos.z) ** 2
        );
        if (distToDoghouse < 0.5) {
          return { ...enemy, isReturning: false };
        }
      }
      return enemy;
    }));
  };

  const handlePositionUpdate = (x, z) => {
    setPlayerPos({ x, z });

    checkEnemyCollisions(x, z);

    setSpecialBonuses(prev => {
      return prev.map(bonus => {
        if (!bonus.collected) {
          const distance = Math.sqrt(
            Math.pow(x - bonus.x, 2) + Math.pow(z - bonus.z, 2)
          );
          if (distance < 0.6) {
            setScore(p => p + 500);
            playCollectSound();
            return { ...bonus, collected: true };
          }
        }
        return bonus;
      });
    });

    setBarrels(prevBarrels => {
      let tokensToAdd = 0;
      let pointsToAdd = 0;
      let hasChanges = false;

      const nextBarrels = prevBarrels.map(barrel => {
        if (collectedBarrelsRef.current.has(barrel.id) && !barrel.collected) {
          hasChanges = true;
          return { ...barrel, collected: true };
        }

        if (!barrel.collected && !collectedBarrelsRef.current.has(barrel.id)) {
          const distance = Math.sqrt(
            Math.pow(x - barrel.x, 2) + Math.pow(z - barrel.z, 2)
          );
          if (distance < 0.6) {
            collectedBarrelsRef.current.add(barrel.id);
            tokensToAdd++;
            pointsToAdd += 50;
            hasChanges = true;
            playBarrelSound();
            return { ...barrel, collected: true };
          }
        }
        return barrel;
      });

      if (tokensToAdd > 0) {
        setTokens(prev => Math.min(3, prev + tokensToAdd));
        setScore(prev => prev + pointsToAdd);
      }

      return hasChanges ? nextBarrels : prevBarrels;
    });

    let itemsCollectedNow = 0;

    collectibles.forEach(collectible => {
      if (!collectible.collected && !collectedBeersRef.current.has(collectible.id)) {
        const distance = Math.sqrt(
          Math.pow(x - collectible.x, 2) + Math.pow(z - collectible.z, 2)
        );

        if (distance < 0.5) {
          collectedBeersRef.current.add(collectible.id);
          itemsCollectedNow++;
        }
      }
    });

    if (itemsCollectedNow > 0) {
      setComboMultiplier(1.5);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => {
        setComboMultiplier(1);
      }, 3000);

      const scoreToAdd = itemsCollectedNow * Math.floor(10 * comboMultiplier);

      setScore(prev => prev + scoreToAdd);
      setBeersCollected(prev => prev + itemsCollectedNow);
      playCollectSound();

      setCollectibles(prevCollectibles =>
        prevCollectibles.map(c =>
          collectedBeersRef.current.has(c.id) ? { ...c, collected: true } : c
        )
      );
    }
  };

  useEffect(() => {
    if (beersCollected === initialCollectibles.length && !showWinModal) {
      setIsPaused(true);

      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const timeBonus = Math.max(0, Math.floor((180 - elapsedSeconds) * 10));

      setFinalScoreStats({
        score: score,
        bonus: timeBonus,
        total: score + timeBonus
      });

      setShowWinModal(true);
      if (onLevelComplete) {
        onLevelComplete(4); // Level 4.5 completed
      }
    }
  }, [beersCollected, showWinModal, onLevelComplete, score, startTime]);

  useEffect(() => {
    if (isPaused) return;
    checkEnemyCollisions(playerPos.x, playerPos.z);
  }, [playerPos, enemies, isPaused, isInvulnerable, powerActive, lives, beersCollected]);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showIntroVideo || isPaused) return;

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
        e.preventDefault();
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
  }, [showIntroVideo, isPaused, activatePower]);

  return (
    <div className="game-container" style={{ width: '100vw', height: '100vh', backgroundColor: '#111' }}>
      <Canvas
        camera={{ position: [9, 14, 18], fov: cameraConfig.fov }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color('#87CEEB');
        }}
      >
        <Suspense fallback={
          <mesh position={[9, 5, 11]}>
            <boxGeometry args={[5, 5, 5]} />
            <meshStandardMaterial color="red" />
          </mesh>
        }>
          <ambientLight intensity={1.5} />
          <directionalLight position={[9, 18, 11]} intensity={1.0} />

          <PreloadTextures />
          <Maze walls={walls} />
          <Floor />

          <InstancedCollectibles collectibles={collectibles} />

          {barrels.map(b => !b.collected && <Barrel key={b.id} position={b} />)}

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
              rotation={1.1}
              role={enemy.role}
              assignedZone={enemy.zone}
              doghousePos={doghousePos}
              isReturning={enemy.isReturning}
              coordinator={coordinatorRef.current}
              spritesheet1Path="/assets/personajes/enemy_type_9.png"
              spritesheet2Path="/assets/personajes/enemy_type_10.png"
              debugMode={false}
            />
          ))}

          <Player
            position={playerPos}
            direction={direction}
            onPositionUpdate={handlePositionUpdate}
            isPaused={isPaused}
            isPowerActive={powerActive}
            isInvulnerable={isInvulnerable}
          />
          <Camera
            targetX={playerPos.x}
            targetZ={playerPos.z}
            rotation={cameraConfig.rotation}
            distance={cameraConfig.distance}
            height={cameraConfig.height}
          />
        </Suspense>
      </Canvas>

      <div className="ui-overlay">
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
                disabled={tokens === 0 || powerActive}
                className="power-button"
              >
                <img
                  src="/assets/poderes/image-removebg-preview (13).png"
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

        <LevelHeader
          lives={lives}
          levelName="La Rubia Plus"
          beersCollected={beersCollected}
          totalBeers={initialCollectibles.length}
          score={score}
          levelNumber={"4.5"}
          onSettingsClick={() => {
            setIsPaused(true);
            setShowSettingsModal(true);
          }}
          language={language}
        />

        {showSettingsModal && (
          <div className="settings-modal">
            <div className="settings-content glass-panel">
              <h2>{gameUI.pause}</h2>
              <button className="modal-button" onClick={() => {
                setShowSettingsModal(false);
                setIsPaused(false);
              }}>
                {gameUI.continue}
              </button>
              <button className="modal-button" onClick={toggleMute}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                {isMuted ? ` ${gameUI.enableSound}` : ` ${gameUI.muteSound}`}
              </button>
              <button className="modal-button restart-button" onClick={restartLevel}>
                {gameUI.restart}
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
                {beersCollected / initialCollectibles.length >= 0.7 ? gameUI.canAdvance : gameUI.outOfLives}
              </p>

              {beersCollected / initialCollectibles.length >= 0.7 && (
                <StarRating stars={
                  beersCollected / initialCollectibles.length >= 0.85 ? 2 : 1
                } />
              )}

              <div className="game-over-stats">
                <p>{gameUI.baseScore}: {finalScoreStats.score}</p>
                <p>{gameUI.timeBonus}: {finalScoreStats.bonus}</p>
                <p style={{ fontSize: '1.2em', color: '#FFD700' }}>{gameUI.totalScore}: {finalScoreStats.total}</p>
                <p>{gameUI.beersCollected}: {beersCollected}/{initialCollectibles.length}</p>
                {beersCollected / initialCollectibles.length >= 0.7 && (
                  <p style={{ color: '#48BB78', marginTop: '10px' }}>{gameUI.minimumCompleted}</p>
                )}
              </div>

              {beersCollected / initialCollectibles.length >= 0.7 && onNextLevel && (
                <button className="modal-button" onClick={onNextLevel} style={{ backgroundColor: '#48BB78', marginBottom: '15px' }}>
                  <Play size={20} /> {gameUI.nextLevel}
                </button>
              )}

              <button className="modal-button restart-button" onClick={restartLevel}>
                <RotateCcw size={20} /> {gameUI.tryAgain}
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
              <p className="victory-subtitle">{gameUI.levelCompleted}</p>

              <StarRating stars={3} />

              <div className="victory-stats">
                <p>{gameUI.baseScore}: {finalScoreStats.score}</p>
                <p>{gameUI.timeBonus}: {finalScoreStats.bonus}</p>
                <p style={{ fontSize: '1.4em', color: '#FFD700', fontWeight: 'bold' }}>{gameUI.totalScore}: {finalScoreStats.total}</p>
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
            src={language === 'es' ? "/assets/videos/NIVEL 3 FINAL.mp4" : "/assets/videosingles/LEVEL 3 (1).mp4"}
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
              fontWeight: 'bold'
            }}
          >
            Saltar
          </button>
        </div>
      )}

      {enemyAlert && (
        <div className="enemy-alert">
          {enemyAlert}
        </div>
      )}

      {powerAlert && (
        <div className="enemy-alert" style={{ background: 'rgba(0, 100, 255, 0.7)', borderColor: '#4488ff', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}>
          {powerAlert}
        </div>
      )}
    </div>
  );
}
