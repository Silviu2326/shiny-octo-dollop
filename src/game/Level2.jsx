import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import './Level2.css';
import LevelHeader from '../components/LevelHeader';

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

const initialCollectibles = generateCollectibles(110);

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
    if (direction.z < 0) return spritesheet1;
    if (direction.x < 0) return spritesheet1;
    if (direction.x > 0) return spritesheet2;
    if (direction.z > 0) return spritesheet2;
    return spritesheet2;
  };

  const getFlipX = () => {
    if (direction.x < 0) return -1;
    if (direction.z > 0) return -1;
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

function Enemy({ position, playerPos, onPositionUpdate, rotation, isPaused, enemyId }) {
  const meshRef = useRef();
  const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_13.png');
  const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_14.png');

  const [currentFrame, setCurrentFrame] = useState(0);
  const [direction, setDirection] = useState({ x: 1, z: 0 });
  const [mode, setMode] = useState('scatter');
  const [modeTimer, setModeTimer] = useState(0);
  const [lastIntersectionPos, setLastIntersectionPos] = useState({ x: -999, z: -999 });

  const timerConfig = useRef({
    scatterDuration: 8 + Math.random() * 4,
    chaseDuration: 3 + Math.random() * 2,
  }).current;

  useMemo(() => {
    spritesheet1.magFilter = THREE.NearestFilter;
    spritesheet1.minFilter = THREE.NearestFilter;
    spritesheet2.magFilter = THREE.NearestFilter;
    spritesheet2.minFilter = THREE.NearestFilter;
  }, [spritesheet1, spritesheet2]);

  const frameCount = 8;
  const animationSpeed = 10;

  const isAtIntersection = (x, z, lastPos) => {
    const distanceFromLast = Math.sqrt(
      Math.pow(x - lastPos.x, 2) + Math.pow(z - lastPos.z, 2)
    );
    if (distanceFromLast < 1.5) return false;

    const directions = [
      { x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 },
    ];

    let availableDirections = 0;
    directions.forEach(dir => {
      const testX = x + dir.x * 0.6;
      const testZ = z + dir.z * 0.6;
      if (!checkCollision(testX, testZ)) {
        availableDirections++;
      }
    });

    return availableDirections > 2;
  };

  const getValidDirections = (x, z, currentDir) => {
    const directions = [
      { x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 },
    ];

    return directions.filter(dir => {
      if (dir.x === -currentDir.x && dir.z === -currentDir.z) return false;
      const testX = x + dir.x * 0.5;
      const testZ = z + dir.z * 0.5;
      return !checkCollision(testX, testZ);
    });
  };

  useFrame((state, delta) => {
    if (isPaused) return;

    const distance = Math.sqrt(
      Math.pow(playerPos.x - position.x, 2) +
      Math.pow(playerPos.z - position.z, 2)
    );
    if (distance > 20) return;

    setModeTimer(prev => {
      const newTimer = prev + delta;
      const currentDuration = mode === 'scatter'
        ? timerConfig.scatterDuration
        : timerConfig.chaseDuration;

      if (newTimer >= currentDuration) {
        setMode(currentMode => currentMode === 'scatter' ? 'chase' : 'scatter');
        return 0;
      }
      return newTimer;
    });

    const speed = 2.70;
    const nextX = position.x + direction.x * speed * delta;
    const nextZ = position.z + direction.z * speed * delta;

    const canMove = !checkCollision(nextX, nextZ);
    const atIntersection = isAtIntersection(position.x, position.z, lastIntersectionPos);

    if (atIntersection || !canMove) {
      const validDirs = getValidDirections(position.x, position.z, direction);

      if (validDirs.length > 0) {
        let newDir;

        if (mode === 'scatter') {
          newDir = validDirs[Math.floor(Math.random() * validDirs.length)];
        } else {
          const isPlayerClose = distance < 8;

          if (isPlayerClose && Math.random() > 0.3) {
            const dx = playerPos.x - position.x;
            const dz = playerPos.z - position.z;

            newDir = validDirs.reduce((best, dir) => {
              const score = dir.x * dx + dir.z * dz;
              const bestScore = best.x * dx + best.z * dz;
              return score > bestScore ? dir : best;
            });
          } else {
            const continueDir = validDirs.find(dir =>
              dir.x === direction.x && dir.z === direction.z
            );
            newDir = continueDir || validDirs[Math.floor(Math.random() * validDirs.length)];
          }
        }

        setDirection(newDir);
        if (atIntersection) {
          setLastIntersectionPos({ x: position.x, z: position.z });
        }
      }
    }

    if (canMove) {
      onPositionUpdate(nextX, nextZ);
      const time = state.clock.getElapsedTime();
      const newFrame = Math.floor(time * animationSpeed) % frameCount;
      setCurrentFrame(newFrame);
    }
  });

  const getCurrentTexture = () => {
    if (direction.x > 0 || direction.z > 0) return spritesheet1;
    return spritesheet2;
  };

  const getFlipX = () => {
    if (direction.z > 0) return -1;
    if (direction.x < 0) return -1;
    return 1;
  };

  const texture = getCurrentTexture();
  texture.repeat.set(1 / frameCount, 1);
  texture.offset.x = currentFrame / frameCount;

  return (
    <mesh
      ref={meshRef}
      position={[position.x, 0.5, position.z]}
      rotation={[-Math.PI / 4, rotation, 0]}
      scale={[getFlipX(), 1, 1]}
    >
      <planeGeometry args={[1.3, 1.3]} />
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

// --- Main Component ---

export default function Level2({ onBack }) {
  const [playerPos, setPlayerPos] = useState({ x: 2, z: 2 });
  const [direction, setDirection] = useState({ x: 0, z: 0 });
  const [collectibles, setCollectibles] = useState(initialCollectibles);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [beersCollected, setBeersCollected] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [enemies, setEnemies] = useState([]);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const enemyIdRef = useRef(1);
  const invulnerabilityTimerRef = useRef(null);

  const doghousePos = { x: 5, z: 5 };

  const cameraConfig = {
    rotation: Math.PI / 4.8,
    distance: 7,
    height: 5,
    fov: 60,
  };

  const playerRotation = 1.1;

  // Audio
  useEffect(() => {
    const music = new Audio('/assets/audio/music_medusa.wav');
    music.loop = true;
    music.volume = 0.3;
    music.play().catch(e => console.log("Audio play failed:", e));

    return () => {
      music.pause();
      music.currentTime = 0;
    };
  }, []);

  const playCollectSound = () => {
    const sfx = new Audio('/assets/audio/sfx_collect.mp3');
    sfx.volume = 0.6;
    sfx.play().catch(e => console.log("SFX play failed:", e));
  };

  const playLoseLifeSound = () => {
    const sfx = new Audio('/assets/audio/sfx_lose_life.mp3');
    sfx.volume = 0.6;
    sfx.play().catch(e => console.log("SFX play failed:", e));
  };

  const playGameOverSound = () => {
    const sfx = new Audio('/assets/audio/sfx_game_over.mp3');
    sfx.volume = 0.6;
    sfx.play().catch(e => console.log("SFX play failed:", e));
  };

  const restartLevel = () => {
    setPlayerPos({ x: 2, z: 2 });
    setDirection({ x: 0, z: 0 });
    setCollectibles(initialCollectibles.map(c => ({ ...c, collected: false })));
    setScore(0);
    setLives(3);
    setBeersCollected(0);
    setEnemies([]);
    setIsInvulnerable(false);
    enemyIdRef.current = 1;
    setIsPaused(false);
    setShowSettingsModal(false);
    setShowGameOverModal(false);
    setShowTutorial(true);

    if (invulnerabilityTimerRef.current) {
      clearTimeout(invulnerabilityTimerRef.current);
      invulnerabilityTimerRef.current = null;
    }
  };

  // Spawn enemies
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setEnemies(prev => [...prev, { id: enemyIdRef.current++, x: doghousePos.x, z: doghousePos.z }]);
    }, 5000);

    const timer2 = setTimeout(() => {
      setEnemies(prev => [...prev, { id: enemyIdRef.current++, x: doghousePos.x, z: doghousePos.z }]);
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

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showTutorial) {
        setShowTutorial(false);
        return;
      }
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

  // Touch Controls
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const minSwipeDistance = 30;

    const handleTouchStart = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
      }

      if (showTutorial) {
        setShowTutorial(false);
        return;
      }
      e.preventDefault();
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
      }

      e.preventDefault();
      touchEndX = e.touches[0].clientX;
      touchEndY = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      if (showTutorial) return;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX < minSwipeDistance && absDeltaY < minSwipeDistance) {
        return;
      }

      if (absDeltaX > absDeltaY) {
        if (deltaX > 0) {
          setDirection({ x: 1, z: 0 });
        } else {
          setDirection({ x: -1, z: 0 });
        }
      } else {
        if (deltaY > 0) {
          setDirection({ x: 0, z: 1 });
        } else {
          setDirection({ x: 0, z: -1 });
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showTutorial]);

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
      return prevCollectibles.map(collectible => {
        const distance = Math.sqrt(
          Math.pow(x - collectible.x, 2) + Math.pow(z - collectible.z, 2)
        );
        if (distance < 0.5 && !collectible.collected) {
          setScore(prev => prev + 10);
          setBeersCollected(prev => prev + 1);
          playCollectSound();
          return { ...collectible, collected: true };
        }
        return collectible;
      });
    });
  };

  return (
    <div className="game-container">
      <Canvas camera={{ position: [14, 16, 24], fov: cameraConfig.fov }} shadows>
        <ambientLight intensity={1.2} />
        <pointLight position={[14, 15, 16]} intensity={2.0} />
        <pointLight position={[7, 10, 8]} intensity={1.2} />
        <pointLight position={[21, 10, 24]} intensity={1.2} />

        <Maze walls={walls} />
        <Floor />
        <Bubbles />

        <InstancedCollectibles collectibles={collectibles} />

        <Doghouse position={doghousePos} />

        {enemies.map(enemy => (
          <Enemy
            key={enemy.id}
            enemyId={enemy.id}
            position={{ x: enemy.x, z: enemy.z }}
            playerPos={playerPos}
            onPositionUpdate={(x, z) => handleEnemyPositionUpdate(enemy.id, x, z)}
            rotation={playerRotation}
            isPaused={isPaused}
          />
        ))}

        <Player
          position={playerPos}
          direction={direction}
          onPositionUpdate={handlePositionUpdate}
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
          lives={lives}
          levelNumber={2}
          beersCollected={beersCollected}
          score={score}
        />

        <button className="settings-button" onClick={() => {
          setIsPaused(true);
          setShowSettingsModal(true);
        }}>
          ⏸️
        </button>

        {showTutorial && (
          <div className="tutorial-modal animate-fade-in">
            <div className="tutorial-content glass-panel">
              <h2>¡Bienvenido a Medusa!</h2>
              <p>Usa las flechas o W/A/S/D para moverte.</p>
              <p>¡Cuidado con los enemigos!</p>
              <p>Tienes 3 vidas.</p>
              <button onClick={() => setShowTutorial(false)}>JUGAR</button>
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
                ▶️ Seguir
              </button>
              <button className="modal-button restart-button" onClick={restartLevel}>
                🔄 Reiniciar
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                🏠 Salir
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
                🔄 Reintentar
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                🏠 Volver al menú
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
