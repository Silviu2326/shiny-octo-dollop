import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import './Level2.css';
import LevelHeader from '../components/LevelHeader';
import Enemy from '../components/game/Enemy';
import { AIRoles, createPatrolZones, assignZone } from './ai/EnemyAI';

// --- Configuration & Constants ---
const CELL_SIZE = 5;

const walls = [
  // Background walls
  { x: -2, z: -10, length: 60, height: 5, thickness: 1, orientation: 'vertical' },
  { x: -10, z: -2, length: 60, height: 5, thickness: 1, orientation: 'horizontal' },

  // Exterior walls (28×32)
  { x: 0, z: 0, length: 28, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 0, z: 32, length: 28, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 0, z: 0, length: 32, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 28, z: 0, length: 32, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // FIRST RING - WITH 4 DOORS
  { x: 3, z: 3, length: 7, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 12, z: 3, length: 13, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 3, z: 3, length: 9, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 3, z: 17, length: 11, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 25, z: 3, length: 9, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 25, z: 17, length: 11, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 3, z: 28, length: 14, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 19, z: 28, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

  // SECOND RING - WITH 4 DOORS
  { x: 6, z: 6, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 14, z: 6, length: 8, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 6, z: 6, length: 7, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 6, z: 17, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 22, z: 6, length: 7, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 22, z: 17, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 6, z: 25, length: 9, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 17, z: 25, length: 5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

  // THIRD RING - INNER OBSTACLES
  { x: 9, z: 9, length: 5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 16, z: 9, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 9, z: 13, length: 5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 9, z: 10, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 19, z: 10, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 9, z: 18, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 19, z: 18, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 9, z: 22, length: 5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 16, z: 22, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
];

// Spatial Grid
const grid = {};

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

  const minCellX = Math.floor((x - playerRadius) / CELL_SIZE);
  const maxCellX = Math.floor((x + playerRadius) / CELL_SIZE);
  const minCellZ = Math.floor((z - playerRadius) / CELL_SIZE);
  const maxCellZ = Math.floor((z + playerRadius) / CELL_SIZE);

  for (let cx = minCellX; cx <= maxCellX; cx++) {
    for (let cz = minCellZ; cz <= maxCellZ; cz++) {
      const key = `${cx},${cz}`;
      const nearbyWalls = grid[key];

      if (nearbyWalls) {
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
      }
    }
  }

  return false;
}

function generateCollectibles(count) {
  const collectibles = [];
  let id = 1;

  while (collectibles.length < count) {
    const x = Math.random() * 26 + 1;
    const z = Math.random() * 30 + 1;

    if (!checkCollision(x, z)) {
      const tooClose = collectibles.some(c => {
        const distance = Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(z - c.z, 2));
        return distance < 1;
      });

      if (!tooClose) {
        collectibles.push({ id: id++, x, z, collected: false });
      }
    }
  }

  return collectibles;
}

const initialCollectibles = generateCollectibles(55);

// --- 3D Components ---

function Maze({ walls }) {
  const { wallGeometry, backgroundGeometry } = useMemo(() => {
    const wallGeometries = [];
    const bgGeometries = [];

    const addGeometry = (wall, targetArray) => {
      const isHorizontal = wall.orientation === 'horizontal';
      const width = isHorizontal ? wall.length : wall.thickness;
      const depth = isHorizontal ? wall.thickness : wall.length;

      const geometry = new THREE.BoxGeometry(width, wall.height, depth);

      const uvs = geometry.attributes.uv;
      for (let i = 0; i < uvs.count; i++) {
        const u = uvs.getX(i);
        const v = uvs.getY(i);

        if (wall.height > 2) {
          uvs.setXY(i, u * 2, v * 1);
        } else {
          const repeatX = wall.length;
          uvs.setXY(i, u * repeatX, v);
        }
      }

      const centerX = isHorizontal ? wall.x + wall.length / 2 : wall.x;
      const centerZ = isHorizontal ? wall.z : wall.z + wall.length / 2;

      geometry.translate(centerX, wall.height / 2, centerZ);
      targetArray.push(geometry);
    };

    walls.forEach(wall => {
      if (wall.height > 2) {
        addGeometry(wall, bgGeometries);
      } else {
        addGeometry(wall, wallGeometries);
      }
    });

    const mergedWallGeom = wallGeometries.length > 0 ? mergeBufferGeometries(wallGeometries) : null;
    const mergedBgGeom = bgGeometries.length > 0 ? mergeBufferGeometries(bgGeometries) : null;

    return { wallGeometry: mergedWallGeom, backgroundGeometry: mergedBgGeom };
  }, [walls]);

  const wallTexture = useLoader(THREE.TextureLoader, '/assets/paredes/wall_stone.jpg');
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.magFilter = THREE.NearestFilter;
  wallTexture.minFilter = THREE.NearestFilter;

  const bgTexture = useLoader(THREE.TextureLoader, '/assets/paredes/wall_background_4.png');
  bgTexture.wrapS = THREE.RepeatWrapping;
  bgTexture.wrapT = THREE.RepeatWrapping;
  bgTexture.magFilter = THREE.NearestFilter;
  bgTexture.minFilter = THREE.NearestFilter;

  return (
    <>
      {wallGeometry && (
        <mesh geometry={wallGeometry}>
          <meshBasicMaterial map={wallTexture} />
        </mesh>
      )}
      {backgroundGeometry && (
        <mesh geometry={backgroundGeometry}>
          <meshBasicMaterial
            map={bgTexture}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}
    </>
  );
}

function Player({ position, direction, onPositionUpdate, rotation, isPaused, isInvulnerable }) {
  const meshRef = useRef();
  const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/player.png');
  const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/player_secondary.png');

  const [currentFrame, setCurrentFrame] = useState(0);
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
      const speed = 4.5;
      const newX = position.x + direction.x * speed * delta;
      const newZ = position.z + direction.z * speed * delta;

      if (!checkCollision(newX, newZ)) {
        onPositionUpdate(newX, newZ);
      }

      const time = state.clock.getElapsedTime();
      const newFrame = Math.floor(time * animationSpeed) % frameCount;
      setCurrentFrame(newFrame);
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
    <mesh
      ref={meshRef}
      position={[position.x, 0.5, position.z]}
      rotation={[-Math.PI / 4, rotation, 0]}
      scale={[getFlipX(), 1, 1]}
    >
      <planeGeometry args={[1.1, 1.1]} />
      <meshStandardMaterial
        map={texture}
        transparent={true}
        side={THREE.DoubleSide}
        alphaTest={0.5}
        opacity={pulseOpacity}
        depthWrite={true}
      />
    </mesh>
  );
}

function InstancedCollectibles({ collectibles }) {
  const meshRef = useRef();
  const texture = useLoader(THREE.TextureLoader, '/assets/cervezas/collectible_medusa.png');

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
        opacity={1}
      />
    </instancedMesh>
  );
}

function Doghouse({ position }) {
  const meshRef = useRef();
  const texture = useLoader(THREE.TextureLoader, '/assets/casetas/image-removebg-preview (9).png');

  useMemo(() => {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
  }, [texture]);

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

// Preload textures
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_13.png');
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_14.png');



function Floor() {
  const meshRef = useRef();
  const texture = useLoader(THREE.TextureLoader, '/assets/suelos/floor_texture_3.png');

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;

      texture.offset.x = Math.sin(time * 0.1) * 0.1;
      texture.offset.y = time * 0.05;

      const wave = Math.sin(time * 0.5) * 0.5 + 0.5;
      const r = 0.5 + wave * 0.3;
      const g = 0.7 + wave * 0.3;
      const b = 0.9 + wave * 0.1;
      meshRef.current.material.color.setRGB(r, g, b);
      meshRef.current.material.emissive.setRGB(0.3, 0.5, 0.8);
    }
  });

  const floorWidth = 44;
  const floorDepth = 48;

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[14, -0.1, 16]}>
      <planeGeometry args={[floorWidth, floorDepth]} />
      <meshStandardMaterial
        map={texture}
        color="#7eb3d9"
        emissive="#4a90c9"
        emissiveIntensity={0.4}
        transparent={true}
        opacity={0.9}
      />
    </mesh>
  );
}

function Bubbles() {
  const meshRef = useRef();
  const count = 80;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const texture = useLoader(THREE.TextureLoader, '/assets/bubble.jpg');

  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);
  const frustum = useMemo(() => new THREE.Frustum(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 100;
      const x = Math.random() * 32 - 2;
      const z = Math.random() * 36 - 2;
      const y = Math.random() * 10;
      const scale = 0.2 + Math.random() * 0.3;
      temp.push({ factor, speed, x, z, y, scale, initialScale: scale });
    }
    return temp;
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const camera = state.camera;
    camera.updateMatrixWorld();
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    particles.forEach((particle, i) => {
      particle.y += particle.speed * 8 * delta;

      if (particle.y > 8) {
        particle.y = -1;
        particle.x = Math.random() * 32 - 2;
        particle.z = Math.random() * 36 - 2;
      }

      const time = state.clock.elapsedTime;
      const displayX = particle.x + Math.sin(time * 0.5 + particle.factor) * 0.3;
      const displayZ = particle.z + Math.cos(time * 0.3 + particle.factor) * 0.3;

      const position = new THREE.Vector3(displayX, particle.y, displayZ);
      if (frustum.containsPoint(position)) {
        dummy.position.copy(position);
        dummy.lookAt(camera.position);

        const pulse = 1 + Math.sin(time * 2 + particle.factor) * 0.1;
        const currentScale = particle.scale * pulse;

        dummy.scale.set(currentScale, currentScale, currentScale);
      } else {
        dummy.scale.set(0, 0, 0);
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent={true}
        opacity={0.8}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
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

export default function Level2({ onBack, onNextLevel, onLevelComplete }) {
  const [playerPos, setPlayerPos] = useState({ x: 2, z: 2 });
  const [direction, setDirection] = useState({ x: 0, z: 0 });
  const [collectibles, setCollectibles] = useState(initialCollectibles);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [enemies, setEnemies] = useState([]);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [finalScoreStats, setFinalScoreStats] = useState({ score: 0, bonus: 0, total: 0 });
  const enemyIdRef = useRef(1);
  const invulnerabilityTimerRef = useRef(null);

  const [enemyAlert, setEnemyAlert] = useState(null);

  const showEnemyAlert = (text) => {
    setEnemyAlert(text);
    setTimeout(() => {
      setEnemyAlert(null);
    }, 2000);
  };

  // Patrol zones
  const patrolZones = useMemo(() => createPatrolZones(28, 32, 2), []);

  const doghousePos = { x: 5, z: 5 };

  const cameraConfig = {
    rotation: Math.PI / 4.8,
    distance: 7,
    height: 5,
    fov: 60,
  };

  const playerRotation = 1.1;

  // Audio
  const musicRef = useRef(null);

  useEffect(() => {
    if (showIntroVideo) return;

    musicRef.current = new Audio('/assets/audio/music_medusa.wav');
    musicRef.current.loop = true;
    musicRef.current.volume = 0.3;

    // Only play if not muted initially (though muted state starts false)
    if (!isMuted) {
      musicRef.current.play().catch(e => console.log("Audio play failed:", e));
    }

    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, [showIntroVideo]); // Only run when showIntroVideo changes

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

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const restartLevel = () => {
    setPlayerPos({ x: 2, z: 2 });
    setDirection({ x: 0, z: 0 });
    setCollectibles(initialCollectibles.map(c => ({ ...c, collected: false })));
    setScore(0);
    setLives(3);
    setEnemies([]);
    setIsInvulnerable(false);
    enemyIdRef.current = 1;
    setIsPaused(false);
    setShowSettingsModal(false);
    setShowGameOverModal(false);
    setShowGameOverModal(false);
    setShowVictoryModal(false);
    setShowTutorial(true);
    setStartTime(Date.now());

    if (invulnerabilityTimerRef.current) {
      clearTimeout(invulnerabilityTimerRef.current);
      invulnerabilityTimerRef.current = null;
    }
  };

  // Spawn enemies
  useEffect(() => {
    if (!showTutorial) {
      setStartTime(Date.now());
    }
  }, [showTutorial]);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setEnemies(prev => [
        ...prev,
        {
          id: enemyIdRef.current++,
          x: doghousePos.x,
          z: doghousePos.z,
          role: AIRoles.CHASER,
          zone: assignZone(0, patrolZones),
          isReturning: false
        }
      ]);
      showEnemyAlert("¡Apareció un enemigo!");
    }, 5000);

    const timer2 = setTimeout(() => {
      setEnemies(prev => [
        ...prev,
        {
          id: enemyIdRef.current++,
          x: doghousePos.x,
          z: doghousePos.z,
          role: AIRoles.PATROL,
          zone: assignZone(1, patrolZones),
          isReturning: false
        }
      ]);
      showEnemyAlert("¡Cuidado, otro enemigo!");
    }, 10000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [showTutorial]);

  useEffect(() => {
    return () => {
      if (invulnerabilityTimerRef.current) {
        clearTimeout(invulnerabilityTimerRef.current);
      }
    };
  }, []);

  // Return to base logic
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

  // Constant collision check (Fix for idle player not getting hit)
  useEffect(() => {
    if (isPaused || isInvulnerable) return;

    const hitByEnemy = enemies.some(enemy => {
      if (enemy.isReturning) return false;

      const distance = Math.sqrt(
        Math.pow(playerPos.x - enemy.x, 2) +
        Math.pow(playerPos.z - enemy.z, 2)
      );
      return distance < 0.5;
    });

    if (hitByEnemy) {
      const newLives = lives - 1;

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
  }, [playerPos, enemies, isPaused, isInvulnerable, lives]);

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
  }, [showTutorial, direction]);

  const handleEnemyPositionUpdate = (enemyId, x, z) => {
    setEnemies(prevEnemies =>
      prevEnemies.map(enemy =>
        enemy.id === enemyId ? { ...enemy, x, z } : enemy
      )
    );
  };

  const handlePositionUpdate = (x, z) => {
    setPlayerPos({ x, z });

    // Check enemy collision
    if (!isInvulnerable) {
      const hitByEnemy = enemies.some(enemy => {
        const distance = Math.sqrt(
          Math.pow(x - enemy.x, 2) + Math.pow(z - enemy.z, 2)
        );
        return distance < 0.4;
      });

      if (hitByEnemy) {
        const newLives = lives - 1;

        if (newLives <= 0) {
          setLives(0);

          // Calculate score stats for Game Over
          const elapsedSeconds = (Date.now() - startTime) / 1000;
          const timeBonus = Math.max(0, Math.floor((180 - elapsedSeconds) * 10)); // 3 mins max time
          const currentTotal = score; // No bonus on death usually, but user asked for points. 
          // If soft pass is active, maybe give bonus?
          // "quiero que pongas un bonus por tiempo que aumente los puntos" -> implied for win, but let's check.
          // If they DIE, they probably shouldn't get a time bonus for finishing, as they didn't finish.
          // However, for the "Soft Pass", they are "advancing".
          // Let's give them the bonus if they meet the soft pass criteria.

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

    // Check collectible collision
    setCollectibles(prevCollectibles => {
      let hasChanges = false;
      const newCollectibles = prevCollectibles.map(collectible => {
        if (collectible.collected) return collectible;

        const distance = Math.sqrt(
          Math.pow(x - collectible.x, 2) + Math.pow(z - collectible.z, 2)
        );
        if (distance < 0.5) {
          hasChanges = true;
          return { ...collectible, collected: true };
        }
        return collectible;
      });

      return hasChanges ? newCollectibles : prevCollectibles;
    });
  };

  // Effect to handle score and sound when collectibles change
  const beersCollected = useMemo(() => collectibles.filter(c => c.collected).length, [collectibles]);
  const prevBeersRef = useRef(0);

  useEffect(() => {
    const diff = beersCollected - prevBeersRef.current;
    if (diff > 0) {
      setScore(prev => prev + (diff * 10));
      playCollectSound();
    }
    prevBeersRef.current = beersCollected;
  }, [beersCollected]);

  // Check for victory (all beers collected)
  const totalBeers = initialCollectibles.length;
  useEffect(() => {
    if (beersCollected >= totalBeers && !showVictoryModal) {
      setIsPaused(true);

      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const timeBonus = Math.max(0, Math.floor((180 - elapsedSeconds) * 10));

      setFinalScoreStats({
        score: score,
        bonus: timeBonus,
        total: score + timeBonus
      });

      setShowVictoryModal(true);
      if (onLevelComplete) {
        onLevelComplete(1); // Nivel 1 completed (Level2.jsx), unlock Nivel 2
      }
    }
  }, [beersCollected, totalBeers, showVictoryModal, onLevelComplete, score, startTime]);

  return (
    <div className="game-container">
      <Canvas camera={{ position: [14, 16, 24], fov: cameraConfig.fov }} shadows>
        <ambientLight intensity={1.5} />
        <directionalLight position={[14, 20, 16]} intensity={1.0} />

        <Maze walls={walls} />
        <Floor />

        <InstancedCollectibles collectibles={collectibles} />
        <Bubbles />

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
            isPowerActive={false}
            isPaused={isPaused}
            rotation={playerRotation}
            role={enemy.role}
            assignedZone={enemy.zone}
            doghousePos={doghousePos}
            isReturning={enemy.isReturning}
            spritesheet1Path="/assets/personajes/enemy_type_13.png"
            spritesheet2Path="/assets/personajes/enemy_type_14.png"
          />
        ))}

        <Player
          position={playerPos}
          direction={direction}
          onPositionUpdate={(x, z) => handlePositionUpdate(x, z)}
          rotation={playerRotation}
          isPaused={isPaused}
          isInvulnerable={isInvulnerable}
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
          levelNumber={2}
          lives={lives}
          score={score}
          beersCollected={beersCollected}
          onBack={onBack}
          onSettingsClick={() => {
            setIsPaused(true);
            setShowSettingsModal(true);
          }}
        />

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



        {showTutorial && (
          <div className="tutorial-modal">
            <div className="tutorial-content glass-panel animate-fade-in">
              <h2>¡NIVEL 2: LAS MEDUSAS!</h2>
              <p>Evita a los enemigos y recoge las medusas.</p>
              <p>¡Cuidado! Atravesar paredes te hará daño.</p>
              <button onClick={() => setShowTutorial(false)}>¡ENTENDIDO!</button>
            </div>
          </div>
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

        {showGameOverModal && (
          <div className="game-over-modal">
            <div className="game-over-content glass-panel">
              <h2 className="game-over-title">
                {beersCollected / initialCollectibles.length >= 0.7 ? "¡BUEN INTENTO!" : "¡HAS PERDIDO!"}
              </h2>
              <p className="game-over-subtitle">
                {beersCollected / initialCollectibles.length >= 0.7 ? "Puedes avanzar al siguiente nivel" : "Se acabaron las vidas"}
              </p>

              {beersCollected / initialCollectibles.length >= 0.7 && (
                <StarRating stars={
                  beersCollected / initialCollectibles.length >= 0.85 ? 2 : 1
                } />
              )}

              <div className="game-over-stats">
                <p>Puntuación Base: {finalScoreStats.score}</p>
                <p>Bonus Tiempo: {finalScoreStats.bonus}</p>
                <p style={{ fontSize: '1.2em', color: '#FFD700' }}>Total: {finalScoreStats.total}</p>
                <p>Cervezas recogidas: {beersCollected}</p>
                {beersCollected / initialCollectibles.length >= 0.7 && (
                  <p style={{ color: '#48BB78', marginTop: '10px' }}>¡Objetivo mínimo completado!</p>
                )}
              </div>

              {beersCollected / initialCollectibles.length >= 0.7 && onNextLevel && (
                <button className="modal-button" onClick={onNextLevel} style={{ backgroundColor: '#48BB78', marginBottom: '15px' }}>
                  <Play size={20} /> Siguiente Nivel
                </button>
              )}

              <button className="modal-button restart-button" onClick={restartLevel}>
                <RotateCcw size={20} /> Reintentar
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                <Home size={20} /> Volver al menú
              </button>
            </div>
          </div>
        )}

        {
          showVictoryModal && (
            <div className="victory-modal">
              <div className="victory-content glass-panel">
                <h2 className="victory-title">¡VICTORIA!</h2>
                <p className="victory-subtitle">¡Nivel Completado!</p>

                <StarRating stars={3} />

                <div className="victory-stats">
                  <p>Puntuación Base: {finalScoreStats.score}</p>
                  <p>Bonus Tiempo: {finalScoreStats.bonus}</p>
                  <p style={{ fontSize: '1.4em', color: '#FFD700', fontWeight: 'bold' }}>Total: {finalScoreStats.total}</p>
                </div>
                {onNextLevel && (
                  <button className="modal-button" onClick={onNextLevel} style={{ backgroundColor: '#48BB78' }}>
                    <Play size={20} /> Siguiente Nivel
                  </button>
                )}
                <button className="modal-button restart-button" onClick={restartLevel}>
                  <RotateCcw size={20} /> Jugar de nuevo
                </button>
                <button className="modal-button cancel-button" onClick={onBack}>
                  <Home size={20} /> Volver al menú
                </button>
              </div>
            </div>
          )
        }

        {
          enemyAlert && (
            <div className="enemy-alert">
              {enemyAlert}
            </div>
          )
        }
      </div >

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
            src="/assets/videos/NIVEL 1 FINAL.mp4"
            autoPlay
            playsInline

            onLoadStart={() => setIsVideoLoading(true)}
            onWaiting={() => setIsVideoLoading(true)}
            onCanPlay={() => setIsVideoLoading(false)}
            onPlaying={() => setIsVideoLoading(false)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isVideoLoading ? 0.5 : 1 }}
            onEnded={() => setShowIntroVideo(false)}
            onClick={() => setShowIntroVideo(false)}
            onError={() => setShowIntroVideo(false)}
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

