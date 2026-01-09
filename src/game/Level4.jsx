import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import './Level4.css';
import LevelHeader from '../components/LevelHeader';

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

const initialCollectibles = generateCollectibles(150);

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

  const texture = getCurrentTexture();
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

function Enemy({ position, playerPos, onPositionUpdate, isPowerActive, isPaused, role = 'normal' }) {
  const meshRef = useRef();
  const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_9.png');
  const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_10.png');

  const [currentFrame, setCurrentFrame] = useState(0);
  const [animationTime, setAnimationTime] = useState(0);
  const [direction, setDirection] = useState({ x: 1, z: 0 });
  const [mode, setMode] = useState('scatter');
  const [modeTimer, setModeTimer] = useState(0);
  const [lastIntersectionPos, setLastIntersectionPos] = useState({ x: -999, z: -999 });

  useMemo(() => {
    spritesheet1.magFilter = THREE.NearestFilter;
    spritesheet1.minFilter = THREE.NearestFilter;
    spritesheet2.magFilter = THREE.NearestFilter;
    spritesheet2.minFilter = THREE.NearestFilter;
  }, [spritesheet1, spritesheet2]);

  const frameCount = 8;
  const animationSpeed = 10;

  const timerConfig = useMemo(() => {
    const baseVariation = Math.random() * 2;

    switch (role) {
      case 'straight':
        return {
          scatterDuration: 6 + baseVariation,
          chaseDuration: 5 + baseVariation,
          straightBias: 0.7,
        };
      case 'turner':
        return {
          scatterDuration: 5 + baseVariation,
          chaseDuration: 6 + baseVariation,
          straightBias: 0.2,
        };
      case 'frequent':
        return {
          scatterDuration: 3 + baseVariation,
          chaseDuration: 3 + baseVariation,
          straightBias: 0.5,
        };
      default:
        return {
          scatterDuration: 5 + baseVariation,
          chaseDuration: 5 + baseVariation,
          straightBias: 0.5,
        };
    }
  }, [role]);

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
    if (distance > 25) return;

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

    const speed = 4.28;
    const nextX = position.x + direction.x * speed * delta;
    const nextZ = position.z + direction.z * speed * delta;

    const canMove = !checkCollision(nextX, nextZ);
    const atIntersection = isAtIntersection(position.x, position.z, lastIntersectionPos);

    if (atIntersection || !canMove) {
      const validDirs = getValidDirections(position.x, position.z, direction);

      if (validDirs.length > 0) {
        let newDir;

        if (mode === 'scatter') {
          const continueDir = validDirs.find(dir =>
            dir.x === direction.x && dir.z === direction.z
          );

          if (continueDir && Math.random() < timerConfig.straightBias) {
            newDir = continueDir;
          } else {
            newDir = validDirs[Math.floor(Math.random() * validDirs.length)];
          }
        } else {
          const dx = playerPos.x - position.x;
          const dz = playerPos.z - position.z;

          newDir = validDirs.reduce((best, dir) => {
            const score = dir.x * dx + dir.z * dz;
            const bestScore = best.x * dx + best.z * dz;
            return score > bestScore ? dir : best;
          });
        }

        setDirection(newDir);

        if (atIntersection) {
          setLastIntersectionPos({ x: position.x, z: position.z });
        }
      }
    }

    if (canMove) {
      onPositionUpdate(nextX, nextZ);

      setAnimationTime(prev => {
        const newTime = prev + delta * animationSpeed;
        const newFrame = Math.floor(newTime) % frameCount;
        setCurrentFrame(newFrame);
        return newTime;
      });
    }
  });

  const getCurrentTexture = () => {
    if (direction.x > 0 || direction.z > 0) {
      return spritesheet1;
    } else {
      return spritesheet2;
    }
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
      rotation={[-Math.PI / 4, 1.1, 0]}
      scale={[getFlipX(), 1, 1]}
    >
      <planeGeometry args={[1.3, 1.3]} />
      <meshStandardMaterial
        map={texture}
        transparent={true}
        side={THREE.DoubleSide}
        alphaTest={0.5}
        depthWrite={true}
        color={isPowerActive ? "#6666ff" : "white"}
      />
    </mesh>
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
  texture.repeat.set(25, 25);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, -0.1, 17]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
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

export default function Level4({ onBack }) {
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
    { id: 4, x: 24, z: 8, collected: false },
    { id: 5, x: 19, z: 28, collected: false },
  ]);
  const collectedBarrelsRef = useRef(new Set());
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

  const doghousePos = { x: 3, z: 5 };

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
      { id: 4, x: 24, z: 8, collected: false },
      { id: 5, x: 19, z: 28, collected: false },
    ]);
    collectedBarrelsRef.current.clear();
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
          id: enemyIdRef.current++,
          x: doghousePos.x,
          z: doghousePos.z,
          role: 'straight',
        }
      ]);
    }, 4000);

    const timer2 = setTimeout(() => {
      setEnemies(prevEnemies => [
        ...prevEnemies,
        {
          id: enemyIdRef.current++,
          x: doghousePos.x,
          z: doghousePos.z,
          role: 'turner',
        }
      ]);
    }, 8000);

    const timer3 = setTimeout(() => {
      setEnemies(prevEnemies => [
        ...prevEnemies,
        {
          id: enemyIdRef.current++,
          x: doghousePos.x,
          z: doghousePos.z,
          role: 'frequent',
        }
      ]);
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

    if (!isInvulnerable) {
      const hitByEnemy = enemies.some(enemy => {
        const distance = Math.sqrt(
          Math.pow(x - enemy.x, 2) + Math.pow(z - enemy.z, 2)
        );
        return distance < 0.4;
      });

      if (hitByEnemy) {
        const newLives = lives - 1;
        setLivesLost(true);

        if (newLives <= 0) {
          setLives(0);
          setShowGameOverModal(true);
          setIsPaused(true);
        } else {
          setLives(newLives);

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

    setSpecialBonuses(prev => {
      return prev.map(bonus => {
        if (!bonus.collected) {
          const distance = Math.sqrt(
            Math.pow(x - bonus.x, 2) + Math.pow(z - bonus.z, 2)
          );
          if (distance < 0.6) {
            setScore(p => p + 500);
            return { ...bonus, collected: true };
          }
        }
        return bonus;
      });
    });

    setBarrels(prevBarrels => {
      return prevBarrels.map(barrel => {
        if (!barrel.collected && !collectedBarrelsRef.current.has(barrel.id)) {
          const distance = Math.sqrt(
            Math.pow(x - barrel.x, 2) + Math.pow(z - barrel.z, 2)
          );
          if (distance < 0.6) {
            // Mark as collected in the ref immediately to prevent double collection
            collectedBarrelsRef.current.add(barrel.id);
            setTokens(prev => prev + 1);
            setScore(prev => prev + 25);
            return { ...barrel, collected: true };
          }
        }
        return barrel;
      });
    });

    setCollectibles(prevCollectibles => {
      return prevCollectibles.map(collectible => {
        if (!collectible.collected) {
          const distance = Math.sqrt(
            Math.pow(x - collectible.x, 2) + Math.pow(z - collectible.z, 2)
          );
          if (distance < 0.5) {
            setComboMultiplier(1.5);
            if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
            comboTimerRef.current = setTimeout(() => {
              setComboMultiplier(1);
            }, 3000);

            setScore(prev => prev + Math.floor(10 * comboMultiplier));
            setBeersCollected(prev => prev + 1);
            return { ...collectible, collected: true };
          }
        }
        return collectible;
      });
    });
  };

  useEffect(() => {
    if (beersCollected === initialCollectibles.length && initialCollectibles.length > 0) {
      setIsPaused(true);
      setShowWinModal(true);
    }
  }, [beersCollected]);

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

  // Touch Controls
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const minSwipeDistance = 30;

    const handleTouchStart = (e) => {
      // Ignore if touching a button
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
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
  }, [isPaused]);

  return (
    <div className="game-container">
      <Canvas camera={{ position: [14, 18, 26], fov: cameraConfig.fov }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[14, 22, 17]} intensity={1.0} />

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

        {enemies.map(enemy => (
          <Enemy
            key={enemy.id}
            enemyId={enemy.id}
            role={enemy.role || 'normal'}
            position={{ x: enemy.x, z: enemy.z }}
            playerPos={playerPos}
            onPositionUpdate={(x, z) => handleEnemyPositionUpdate(enemy.id, x, z)}
            isPowerActive={powerActive}
            isPaused={isPaused}
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
      </Canvas>

      <div className="ui-overlay">
        <LevelHeader
          lives={lives}
          levelName="La Rubia"
          beersCollected={beersCollected}
          totalBeers={initialCollectibles.length}
          score={score}
          levelNumber={4}
        />

        <div className="power-button-container">
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
              <button className="modal-button restart-button" onClick={restartLevel}>
                Reiniciar
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                Salir
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
          <div className="win-modal">
            <div className="win-content glass-panel">
              <h2 className="win-title">¡NIVEL COMPLETADO!</h2>
              <p className="win-subtitle">¡Excelente trabajo!</p>
              <div className="win-stats">
                <p>Puntuación Base: {score}</p>
                {!livesLost && (
                  <p className="bonus-text">★ Sin perder vidas: +100</p>
                )}
                {tokens > 0 && (
                  <p className="bonus-text-blue">★ Barriles guardados: +{tokens * 50}</p>
                )}
                <div className="stats-divider"></div>
                <p className="total-score">
                  TOTAL: {Math.max(150, score + (!livesLost ? 100 : 0) + (tokens * 50))}
                </p>
              </div>
              <button className="modal-button restart-button" onClick={restartLevel}>
                Jugar de nuevo
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                Volver al menú
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
