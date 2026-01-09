import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import * as THREE from 'three';
import './Level3.css';
import LevelHeader from '../components/LevelHeader';

const walls = [
  // Background walls
  { x: -2, z: -10, length: 60, height: 10, thickness: 1, orientation: 'vertical' },
  { x: -10, z: -2, length: 60, height: 10, thickness: 1, orientation: 'horizontal' },

  // SECTION 1: EXTERIOR BORDERS (28×32)
  { x: 0, z: 0, length: 28, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 0, z: 32, length: 28, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 0, z: 0, length: 32, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 28, z: 0, length: 32, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECTION 2: OUTER RING → MIDDLE with Choke Points
  { x: 4, z: 4, length: 9.5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 14.5, z: 4, length: 9.5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 4, z: 28, length: 9.5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 14.5, z: 28, length: 9.5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 4, z: 4, length: 24, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 24, z: 4, length: 24, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECTION 3: MIDDLE RING → INNER
  { x: 8, z: 8, length: 12, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 8, z: 24, length: 12, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 8, z: 8, length: 16, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 20, z: 8, length: 7.5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 20, z: 16.5, length: 7.5, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECTION 4: INNER RING
  { x: 12, z: 12, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 12, z: 20, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 12, z: 12, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 16, z: 12, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },

  // SECTION 5: DECORATIVE OBSTACLES
  { x: 5, z: 6, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 21, z: 6, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 5, z: 26, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 21, z: 26, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 10, z: 10, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 18, z: 10, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 10, z: 22, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
  { x: 18, z: 22, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
];

function checkCollision(x, z, walls) {
  const playerRadius = 0.3;

  for (const wall of walls) {
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
    const x = Math.random() * 26 + 1;
    const z = Math.random() * 30 + 1;

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

const initialCollectibles = generateCollectibles(140);

// Preload enemy textures to avoid lag
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

function Player({ position, direction, onPositionUpdate, walls, rotation, isPaused, isInvulnerable }) {
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

      if (!checkCollision(newX, newZ, walls)) {
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

  const texture = getCurrentTexture();
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
        depthWrite={true}
        opacity={pulseOpacity}
      />
    </mesh>
  );
}

function Enemy({ position, playerPos, walls, onPositionUpdate, rotation, isPowerActive, isPaused, enemyId }) {
  const meshRef = useRef();
  const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_11.png');
  const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_12.png');

  const [currentFrame, setCurrentFrame] = useState(0);
  const [direction, setDirection] = useState({ x: 1, z: 0 });
  const [mode, setMode] = useState('scatter');
  const [modeTimer, setModeTimer] = useState(0);
  const [lastIntersectionPos, setLastIntersectionPos] = useState({ x: -999, z: -999 });

  const timerConfig = useRef({
    scatterDuration: 5 + Math.random() * 3,
    chaseDuration: 5 + Math.random() * 3,
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
      if (!checkCollision(testX, testZ, walls)) {
        availableDirections++;
      }
    });

    return availableDirections > 2;
  };

  const getValidDirections = (x, z, currentDir, allowReverse = false) => {
    const directions = [
      { x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 },
    ];

    return directions.filter(dir => {
      if (!allowReverse && dir.x === -currentDir.x && dir.z === -currentDir.z) {
        return false;
      }

      const testX = x + dir.x * 0.5;
      const testZ = z + dir.z * 0.5;
      return !checkCollision(testX, testZ, walls);
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

    const baseSpeed = 3.60;
    const speed = isPowerActive ? baseSpeed * 0.5 : baseSpeed;
    const nextX = position.x + direction.x * speed * delta;
    const nextZ = position.z + direction.z * speed * delta;

    const canMove = !checkCollision(nextX, nextZ, walls);
    const atIntersection = isAtIntersection(position.x, position.z, lastIntersectionPos);

    if (atIntersection || !canMove) {
      let validDirs = getValidDirections(position.x, position.z, direction, false);

      if (validDirs.length === 0) {
        validDirs = getValidDirections(position.x, position.z, direction, true);
      }

      if (validDirs.length > 0) {
        let newDir;

        if (mode === 'scatter') {
          newDir = validDirs[Math.floor(Math.random() * validDirs.length)];
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
      const time = state.clock.getElapsedTime();
      const newFrame = Math.floor(time * animationSpeed) % frameCount;
      setCurrentFrame(newFrame);
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
        color={isPowerActive ? "#6666ff" : "white"}
      />
    </mesh>
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
  texture.repeat.set(50, 50);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, -0.1, 16]}>
      <planeGeometry args={[200, 200]} />
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

// --- Main Component ---

const doghousePos = { x: 2.5, z: 4 };

export default function Level3({ onBack }) {
  const [playerPos, setPlayerPos] = useState({ x: 2, z: 2 });
  const [direction, setDirection] = useState({ x: 0, z: 0 });
  const [collectibles, setCollectibles] = useState(initialCollectibles);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [beersCollected, setBeersCollected] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [specialBonuses, setSpecialBonuses] = useState([]);
  const [bonusFlags, setBonusFlags] = useState({ p30: false, p70: false });

  const [barrels, setBarrels] = useState([
    { id: 1, x: 3.5, z: 3, collected: false },
    { id: 2, x: 6, z: 16, collected: false },
    { id: 3, x: 22, z: 16, collected: false },
    { id: 4, x: 14, z: 16, collected: false },
  ]);
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
  const [isMuted, setIsMuted] = useState(false);

  // --- Main Component ---

  // Game Loop
  const handlePositionUpdate = React.useCallback((newX, newZ) => {
    if (isPaused) return;

    // Check collision with enemies
    const checkCollisions = (x, z) => {
      if (isInvulnerable) return;

      for (const enemy of enemies) {
        const dist = Math.sqrt(Math.pow(x - enemy.x, 2) + Math.pow(z - enemy.z, 2));
        if (dist < 0.8) {
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

          return;
        }
      }
    };

    // Special Bonuses collision
    let bonusHitId = null;
    specialBonuses.forEach(bonus => {
      if (!bonus.collected) {
        const distance = Math.sqrt(
          Math.pow(newX - bonus.x, 2) + Math.pow(newZ - bonus.z, 2)
        );
        if (distance < 0.6) {
          bonusHitId = bonus.id;
        }
      }
    });

    if (bonusHitId) {
      setSpecialBonuses(prev => prev.map(b => b.id === bonusHitId ? { ...b, collected: true } : b));
      setScore(p => p + 500);
      playCollectSound();
    }

    // Barrels collision
    let barrelHitId = null;
    barrels.forEach(barrel => {
      if (!barrel.collected) {
        const distance = Math.sqrt(
          Math.pow(newX - barrel.x, 2) + Math.pow(newZ - barrel.z, 2)
        );
        if (distance < 0.8) {
          barrelHitId = barrel.id;
        }
      }
    });

    if (barrelHitId) {
      setBarrels(prev => prev.map(b => b.id === barrelHitId ? { ...b, collected: true } : b));
      if (tokens < 3) {
        setTokens(p => p + 1);
      } else {
        setScore(p => p + 100);
      }
      playBarrelSound();
    }

    // Collectibles collision
    let collectibleHitId = null;
    collectibles.forEach(collectible => {
      if (!collectible.collected) {
        const distance = Math.sqrt(Math.pow(newX - collectible.x, 2) + Math.pow(newZ - collectible.z, 2));
        if (distance < 0.5) {
          collectibleHitId = collectible.id;
        }
      }
    });

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

    setPlayerPos({ x: newX, z: newZ });
    checkCollisions(newX, newZ);
  }, [enemies, isPaused, isInvulnerable, specialBonuses, barrels, collectibles, tokens, lives, score, comboMultiplier]);

  const cameraConfig = {
    rotation: Math.PI / 4.8,
    distance: 7,
    height: 5,
    fov: 60,
  };

  const playerRotation = 1.1;

  // Audio Ref
  const musicRef = useRef(null);

  useEffect(() => {
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
  }, []);

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

  const playCollectSound = () => {
    if (isMuted) return;
    const sfx = new Audio('/assets/audio/sfx_collect.mp3');
    sfx.volume = 0.6;
    sfx.play().catch(e => console.log("SFX play failed:", e));
  };

  const playBarrelSound = () => {
    if (isMuted) return;
    const sfx = new Audio('/assets/audio/sfx_barrel.mp3');
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

  const restartLevel = () => {
    setPlayerPos({ x: 2, z: 2 });
    setDirection({ x: 0, z: 0 });
    setCollectibles(initialCollectibles.map(c => ({ ...c, collected: false })));
    setScore(0);
    setLives(3);
    setBeersCollected(0);
    setTokens(0);
    setBarrels([
      { id: 1, x: 3.5, z: 3, collected: false },
      { id: 2, x: 6, z: 16, collected: false },
      { id: 3, x: 22, z: 16, collected: false },
      { id: 4, x: 14, z: 16, collected: false },
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
        }
      ]);
    }, 5000);

    const timer2 = setTimeout(() => {
      setEnemies(prevEnemies => [
        ...prevEnemies,
        {
          id: enemyIdRef.current++,
          x: doghousePos.x,
          z: doghousePos.z,
        }
      ]);
    }, 10000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
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
        z = Math.random() * 30 + 1;
        if (!checkCollision(x, z, walls)) {
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

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
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
  }, [direction, tokens, powerActive]);

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
  }, []);

  // Game Loop


  const handleEnemyPositionUpdate = (id, x, z) => {
    setEnemies(prev => prev.map(enemy =>
      enemy.id === id ? { ...enemy, x, z } : enemy
    ));
  };

  useEffect(() => {
    if (beersCollected === initialCollectibles.length && initialCollectibles.length > 0) {
      setIsPaused(true);
      setShowWinModal(true);
    }
  }, [beersCollected]);

  return (
    <div className="game-container">
      <Canvas camera={{ position: [14, 16, 24], fov: cameraConfig.fov }} shadows>
        <ambientLight intensity={1.5} />
        <directionalLight position={[14, 20, 16]} intensity={1.0} />

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
            position={{ x: enemy.x, z: enemy.z }}
            playerPos={playerPos}
            walls={walls}
            onPositionUpdate={(x, z) => handleEnemyPositionUpdate(enemy.id, x, z)}
            rotation={playerRotation}
            isPowerActive={powerActive}
            isPaused={isPaused}
          />
        ))}

        <Player
          position={playerPos}
          direction={direction}
          onPositionUpdate={handlePositionUpdate}
          walls={walls}
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
          levelNumber={3}
          beersCollected={beersCollected}
          score={score}
        />
        <div style={{ position: 'absolute', top: 100, left: 10, color: 'white', zIndex: 9999 }}>
          Enemies: {enemies.length}
        </div>

        <div className="power-button-container">
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

        <button className="settings-button" onClick={() => {
          setIsPaused(true);
          setShowSettingsModal(true);
        }}>
          <Pause size={24} />
        </button>

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
              <h2 className="game-over-title">¡HAS PERDIDO!</h2>
              <p className="game-over-subtitle">Se acabaron las vidas</p>
              <div className="game-over-stats">
                <p>Puntuación final: {score}</p>
                <p>Cervezas recogidas: {beersCollected}</p>
              </div>
              <button className="modal-button restart-button" onClick={restartLevel}>
                <RotateCcw size={20} /> Reintentar
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                <Home size={20} /> Volver al menú
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
                <RotateCcw size={20} /> Jugar de nuevo
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                <Home size={20} /> Volver al menú
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
