import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import './Level4.css';
import LevelHeader from '../components/LevelHeader';

const CELL_SIZE = 6;
const PLAYER_SIZE = 2.5;
const COLLECTIBLE_SIZE = 1.2;
const ENEMY_SIZE = 2.5;
const WALL_HEIGHT = 8;

const level4Map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
  [1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1],
  [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const BARREL_POSITIONS = [
  { x: 3, y: 1.5, z: 5 },
  { x: 24, y: 1.5, z: 5 },
  { x: 13.5, y: 1.5, z: 13 },
  { x: 3, y: 1.5, z: 25 },
  { x: 24, y: 1.5, z: 25 }
];

const createSpatialGrid = (map) => {
  const grid = {};
  const cellSize = CELL_SIZE;

  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col] === 1) {
        const x = col * cellSize;
        const z = row * cellSize;
        const gridX = Math.floor(x / cellSize);
        const gridZ = Math.floor(z / cellSize);
        const key = `${gridX},${gridZ}`;

        if (!grid[key]) {
          grid[key] = [];
        }
        grid[key].push({ x, z, col, row });
      }
    }
  }

  return grid;
};

function Player({ position, onPositionChange, walls, collectibles, onCollectCollectible, barrels, onCollectBarrel, gameActive, isPowerActive, onCollision }) {
  const meshRef = useRef();
  const velocityRef = useRef({ x: 0, z: 0 });
  const [trail, setTrail] = useState([]);
  const trailRef = useRef([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameActive) return;

      const baseSpeed = 0.25;
      const speed = isPowerActive ? baseSpeed * 2.5 : baseSpeed;

      switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          velocityRef.current = { x: 0, z: -speed };
          break;
        case 's':
        case 'arrowdown':
          velocityRef.current = { x: 0, z: speed };
          break;
        case 'a':
        case 'arrowleft':
          velocityRef.current = { x: -speed, z: 0 };
          break;
        case 'd':
        case 'arrowright':
          velocityRef.current = { x: speed, z: 0 };
          break;
      }
    };

    const handleKeyUp = () => {
      velocityRef.current = { x: 0, z: 0 };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameActive, isPowerActive]);

  useFrame(() => {
    if (!gameActive || !meshRef.current) return;

    const newX = position.x + velocityRef.current.x;
    const newZ = position.z + velocityRef.current.z;

    let canMoveX = true;
    let canMoveZ = true;

    for (const wall of walls) {
      if (Math.abs(newX - wall.x) < (PLAYER_SIZE + CELL_SIZE) / 2 &&
          Math.abs(position.z - wall.z) < (PLAYER_SIZE + CELL_SIZE) / 2) {
        canMoveX = false;
      }
      if (Math.abs(position.x - wall.x) < (PLAYER_SIZE + CELL_SIZE) / 2 &&
          Math.abs(newZ - wall.z) < (PLAYER_SIZE + CELL_SIZE) / 2) {
        canMoveZ = false;
      }
    }

    const finalX = canMoveX ? newX : position.x;
    const finalZ = canMoveZ ? newZ : position.z;

    if (finalX !== position.x || finalZ !== position.z) {
      onPositionChange({ x: finalX, y: position.y, z: finalZ });

      if (isPowerActive) {
        trailRef.current.unshift({ x: position.x, z: position.z, time: Date.now() });
        if (trailRef.current.length > 5) {
          trailRef.current.pop();
        }
        setTrail([...trailRef.current]);
      }
    }

    collectibles.forEach((collectible, index) => {
      const distance = Math.sqrt(
        Math.pow(position.x - collectible.x, 2) +
        Math.pow(position.z - collectible.z, 2)
      );
      if (distance < (PLAYER_SIZE + COLLECTIBLE_SIZE) / 2) {
        onCollectCollectible(index);
      }
    });

    barrels.forEach((barrel, index) => {
      const distance = Math.sqrt(
        Math.pow(position.x - barrel.x, 2) +
        Math.pow(position.z - barrel.z, 2)
      );
      if (distance < (PLAYER_SIZE + COLLECTIBLE_SIZE) / 1.5) {
        onCollectBarrel(index);
      }
    });
  });

  useEffect(() => {
    if (!isPowerActive) {
      trailRef.current = [];
      setTrail([]);
    }
  }, [isPowerActive]);

  const pulseOpacity = Math.abs(Math.sin(Date.now() * 0.005));

  return (
    <>
      <mesh ref={meshRef} position={[position.x, position.y, position.z]}>
        <sphereGeometry args={[PLAYER_SIZE / 2, 32, 32]} />
        <meshStandardMaterial
          color={isPowerActive ? "#FFD700" : "#FFA500"}
          emissive={isPowerActive ? "#FFD700" : "#FF8C00"}
          emissiveIntensity={isPowerActive ? 1.5 : 0.5}
        />
      </mesh>
      {isPowerActive && trail.map((pos, index) => (
        <mesh key={index} position={[pos.x, position.y, pos.z]}>
          <sphereGeometry args={[(PLAYER_SIZE / 2) * (0.8 - index * 0.1), 16, 16]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={1.5 - index * 0.3}
            transparent
            opacity={(0.6 - index * 0.1) * pulseOpacity}
          />
        </mesh>
      ))}
    </>
  );
}

function Enemy({ initialPosition, walls, playerPosition, spatialGrid, gameActive, mode, onCatch, isPowerSlowed, microRole }) {
  const meshRef = useRef();
  const [position, setPosition] = useState(initialPosition);
  const [currentMode, setCurrentMode] = useState('scatter');
  const velocityRef = useRef({ x: 0, z: 0 });
  const lastDirectionRef = useRef({ x: 0, z: 0 });
  const modeTimerRef = useRef(0);
  const scatterTarget = useRef({
    x: initialPosition.x + (Math.random() - 0.5) * 60,
    z: initialPosition.z + (Math.random() - 0.5) * 60
  });

  const modeSwitchInterval = microRole === 'frequent' ? 3 : 5;
  const straightBias = microRole === 'straight' ? 0.7 : (microRole === 'turner' ? 0.2 : 0.5);

  useFrame((state, delta) => {
    if (!gameActive || !meshRef.current) return;

    modeTimerRef.current += delta;
    if (modeTimerRef.current > modeSwitchInterval) {
      setCurrentMode(prev => prev === 'scatter' ? 'chase' : 'scatter');
      modeTimerRef.current = 0;
      if (currentMode === 'scatter') {
        scatterTarget.current = {
          x: initialPosition.x + (Math.random() - 0.5) * 60,
          z: initialPosition.z + (Math.random() - 0.5) * 60
        };
      }
    }

    const baseSpeed = 0.12;
    const speed = isPowerSlowed ? baseSpeed * 0.5 : baseSpeed;

    const targetPos = currentMode === 'chase' ? playerPosition : scatterTarget.current;
    const dx = targetPos.x - position.x;
    const dz = targetPos.z - position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 1) {
      const possibleDirections = [
        { x: 0, z: -speed },
        { x: 0, z: speed },
        { x: -speed, z: 0 },
        { x: speed, z: 0 }
      ];

      const validDirections = possibleDirections.filter(dir => {
        const testX = position.x + dir.x * 2;
        const testZ = position.z + dir.z * 2;

        const gridX = Math.floor(testX / CELL_SIZE);
        const gridZ = Math.floor(testZ / CELL_SIZE);
        const key = `${gridX},${gridZ}`;

        if (spatialGrid[key] && spatialGrid[key].length > 0) {
          return false;
        }

        return true;
      });

      if (validDirections.length > 0) {
        const lastDir = lastDirectionRef.current;
        const canContinueStraight = validDirections.some(
          dir => Math.abs(dir.x - lastDir.x) < 0.01 && Math.abs(dir.z - lastDir.z) < 0.01
        );

        let chosenDirection;
        if (canContinueStraight && Math.random() < straightBias) {
          chosenDirection = lastDir;
        } else {
          const directionScores = validDirections.map(dir => {
            const newX = position.x + dir.x * 10;
            const newZ = position.z + dir.z * 10;
            const distToTarget = Math.sqrt(
              Math.pow(targetPos.x - newX, 2) + Math.pow(targetPos.z - newZ, 2)
            );
            return { dir, score: -distToTarget };
          });

          directionScores.sort((a, b) => b.score - a.score);
          chosenDirection = directionScores[0].dir;
        }

        velocityRef.current = chosenDirection;
        lastDirectionRef.current = chosenDirection;
      }
    }

    const newX = position.x + velocityRef.current.x;
    const newZ = position.z + velocityRef.current.z;

    let canMove = true;
    const gridX = Math.floor(newX / CELL_SIZE);
    const gridZ = Math.floor(newZ / CELL_SIZE);
    const key = `${gridX},${gridZ}`;

    if (spatialGrid[key] && spatialGrid[key].length > 0) {
      canMove = false;
    }

    if (canMove) {
      setPosition({ x: newX, y: position.y, z: newZ });
    }

    const distToPlayer = Math.sqrt(
      Math.pow(playerPosition.x - newX, 2) +
      Math.pow(playerPosition.z - newZ, 2)
    );
    if (distToPlayer < (PLAYER_SIZE + ENEMY_SIZE) / 2) {
      onCatch();
    }
  });

  return (
    <mesh ref={meshRef} position={[position.x, position.y, position.z]}>
      <sphereGeometry args={[ENEMY_SIZE / 2, 32, 32]} />
      <meshStandardMaterial
        color={isPowerSlowed ? "#4169E1" : "#FF0000"}
        emissive={isPowerSlowed ? "#1E90FF" : "#8B0000"}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

function MergedWalls({ walls }) {
  const mergedMesh = useMemo(() => {
    const geometries = [];
    const horizontalTexture = new THREE.TextureLoader().load('/assets/Level4-horizontal.png');
    const verticalTexture = new THREE.TextureLoader().load('/assets/Level4-vertical.png');
    horizontalTexture.wrapS = horizontalTexture.wrapT = THREE.RepeatWrapping;
    verticalTexture.wrapS = verticalTexture.wrapT = THREE.RepeatWrapping;

    walls.forEach(wall => {
      const isHorizontal = wall.isHorizontal;
      const geometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
      geometry.translate(wall.x, WALL_HEIGHT / 2, wall.z);
      geometries.push(geometry);
    });

    const mergedGeometry = mergeBufferGeometries(geometries);
    return mergedGeometry;
  }, [walls]);

  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load('/assets/Level4-horizontal.png');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  return (
    <mesh geometry={mergedMesh}>
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

function Collectibles({ collectibles }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime;
    }
  });

  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const instancedMesh = useRef();

  useEffect(() => {
    if (!instancedMesh.current) return;

    collectibles.forEach((collectible, i) => {
      tempObject.position.set(collectible.x, 1.5, collectible.z);
      tempObject.updateMatrix();
      instancedMesh.current.setMatrixAt(i, tempObject.matrix);
    });
    instancedMesh.current.instanceMatrix.needsUpdate = true;
  }, [collectibles, tempObject]);

  return (
    <instancedMesh ref={instancedMesh} args={[null, null, collectibles.length]}>
      <cylinderGeometry args={[COLLECTIBLE_SIZE / 2, COLLECTIBLE_SIZE / 2, 1.5, 16]} />
      <meshStandardMaterial color="#FFD700" emissive="#FFA500" emissiveIntensity={0.5} />
    </instancedMesh>
  );
}

function Barrels({ barrels }) {
  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load('/assets/barrel.png');
    return tex;
  }, []);

  return (
    <>
      {barrels.map((barrel, index) => (
        <mesh key={index} position={[barrel.x, barrel.y, barrel.z]}>
          <cylinderGeometry args={[1.5, 1.5, 3, 16]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      ))}
    </>
  );
}

function Ground() {
  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load('/assets/Level4.png');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[level4Map[0].length * CELL_SIZE, level4Map.length * CELL_SIZE]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

function CameraController({ playerPosition }) {
  const { camera } = useThree();

  useFrame(() => {
    camera.position.x = playerPosition.x;
    camera.position.y = playerPosition.y + 50;
    camera.position.z = playerPosition.z + 40;
    camera.lookAt(playerPosition.x, 0, playerPosition.z);
  });

  return null;
}

function TouchControls({ onMove, gameActive, isPowerActive }) {
  const touchStartRef = useRef(null);

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (!gameActive) return;
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    };

    const handleTouchMove = (e) => {
      if (!gameActive || !touchStartRef.current) return;
      e.preventDefault();

      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;

      const baseSpeed = 0.25;
      const speed = isPowerActive ? baseSpeed * 2.5 : baseSpeed;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        onMove(deltaX > 0 ? { x: speed, z: 0 } : { x: -speed, z: 0 });
      } else {
        onMove(deltaY > 0 ? { x: 0, z: speed } : { x: 0, z: -speed });
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
      onMove({ x: 0, z: 0 });
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameActive, onMove, isPowerActive]);

  return null;
}

export default function Level4({ onBack }) {
  const [playerPosition, setPlayerPosition] = useState({ x: 3, y: 1.5, z: 3 });
  const [walls, setWalls] = useState([]);
  const [spatialGrid, setSpatialGrid] = useState({});
  const [collectibles, setCollectibles] = useState([]);
  const [barrels, setBarrels] = useState(BARREL_POSITIONS);
  const [score, setScore] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [isPowerActive, setIsPowerActive] = useState(false);
  const [powerTimer, setPowerTimer] = useState(0);
  const [initialCollectibles, setInitialCollectibles] = useState([]);
  const livesLostRef = useRef(false);

  useEffect(() => {
    const wallsList = [];
    const collectiblesList = [];

    for (let row = 0; row < level4Map.length; row++) {
      for (let col = 0; col < level4Map[row].length; col++) {
        if (level4Map[row][col] === 1) {
          const isHorizontal = (col > 0 && level4Map[row][col - 1] === 1) ||
                               (col < level4Map[row].length - 1 && level4Map[row][col + 1] === 1);
          wallsList.push({
            x: col * CELL_SIZE,
            z: row * CELL_SIZE,
            col,
            row,
            isHorizontal
          });
        } else if (level4Map[row][col] === 0) {
          const x = col * CELL_SIZE;
          const z = row * CELL_SIZE;
          const isBarrelPosition = BARREL_POSITIONS.some(
            barrel => Math.abs(barrel.x - x) < 2 && Math.abs(barrel.z - z) < 2
          );
          if (!isBarrelPosition && !(col === 0 && row === 1)) {
            collectiblesList.push({ x, z });
          }
        }
      }
    }

    setWalls(wallsList);
    setSpatialGrid(createSpatialGrid(level4Map));
    setCollectibles(collectiblesList);
    setInitialCollectibles(collectiblesList);
  }, []);

  useEffect(() => {
    if (collectibles.length === 0 && initialCollectibles.length > 0 && gameActive) {
      setVictory(true);
      setGameActive(false);
    }
  }, [collectibles, gameActive, initialCollectibles.length]);

  useEffect(() => {
    if (isPowerActive && powerTimer > 0) {
      const interval = setInterval(() => {
        setPowerTimer(prev => {
          if (prev <= 1) {
            setIsPowerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPowerActive, powerTimer]);

  useEffect(() => {
    const handleSpaceBar = (e) => {
      if (e.code === 'Space' && tokens > 0 && !isPowerActive && gameActive) {
        e.preventDefault();
        activatePower();
      }
    };

    window.addEventListener('keydown', handleSpaceBar);
    return () => window.removeEventListener('keydown', handleSpaceBar);
  }, [tokens, isPowerActive, gameActive]);

  const handleCollectCollectible = (index) => {
    setCollectibles(prev => prev.filter((_, i) => i !== index));
    setScore(prev => prev + 10);
  };

  const handleCollectBarrel = (index) => {
    setBarrels(prev => prev.filter((_, i) => i !== index));
    setTokens(prev => prev + 1);
  };

  const handleEnemyCatch = () => {
    if (isInvulnerable || !gameActive) return;

    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameOver(true);
        setGameActive(false);
      } else {
        livesLostRef.current = true;
      }
      return newLives;
    });

    setIsInvulnerable(true);
    setTimeout(() => setIsInvulnerable(false), 3000);
    setPlayerPosition({ x: 3, y: 1.5, z: 3 });
  };

  const activatePower = () => {
    if (tokens > 0 && !isPowerActive) {
      setTokens(prev => prev - 1);
      setIsPowerActive(true);
      setPowerTimer(6);
    }
  };

  const handleRestart = () => {
    setPlayerPosition({ x: 3, y: 1.5, z: 3 });
    setCollectibles(initialCollectibles);
    setBarrels(BARREL_POSITIONS);
    setScore(0);
    setTokens(0);
    setLives(3);
    setGameActive(false);
    setGameOver(false);
    setVictory(false);
    setShowTutorial(true);
    setIsInvulnerable(false);
    setIsPowerActive(false);
    setPowerTimer(0);
    livesLostRef.current = false;
  };

  const startGame = () => {
    setShowTutorial(false);
    setGameActive(true);
  };

  const totalBeers = initialCollectibles.length;
  const beersCollected = totalBeers - collectibles.length;

  return (
    <div className="game-container">
      <Canvas shadows camera={{ position: [0, 50, 40], fov: 75 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
        <Ground />
        <MergedWalls walls={walls} />
        <Collectibles collectibles={collectibles} />
        <Barrels barrels={barrels} />
        <Player
          position={playerPosition}
          onPositionChange={setPlayerPosition}
          walls={walls}
          collectibles={collectibles}
          onCollectCollectible={handleCollectCollectible}
          barrels={barrels}
          onCollectBarrel={handleCollectBarrel}
          gameActive={gameActive}
          isPowerActive={isPowerActive}
          onCollision={handleEnemyCatch}
        />
        {gameActive && (
          <>
            <Enemy
              initialPosition={{ x: 81, y: 1.5, z: 3 }}
              walls={walls}
              playerPosition={playerPosition}
              spatialGrid={spatialGrid}
              gameActive={gameActive}
              mode="chase"
              onCatch={handleEnemyCatch}
              isPowerSlowed={isPowerActive}
              microRole="straight"
            />
            <Enemy
              initialPosition={{ x: 81, y: 1.5, z: 99 }}
              walls={walls}
              playerPosition={playerPosition}
              spatialGrid={spatialGrid}
              gameActive={gameActive}
              mode="scatter"
              onCatch={handleEnemyCatch}
              isPowerSlowed={isPowerActive}
              microRole="turner"
            />
            <Enemy
              initialPosition={{ x: 42, y: 1.5, z: 51 }}
              walls={walls}
              playerPosition={playerPosition}
              spatialGrid={spatialGrid}
              gameActive={gameActive}
              mode="chase"
              onCatch={handleEnemyCatch}
              isPowerSlowed={isPowerActive}
              microRole="frequent"
            />
          </>
        )}
        <CameraController playerPosition={playerPosition} />
        <TouchControls gameActive={gameActive} isPowerActive={isPowerActive} />
      </Canvas>

      <div className="ui-overlay">
        <LevelHeader
          lives={lives}
          levelName="La Carrera del Zigzag"
          beersCollected={beersCollected}
          totalBeers={totalBeers}
          score={score}
          levelNumber={4}
        />

        <div className="power-button-container">
          <button
            className="power-button"
            onClick={activatePower}
            disabled={tokens === 0 || isPowerActive || !gameActive}
          >
            <img
              src="/assets/power-icon.png"
              alt="Power"
              className={`power-button-image ${tokens === 0 || isPowerActive ? 'disabled' : ''}`}
            />
            {tokens > 0 && (
              <div className="token-badge">
                <span className="token-text">{tokens}</span>
              </div>
            )}
            {isPowerActive && (
              <div className="timer-overlay">
                <span className="timer-text">{powerTimer}</span>
              </div>
            )}
          </button>
        </div>

        <button className="settings-button" onClick={() => setShowSettings(true)}>
          PAUSA
        </button>

        {showTutorial && (
          <div className="tutorial-modal">
            <div className="tutorial-content glass-panel animate-fade-in">
              <h2>La Carrera del Zigzag</h2>
              <p>¡Acelera al máximo en este laberinto zigzagueante!</p>
              <p>Usa WASD o las flechas para moverte</p>
              <p>🍺 Recoge 150 cervezas</p>
              <p>🛢️ 5 barriles = 5 tokens</p>
              <p>⚡ PODER: ¡Velocidad x2.5 con estela dorada!</p>
              <p>🎮 3 enemigos con estilos únicos te persiguen</p>
              <button onClick={startGame}>¡EMPEZAR!</button>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="settings-modal">
            <div className="settings-content glass-panel animate-fade-in">
              <h2>PAUSA</h2>
              <button className="modal-button restart-button" onClick={handleRestart}>
                Reiniciar Nivel
              </button>
              <button className="modal-button" onClick={onBack}>
                Volver al Menú
              </button>
              <button className="modal-button cancel-button" onClick={() => setShowSettings(false)}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="game-over-modal">
            <div className="game-over-content glass-panel animate-fade-in">
              <h2 className="game-over-title">GAME OVER</h2>
              <p className="game-over-subtitle">¡Los enemigos te atraparon!</p>
              <div className="game-over-stats">
                <p>Cervezas recogidas: {beersCollected}/{totalBeers}</p>
                <p>Puntuación: {score}</p>
              </div>
              <button className="modal-button restart-button" onClick={handleRestart}>
                Reintentar
              </button>
              <button className="modal-button" onClick={onBack}>
                Volver al Menú
              </button>
            </div>
          </div>
        )}

        {victory && (
          <div className="win-modal">
            <div className="win-content glass-panel animate-fade-in">
              <h2 className="win-title">¡VICTORIA!</h2>
              <p className="win-subtitle">¡Completaste La Carrera del Zigzag!</p>
              <div className="win-stats">
                <p>Puntuación base: {score}</p>
                {!livesLostRef.current && <p className="bonus-text">Sin muertes: +100</p>}
                <p className="bonus-text-blue">Tokens restantes: {tokens} x 50 = {tokens * 50}</p>
                <div className="stats-divider"></div>
                <p className="total-score">TOTAL: {Math.max(150, score + (!livesLostRef.current ? 100 : 0) + (tokens * 50))}</p>
              </div>
              <button className="modal-button restart-button" onClick={handleRestart}>
                Jugar de nuevo
              </button>
              <button className="modal-button" onClick={onBack}>
                Volver al Menú
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
