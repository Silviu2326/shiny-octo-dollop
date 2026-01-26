import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { useDrag } from '@use-gesture/react';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import LevelHeader from '../components/LevelHeader';
import './Level5_5.css';
import EnemyAdvanced from '../components/game/EnemyAdvanced';
import { AIRoles, createPatrolZones, assignZone } from './ai/EnemyAI';
import { EnemyCoordinator } from './ai/EnemyAI_Advanced';

// --- Constants & Configuration ---
const CELL_SIZE = 5;
const INITIAL_PLAYER_POS = { x: 3, z: 3 };
const CAMERA_CONFIG = {
    rotation: Math.PI / 4.8,
    distance: 8,
    height: 6,
    fov: 60,
};
const PLAYER_ROTATION = 1.1;

// --- Walls Definition (Reduced Map 20x24) ---
const walls = [
    // Background
    { x: -2, z: -10, length: 50, height: 10, thickness: 1, orientation: 'vertical' },
    { x: -10, z: -2, length: 50, height: 10, thickness: 1, orientation: 'horizontal' },

    // External Borders (20x24)
    { x: 0, z: 0, length: 20, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 0, z: 24, length: 20, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 0, z: 0, length: 24, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 20, z: 0, length: 24, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Avenue 1 (Horizontal) - Con aberturas
    { x: 2, z: 10, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 12, z: 10, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 2, z: 14, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 12, z: 14, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    // Avenue 2 (Vertical) - Con aberturas
    { x: 8, z: 2, length: 7, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 8, z: 15, length: 7, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 12, z: 2, length: 7, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 12, z: 15, length: 7, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Top Left Quadrant
    { x: 2, z: 2, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 4, z: 2, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 4, z: 4, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    // Alley 1
    { x: 2, z: 6, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 2, z: 6, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 4, z: 7, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Top Right Quadrant
    { x: 14, z: 2, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 16, z: 2, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 16, z: 4, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    // Alley 2
    { x: 14, z: 6, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 14, z: 6, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 16, z: 7, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Bottom Left Quadrant
    { x: 2, z: 16, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 4, z: 16, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 4, z: 18, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    // Alley 3
    { x: 2, z: 20, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 2, z: 20, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 4, z: 21, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Bottom Right Quadrant
    { x: 14, z: 16, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 16, z: 16, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 16, z: 18, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    // Alley 4
    { x: 14, z: 20, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 14, z: 20, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 16, z: 21, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
];

const doghousePos = { x: 5, z: 7 };

// --- Physics (Optimization Grid) ---
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
    let attempts = 0;
    while (collectibles.length < count && attempts < 5000) {
        attempts++;
        const x = Math.random() * 18 + 1;
        const z = Math.random() * 22 + 1;
        if (!checkCollision(x, z)) {
            const tooClose = collectibles.some(c => {
                const dist = Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(z - c.z, 2));
                return dist < 0.6;
            });
            if (!tooClose) {
                collectibles.push({ id: id++, x, z, collected: false });
            }
        }
    }
    return collectibles;
}

const initialCollectibles = generateCollectibles(50);

// Precargar texturas de enemigos
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_7.png');
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_8.png');

// --- Components ---

function Maze({ walls }) {
    const textures = useLoader(THREE.TextureLoader, [
        '/assets/paredes/wall_marble.jpg',
        '/assets/paredes/wall_gold.png',
        '/assets/paredes/wall_background_2.jpg'
    ]);
    const [marble, neon, bg] = textures;

    useMemo(() => {
        textures.forEach(t => {
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.NearestFilter;
            t.wrapS = THREE.RepeatWrapping;
            t.wrapT = THREE.RepeatWrapping;
        });
    }, [textures]);

    const { marbleGeo, neonGeo, bgGeo } = useMemo(() => {
        const marbles = [];
        const neons = [];
        const bgs = [];

        walls.forEach(wall => {
            const isHorizontal = wall.orientation === 'horizontal';
            const isBg = wall.height >= 10;
            const centerX = isHorizontal ? wall.x + wall.length / 2 : wall.x;
            const centerZ = isHorizontal ? wall.z : wall.z + wall.length / 2;
            const width = isHorizontal ? wall.length : wall.thickness;
            const depth = isHorizontal ? wall.thickness : wall.length;

            if (isBg) {
                const g = new THREE.BoxGeometry(width, wall.height, depth);
                g.translate(centerX, wall.height / 2, centerZ);
                bgs.push(g);
            } else {
                const h = wall.height;
                const h1 = h * 0.1;
                const h2 = h * 0.8;
                const h3 = h * 0.1;

                const g1 = new THREE.BoxGeometry(width, h1, depth);
                g1.translate(centerX, h1 / 2, centerZ);

                const g2 = new THREE.BoxGeometry(width, h2, depth);
                g2.translate(centerX, h1 + h2 / 2, centerZ);

                const g3 = new THREE.BoxGeometry(width, h3, depth);
                g3.translate(centerX, h1 + h2 + h3 / 2, centerZ);

                neons.push(g1);
                marbles.push(g2);
                neons.push(g3);
            }
        });

        return {
            marbleGeo: marbles.length ? mergeBufferGeometries(marbles) : null,
            neonGeo: neons.length ? mergeBufferGeometries(neons) : null,
            bgGeo: bgs.length ? mergeBufferGeometries(bgs) : null
        };
    }, [walls]);

    return (
        <group>
            {bgGeo && <mesh geometry={bgGeo} material={new THREE.MeshBasicMaterial({ map: bg })} />}
            {marbleGeo && <mesh geometry={marbleGeo} material={new THREE.MeshBasicMaterial({ map: marble })} />}
            {neonGeo && <mesh geometry={neonGeo} material={new THREE.MeshStandardMaterial({ map: neon, emissive: '#FFD700', emissiveIntensity: 30 })} />}
        </group>
    );
}

function Doghouse({ position }) {
    const texture = useLoader(THREE.TextureLoader, '/assets/casetas/doghouse_level5.png');

    return (
        <mesh position={[position.x, 0.6, position.z]} rotation={[-Math.PI / 4, Math.PI / 4.8, 0]}>
            <planeGeometry args={[1.2, 1.2]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} alphaTest={0.5} />
        </mesh>
    );
}

function InstancedCollectibles({ collectibles }) {
    const meshRef = useRef();
    const texture = useLoader(THREE.TextureLoader, '/assets/cervezas/collectible_sifrina.png');
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useMemo(() => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
    }, [texture]);

    useFrame(() => {
        if (!meshRef.current) return;
        collectibles.forEach((c, i) => {
            if (c.collected) {
                dummy.scale.set(0, 0, 0);
            } else {
                dummy.position.set(c.x, 0.4, c.z);
                dummy.rotation.set(-Math.PI / 4, Math.PI / 4.8, 0);
                dummy.scale.set(1, 1, 1);
            }
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, collectibles.length]} renderOrder={1}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} alphaTest={0.5} depthWrite={false} />
        </instancedMesh>
    );
}

function Barrel({ position }) {
    const texture = useLoader(THREE.TextureLoader, '/assets/barriles/barrel_level5.png');
    return (
        <mesh position={[position.x, 0.5, position.z]} rotation={[-Math.PI / 8, 0, 0]}>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} />
        </mesh>
    );
}

function SpecialBonus({ position }) {
    const texture = useLoader(THREE.TextureLoader, '/assets/bonus/bonus_diamond.png');
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
            />
        </mesh>
    );
}

// Burbuja protectora del jugador
function ProtectiveBubble({ position, isActive }) {
    const bubbleRef = useRef();
    const [pulseScale, setPulseScale] = useState(1);

    useFrame(({ clock }) => {
        if (bubbleRef.current && isActive) {
            const pulse = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.1;
            setPulseScale(pulse);
            bubbleRef.current.rotation.y += 0.02;
        }
    });

    if (!isActive) return null;

    return (
        <group position={[position.x, 0.5, position.z]} ref={bubbleRef} renderOrder={5}>
            <mesh scale={[pulseScale * 1.2, pulseScale * 1.2, pulseScale * 1.2]} renderOrder={5}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial
                    color="#00BFFF"
                    transparent={true}
                    opacity={0.15}
                    side={THREE.DoubleSide}
                    emissive="#00BFFF"
                    emissiveIntensity={0.3}
                    depthWrite={false}
                />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[pulseScale, pulseScale, pulseScale]} renderOrder={5}>
                <torusGeometry args={[1, 0.05, 16, 32]} />
                <meshStandardMaterial
                    color="#00FFFF"
                    emissive="#00FFFF"
                    emissiveIntensity={1}
                    transparent={true}
                    opacity={0.7}
                    depthWrite={false}
                />
            </mesh>
            <mesh rotation={[0, 0, 0]} scale={[pulseScale, pulseScale, pulseScale]} renderOrder={5}>
                <torusGeometry args={[1, 0.03, 16, 32]} />
                <meshStandardMaterial
                    color="#00FFFF"
                    emissive="#00FFFF"
                    emissiveIntensity={0.8}
                    transparent={true}
                    opacity={0.5}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

function Player({ position, direction, onPositionUpdate, isPowerActive, isInvulnerable, isPaused }) {
    const meshRef = useRef();
    const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/player.png');
    const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/player_secondary.png');
    const [currentFrame, setCurrentFrame] = useState(0);
    const [animationTime, setAnimationTime] = useState(0);
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
            const speed = baseSpeed;
            const newX = position.x + direction.x * speed * delta;
            const newZ = position.z + direction.z * speed * delta;

            if (!checkCollision(newX, newZ)) {
                onPositionUpdate(newX, newZ);
            }

            setAnimationTime(prev => {
                const newTime = prev + delta * animationSpeed;
                const newFrame = Math.floor(newTime) % frameCount;
                setCurrentFrame(newFrame);
                return newTime;
            });
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
        <mesh position={[position.x, 0.5, position.z]} rotation={[-Math.PI / 4, PLAYER_ROTATION, 0]} scale={[getFlipX(), 1, 1]} renderOrder={10}>
            <planeGeometry args={[1.1, 1.1]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} opacity={pulseOpacity} alphaTest={0.5} depthWrite={false} />
        </mesh>
    );
}

function Floor() {
    const tex = useLoader(THREE.TextureLoader, '/assets/suelos/floor_level5_texture.png');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(25, 25);
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, -0.1, 12]}>
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial map={tex} />
        </mesh>
    );
}

// --- Main Level Component ---

// Crear zonas de patrulla para el mapa (20x24)
const patrolZones = createPatrolZones(20, 24, 2);

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

export default function Level5_5({ onBack, onNextLevel, onLevelComplete }) {
    const [playerPos, setPlayerPos] = useState(INITIAL_PLAYER_POS);
    const [direction, setDirection] = useState({ x: 0, z: 0 });
    const [collectibles, setCollectibles] = useState(initialCollectibles);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [tokens, setTokens] = useState(0);
    const [powerActive, setPowerActive] = useState(false);
    const [powerTimeLeft, setPowerTimeLeft] = useState(0);
    const [isInvulnerable, setIsInvulnerable] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [finalScoreStats, setFinalScoreStats] = useState({ score: 0, bonus: 0, total: 0 });

    // UI State
    const [isPaused, setIsPaused] = useState(true);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [showWinModal, setShowWinModal] = useState(false);
    const [showTutorial, setShowTutorial] = useState(true);
    const beersCollected = useMemo(() => collectibles.filter(c => c.collected).length, [collectibles]);

    const [barrels, setBarrels] = useState([
        { id: 1, x: 3.5, z: 8, collected: false },
        { id: 2, x: 17, z: 20, collected: false },
    ]);
    const invulnerabilityTimerRef = useRef(null);

    // Audio State
    const [isMuted, setIsMuted] = useState(false);
    const musicRef = useRef(null);

    // Enemy Coordinator for advanced AI
    const coordinatorRef = useRef(new EnemyCoordinator());

    const [enemies, setEnemies] = useState([]);
    const enemiesRef = useRef(enemies);
    const enemyIdRef = useRef(1);

    const [enemyAlert, setEnemyAlert] = useState(null);
    const [powerAlert, setPowerAlert] = useState(null);

    // Refs for collection optimization
    const collectedBeersRef = useRef(new Set());
    const collectedBarrelsRef = useRef(new Set());
    const collectedBonusesRef = useRef(new Set());
    const lastHitTimeRef = useRef(0);

    // Track pressed keys
    const keysPressed = useRef(new Set());
    const [, forceUpdate] = useState({});

    // Special Bonuses
    const [specialBonuses, setSpecialBonuses] = useState([]);
    const [bonusFlags, setBonusFlags] = useState({ p30: false, p70: false });

    useEffect(() => {
        enemiesRef.current = enemies;
    }, [enemies]);

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

    // --- Audio Logic ---
    useEffect(() => {
        if (showTutorial) return;

        musicRef.current = new Audio('/assets/audio/La Sifrina – "Gluten Free Queen".wav');
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
    }, [showTutorial]);

    useEffect(() => {
        if (!musicRef.current) return;
        if (isMuted) {
            musicRef.current.pause();
        } else {
            musicRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
    }, [isMuted]);

    // Handle page visibility
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

    // Restart start time when tutorial closes
    useEffect(() => {
        if (!showTutorial) {
            setStartTime(Date.now());
        }
    }, [showTutorial]);

    const toggleMute = () => setIsMuted(prev => !prev);

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

    const playGameOverSound = () => {
        if (isMuted) return;
        const sfx = new Audio('/assets/audio/sfx_game_over.mp3');
        sfx.volume = 0.6;
        sfx.play().catch(e => console.log("SFX play failed:", e));
    };

    const playLoseLifeSound = () => {
        if (isMuted) return;
        const sfx = new Audio('/assets/audio/sfx_lose_life.mp3');
        sfx.volume = 0.6;
        sfx.play().catch(e => console.log("SFX play failed:", e));
    };

    const handleEnemyPositionUpdate = (enemyId, x, z) => {
        setEnemies(prevEnemies =>
            prevEnemies.map(enemy =>
                enemy.id === enemyId ? { ...enemy, x, z } : enemy
            )
        );

        // Check collision with player when enemy moves
        if (!isInvulnerable && !powerActive) {
            const dist = Math.sqrt((playerPos.x - x) ** 2 + (playerPos.z - z) ** 2);
            if (dist < 0.5) {
                const enemy = enemiesRef.current.find(e => e.id === enemyId);
                if (enemy && !enemy.isReturning && !enemy.isStunned) {
                    handlePlayerEnemyCollision(enemy, playerPos.x, playerPos.z);
                }
            }
        } else if (powerActive) {
            // If power is active and enemy touches player bubble, stun them
            const bubbleRadius = 1.2;
            const dist = Math.sqrt((playerPos.x - x) ** 2 + (playerPos.z - z) ** 2);
            if (dist < bubbleRadius) {
                const enemy = enemiesRef.current.find(e => e.id === enemyId);
                if (enemy && !enemy.isReturning && !enemy.isStunned) {
                    const pushDir = {
                        x: x - playerPos.x,
                        z: z - playerPos.z
                    };
                    const pushDist = Math.sqrt(pushDir.x ** 2 + pushDir.z ** 2);
                    if (pushDist > 0) {
                        const pushX = x + (pushDir.x / pushDist) * 0.8;
                        const pushZ = z + (pushDir.z / pushDist) * 0.8;

                        setEnemies(prev => prev.map(e =>
                            e.id === enemyId ? {
                                ...e,
                                x: pushX,
                                z: pushZ,
                                isStunned: true,
                                stunEndTime: Date.now() + 4000
                            } : e
                        ));
                        setScore(s => s + 100);
                    }
                }
            }
        }
    };


    const handlePositionUpdate = (newX, newZ) => {
        setPlayerPos({ x: newX, z: newZ });

        // 1. Check Collectibles (Beers)
        let itemsCollectedNow = 0;
        collectibles.forEach(c => {
            if (!c.collected && !collectedBeersRef.current.has(c.id)) {
                const dist = Math.sqrt((newX - c.x) ** 2 + (newZ - c.z) ** 2);
                if (dist < 0.6) {
                    collectedBeersRef.current.add(c.id);
                    itemsCollectedNow++;
                }
            }
        });

        if (itemsCollectedNow > 0) {
            setScore(prev => prev + 10 * itemsCollectedNow);
            playCollectSound();
            setCollectibles(prev => prev.map(c =>
                collectedBeersRef.current.has(c.id) ? { ...c, collected: true } : c
            ));
        }

        // 2. Check Barrels
        let barrelsChanged = false;
        let tokensToAdd = 0;
        let scoreToAdd = 0;

        const nextBarrels = barrels.map(b => {
            if (!b.collected && !collectedBarrelsRef.current.has(b.id)) {
                const dist = Math.sqrt((newX - b.x) ** 2 + (newZ - b.z) ** 2);
                if (dist < 0.8) {
                    collectedBarrelsRef.current.add(b.id);
                    tokensToAdd++;
                    scoreToAdd += 50;
                    barrelsChanged = true;
                    return { ...b, collected: true };
                }
            }
            return b;
        });

        if (barrelsChanged) {
            setBarrels(nextBarrels);
            if (tokensToAdd > 0) {
                setTokens(t => Math.min(3, t + tokensToAdd));
                setScore(s => s + scoreToAdd);
                playBarrelSound();
            }
        }

        // 2.5 Check Special Bonuses
        let bonusesChanged = false;
        let bonusScoreToAdd = 0;

        const nextBonuses = specialBonuses.map(b => {
            if (!b.collected && !collectedBonusesRef.current.has(b.id)) {
                const dist = Math.sqrt((newX - b.x) ** 2 + (newZ - b.z) ** 2);
                if (dist < 0.8) {
                    collectedBonusesRef.current.add(b.id);
                    bonusScoreToAdd += 500;
                    bonusesChanged = true;
                    return { ...b, collected: true };
                }
            }
            return b;
        });

        if (bonusesChanged) {
            setSpecialBonuses(nextBonuses);
            setScore(s => s + bonusScoreToAdd);
            playCollectSound();
        }

        // 3. Check Enemies
        if (!isInvulnerable) {
            enemiesRef.current.forEach(enemy => {
                if (enemy.isReturning || enemy.isStunned) return;
                const bubbleRadius = powerActive ? 1.2 : 0.5;
                const dist = Math.sqrt((newX - enemy.x) ** 2 + (newZ - enemy.z) ** 2);
                if (dist < bubbleRadius) {
                    handlePlayerEnemyCollision(enemy, newX, newZ);
                }
            });
        }
    };

    const handlePlayerEnemyCollision = (enemy, playerX, playerZ) => {
        const now = Date.now();
        if (now - lastHitTimeRef.current < 500) return;

        // Bubble active - stun enemy and push them away
        if (powerActive) {
            const pushDir = {
                x: enemy.x - playerX,
                z: enemy.z - playerZ
            };
            const pushDist = Math.sqrt(pushDir.x ** 2 + pushDir.z ** 2);
            let pushX = enemy.x;
            let pushZ = enemy.z;
            if (pushDist > 0) {
                pushX = enemy.x + (pushDir.x / pushDist) * 0.8;
                pushZ = enemy.z + (pushDir.z / pushDist) * 0.8;
            }

            setScore(s => s + 100);
            setEnemies(prev => prev.map(e =>
                e.id === enemy.id ? {
                    ...e,
                    x: pushX,
                    z: pushZ,
                    isStunned: true,
                    stunEndTime: Date.now() + 4000
                } : e
            ));
            lastHitTimeRef.current = now;
            return;
        }

        // Normal hit
        playLoseLifeSound();
        setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
                setIsPaused(true);
                playGameOverSound();

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
                return 0;
            }
            return newLives;
        });

        setIsInvulnerable(true);
        showEnemyAlert("¡Te han herido!");
        lastHitTimeRef.current = now;

        invulnerabilityTimerRef.current = setTimeout(() => {
            setIsInvulnerable(false);
            invulnerabilityTimerRef.current = null;
        }, 3000);
    };

    const restartLevel = () => {
        setPlayerPos(INITIAL_PLAYER_POS);
        setDirection({ x: 0, z: 0 });
        setCollectibles(initialCollectibles.map(c => ({ ...c, collected: false })));
        setScore(0);
        setLives(3);
        setTokens(0);

        setBarrels([
            { id: 1, x: 3.5, z: 8, collected: false },
            { id: 2, x: 17, z: 20, collected: false },
        ]);
        setEnemies([]);
        enemyIdRef.current = 1;
        coordinatorRef.current = new EnemyCoordinator();
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
        collectedBeersRef.current.clear();
        collectedBarrelsRef.current.clear();
        collectedBonusesRef.current.clear();
        keysPressed.current.clear();
        setSpecialBonuses([]);
        setBonusFlags({ p30: false, p70: false });
        setStartTime(Date.now());
    };

    // Spawn special bonuses at 30% and 70% collection
    useEffect(() => {
        const totalBeers = collectibles.length;
        const collected = collectibles.filter(c => c.collected).length;
        const percentage = totalBeers > 0 ? collected / totalBeers : 0;

        const findFreePosition = () => {
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * 18 + 2;
                const z = Math.random() * 22 + 2;
                if (!checkCollision(x, z, walls)) {
                    return { x, z };
                }
            }
            return { x: 10, z: 12 };
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
    }, [collectibles, bonusFlags]);

    const activatePower = () => {
        if (tokens > 0 && !powerActive) {
            setTokens(prev => prev - 1);
            setPowerActive(true);
            setPowerTimeLeft(10);
            showPowerAlert("¡BURBUJA PROTECTORA! ¡Empuja enemigos!");
        }
    };

    // Power timer
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

    // Cleanup invulnerability timer
    useEffect(() => {
        return () => {
            if (invulnerabilityTimerRef.current) {
                clearTimeout(invulnerabilityTimerRef.current);
            }
        };
    }, []);

    // Check win condition
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
                onLevelComplete(5); // Level 5.5 completed
            }
        }
    }, [beersCollected, showWinModal, onLevelComplete, score, startTime, initialCollectibles.length]);

    // Helper to process direction input
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

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isPaused) return;

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
    }, [isPaused, activatePower]);

    // Enemy Returning Logic and Stun Timer
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused) return;

            const now = Date.now();
            setEnemies(prev => prev.map(enemy => {
                if (enemy.isStunned && enemy.stunEndTime && now >= enemy.stunEndTime) {
                    return { ...enemy, isStunned: false, stunEndTime: 0 };
                }
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
        }, 100);
        return () => clearInterval(interval);
    }, [isPaused]);


    // Enemy Spawning with Advanced AI (4 enemies)
    useEffect(() => {
        if (showTutorial) return;
        if (showWinModal || showGameOverModal) return;

        // Enemy 1: CHASER - Direct pursuit
        const timer1 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: doghousePos.x,
                    z: doghousePos.z,
                    role: AIRoles.CHASER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false,
                    isStunned: false,
                    stunEndTime: 0
                }
            ]);
            showEnemyAlert("¡Apareció un perseguidor!");
            enemyIdRef.current++;
        }, 3000);

        // Enemy 2: CUTTER - Cuts off escape routes
        const timer2 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: doghousePos.x,
                    z: doghousePos.z,
                    role: AIRoles.CUTTER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false,
                    isStunned: false,
                    stunEndTime: 0
                }
            ]);
            showEnemyAlert("¡Cuidado, otro enemigo!");
            enemyIdRef.current++;
        }, 8000);

        // Enemy 3: FLANKER - Approaches from sides
        const timer3 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: doghousePos.x,
                    z: doghousePos.z,
                    role: AIRoles.FLANKER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false,
                    isStunned: false,
                    stunEndTime: 0
                }
            ]);
            showEnemyAlert("¡Más peligro!");
            enemyIdRef.current++;
        }, 14000);

        // Enemy 4: AMBUSHER - Sets up ambush positions
        const timer4 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: doghousePos.x,
                    z: doghousePos.z,
                    role: AIRoles.AMBUSHER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false,
                    isStunned: false,
                    stunEndTime: 0
                }
            ]);
            enemyIdRef.current++;
        }, 20000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    }, [showTutorial, showWinModal, showGameOverModal]);


    return (
        <div className="game-container">
            <Canvas camera={{ position: [10, 14, 18], fov: CAMERA_CONFIG.fov }} shadows>
                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 18, 12]} intensity={1} />

                <Suspense fallback={null}>
                    <Maze walls={walls} />
                    <Floor />
                    <Doghouse position={doghousePos} />

                    <InstancedCollectibles collectibles={collectibles} />

                    {barrels.map(b => !b.collected && <Barrel key={b.id} position={b} />)}

                    {specialBonuses.filter(b => !b.collected).map(b => (
                        <SpecialBonus key={b.id} position={{ x: b.x, z: b.z }} />
                    ))}

                    <Player position={playerPos} direction={direction} onPositionUpdate={handlePositionUpdate} isPowerActive={powerActive} isInvulnerable={isInvulnerable} isPaused={isPaused} />

                    <ProtectiveBubble position={playerPos} isActive={powerActive} />

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
                            isPowerActive={false}
                            isPaused={isPaused || enemy.isStunned}
                            rotation={PLAYER_ROTATION}
                            role={enemy.role}
                            assignedZone={enemy.zone}
                            doghousePos={doghousePos}
                            isReturning={enemy.isReturning}
                            spritesheet1Path="/assets/personajes/enemy_type_7.png"
                            spritesheet2Path="/assets/personajes/enemy_type_8.png"
                            debugMode={false}
                            slowDownOnPower={false}
                            coordinator={coordinatorRef.current}
                            colorNormal="white"
                            colorVulnerable="#6666ff"
                            colorHit="grey"
                        />
                    ))}

                    <CameraController targetX={playerPos.x} targetZ={playerPos.z} />
                </Suspense>
            </Canvas>

            <div className="ui-overlay">
                <LevelHeader
                    lives={lives}
                    levelNumber={"5.5"}
                    beersCollected={beersCollected}
                    totalBeers={initialCollectibles.length}
                    score={score}
                    onSettingsClick={() => {
                        setIsPaused(true);
                        setShowSettingsModal(true);
                    }}
                />

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
                                    src="/assets/poderes/power_icon_l5.png"
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

                {showTutorial && (
                    <div className="tutorial-modal">
                        <div className="tutorial-content glass-panel animate-fade-in">
                            <h2>NIVEL 5.5</h2>
                            <p>Recoge todas las cervezas</p>
                            <p>Usa la burbuja protectora para empujar enemigos</p>
                            <p>Los barriles te dan cargas de poder</p>
                            <p>¡Los enemigos tienen IA avanzada!</p>
                            <button onClick={() => { setShowTutorial(false); setIsPaused(false); }}>
                                ¡JUGAR!
                            </button>
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

                {showWinModal && (
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
                )}
            </div>

            {powerAlert && (
                <div className="enemy-alert" style={{ background: 'rgba(0, 100, 255, 0.7)', borderColor: '#4488ff', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}>
                    {powerAlert}
                </div>
            )}

            {enemyAlert && (
                <div className="enemy-alert">
                    {enemyAlert}
                </div>
            )}
        </div>
    );
}

function CameraController({ targetX, targetZ }) {
    useFrame(({ camera }) => {
        const offsetX = Math.sin(CAMERA_CONFIG.rotation) * CAMERA_CONFIG.distance;
        const offsetZ = Math.cos(CAMERA_CONFIG.rotation) * CAMERA_CONFIG.distance;

        camera.position.x = targetX + offsetX;
        camera.position.y = CAMERA_CONFIG.height;
        camera.position.z = targetZ + offsetZ;
        camera.lookAt(targetX, 0, targetZ);
    });
    return null;
}
