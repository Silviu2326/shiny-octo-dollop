import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import LevelHeader from '../components/LevelHeader';
import EnemyAdvanced from '../components/game/EnemyAdvanced';
import { AIRoles, createPatrolZones, assignZone } from './ai/EnemyAI';
import { EnemyCoordinator } from './ai/EnemyAI_Advanced';
import './Level6_5.css';
import { getGameUI } from '../utils/translations';

// --- Constants & Configuration ---

const INITIAL_PLAYER_POS = { x: 4, z: 3 };
const CAMERA_CONFIG = {
    rotation: Math.PI / 4.8,
    distance: 7,
    height: 5,
    fov: 60,
};
const PLAYER_ROTATION = 1.1;
const DOGHOUSE_POS = { x: 6, z: 3 };

// --- Walls Definition (Reduced Map 20x24) ---
const walls = [
    // Background
    { x: -2, z: -10, length: 50, height: 10, thickness: 1, orientation: 'vertical', isBackground: true },
    { x: -10, z: -2, length: 50, height: 10, thickness: 1, orientation: 'horizontal', isBackground: true },

    // Exterior Borders (20x24)
    { x: 0, z: 0, length: 20, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 0, z: 24, length: 20, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 0, z: 0, length: 24, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 20, z: 0, length: 24, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Central Cross (The "Aspa") - scaled down
    { x: 8, z: 10, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 12, z: 10, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 8, z: 14, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 12, z: 14, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Top Left Arm
    { x: 5, z: 7, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 6, z: 7, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 3, z: 5, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Top Right Arm
    { x: 13, z: 7, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 14, z: 7, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 17, z: 5, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Bottom Left Arm
    { x: 5, z: 17, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 6, z: 15, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 3, z: 19, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Bottom Right Arm
    { x: 13, z: 17, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 14, z: 15, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 17, z: 19, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Bypasses (Stress Ring) - scaled down
    { x: 8, z: 5, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 8, z: 20, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 2, z: 10, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 4, z: 9, length: 6, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 18, z: 10, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 17, z: 9, length: 6, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Periphery Blocks
    { x: 2, z: 3, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 2, z: 2, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 16, z: 3, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 19, z: 2, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 2, z: 21, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 2, z: 20, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 16, z: 21, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 19, z: 20, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Precision Obstacles
    { x: 9, z: 9, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 9, z: 15, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 4, z: 12, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 16, z: 12, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
];

// --- Spatial Partitioning (Grid) ---
const CELL_SIZE = 5;
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
    while (collectibles.length < count && attempts < 10000) {
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

const initialCollectibles = generateCollectibles(55);

// Preload enemy textures
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_5.png');
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_6.png');

// --- Components ---

function Maze({ walls }) {
    const textures = useLoader(THREE.TextureLoader, [
        '/assets/paredes/wall_texture_3.png',
        '/assets/paredes/unnamed (9).jpg'
    ]);
    const [wallTex, bgTex] = textures;

    useMemo(() => {
        textures.forEach(t => {
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.NearestFilter;
            t.wrapS = THREE.RepeatWrapping;
            t.wrapT = THREE.RepeatWrapping;
        });
    }, [textures]);

    const { wallGeometry, bgGeometry } = useMemo(() => {
        const wallGeoms = [];
        const bgGeoms = [];

        walls.forEach(wall => {
            const isHorizontal = wall.orientation === 'horizontal';
            const isBg = wall.isBackground;
            const centerX = isHorizontal ? wall.x + wall.length / 2 : wall.x;
            const centerZ = isHorizontal ? wall.z : wall.z + wall.length / 2;
            const width = isHorizontal ? wall.length : wall.thickness;
            const depth = isHorizontal ? wall.thickness : wall.length;

            const g = new THREE.BoxGeometry(width, wall.height, depth);
            g.translate(centerX, wall.height / 2, centerZ);

            if (isBg) {
                bgGeoms.push(g);
            } else {
                wallGeoms.push(g);
            }
        });

        return {
            wallGeometry: wallGeoms.length ? mergeBufferGeometries(wallGeoms) : null,
            bgGeometry: bgGeoms.length ? mergeBufferGeometries(bgGeoms) : null
        };
    }, [walls]);

    return (
        <group>
            {bgGeometry && <mesh geometry={bgGeometry} material={new THREE.MeshBasicMaterial({ map: bgTex })} />}
            {wallGeometry && <mesh geometry={wallGeometry} material={new THREE.MeshBasicMaterial({ map: wallTex })} />}
        </group>
    );
}

function Doghouse({ position }) {
    const texture = useLoader(THREE.TextureLoader, '/assets/casetas/image-removebg-preview (7).png');
    return (
        <mesh position={[position.x, 0.6, position.z]} rotation={[-Math.PI / 4, Math.PI / 4.8, 0]}>
            <planeGeometry args={[1.2, 1.2]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} alphaTest={0.5} />
        </mesh>
    );
}

function InstancedCollectibles({ collectibles }) {
    const meshRef = useRef();
    const texture = useLoader(THREE.TextureLoader, '/assets/cervezas/collectible_candela.png');
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
        <instancedMesh ref={meshRef} args={[null, null, collectibles.length]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} alphaTest={0.5} />
        </instancedMesh>
    );
}

function Barrel({ position }) {
    const texture = useLoader(THREE.TextureLoader, '/assets/barriles/image-removebg-preview (20) (2).png');
    return (
        <mesh position={[position.x, 0.5, position.z]} rotation={[-Math.PI / 8, 0, 0]}>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} alphaTest={0.5} />
        </mesh>
    );
}

function SpecialBonus({ position }) {
    const texture = useLoader(THREE.TextureLoader, '/assets/bonus/bonus_star.png');
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

function Player({ position, direction, onPositionUpdate, isPaused, isPowerActive, isInvulnerable }) {
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
        <mesh
            ref={meshRef}
            position={[position.x, 0.5, position.z]}
            rotation={[-Math.PI / 4, 0, 0]}
            scale={[getFlipX(), 1, 1]}
            renderOrder={10}
        >
            <planeGeometry args={[1.1, 1.1]} />
            <meshStandardMaterial
                map={texture}
                transparent={true}
                side={THREE.DoubleSide}
                alphaTest={0.5}
                opacity={pulseOpacity}
                depthWrite={false}
            />
        </mesh>
    );
}

function Floor() {
    const tex = useLoader(THREE.TextureLoader, '/assets/suelos/Captura de pantalla 2025-11-27 232617.png');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 6);
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, -0.1, 12]}>
            <planeGeometry args={[20, 24]} />
            <meshBasicMaterial map={tex} />
        </mesh>
    );
}

// --- Main Level Component ---

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

export default function Level6_5({ onBack, onNextLevel, onLevelComplete, language = 'en' }) {
    const gameUI = getGameUI(language);
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
    const [isPaused, setIsPaused] = useState(true);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [showVictoryModal, setShowVictoryModal] = useState(false);
    const [showTutorial, setShowTutorial] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const musicRef = useRef(null);

    // Alert States
    const [enemyAlert, setEnemyAlert] = useState(null);
    const [powerAlert, setPowerAlert] = useState(null);

    // Enemy Coordinator for advanced AI
    const coordinatorRef = useRef(new EnemyCoordinator());

    // Initial Barrels
    const [barrels, setBarrels] = useState([
        { id: 1, x: 10, z: 12, collected: false },
        { id: 2, x: 5, z: 8, collected: false },
        { id: 3, x: 15, z: 16, collected: false },
    ]);

    const [enemies, setEnemies] = useState([]);
    const enemiesRef = useRef(enemies);
    const lastHitTimeRef = useRef(0);
    const enemyIdRef = useRef(1);

    // Refs for collection optimization
    const collectedBeersRef = useRef(new Set());
    const collectedBarrelsRef = useRef(new Set());
    const collectedBonusesRef = useRef(new Set());

    // Special Bonuses
    const [specialBonuses, setSpecialBonuses] = useState([]);
    const [bonusFlags, setBonusFlags] = useState({ p30: false, p70: false });

    // Track pressed keys
    const keysPressed = useRef(new Set());
    const [, forceUpdate] = useState({});

    useEffect(() => {
        enemiesRef.current = enemies;
    }, [enemies]);

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
                playCollectSound();
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

        // 3. Check Enemies (Player runs into Enemy)
        if (!isInvulnerable) {
            enemiesRef.current.forEach(enemy => {
                if (enemy.isReturning || enemy.isStunned) return;
                const dist = Math.sqrt((newX - enemy.x) ** 2 + (newZ - enemy.z) ** 2);
                if (dist < 0.5) {
                    handlePlayerEnemyCollision(enemy);
                }
            });
        }
    };

    const handlePlayerEnemyCollision = (enemy) => {
        const now = Date.now();
        if (now - lastHitTimeRef.current < 1000) return;

        if (powerActive) {
            setScore(s => s + 150);
            setEnemies(prev => prev.map(e =>
                e.id === enemy.id ? { ...e, isReturning: true, returningStartTime: Date.now() } : e
            ));
            showEnemyAlert("¡Enemigo derrotado!");
            lastHitTimeRef.current = now;
        } else {
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setIsPaused(true);
                    setShowGameOverModal(true);
                    playGameOverSound();
                } else {
                    playLoseLifeSound();
                }
                return newLives;
            });
            setScore(s => Math.max(0, s - 5));
            setIsInvulnerable(true);
            showEnemyAlert("¡Te han herido!");
            lastHitTimeRef.current = now;

            setTimeout(() => setIsInvulnerable(false), 2000);
            setDirection({ x: 0, z: 0 });
        }
    };

    // --- Audio Logic ---
    useEffect(() => {
        if (showTutorial) return;

        musicRef.current = new Audio('/assets/audio/Candela%20%E2%80%93%20%E2%80%9CDark%20Flame%E2%80%9D.wav');
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
        if (!showTutorial) {
            setStartTime(Date.now());
        }
    }, [showTutorial]);

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

    const toggleMute = () => setIsMuted(prev => !prev);

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

    // --- Victory Logic ---
    const beersCollected = useMemo(() => collectibles.filter(c => c.collected).length, [collectibles]);

    useEffect(() => {
        if (beersCollected === initialCollectibles.length && !showVictoryModal) {
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
                onLevelComplete(6); // Level 6.5 completed
            }
        }
    }, [beersCollected, showVictoryModal, onLevelComplete, score, startTime, initialCollectibles.length]);

    // --- Game Logic ---

    const activatePower = () => {
        if (tokens > 0 && !powerActive) {
            setTokens(prev => prev - 1);
            setPowerActive(true);
            setPowerTimeLeft(6);
            showPowerAlert("¡PODER ACTIVADO! ¡APROVECHA!");
        }
    };

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

            if (e.key === 'ArrowUp' || e.key === 'w') handleDirectionInput('up');
            if (e.key === 'ArrowDown' || e.key === 's') handleDirectionInput('down');
            if (e.key === 'ArrowLeft' || e.key === 'a') handleDirectionInput('left');
            if (e.key === 'ArrowRight' || e.key === 'd') handleDirectionInput('right');
            if (e.key === ' ') {
                e.preventDefault();
                activatePower();
            }
        };
        const handleKeyUp = (e) => {
            if (e.key === 'ArrowUp' || e.key === 'w') handleDirectionRelease('up');
            if (e.key === 'ArrowDown' || e.key === 's') handleDirectionRelease('down');
            if (e.key === 'ArrowLeft' || e.key === 'a') handleDirectionRelease('left');
            if (e.key === 'ArrowRight' || e.key === 'd') handleDirectionRelease('right');
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isPaused, activatePower]);


    // Enemy returning to doghouse logic
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused) return;

            const now = Date.now();
            setEnemies(prev => prev.map(enemy => {
                if (enemy.isReturning) {
                    const distToDoghouse = Math.sqrt(
                        (enemy.x - DOGHOUSE_POS.x) ** 2 +
                        (enemy.z - DOGHOUSE_POS.z) ** 2
                    );
                    const timeElapsed = enemy.returningStartTime ? now - enemy.returningStartTime : 0;
                    if (distToDoghouse < 0.5 || timeElapsed > 3000) {
                        return { ...enemy, isReturning: false, returningStartTime: null };
                    }
                }
                return enemy;
            }));
        }, 50);

        return () => clearInterval(interval);
    }, [enemies, isPaused]);

    // Enemy Spawning with Advanced AI (4 enemies)
    useEffect(() => {
        if (showTutorial) return;
        if (showVictoryModal || showGameOverModal) return;

        // Enemy 1: CHASER - Direct pursuit
        const timer1 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: AIRoles.CHASER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false,
                    isStunned: false,
                    stunEndTime: 0
                }
            ]);
            showEnemyAlert("¡Apareció un perseguidor!");
            enemyIdRef.current++;
        }, 2000);

        // Enemy 2: CUTTER - Cuts off escape routes
        const timer2 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: AIRoles.CUTTER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false,
                    isStunned: false,
                    stunEndTime: 0
                }
            ]);
            showEnemyAlert("¡Cuidado, otro enemigo!");
            enemyIdRef.current++;
        }, 6000);

        // Enemy 3: FLANKER - Approaches from sides
        const timer3 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: AIRoles.FLANKER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false,
                    isStunned: false,
                    stunEndTime: 0
                }
            ]);
            showEnemyAlert("¡Más peligro!");
            enemyIdRef.current++;
        }, 11000);

        // Enemy 4: AMBUSHER - Sets up ambush positions
        const timer4 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: AIRoles.AMBUSHER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false,
                    isStunned: false,
                    stunEndTime: 0
                }
            ]);
            enemyIdRef.current++;
        }, 16000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    }, [showTutorial, showVictoryModal, showGameOverModal]);

    const handleEnemyPositionUpdate = (id, x, z) => {
        setEnemies(prev => prev.map(e => e.id === id ? { ...e, x, z } : e));

        // Check collision with player
        if (!isInvulnerable) {
            const dist = Math.sqrt((x - playerPos.x) ** 2 + (z - playerPos.z) ** 2);
            if (dist < 0.5) {
                const enemy = enemiesRef.current.find(e => e.id === id);
                if (enemy && !enemy.isReturning && !enemy.isStunned) {
                    handlePlayerEnemyCollision(enemy);
                }
            }
        }
    };

    const restartLevel = () => {
        setPlayerPos(INITIAL_PLAYER_POS);
        setDirection({ x: 0, z: 0 });
        keysPressed.current.clear();
        setCollectibles(initialCollectibles.map(c => ({ ...c, collected: false })));
        setScore(0);
        setLives(3);
        setTokens(0);
        setPowerActive(false);
        setPowerTimeLeft(0);
        setEnemies([]);
        enemyIdRef.current = 1;
        coordinatorRef.current = new EnemyCoordinator();
        setIsInvulnerable(false);
        setIsPaused(false);
        setShowSettingsModal(false);
        setShowGameOverModal(false);
        setShowVictoryModal(false);
        setBarrels([
            { id: 1, x: 10, z: 12, collected: false },
            { id: 2, x: 5, z: 8, collected: false },
            { id: 3, x: 15, z: 16, collected: false },
        ]);
        collectedBeersRef.current.clear();
        collectedBarrelsRef.current.clear();
        collectedBonusesRef.current.clear();
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
                const x = Math.random() * 16 + 2;
                const z = Math.random() * 20 + 2;
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

    return (
        <div className="game-container">
            <Canvas camera={{ position: [10, 12, 18], fov: 60 }} shadows>
                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 18, 12]} intensity={1} />

                <Maze walls={walls} />
                <Floor />
                <Doghouse position={DOGHOUSE_POS} />

                <InstancedCollectibles collectibles={collectibles} />

                {barrels.map(b => !b.collected && <Barrel key={b.id} position={b} />)}

                {specialBonuses.filter(b => !b.collected).map(b => (
                    <SpecialBonus key={b.id} position={{ x: b.x, z: b.z }} />
                ))}

                <Player position={playerPos} direction={direction} onPositionUpdate={handlePositionUpdate} isPaused={isPaused} isPowerActive={powerActive} isInvulnerable={isInvulnerable} />

                {enemies.map(e => (
                    <EnemyAdvanced
                        key={e.id}
                        enemyId={e.id}
                        position={{ x: e.x, z: e.z }}
                        playerPos={playerPos}
                        playerDirection={direction}
                        walls={walls}
                        onPositionUpdate={(x, z) => handleEnemyPositionUpdate(e.id, x, z)}
                        checkCollision={checkCollision}
                        isPowerActive={powerActive}
                        isPaused={isPaused || e.isStunned}
                        rotation={PLAYER_ROTATION}
                        role={e.role}
                        assignedZone={e.zone}
                        doghousePos={DOGHOUSE_POS}
                        isReturning={e.isReturning}
                        spritesheet1Path="/assets/personajes/enemy_type_5.png"
                        spritesheet2Path="/assets/personajes/enemy_type_6.png"
                        debugMode={false}
                        coordinator={coordinatorRef.current}
                        colorNormal="white"
                        colorVulnerable="#ff0000"
                        colorHit="#ffffff"
                    />
                ))}

                <CameraController targetX={playerPos.x} targetZ={playerPos.z} />
            </Canvas>

            <div className="ui-overlay">
                <LevelHeader
                    lives={lives}
                    levelNumber={"6.5"}
                    beersCollected={beersCollected}
                    totalBeers={initialCollectibles.length}
                    score={score}
                    onSettingsClick={() => {
                        setIsPaused(true);
                        setShowSettingsModal(true);
                    }}
                    language={language}
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
                                    src="/assets/poderes/image-removebg-preview (15).png"
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
                            <h2>NIVEL 6.5</h2>
                            <p>Recoge todas las cervezas</p>
                            <p>Usa el poder para derrotar enemigos</p>
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
                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />} {isMuted ? gameUI.enableSound : gameUI.muteSound}
                            </button>
                            <button className="modal-button cancel-button" onClick={onBack}>
                                <Home size={20} /> {gameUI.exit}
                            </button>
                        </div>
                    </div>
                )}

                {showVictoryModal && (
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
                                <p>{gameUI.beersCollected}: {beersCollected}</p>
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
