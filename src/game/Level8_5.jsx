import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import LevelHeader from '../components/LevelHeader';
import EnemyAdvanced from '../components/game/EnemyAdvanced';
import { AIRoles, createPatrolZones, assignZone } from './ai/EnemyAI';
import { EnemyCoordinator } from './ai/EnemyAI_Advanced';
import './Level8_5.css';

// --- Constants & Configuration ---
const INITIAL_PLAYER_POS = { x: 11, z: 2 };
const DOGHOUSE_POS = { x: 11, z: 3 };
const CAMERA_CONFIG = {
    rotation: Math.PI / 4.8,
    distance: 8,
    height: 6,
    fov: 60,
};

// --- Walls Definition (Reduced 22x26 map with cross pattern) ---
const walls = [
    // Background
    { x: -2, z: -10, length: 50, height: 10, thickness: 1, orientation: 'vertical', isBackground: true },
    { x: -10, z: -2, length: 50, height: 10, thickness: 1, orientation: 'horizontal', isBackground: true },

    // Exterior Borders (22x26)
    { x: 0, z: 0, length: 22, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 0, z: 26, length: 22, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 0, z: 0, length: 26, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 22, z: 0, length: 26, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Cross 1 (NW)
    { x: 4, z: 3, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 8, z: 3, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 4, z: 7, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 8, z: 7, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Cross 2 (NE)
    { x: 14, z: 3, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 18, z: 3, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 14, z: 7, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 18, z: 7, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Cross 3 (W)
    { x: 4, z: 11, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 8, z: 11, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 4, z: 15, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 8, z: 15, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Cross 4 (E)
    { x: 14, z: 11, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 18, z: 11, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 14, z: 15, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 18, z: 15, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Cross 5 (SW)
    { x: 4, z: 19, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 8, z: 19, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 4, z: 23, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 8, z: 23, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Cross 6 (SE)
    { x: 14, z: 19, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 18, z: 19, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 14, z: 23, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 18, z: 23, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Choke Points
    { x: 8, z: 5, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 12, z: 5, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    { x: 8, z: 21, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 12, z: 21, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    // Core Dense Structure
    { x: 10, z: 11, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 10, z: 15, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 10, z: 12, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Side walls
    { x: 2, z: 13, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 20, z: 13, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Corner fillers
    { x: 2, z: 4, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 19, z: 4, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 2, z: 22, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 19, z: 22, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
];

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

function checkCollision(x, z) {
    const playerRadius = 0.3;
    for (const wall of walls) {
        const { minX, maxX, minZ, maxZ } = getWallBounds(wall);
        if (
            x + playerRadius > minX &&
            x - playerRadius < maxX &&
            z + playerRadius > minZ &&
            z - playerRadius < maxZ
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
        const x = Math.random() * 20 + 1;
        const z = Math.random() * 24 + 1;
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

const initialCollectibles = generateCollectibles(60);

// --- Preload Textures ---
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_1.png');
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_2.png');
useLoader.preload(THREE.TextureLoader, '/assets/personajes/player.png');
useLoader.preload(THREE.TextureLoader, '/assets/personajes/player_secondary.png');

// --- Patrol Zones ---
const patrolZones = createPatrolZones(22, 26, 2);

// --- Enemy Coordinator (for Advanced AI) ---
const enemyCoordinator = new EnemyCoordinator();

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
        '/assets/paredes/wall_brick.jpg',
        '/assets/paredes/wall_stone.jpg',
        '/assets/paredes/wall_marble.jpg',
        '/assets/paredes/wall_texture_3.png',
        '/assets/paredes/wall_background_3.jpg'
    ]);
    const [tex1, tex2, tex3, tex4, bgTex] = textures;

    useMemo(() => {
        textures.forEach(t => {
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.NearestFilter;
            t.wrapS = THREE.RepeatWrapping;
            t.wrapT = THREE.RepeatWrapping;
        });
    }, [textures]);

    const { g1, g2, g3, g4, bgGeom } = useMemo(() => {
        const t1g = [], t2g = [], t3g = [], t4g = [], bgg = [];

        // Zones for 22x26 map
        const colDiv = 11;
        const rowDiv = 13;

        walls.forEach(wall => {
            const isHorizontal = wall.orientation === 'horizontal';
            const centerX = isHorizontal ? wall.x + wall.length / 2 : wall.x;
            const centerZ = isHorizontal ? wall.z : wall.z + wall.length / 2;
            const width = isHorizontal ? wall.length : wall.thickness;
            const depth = isHorizontal ? wall.thickness : wall.length;

            const g = new THREE.BoxGeometry(width, wall.height, depth);
            g.translate(centerX, wall.height / 2, centerZ);

            if (wall.isBackground) {
                bgg.push(g);
            } else {
                if (centerZ <= rowDiv) {
                    if (centerX <= colDiv) t1g.push(g); else t2g.push(g);
                } else {
                    if (centerX <= colDiv) t3g.push(g); else t4g.push(g);
                }
            }
        });

        return {
            g1: t1g.length ? mergeBufferGeometries(t1g) : null,
            g2: t2g.length ? mergeBufferGeometries(t2g) : null,
            g3: t3g.length ? mergeBufferGeometries(t3g) : null,
            g4: t4g.length ? mergeBufferGeometries(t4g) : null,
            bgGeom: bgg.length ? mergeBufferGeometries(bgg) : null,
        };
    }, [walls]);

    return (
        <group>
            {bgGeom && <mesh geometry={bgGeom} material={new THREE.MeshBasicMaterial({ map: bgTex })} />}
            {g1 && <mesh geometry={g1} material={new THREE.MeshBasicMaterial({ map: tex1 })} />}
            {g2 && <mesh geometry={g2} material={new THREE.MeshBasicMaterial({ map: tex2 })} />}
            {g3 && <mesh geometry={g3} material={new THREE.MeshBasicMaterial({ map: tex3 })} />}
            {g4 && <mesh geometry={g4} material={new THREE.MeshBasicMaterial({ map: tex4 })} />}
        </group>
    );
}

function Doghouse({ position }) {
    const texture = useLoader(THREE.TextureLoader, '/assets/casetas/house_icon.png');
    return (
        <mesh position={[position.x, 0.6, position.z]} rotation={[-Math.PI / 4, Math.PI / 4.8, 0]}>
            <planeGeometry args={[1.2, 1.2]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} alphaTest={0.5} />
        </mesh>
    );
}

function InstancedCollectibles({ collectibles }) {
    const meshRef = useRef();
    const texture = useLoader(THREE.TextureLoader, '/assets/cervezas/collectible_bottle.png');
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
    const texture = useLoader(THREE.TextureLoader, '/assets/barriles/barrel_chatgpt.png');
    return (
        <mesh position={[position.x, 0.5, position.z]} rotation={[-Math.PI / 8, 0, 0]}>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} />
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
            />
        </mesh>
    );
}

function Player({ position, direction, isInvulnerable, isPowerActive, isPaused, onPositionUpdate }) {
    const meshRef = useRef();
    const t1 = useLoader(THREE.TextureLoader, '/assets/personajes/player.png');
    const t2 = useLoader(THREE.TextureLoader, '/assets/personajes/player_secondary.png');

    const spritesheet1 = useMemo(() => {
        const t = t1.clone();
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestFilter;
        return t;
    }, [t1]);

    const spritesheet2 = useMemo(() => {
        const t = t2.clone();
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestFilter;
        return t;
    }, [t2]);

    const [currentFrame, setCurrentFrame] = useState(0);
    const [animationTime, setAnimationTime] = useState(0);
    const [lastDirection, setLastDirection] = useState({ x: 1, z: 0 });
    const [trail, setTrail] = useState([]);
    const [pulseTime, setPulseTime] = useState(0);
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
                            emissive="#00FFFF"
                            emissiveIntensity={1.5 - index * 0.3}
                            depthWrite={false}
                        />
                    </mesh>
                );
            })}

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
                    emissive={isPowerActive ? "#00FFFF" : "#000000"}
                    emissiveIntensity={isPowerActive ? 0.8 : 0}
                    opacity={pulseOpacity}
                    depthWrite={true}
                />
            </mesh>
        </group>
    );
}

function Floor() {
    const tex = useLoader(THREE.TextureLoader, '/assets/suelos/floor_texture.jpg');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5.5, 6.5);
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[11, -0.1, 13]}>
            <planeGeometry args={[22, 26]} />
            <meshBasicMaterial map={tex} />
        </mesh>
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

// --- Main Level Component ---

export default function Level8_5({ onBack, onNextLevel, onLevelComplete }) {
    const [playerPos, setPlayerPos] = useState(INITIAL_PLAYER_POS);
    const [direction, setDirection] = useState({ x: 0, z: 0 });
    const [collectibles, setCollectibles] = useState(initialCollectibles);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [tokens, setTokens] = useState(0);
    const [isInvulnerable, setIsInvulnerable] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [finalScoreStats, setFinalScoreStats] = useState({ score: 0, bonus: 0, total: 0 });
    const isInvulnerableRef = useRef(false);

    // UI State
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

    // Power-up State (Super Speed)
    const [powerActive, setPowerActive] = useState(false);
    const [powerTimeLeft, setPowerTimeLeft] = useState(0);

    const [barrels, setBarrels] = useState([
        { id: 1, x: 6, z: 5, collected: false },
        { id: 2, x: 16, z: 5, collected: false },
        { id: 3, x: 6, z: 21, collected: false },
        { id: 4, x: 16, z: 21, collected: false },
    ]);

    const [enemies, setEnemies] = useState([]);
    const [restartCount, setRestartCount] = useState(0);
    const enemyIdRef = useRef(1);
    const collectedBarrelsRef = useRef(new Set());
    const collectedBonusesRef = useRef(new Set());
    const collectedBeersRef = useRef(new Set());
    const processingHit = useRef(false);

    // Special Bonuses
    const [specialBonuses, setSpecialBonuses] = useState([]);
    const [bonusFlags, setBonusFlags] = useState({ p30: false, p70: false });

    // Track pressed keys
    const keysPressed = useRef(new Set());
    const [, forceUpdate] = useState({});

    // --- Audio Logic ---
    useEffect(() => {
        if (showTutorial) return;

        musicRef.current = new Audio('/assets/audio/Documento de Silviu-san.mp3');
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

    useEffect(() => {
        isInvulnerableRef.current = isInvulnerable;
    }, [isInvulnerable]);

    const toggleMute = () => setIsMuted(prev => !prev);

    const showEnemyAlert = (text) => {
        setEnemyAlert(text);
        setTimeout(() => setEnemyAlert(null), 2000);
    };

    const showPowerAlert = (text) => {
        setPowerAlert(text);
        setTimeout(() => setPowerAlert(null), 2000);
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
                onLevelComplete(8);
            }
        }
    }, [beersCollected, showVictoryModal, score, startTime, onLevelComplete]);

    const handleEnemyPositionUpdate = (enemyId, x, z) => {
        setEnemies(prevEnemies =>
            prevEnemies.map(enemy =>
                enemy.id === enemyId ? { ...enemy, x, z } : enemy
            )
        );

        // Update coordinator
        enemyCoordinator.updateEnemy(enemyId, { x, z });
    };

    const handleReturnComplete = (id) => {
        setEnemies(prev => prev.map(e => e.id === id ? { ...e, isReturning: false } : e));
    };

    const activatePower = () => {
        if (tokens > 0 && !powerActive) {
            setTokens(t => t - 1);
            setPowerActive(true);
            setPowerTimeLeft(6);
            showPowerAlert("¡SUPER VELOCIDAD ACTIVADA!");
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
            if (e.key === 'ArrowUp' || e.key === 'w') handleDirectionInput('up');
            if (e.key === 'ArrowDown' || e.key === 's') handleDirectionInput('down');
            if (e.key === 'ArrowLeft' || e.key === 'a') handleDirectionInput('left');
            if (e.key === 'ArrowRight' || e.key === 'd') handleDirectionInput('right');
            if (e.key === ' ') activatePower();
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
    }, [tokens, powerActive]);

    const handlePositionUpdate = (newX, newZ) => {
        setPlayerPos({ x: newX, z: newZ });

        // 1. Check Collectibles
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

        // 3. Check Special Bonuses
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

        // 4. Check Enemies
        if (!isInvulnerable) {
            enemies.forEach(enemy => {
                const dist = Math.sqrt((newX - enemy.x) ** 2 + (newZ - enemy.z) ** 2);

                if (dist < 0.6 && powerActive && !enemy.isReturning) {
                    setScore(s => s + 150);
                    setEnemies(prev => prev.map(e => e.id === enemy.id ? { ...e, isReturning: true } : e));
                    return;
                }

                if (dist < 0.5 && !powerActive && !enemy.isReturning && !processingHit.current) {
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
            }
            return newLives;
        });

        if (lives > 1) {
            playLoseLifeSound();
            setIsInvulnerable(true);
            setTimeout(() => {
                setIsInvulnerable(false);
                processingHit.current = false;
            }, 3000);
        }
    };

    // Enemy collision detection
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused) return;

            setEnemies(prev => prev.map(e => {
                const dist = Math.sqrt((playerPos.x - e.x) ** 2 + (playerPos.z - e.z) ** 2);

                if (dist < 0.6 && powerActive && !e.isReturning) {
                    setScore(s => s + 150);
                    return { ...e, isReturning: true };
                }

                if (dist < 0.6 && !isInvulnerableRef.current && !e.isReturning && !powerActive) {
                    isInvulnerableRef.current = true;
                    setLives(l => {
                        const newLives = l - 1;
                        if (newLives <= 0) {
                            setIsPaused(true);
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
                        } else {
                            playLoseLifeSound();
                            setIsInvulnerable(true);
                            setTimeout(() => {
                                setIsInvulnerable(false);
                                isInvulnerableRef.current = false;
                            }, 3000);
                        }
                        return newLives;
                    });
                }

                if (e.isReturning) {
                    const distToDoghouse = Math.sqrt(
                        (e.x - DOGHOUSE_POS.x) ** 2 + (e.z - DOGHOUSE_POS.z) ** 2
                    );
                    if (distToDoghouse < 0.5) {
                        return { ...e, x: DOGHOUSE_POS.x, z: DOGHOUSE_POS.z, isReturning: false };
                    }
                }

                return e;
            }));
        }, 50);
        return () => clearInterval(interval);
    }, [playerPos, powerActive, isPaused, beersCollected, score, startTime]);

    // Enemy Spawning with Advanced AI (4 enemies)
    useEffect(() => {
        if (showTutorial) return;
        if (showVictoryModal || showGameOverModal) return;

        const doghousePos = DOGHOUSE_POS;

        // Enemy 1: CHASER at 3 seconds
        const timer1 = setTimeout(() => {
            const newId = enemyIdRef.current++;
            enemyCoordinator.registerEnemy(newId, doghousePos, AIRoles.CHASER);
            setEnemies(prevEnemies => [...prevEnemies, {
                id: newId,
                x: doghousePos.x,
                z: doghousePos.z,
                role: AIRoles.CHASER,
                zone: assignZone(newId, patrolZones),
                isReturning: false,
                isStunned: false,
                stunEndTime: 0
            }]);
            showEnemyAlert("¡Apareció un perseguidor!");
        }, 3000);

        // Enemy 2: CUTTER at 8 seconds
        const timer2 = setTimeout(() => {
            const newId = enemyIdRef.current++;
            enemyCoordinator.registerEnemy(newId, doghousePos, AIRoles.CUTTER);
            setEnemies(prevEnemies => [...prevEnemies, {
                id: newId,
                x: doghousePos.x,
                z: doghousePos.z,
                role: AIRoles.CUTTER,
                zone: assignZone(newId, patrolZones),
                isReturning: false,
                isStunned: false,
                stunEndTime: 0
            }]);
            showEnemyAlert("¡Cuidado, otro enemigo!");
        }, 8000);

        // Enemy 3: FLANKER at 14 seconds
        const timer3 = setTimeout(() => {
            const newId = enemyIdRef.current++;
            enemyCoordinator.registerEnemy(newId, doghousePos, AIRoles.FLANKER);
            setEnemies(prevEnemies => [...prevEnemies, {
                id: newId,
                x: doghousePos.x,
                z: doghousePos.z,
                role: AIRoles.FLANKER,
                zone: assignZone(newId, patrolZones),
                isReturning: false,
                isStunned: false,
                stunEndTime: 0
            }]);
            showEnemyAlert("¡Más peligro!");
        }, 14000);

        // Enemy 4: AMBUSHER at 20 seconds
        const timer4 = setTimeout(() => {
            const newId = enemyIdRef.current++;
            enemyCoordinator.registerEnemy(newId, doghousePos, AIRoles.AMBUSHER);
            setEnemies(prevEnemies => [...prevEnemies, {
                id: newId,
                x: doghousePos.x,
                z: doghousePos.z,
                role: AIRoles.AMBUSHER,
                zone: assignZone(newId, patrolZones),
                isReturning: false,
                isStunned: false,
                stunEndTime: 0
            }]);
        }, 20000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    }, [showTutorial, showVictoryModal, showGameOverModal, restartCount]);

    const restartLevel = () => {
        setPlayerPos(INITIAL_PLAYER_POS);
        setDirection({ x: 0, z: 0 });
        keysPressed.current.clear();
        setCollectibles(initialCollectibles.map(c => ({ ...c, collected: false })));
        setScore(0);
        setLives(3);
        setTokens(0);
        setIsInvulnerable(false);
        isInvulnerableRef.current = false;
        processingHit.current = false;
        setPowerActive(false);
        setPowerTimeLeft(0);
        setEnemies([]);
        enemyIdRef.current = 1;
        collectedBeersRef.current.clear();
        collectedBarrelsRef.current.clear();
        collectedBonusesRef.current.clear();
        setSpecialBonuses([]);
        setBonusFlags({ p30: false, p70: false });
        setIsPaused(false);
        setShowSettingsModal(false);
        setShowGameOverModal(false);
        setShowVictoryModal(false);
        setBarrels([
            { id: 1, x: 6, z: 5, collected: false },
            { id: 2, x: 16, z: 5, collected: false },
            { id: 3, x: 6, z: 21, collected: false },
            { id: 4, x: 16, z: 21, collected: false },
        ]);
        setRestartCount(prev => prev + 1);
    };

    // Spawn special bonuses at 30% and 70%
    useEffect(() => {
        const totalBeers = collectibles.length;
        const collected = collectibles.filter(c => c.collected).length;
        const percentage = totalBeers > 0 ? collected / totalBeers : 0;

        const findFreePosition = () => {
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * 18 + 2;
                const z = Math.random() * 22 + 2;
                if (!checkCollision(x, z)) {
                    return { x, z };
                }
            }
            return { x: 11, z: 13 };
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

    const handleStartGame = () => {
        setShowTutorial(false);
        setIsPaused(false);
    };

    return (
        <div className="game-container">
            <Canvas camera={{ position: [11, 14, 20], fov: CAMERA_CONFIG.fov }} shadows>
                <ambientLight intensity={1.5} />
                <directionalLight position={[11, 18, 13]} intensity={1} />

                <Maze walls={walls} />
                <Floor />
                <Doghouse position={DOGHOUSE_POS} />

                <InstancedCollectibles collectibles={collectibles} />

                {barrels.map(b => !b.collected && <Barrel key={b.id} position={b} />)}

                {specialBonuses.filter(b => !b.collected).map(b => (
                    <SpecialBonus key={b.id} position={{ x: b.x, z: b.z }} />
                ))}

                <Player
                    position={playerPos}
                    direction={direction}
                    onPositionUpdate={handlePositionUpdate}
                    isPaused={isPaused}
                    isPowerActive={powerActive}
                    isInvulnerable={isInvulnerable}
                />

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
                        isPowerActive={powerActive}
                        isPaused={isPaused}
                        rotation={1.1}
                        role={enemy.role}
                        assignedZone={enemy.zone}
                        doghousePos={DOGHOUSE_POS}
                        isReturning={enemy.isReturning}
                        onReturnComplete={() => handleReturnComplete(enemy.id)}
                        spritesheet1Path="/assets/personajes/enemy_type_1.png"
                        spritesheet2Path="/assets/personajes/enemy_type_2.png"
                        coordinator={enemyCoordinator}
                        isStunned={enemy.isStunned}
                        stunEndTime={enemy.stunEndTime}
                    />
                ))}

                <CameraController targetX={playerPos.x} targetZ={playerPos.z} />
            </Canvas>

            <div className="ui-overlay">
                <LevelHeader
                    lives={lives}
                    levelNumber={"8.5"}
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
                            className={`d-pad-button up ${isPressed('up') ? 'active' : ''}`}
                            onPointerDown={() => handleDirectionInput('up')}
                            onPointerUp={() => handleDirectionRelease('up')}
                            onPointerLeave={() => handleDirectionRelease('up')}
                            onPointerEnter={(e) => (e.buttons > 0 || e.pressure > 0) && handleDirectionInput('up')}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <ArrowUp size={24} />
                        </button>
                    </div>
                    <div className="d-pad-row middle">
                        <button
                            className={`d-pad-button left ${isPressed('left') ? 'active' : ''}`}
                            onPointerDown={() => handleDirectionInput('left')}
                            onPointerUp={() => handleDirectionRelease('left')}
                            onPointerLeave={() => handleDirectionRelease('left')}
                            onPointerEnter={(e) => (e.buttons > 0 || e.pressure > 0) && handleDirectionInput('left')}
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
                                    src="/assets/poderes/power_icon.png"
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
                            onPointerDown={() => handleDirectionInput('right')}
                            onPointerUp={() => handleDirectionRelease('right')}
                            onPointerLeave={() => handleDirectionRelease('right')}
                            onPointerEnter={(e) => (e.buttons > 0 || e.pressure > 0) && handleDirectionInput('right')}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <ArrowRight size={24} />
                        </button>
                    </div>
                    <div className="d-pad-row">
                        <button
                            className={`d-pad-button down ${isPressed('down') ? 'active' : ''}`}
                            onPointerDown={() => handleDirectionInput('down')}
                            onPointerUp={() => handleDirectionRelease('down')}
                            onPointerLeave={() => handleDirectionRelease('down')}
                            onPointerEnter={(e) => (e.buttons > 0 || e.pressure > 0) && handleDirectionInput('down')}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <ArrowDown size={24} />
                        </button>
                    </div>
                </div>

                {showTutorial && (
                    <div className="tutorial-modal">
                        <div className="tutorial-content">
                            <h2>NIVEL 8.5</h2>
                            <p>Recoge todas las botellas</p>
                            <p>Evita a los enemigos avanzados</p>
                            <p>Recoge barriles para activar super velocidad</p>
                            <p>¡Con super velocidad puedes derrotar enemigos!</p>
                            <button onClick={handleStartGame}>¡JUGAR!</button>
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

                {showVictoryModal && (
                    <div className="settings-modal victory-modal">
                        <div className="settings-content glass-panel victory-content">
                            <h2>¡JUEGO COMPLETADO!</h2>
                            <p className="score-text">¡Has completado el nivel avanzado!</p>

                            <StarRating stars={3} />

                            <div className="victory-stats">
                                <p>Puntuación Base: {finalScoreStats.score}</p>
                                <p>Bonus Tiempo: {finalScoreStats.bonus}</p>
                                <p style={{ fontSize: '1.4em', color: '#FFD700', fontWeight: 'bold' }}>Total: {finalScoreStats.total}</p>
                            </div>

                            <p className="unlock-text">¡Gracias por jugar Beer Run!</p>
                            <button className="modal-button restart-button" onClick={restartLevel}>
                                <RotateCcw size={20} /> Jugar de nuevo
                            </button>
                            <button className="modal-button cancel-button" onClick={onBack}>
                                <Home size={20} /> Volver al Menú
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
                                <p>Botellas recogidas: {initialCollectibles.length - collectibles.filter(c => !c.collected).length}</p>
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

                {powerAlert && (
                    <div className="enemy-alert" style={{ background: 'rgba(0, 255, 255, 0.7)', borderColor: '#00ffff', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}>
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
