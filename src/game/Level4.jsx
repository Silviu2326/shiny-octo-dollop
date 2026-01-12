import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import './Level4.css';
import LevelHeader from '../components/LevelHeader';
import Enemy from '../components/game/Enemy';
import { AIRoles, createPatrolZones, assignZone } from './ai/EnemyAI';

// Paredes del nivel (igual que en móvil)
const walls = [
  // Muros de fondo (Background)
  { x: -2, z: -10, length: 60, height: 10, thickness: 1, orientation: 'vertical' },
  { x: -10, z: -2, length: 60, height: 10, thickness: 1, orientation: 'horizontal' },

  // SECCIÓN 1: BORDES EXTERNOS DEL MAPA (28×34)
  { x: 0, z: 0, length: 28, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 0, z: 34, length: 28, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 0, z: 0, length: 34, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 28, z: 0, length: 34, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECCIÓN 2: ZIG-ZAG PRINCIPAL LADO IZQUIERDO
  { x: 2, z: 2, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 8, z: 2, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 2, z: 6, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 2, z: 6, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  { x: 2, z: 10, length: 8, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 10, z: 10, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 4, z: 14, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 4, z: 14, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  { x: 2, z: 18, length: 8, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 10, z: 18, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 2, z: 22, length: 8, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 2, z: 22, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  { x: 2, z: 26, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 8, z: 26, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 4, z: 30, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 4, z: 30, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECCIÓN 3: ZIG-ZAG CENTRAL
  { x: 12, z: 2, length: 5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 12, z: 7, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 16, z: 7, length: 6, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 12, z: 13, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 12, z: 13, length: 6, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 12, z: 19, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 18, z: 19, length: 6, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 14, z: 25, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 14, z: 25, length: 7, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECCIÓN 4: ZIG-ZAG LADO DERECHO
  { x: 20, z: 2, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 20, z: 2, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 20, z: 6, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 26, z: 6, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  { x: 18, z: 10, length: 8, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 18, z: 10, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 20, z: 14, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 26, z: 14, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  { x: 20, z: 18, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 20, z: 18, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 22, z: 22, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 22, z: 22, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  { x: 20, z: 26, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 20, z: 26, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 22, z: 30, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 26, z: 30, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECCIÓN 5: OBSTÁCULOS ADICIONALES
  { x: 5, z: 4, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 6, z: 8, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 5, z: 12, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 7, z: 16, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 6, z: 20, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 5, z: 24, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 6, z: 28, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  { x: 21, z: 4, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 20, z: 8, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 23, z: 12, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 21, z: 16, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 24, z: 20, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 23, z: 24, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 24, z: 28, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  { x: 14, z: 4, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 15, z: 10, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 14, z: 16, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 16, z: 22, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 13, z: 28, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
];

// Spatial partitioning
const CELL_SIZE = 6;
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
    const x = Math.random() * 26 + 1;
    const z = Math.random() * 32 + 1;

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

const initialCollectibles = generateCollectibles(70);

function Maze({ walls }) {
  console.log('Maze component rendering, walls count:', walls.length);
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
  console.log('Player component rendering at position:', position);
  const meshRef = useRef();
  try {
    const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/player.png');
    const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/player_secondary.png');
    console.log('Player textures loaded successfully');
  } catch (error) {
    console.error('Error loading Player textures:', error);
    return null;
  }

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

// Enemy component moved to src/components/game/Enemy.jsx

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
  console.log('Floor component rendering');
  try {
    const texture = useLoader(THREE.TextureLoader, '/assets/suelos/floor_texture_2.png');
    console.log('Floor texture loaded successfully');

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(25, 25);

    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, -0.1, 17]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    );
  } catch (error) {
    console.error('Error in Floor component:', error);
    return null;
  }
}

// Preload enemy textures to prevent black screen flash
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

// Crear zonas de patrulla para el mapa (28x34)
const patrolZones = createPatrolZones(28, 34, 2);

export default function Level4({ onBack, onNextLevel, onLevelComplete }) {
  console.log('Level4 rendering');
  const [playerPos, setPlayerPos] = useState({ x: 3, z: 3 });
  const [direction, setDirection] = useState({ x: 0, z: 0 });
  const [collectibles, setCollectibles] = useState(initialCollectibles);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [beersCollected, setBeersCollected] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [specialBonuses, setSpecialBonuses] = useState([]);
  const [bonusFlags, setBonusFlags] = useState({ p30: false, p70: false });

  const [barrels, setBarrels] = useState([
    { id: 1, x: 4, z: 4, collected: false },
    { id: 2, x: 9, z: 12, collected: false },
    { id: 3, x: 14, z: 20, collected: false },
  ]);
  const collectedBarrelsRef = useRef(new Set());
  const collectedBeersRef = useRef(new Set());
  const [enemies, setEnemies] = useState([]);
  const enemyIdRef = useRef(1);
  const [powerActive, setPowerActive] = useState(false);
  const [powerTimeLeft, setPowerTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const invulnerabilityTimerRef = useRef(null);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const comboTimerRef = useRef(null);
  const [livesLost, setLivesLost] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(true);
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

  console.log('Level4 state:', { showIntroVideo, lives, score, collectiblesCount: collectibles.length });

  const doghousePos = { x: 3, z: 5 };

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

  // Handle mute toggle for bg music
  useEffect(() => {
    if (!musicRef.current) return;

    if (isMuted) {
      musicRef.current.pause();
    } else {
      musicRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const cameraConfig = {
    rotation: Math.PI / 4.8,
    distance: 8,
    height: 6,
    fov: 60,
  };

  const restartLevel = () => {
    setPlayerPos({ x: 3, z: 3 });
    setDirection({ x: 0, z: 0 });
    setCollectibles(initialCollectibles.map(c => ({ ...c, collected: false })));
    setScore(0);
    setLives(3);
    setBeersCollected(0);
    setTokens(0);
    setBarrels([
      { id: 1, x: 4, z: 4, collected: false },
      { id: 2, x: 9, z: 12, collected: false },
      { id: 3, x: 14, z: 20, collected: false },
    ]);
    collectedBarrelsRef.current.clear();
    collectedBeersRef.current.clear();
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

    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    if (invulnerabilityTimerRef.current) {
      clearTimeout(invulnerabilityTimerRef.current);
      invulnerabilityTimerRef.current = null;
    }
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

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setEnemies(prevEnemies => [
        ...prevEnemies,
        {
          id: enemyIdRef.current,
          x: doghousePos.x,
          z: doghousePos.z,
          role: AIRoles.STRAIGHT,
          zone: assignZone(enemyIdRef.current, patrolZones),
          isReturning: false
        }
      ]);
      showEnemyAlert("¡Apareció un enemigo!");
      enemyIdRef.current++;
    }, 5000);

    const timer2 = setTimeout(() => {
      setEnemies(prevEnemies => [
        ...prevEnemies,
        {
          id: enemyIdRef.current,
          x: doghousePos.x,
          z: doghousePos.z,
          role: AIRoles.TURNER,
          zone: assignZone(enemyIdRef.current, patrolZones),
          isReturning: false
        }
      ]);
      showEnemyAlert("¡Cuidado, otro enemigo!");
      enemyIdRef.current++;
    }, 10000);

    const timer3 = setTimeout(() => {
      setEnemies(prevEnemies => [
        ...prevEnemies,
        {
          id: enemyIdRef.current,
          x: doghousePos.x,
          z: doghousePos.z,
          role: AIRoles.FREQUENT,
          zone: assignZone(enemyIdRef.current, patrolZones),
          isReturning: false
        }
      ]);
      showEnemyAlert("¡Más peligro!");
      enemyIdRef.current++;
    }, 15000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [showWinModal, showGameOverModal]);

  useEffect(() => {
    const totalBeers = initialCollectibles.length;
    if (totalBeers === 0) return;

    const percentage = beersCollected / totalBeers;

    const findFreePosition = () => {
      let x, z;
      let valid = false;
      let attempts = 0;
      while (!valid && attempts < 50) {
        x = Math.random() * 26 + 1;
        z = Math.random() * 32 + 1;
        if (!checkCollision(x, z)) {
          valid = true;
        }
        attempts++;
      }
      return valid ? { x, z } : { x: 14, z: 16 };
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

  const handlePositionUpdate = (x, z) => {
    setPlayerPos({ x, z });

    // Manejar colisiones con enemigos
    if (!isInvulnerable) {
      enemies.forEach(enemy => {
        const distance = Math.sqrt(
          Math.pow(x - enemy.x, 2) + Math.pow(z - enemy.z, 2)
        );

        // Si el jugador toca al enemigo con poder activo
        if (distance < 0.6 && powerActive && !enemy.isReturning) {
          setScore(s => s + 200);
          setEnemies(prev => prev.map(e =>
            e.id === enemy.id ? { ...e, isReturning: true } : e
          ));
          return;
        }

        // Si el enemigo toca al jugador sin poder
        if (distance < 0.4 && !powerActive && !enemy.isReturning) {
          const newLives = lives - 1;
          setLivesLost(true);

          if (newLives <= 0) {
            setLives(0);
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

    // Resetear enemigos que llegaron a casa
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
        // Si ya está en la ref, asegurarse de que esté marcado como collected
        if (collectedBarrelsRef.current.has(barrel.id) && !barrel.collected) {
          hasChanges = true;
          return { ...barrel, collected: true };
        }

        // Si está cerca y no ha sido recogido
        if (!barrel.collected && !collectedBarrelsRef.current.has(barrel.id)) {
          const distance = Math.sqrt(
            Math.pow(x - barrel.x, 2) + Math.pow(z - barrel.z, 2)
          );
          if (distance < 0.6) {
            collectedBarrelsRef.current.add(barrel.id);
            tokensToAdd++;
            pointsToAdd += 25;
            hasChanges = true;
            playBarrelSound();
            console.log('Barrel collected! ID:', barrel.id);
            return { ...barrel, collected: true };
          }
        }
        return barrel;
      });

      if (tokensToAdd > 0) {
        setTokens(prev => prev + tokensToAdd);
        setScore(prev => prev + pointsToAdd);
      }

      return hasChanges ? nextBarrels : prevBarrels;
    });

    // Nueva lógica para cervezas usando Ref para evitar doble conteo y efectos secundarios en el render
    let itemsCollectedNow = 0;

    // Iteramos sobre los coleccionables desde el estado actual (closure)
    // Usamos collectedBeersRef para filtrar los que ya procesamos en este frame o anteriores (pero que aún no se reflejan en el estado)
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

      // Calculo del puntaje total a añadir
      const scoreToAdd = itemsCollectedNow * Math.floor(10 * comboMultiplier); // Nota: comboMultiplier es del render actual
      // Si itemsCollectedNow > 1, el multiplier debería aplicar a todos, o quizás incrementarse? 
      // Por simplicidad mantenemos la lógica original: score por cada uno.
      // La lógica original era: setScore(prev => prev + Math.floor(10 * comboMultiplier)) por CADA item.

      setScore(prev => prev + scoreToAdd);
      setBeersCollected(prev => prev + itemsCollectedNow);
      playCollectSound();

      // Actualizamos visualmente los coleccionables
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
      setShowWinModal(true);
      if (onLevelComplete) {
        onLevelComplete(3); // Nivel 3 completed (Level4.jsx), unlock Nivel 4
      }
    }
  }, [beersCollected, showWinModal, onLevelComplete]);

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
  }, [direction, tokens, powerActive, isPaused]);



  console.log('Level4 returning JSX, showIntroVideo:', showIntroVideo);

  return (
    <div className="game-container" style={{ width: '100vw', height: '100vh', backgroundColor: '#111' }}>
      {console.log('Rendering Canvas')}
      <Canvas
        camera={{ position: [14, 18, 26], fov: cameraConfig.fov }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
        onCreated={({ gl, scene }) => {
          console.log('Canvas created, renderer:', gl);
          scene.background = new THREE.Color('#87CEEB'); // Sky blue background
        }}
      >
        <Suspense fallback={
          <mesh position={[14, 5, 17]}>
            <boxGeometry args={[5, 5, 5]} />
            <meshStandardMaterial color="red" />
          </mesh>
        }>
          <ambientLight intensity={1.5} />
          <directionalLight position={[14, 22, 17]} intensity={1.0} />

          <PreloadTextures />
          <Maze walls={walls} />
          <Floor />

          <InstancedCollectibles collectibles={collectibles} />

          {barrels.map(b => !b.collected && <Barrel key={b.id} position={b} />)}

          {specialBonuses.filter(b => !b.collected).map(b => (
            <SpecialBonus key={b.id} position={{ x: b.x, z: b.z }} />
          ))}

          <Doghouse position={doghousePos} />

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
              isPowerActive={powerActive}
              isPaused={isPaused}
              rotation={1.1}
              role={enemy.role}
              assignedZone={enemy.zone}
              doghousePos={doghousePos}
              isReturning={enemy.isReturning}
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
          levelName="La Rubia"
          beersCollected={beersCollected}
          totalBeers={initialCollectibles.length}
          score={score}
          levelNumber={4}
        />

        <button className="settings-button" onClick={() => {
          setIsPaused(true);
          setShowSettingsModal(true);
        }}>
          PAUSA
        </button>

        {showSettingsModal && (
          <div className="settings-modal">
            <div className="settings-content glass-panel">
              <h2>PAUSA</h2>
              <button className="modal-button" onClick={() => {
                setShowSettingsModal(false);
                setIsPaused(false);
              }}>
                Seguir
              </button>
              <button className="modal-button" onClick={toggleMute}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                {isMuted ? " Activar Sonido" : " Silenciar"}
              </button>
              <button className="modal-button restart-button" onClick={restartLevel}>
                Reiniciar
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                <Home size={20} /> Salir
              </button>
            </div>
          </div>
        )}

        {showGameOverModal && (
          <div className="game-over-modal">
            <div className="game-over-content glass-panel">
              <h2 className="game-over-title">¡HAS PERDIDO!</h2>
              <p className="game-over-subtitle">Se acabaron las vidas</p>
              <div className="game-over-stats">
                <p>Puntuación final: {score}</p>
                <p>Cervezas recogidas: {beersCollected}</p>
              </div>

              <button className="modal-button restart-button" onClick={restartLevel}>
                Reintentar
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                Volver al menú
              </button>
            </div>
          </div>
        )}

        {showWinModal && (
          <div className="settings-modal victory-modal">
            <div className="settings-content glass-panel victory-content">
              <h2 style={{ fontSize: '2.5em', marginBottom: '20px' }}>🎉 ¡NIVEL COMPLETADO! 🎉</h2>
              <p style={{ fontSize: '1.2em', marginBottom: '10px' }}>¡Has conseguido {score} puntos!</p>
              <p style={{ fontSize: '1em', marginBottom: '30px', color: '#4CAF50' }}>¡El siguiente nivel está desbloqueado!</p>
              {onNextLevel && (
                <button className="modal-button" onClick={onNextLevel} style={{ backgroundColor: '#4CAF50', marginBottom: '10px' }}>
                  <Play size={20} /> Siguiente Nivel
                </button>
              )}
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
            src="/assets/videos/NIVEL 3 FINAL.mp4"
            autoPlay
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              console.error('Level4 - Error loading video:', e);
              console.log('Level4 - Setting showIntroVideo to false due to error');
              setShowIntroVideo(false);
            }}
            onLoadStart={() => console.log('Level4 - Video loading started')}
            onEnded={() => {
              console.log('Level4 - Video ended, setting showIntroVideo to false');
              setShowIntroVideo(false);
            }}
            onClick={() => {
              console.log('Level4 - Video clicked, setting showIntroVideo to false');
              setShowIntroVideo(false);
            }}
          />
          <button
            onClick={() => {
              console.log('Level4 - Skip button clicked');
              setShowIntroVideo(false);
            }}
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
