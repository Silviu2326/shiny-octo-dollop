import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import './Level1.css';
import LevelHeader from '../components/LevelHeader';

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

const initialCollectibles = generateCollectibles(80);

// --- 3D Components ---

function Maze({ walls }) {
  const textureUrls = {
    brick: '/assets/paredes/wall_brick.jpg',
    gold: '/assets/paredes/wall_gold.png',
    background: '/assets/paredes/wall_background.png'
  };

  const brickTexture = useLoader(THREE.TextureLoader, textureUrls.brick);
  const goldTexture = useLoader(THREE.TextureLoader, textureUrls.gold);
  const backgroundTexture = useLoader(THREE.TextureLoader, textureUrls.background);

  useMemo(() => {
    [brickTexture, goldTexture, backgroundTexture].forEach(t => {
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
    });
  }, [brickTexture, goldTexture, backgroundTexture]);

  const { brickGeometry, goldGeometry, backgroundGeometry } = useMemo(() => {
    const brickGeometries = [];
    const goldGeometries = [];
    const backgroundGeometries = [];

    walls.forEach(wall => {
      const isHorizontal = wall.orientation === 'horizontal';
      const isBackgroundWall = wall.height > 2;

      const centerX = isHorizontal ? wall.x + wall.length / 2 : wall.x;
      const centerZ = isHorizontal ? wall.z : wall.z + wall.length / 2;
      const width = isHorizontal ? wall.length : wall.thickness;
      const depth = isHorizontal ? wall.thickness : wall.length;

      if (isBackgroundWall) {
        const geometry = new THREE.BoxGeometry(width, wall.height, depth);
        geometry.translate(centerX, wall.height / 2, centerZ);
        const uvs = geometry.attributes.uv;
        for (let i = 0; i < uvs.count; i++) {
          uvs.setXY(i, uvs.getX(i), uvs.getY(i));
        }
        backgroundGeometries.push(geometry);
      } else {
        const bottomHeight = wall.height * 0.8;
        const topHeight = wall.height * 0.2;
        const bottomY = bottomHeight / 2;
        const topY = bottomHeight + topHeight / 2;

        const bottomGeo = new THREE.BoxGeometry(width, bottomHeight, depth);
        bottomGeo.translate(centerX, bottomY, centerZ);
        const bottomUVs = bottomGeo.attributes.uv;
        for (let i = 0; i < bottomUVs.count; i++) {
          bottomUVs.setXY(i, bottomUVs.getX(i) * wall.length, bottomUVs.getY(i));
        }
        brickGeometries.push(bottomGeo);

        const topGeo = new THREE.BoxGeometry(width, topHeight, depth);
        topGeo.translate(centerX, topY, centerZ);
        const topUVs = topGeo.attributes.uv;
        for (let i = 0; i < topUVs.count; i++) {
          topUVs.setXY(i, topUVs.getX(i) * wall.length, topUVs.getY(i));
        }
        goldGeometries.push(topGeo);
      }
    });

    return {
      brickGeometry: brickGeometries.length > 0 ? mergeBufferGeometries(brickGeometries) : null,
      goldGeometry: goldGeometries.length > 0 ? mergeBufferGeometries(goldGeometries) : null,
      backgroundGeometry: backgroundGeometries.length > 0 ? mergeBufferGeometries(backgroundGeometries) : null
    };
  }, [walls]);

  return (
    <group>
      {backgroundGeometry && (
        <mesh geometry={backgroundGeometry}>
          <meshBasicMaterial map={backgroundTexture} color="#ffffff" />
        </mesh>
      )}
      {brickGeometry && (
        <mesh geometry={brickGeometry}>
          <meshBasicMaterial map={brickTexture} />
        </mesh>
      )}
      {goldGeometry && (
        <mesh geometry={goldGeometry}>
          <meshBasicMaterial map={goldTexture} />
        </mesh>
      )}
    </group>
  );
}

function Player({ position, direction, onPositionUpdate, walls, rotation, isPaused }) {
  const meshRef = useRef();
  const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/player.png');
  const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/player_secondary.png');

  const [currentFrame, setCurrentFrame] = useState(0);

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
      />
    </mesh>
  );
}

function Collectible({ position }) {
  const texture = useLoader(THREE.TextureLoader, '/assets/collectible_bottle.png');
  useMemo(() => {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
  }, [texture]);

  return (
    <mesh position={[position.x, 0.4, position.z]} rotation={[-Math.PI / 4, Math.PI / 4.8, 0]}>
      <planeGeometry args={[0.6, 0.6]} />
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

function Floor() {
  const texture = useLoader(THREE.TextureLoader, '/assets/suelos/floor_texture.jpg');
  useMemo(() => {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(40 / 5, 45 / 5);
  }, [texture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, -0.1, 14]}>
      <planeGeometry args={[40, 45]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

function CameraController({ targetX, targetZ, rotation, distance, height }) {
  useFrame(({ camera }) => {
    const offsetX = Math.sin(rotation) * distance;
    const offsetZ = Math.cos(rotation) * distance;

    camera.position.x += (targetX + offsetX - camera.position.x) * 0.1;
    camera.position.y = height;
    camera.position.z += (targetZ + offsetZ - camera.position.z) * 0.1;

    camera.lookAt(targetX, 0, targetZ);
  });
  return null;
}

// --- Main Component ---

export default function Level1({ onBack }) {
  const [playerPos, setPlayerPos] = useState({ x: 2, z: 2 });
  const [direction, setDirection] = useState({ x: 0, z: 0 });
  const [collectibles, setCollectibles] = useState(initialCollectibles);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [showTutorial, setShowTutorial] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
    const music = new Audio('/assets/audio/music_background.mp3');
    music.loop = true;
    music.volume = 0.4;
    music.play().catch(e => console.log("Audio play failed (user interaction required):", e));

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

  const restartLevel = () => {
    setPlayerPos({ x: 2, z: 2 });
    setDirection({ x: 0, z: 0 });
    setCollectibles(initialCollectibles);
    setScore(0);
    setLives(3);
    setIsPaused(false);
    setShowSettingsModal(false);
    setShowTutorial(true);
  };

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

  // Touch/Swipe Controls for Mobile
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

  const handlePositionUpdate = (x, z) => {
    setPlayerPos({ x, z });

    setCollectibles(prev => {
      const remaining = prev.filter(c => {
        const dist = Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(z - c.z, 2));
        if (dist < 0.5) {
          setScore(s => s + 10);
          playCollectSound();
          return false;
        }
        return true;
      });
      return remaining;
    });
  };

  return (
    <div className="game-container">
      <Canvas camera={{ position: [12, 15, 20], fov: cameraConfig.fov }} shadows>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2.0} />

        <Maze walls={walls} />
        <Floor />
        <Player
          position={playerPos}
          direction={direction}
          onPositionUpdate={handlePositionUpdate}
          walls={walls}
          rotation={playerRotation}
          isPaused={isPaused}
        />

        {collectibles.map(c => (
          <Collectible key={c.id} position={c} />
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
        <LevelHeader
          lives={lives}
          levelNumber={1}
          beersCollected={beersCollected}
          score={score}
        />

        <button className="settings-button" onClick={() => setShowSettingsModal(true)}>
          ⚙️
        </button>

        <button className="back-button" onClick={onBack}>
          salir
        </button>

        {showTutorial && (
          <div className="tutorial-modal animate-fade-in">
            <div className="tutorial-content glass-panel">
              <h2>¡Bienvenido a La Casa del Gato!</h2>
              <p>Usa las flechas o W/A/S/D para moverte.</p>
              <p>Desliza en móvil para cambiar dirección.</p>
              <p>Recoge todas las cervezas 🍺</p>
              <button onClick={() => setShowTutorial(false)}>JUGAR</button>
            </div>
          </div>
        )}

        {showSettingsModal && (
          <div className="settings-modal">
            <div className="settings-content glass-panel">
              <h2>MENÚ</h2>
              <button className="modal-button restart-button" onClick={restartLevel}>
                🔄 Reiniciar Nivel
              </button>
              <button className="modal-button" onClick={() => setShowSettingsModal(false)}>
                ▶️ Continuar
              </button>
              <button className="modal-button cancel-button" onClick={onBack}>
                🚪 Salir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
