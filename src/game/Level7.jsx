import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import LevelHeader from '../components/LevelHeader';
import Enemy from '../components/game/Enemy';
import { AIRoles, createPatrolZones, assignZone } from './ai/EnemyAI';
import './Level7.css';

// --- Constants & Configuration ---
const INITIAL_PLAYER_POS = { x: 15, z: 5 };
const DOGHOUSE_POS = { x: 15, z: 6 };
const CAMERA_CONFIG = {
    rotation: Math.PI / 4.8,
    distance: 8,
    height: 6,
    fov: 60,
};
const PLAYER_ROTATION = 1.1;

// --- Walls Definition (From Level7.js) ---
const walls = [
    // Background
    { x: -2, z: -10, length: 60, height: 10, thickness: 1, orientation: 'vertical', textureType: 'left_bg', isBackground: true },
    { x: -10, z: -2, length: 60, height: 10, thickness: 1, orientation: 'horizontal', textureType: 'top_bg', isBackground: true },

    // Exterior Borders
    { x: 0, z: 0, length: 30, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 0, z: 36, length: 30, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 0, z: 0, length: 36, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 30, z: 0, length: 36, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // North Roundabout (Hub Superior)
    { x: 12, z: 3, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 10, z: 4, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 20, z: 4, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 8, z: 6, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 22, z: 6, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 10, z: 10, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 20, z: 10, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    // Internal Islands North
    { x: 15, z: 7, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 15, z: 9, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    // South Roundabout (Hub Inferior)
    { x: 8, z: 26, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 22, z: 26, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 10, z: 26, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 20, z: 26, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 10, z: 30, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 20, z: 30, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 12, z: 33, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    // Internal Islands South
    { x: 14, z: 28, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 16, z: 28, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Lateral Connections ("S" Curves)
    // West Route
    { x: 5, z: 10, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 4, z: 12, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 5, z: 16, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 6, z: 18, length: 6, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 5, z: 22, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 4, z: 24, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 5, z: 28, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    // East Route
    { x: 22, z: 10, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 26, z: 12, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 23, z: 16, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 24, z: 18, length: 6, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 23, z: 22, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 26, z: 24, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 22, z: 28, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    // Central Spine
    { x: 13, z: 13, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 17, z: 13, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 14, z: 15, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' }, // Zig
    { x: 12, z: 18, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 18, z: 18, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 14, z: 21, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' }, // Zag
    { x: 13, z: 23, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 17, z: 23, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Fillers
    { x: 2, z: 5, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 28, z: 5, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 2, z: 31, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 28, z: 31, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
];

// --- Spatial Partitioning (Grid) ---
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
    let attempts = 0;
    while (collectibles.length < count && attempts < 10000) {
        attempts++;
        const x = Math.random() * 28 + 1;
        const z = Math.random() * 34 + 1;
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

const initialCollectibles = generateCollectibles(90);

// --- Preload Textures ---
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_3.png');
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_4.png');
useLoader.preload(THREE.TextureLoader, '/assets/personajes/player.png');
useLoader.preload(THREE.TextureLoader, '/assets/personajes/player_secondary.png');
useLoader.preload(THREE.TextureLoader, '/assets/suelos/floor_texture_2.png');

// --- Patrol Zones ---
const patrolZones = createPatrolZones(30, 36, 2);

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

// --- Components ---

function Maze({ walls }) {
    const textures = useLoader(THREE.TextureLoader, [
        '/assets/paredes/wall_texture_4.png',
        '/assets/paredes/wall_background_left.jpg',
        '/assets/paredes/wall_background_top.jpg'
    ]);
    const [mainTex, leftBgTex, topBgTex] = textures;

    useMemo(() => {
        textures.forEach(t => {
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.NearestFilter;
            t.wrapS = THREE.RepeatWrapping;
            t.wrapT = THREE.RepeatWrapping;
        });
    }, [textures]);

    const { mainGeom, leftGeom, topGeom } = useMemo(() => {
        const mains = [];
        const lefts = [];
        const tops = [];

        walls.forEach(wall => {
            const isHorizontal = wall.orientation === 'horizontal';
            const width = isHorizontal ? wall.length : wall.thickness;
            const depth = isHorizontal ? wall.thickness : wall.length;
            const centerX = isHorizontal ? wall.x + wall.length / 2 : wall.x;
            const centerZ = isHorizontal ? wall.z : wall.z + wall.length / 2;

            const g = new THREE.BoxGeometry(width, wall.height, depth);
            g.translate(centerX, wall.height / 2, centerZ);

            if (wall.textureType === 'left_bg') lefts.push(g);
            else if (wall.textureType === 'top_bg') tops.push(g);
            else mains.push(g);
        });

        return {
            mainGeom: mains.length ? mergeBufferGeometries(mains) : null,
            leftGeom: lefts.length ? mergeBufferGeometries(lefts) : null,
            topGeom: tops.length ? mergeBufferGeometries(tops) : null
        };
    }, [walls]);

    return (
        <group>
            {mainGeom && <mesh geometry={mainGeom} material={new THREE.MeshBasicMaterial({ map: mainTex })} />}
            {leftGeom && <mesh geometry={leftGeom} material={new THREE.MeshBasicMaterial({ map: leftBgTex })} />}
            {topGeom && <mesh geometry={topGeom} material={new THREE.MeshBasicMaterial({ map: topBgTex })} />}
        </group>
    );
}

function Doghouse({ position }) {
    const texture = useLoader(THREE.TextureLoader, '/assets/casetas/image-removebg-preview (23).png');
    return (
        <mesh position={[position.x, 0.6, position.z]} rotation={[-Math.PI / 4, Math.PI / 4.8, 0]}>
            <planeGeometry args={[1.2, 1.2]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} alphaTest={0.5} />
        </mesh>
    );
}

function InstancedCollectibles({ collectibles }) {
    const meshRef = useRef();
    const texture = useLoader(THREE.TextureLoader, '/assets/cervezas/collectible_guajira.png');
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
    const texture = useLoader(THREE.TextureLoader, '/assets/barriles/70b6c64e-daac-4491-ac2a-bfbea504d337.png');
    return (
        <mesh position={[position.x, 0.5, position.z]} rotation={[-Math.PI / 8, 0, 0]}>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} />
        </mesh>
    );
}

// Enemy component moved to src/components/game/Enemy.jsx

function Player({ position, direction, onPositionUpdate, isPaused, isPowerActive, isInvulnerable, shockwaveActive, shockwaveRadius }) {
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
        <group>
            {isPowerActive && trail.map((pos, index) => {
                const trailTexture = getCurrentTexture().clone();
                trailTexture.repeat.set(1 / frameCount, 1);
                trailTexture.offset.x = pos.frame / frameCount;

                return (
                    <mesh
                        key={index}
                        position={[pos.x, 0.5, pos.z]}
                        rotation={[-Math.PI / 4, 0, 0]}
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

            {shockwaveActive && (
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[position.x, 0.1, position.z]} // Shockwave center at player
                >
                    <ringGeometry args={[shockwaveRadius - 0.5, shockwaveRadius, 32]} />
                    <meshBasicMaterial color="#FF6600" transparent opacity={0.6} side={THREE.DoubleSide} />
                </mesh>
            )}

            <mesh
                ref={meshRef}
                position={[position.x, 0.5, position.z]}
                rotation={[-Math.PI / 4, 0, 0]}
                scale={[getFlipX(), 1, 1]}
                renderOrder={2}
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
        </group>
    );
}

function Floor() {
    const tex = useLoader(THREE.TextureLoader, '/assets/suelos/floor_texture_2.png');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(15, 18);
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, -0.1, 18]}>
            <planeGeometry args={[60, 72]} />
            <meshBasicMaterial map={tex} />
        </mesh>
    );
}

// --- Main Level Component ---

export default function Level7({ onBack, onNextLevel, onLevelComplete }) {
    const [playerPos, setPlayerPos] = useState(INITIAL_PLAYER_POS);
    const [direction, setDirection] = useState({ x: 0, z: 0 });
    const [collectibles, setCollectibles] = useState(initialCollectibles);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [tokens, setTokens] = useState(0);
    const [isInvulnerable, setIsInvulnerable] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [finalScoreStats, setFinalScoreStats] = useState({ score: 0, bonus: 0, total: 0 });
    const [isPaused, setIsPaused] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [showVictoryModal, setShowVictoryModal] = useState(false);
    const [showIntroVideo, setShowIntroVideo] = useState(true);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);
    const videoRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);
    const musicRef = useRef(null);

    // Alert States
    const [enemyAlert, setEnemyAlert] = useState(null);
    const [powerAlert, setPowerAlert] = useState(null);

    // Power-up State
    const [powerActive, setPowerActive] = useState(false);
    const [shockwaveActive, setShockwaveActive] = useState(false);
    const [shockwaveRadius, setShockwaveRadius] = useState(0);
    const [powerTimeLeft, setPowerTimeLeft] = useState(0);

    const [barrels, setBarrels] = useState([
        { id: 1, x: 15, z: 9, collected: false },
        { id: 2, x: 5, z: 18, collected: false },
        { id: 3, x: 25, z: 18, collected: false },
    ]);

    const [enemies, setEnemies] = useState([]);
    const collectedBarrelsRef = useRef(new Set());
    const processingHit = useRef(false);

    // --- Audio Logic ---
    useEffect(() => {
        if (showIntroVideo) return;

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
    }, [showIntroVideo]);

    // Restart start time when tutorial closes
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
                onLevelComplete(6); // Nivel 6 completed (Level7.jsx), unlock Nivel 7
            }
        }
    }, [beersCollected, showVictoryModal, onLevelComplete, score, startTime, initialCollectibles.length]);

    // --- Game Logic ---

    const activatePower = () => {
        if (tokens > 0 && !powerActive) {
            setTokens(t => t - 1);
            setPowerActive(true);
            setShockwaveActive(true);
            setShockwaveRadius(0);
            setPowerTimeLeft(6);
            showPowerAlert("¡ONDA EXPANSIVA ACTIVADA!");

            // Animate shockwave radius
            let r = 0;
            const interval = setInterval(() => {
                if (!isPaused) {
                    r += 0.5;
                    setShockwaveRadius(r);
                    if (r >= 5) {
                        clearInterval(interval);
                        setShockwaveActive(false);
                    }
                }
            }, 50);

            // Apply Push and Stun
            const PUSH_DIST = 3;
            const EXPLOSION_RADIUS = 5;

            setEnemies(prev => prev.map(e => {
                if (e.isReturning) return e;
                const dist = Math.sqrt((e.x - playerPos.x) ** 2 + (e.z - playerPos.z) ** 2);
                if (dist <= EXPLOSION_RADIUS) {
                    const dx = e.x - playerPos.x;
                    const dz = e.z - playerPos.z;
                    // Normalize and push
                    const len = Math.sqrt(dx * dx + dz * dz) || 1;
                    let nx = e.x + (dx / len) * PUSH_DIST;
                    let nz = e.z + (dz / len) * PUSH_DIST;

                    // Simple wall check for push (if wall, don't move or move less - simplifying to don't move if blocked)
                    if (checkCollision(nx, nz, walls)) {
                        nx = e.x; nz = e.z;
                    }

                    // Stun logic handled by state flag + timeout in the effect or component?
                    // We'll add 'stunned' property
                    return { ...e, x: nx, z: nz, stunned: true, stunTime: Date.now() + 5000 };
                }
                return e;
            }));
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



    useEffect(() => {
        const k = (e) => {
            if (isPaused) return;
            if (e.key === 'ArrowUp' || e.key === 'w') setDirection({ x: 0, z: -1 });
            if (e.key === 'ArrowDown' || e.key === 's') setDirection({ x: 0, z: 1 });
            if (e.key === 'ArrowLeft' || e.key === 'a') setDirection({ x: -1, z: 0 });
            if (e.key === 'ArrowRight' || e.key === 'd') setDirection({ x: 1, z: 0 });
            if (e.key === ' ') activatePower();
        };
        const ku = () => setDirection({ x: 0, z: 0 });
        window.addEventListener('keydown', k);
        window.addEventListener('keyup', ku);
        return () => { window.removeEventListener('keydown', k); window.removeEventListener('keyup', ku); };
    }, [isPaused, tokens, powerActive]);

    const handleEnemyPositionUpdate = (id, x, z) => {
        setEnemies(prev => prev.map(e => e.id === id ? { ...e, x, z } : e));

        if (!isInvulnerable) {
            const dist = Math.sqrt((x - playerPos.x) ** 2 + (z - playerPos.z) ** 2);
            if (dist < 0.5) {
                const enemy = enemies.find(e => e.id === id);
                if (enemy && !enemy.isReturning) {
                    if (powerActive) { // Touch-kill if power active (Level 7 specific logic kept from original)
                        setScore(s => s + 200);
                        setEnemies(prev => prev.map(e => e.id === id ? { ...e, isReturning: true } : e));
                    } else if (!processingHit.current) {
                        handlePlayerHit();
                    }
                }
            }
        }
    };

    const handleReturnComplete = (id) => {
        setEnemies(prev => prev.map(e => e.id === id ? { ...e, isReturning: false } : e));
    };

    // Refs for collection optimization
    const collectedBeersRef = useRef(new Set());

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
                    scoreToAdd += 25;
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

        // 3. Check Enemies (Player runs into Enemy)
        // Note: For Level 7, we also need to check "Shockwave" hits if active, 
        // but typically shockwave is an 'active' check over all enemies when fired.
        // Here we just check if PLAYER collides with ENEMY body.
        if (!isInvulnerable) {
            enemies.forEach(enemy => {
                const dist = Math.sqrt((newX - enemy.x) ** 2 + (newZ - enemy.z) ** 2);

                // Si el jugador toca al enemigo con poder activo (NOT shockwave, but contact power if any - typically powerActive implies touch-kill in this game design?)
                // Level 7 uses "Shockwave" as power. Does touching kills? 
                // Original code: if (dist < 0.6 && powerActive && !enemy.isReturning).

                if (dist < 0.6 && powerActive && !enemy.isReturning) {
                    setScore(s => s + 200);
                    setEnemies(prev => prev.map(e => e.id === enemy.id ? { ...e, isReturning: true } : e));
                    return;
                }

                if (dist < 0.4 && !powerActive && !enemy.isReturning && !processingHit.current) {
                    handlePlayerHit();
                }
            });
        }
    };

    const handlePlayerHit = () => {
        processingHit.current = true;
        setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
                setIsPaused(true);
                // Game Over Stats logic needs to be cleaner, but we'll trigger the modal
                setShowGameOverModal(true);
            }
            return newLives;
        });

        if (lives > 1) { // If checking prev value, care needed. easier to just check state if update is batched
            playLoseLifeSound();
            setIsInvulnerable(true);
            setTimeout(() => {
                setIsInvulnerable(false);
                processingHit.current = false;
            }, 3000);
        }
    };

    // Enemy returning to doghouse logic
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused) return;

            setEnemies(prev => {
                let changed = false;
                const next = prev.map(enemy => {
                    if (enemy.isReturning) {
                        const distToDoghouse = Math.sqrt(
                            (enemy.x - DOGHOUSE_POS.x) ** 2 +
                            (enemy.z - DOGHOUSE_POS.z) ** 2
                        );
                        if (distToDoghouse < 0.5) {
                            changed = true;
                            return { ...enemy, isReturning: false };
                        }
                    }
                    return enemy;
                });
                return changed ? next : prev;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [isPaused]);

    // Enemy Spawning with AI roles (7 enemigos total)
    const enemyIdRef = useRef(1);

    // Limpiar aturdimiento cuando expire el tiempo
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused) return;

            setEnemies(prev => prev.map(e => {
                // Si el enemigo está aturdido y el tiempo expiró, quitar aturdimiento
                if (e.stunned && Date.now() >= e.stunTime) {
                    return { ...e, stunned: false, stunTime: 0 };
                }
                return e;
            }));
        }, 100); // Revisar cada 100ms

        return () => clearInterval(interval);
    }, [isPaused]);

    useEffect(() => {
        const timer1 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: AIRoles.STRAIGHT,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            showEnemyAlert("¡Apareció un enemigo!");
            enemyIdRef.current++;
        }, 2000);

        const timer2 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: AIRoles.TURNER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            showEnemyAlert("¡Cuidado, otro enemigo!");
            enemyIdRef.current++;
        }, 5000);

        const timer3 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: AIRoles.FREQUENT,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            showEnemyAlert("¡Más peligro!");
            enemyIdRef.current++;
        }, 9000);

        const timer4 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: AIRoles.CHASER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            enemyIdRef.current++;
        }, 15000);

        const timer5 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: AIRoles.CUTTER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            enemyIdRef.current++;
        }, 20000);

        const timer6 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: AIRoles.ROTATOR,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            enemyIdRef.current++;
        }, 25000);

        const timer7 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: AIRoles.LAZY,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            enemyIdRef.current++;
        }, 30000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
            clearTimeout(timer5);
            clearTimeout(timer6);
            clearTimeout(timer7);
        };
    }, []);

    const restartLevel = () => {
        setPlayerPos(INITIAL_PLAYER_POS);
        setDirection({ x: 0, z: 0 });
        setCollectibles(initialCollectibles.map(c => ({ ...c, collected: false })));
        setScore(0);
        setLives(3);
        setTokens(0);
        setIsInvulnerable(false);
        setPowerActive(false);
        setPowerTimeLeft(0);
        setShockwaveActive(false);
        setEnemies([]);
        enemyIdRef.current = 1;
        setIsPaused(false);
        setShowSettingsModal(false);
        setShowGameOverModal(false);
        setShowVictoryModal(false);
        collectedBarrelsRef.current.clear();
        setBarrels([
            { id: 1, x: 15, z: 9, collected: false },
            { id: 2, x: 5, z: 18, collected: false },
            { id: 3, x: 25, z: 18, collected: false },
        ]);
    };

    return (
        <div className="game-container">


            <Canvas camera={{ position: [15, 18, 26], fov: CAMERA_CONFIG.fov }} shadows>
                <ambientLight intensity={1.5} />
                <directionalLight position={[15, 24, 18]} intensity={1} />

                <Maze walls={walls} />
                <Floor />
                <Doghouse position={DOGHOUSE_POS} />

                <InstancedCollectibles collectibles={collectibles} />

                {barrels.map(b => !b.collected && <Barrel key={b.id} position={b} />)}

                <Player
                    position={playerPos}
                    direction={direction}
                    onPositionUpdate={handlePositionUpdate}
                    isPaused={isPaused}
                    isPowerActive={powerActive}
                    isInvulnerable={isInvulnerable}
                    shockwaveActive={shockwaveActive}
                    shockwaveRadius={shockwaveRadius}
                />

                {enemies.map(e => (
                    <Enemy
                        key={e.id}
                        enemyId={e.id}
                        position={{ x: e.x, z: e.z }}
                        playerPos={playerPos}
                        playerDirection={direction}
                        walls={walls}
                        onPositionUpdate={(x, z) => handleEnemyPositionUpdate(e.id, x, z)}
                        checkCollision={checkCollision}
                        isPowerActive={powerActive}
                        isPaused={isPaused}
                        rotation={1.1}
                        role={e.role}
                        assignedZone={e.zone}
                        doghousePos={DOGHOUSE_POS}
                        isReturning={e.isReturning}
                        spritesheet1Path="/assets/personajes/enemy_type_3.png"
                        spritesheet2Path="/assets/personajes/enemy_type_4.png"
                        debugMode={false}
                        isStunned={e.stunned && Date.now() < e.stunTime}
                        stunEndTime={e.stunTime}
                    />
                ))}

                <CameraController targetX={playerPos.x} targetZ={playerPos.z} />
            </Canvas>

            <div className="ui-overlay">
                <LevelHeader
                    lives={lives}
                    levelNumber={7}
                    beersCollected={initialCollectibles.length - collectibles.filter(c => !c.collected).length}
                    score={score}
                    onSettingsClick={() => {
                        setIsPaused(true);
                        setShowSettingsModal(true);
                    }}
                />

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
                                    src="/assets/poderes/image-removebg-preview (16).png"
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

                {showVictoryModal && (
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
                            src="/assets/videos/GUAJIRA NIVEL 6 (1) .mp4"
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

                {powerAlert && (
                    <div className="enemy-alert" style={{ background: 'rgba(255, 100, 0, 0.7)', borderColor: '#ff8844', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}>
                        {powerAlert}
                    </div>
                )}

                {enemyAlert && (
                    <div className="enemy-alert">
                        {enemyAlert}
                    </div>
                )}
            </div>
        </div >
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
