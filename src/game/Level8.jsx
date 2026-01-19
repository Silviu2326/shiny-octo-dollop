import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import LevelHeader from '../components/LevelHeader';
import Enemy from '../components/game/Enemy';
import { AIRoles, createPatrolZones, assignZone } from './ai/EnemyAI';
import './Level8.css';

// --- Constants & Configuration ---
const INITIAL_PLAYER_POS = { x: 16, z: 2 };
const DOGHOUSE_POS = { x: 16, z: 4 };
const CAMERA_CONFIG = {
    rotation: Math.PI / 4.8,
    distance: 8,
    height: 6,
    fov: 60,
};
const PLAYER_ROTATION = 1.1;

// --- Walls Definition (From Level8.js) ---
const walls = [
    // Background
    { x: -2, z: -10, length: 60, height: 10, thickness: 1, orientation: 'vertical', isBackground: true },
    { x: -10, z: -2, length: 60, height: 10, thickness: 1, orientation: 'horizontal', isBackground: true },

    // Exterior Borders (32x38)
    { x: 0, z: 0, length: 32, height: 0.6, thickness: 0.2, orientation: 'horizontal' }, // Top Border (Special Texture Handling in Component)
    { x: 0, z: 38, length: 32, height: 0.6, thickness: 0.2, orientation: 'horizontal' }, // Bottom Border
    { x: 0, z: 0, length: 38, height: 0.6, thickness: 0.2, orientation: 'vertical' },   // Left Border
    { x: 32, z: 0, length: 38, height: 0.6, thickness: 0.2, orientation: 'vertical' },  // Right Border

    // Cross 1 (NW)
    { x: 5, z: 3, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 11, z: 3, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 5, z: 9, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 11, z: 9, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    // Cross 2 (N)
    { x: 13, z: 5, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 19, z: 5, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 13, z: 11, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 19, z: 11, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    // Cross 3 (NE)
    { x: 21, z: 3, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 27, z: 3, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 21, z: 9, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 27, z: 9, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Cross 4 (W)
    { x: 5, z: 16, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 11, z: 16, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 5, z: 22, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 11, z: 22, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    // Cross 5 (E)
    { x: 21, z: 16, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 27, z: 16, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 21, z: 22, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 27, z: 22, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Cross 6 (SW)
    { x: 5, z: 29, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 11, z: 29, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 5, z: 35, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 11, z: 35, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    // Cross 7 (S)
    { x: 13, z: 27, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 19, z: 27, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 13, z: 33, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 19, z: 33, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    // Cross 8 (SE)
    { x: 21, z: 29, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 27, z: 29, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 21, z: 35, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 27, z: 35, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Choke Points
    { x: 11, z: 6, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 11, z: 8, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 12, z: 7, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 19, z: 6, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 19, z: 8, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 20, z: 7, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 6, z: 12, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 10, z: 12, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 8, z: 14, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    { x: 22, z: 12, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 26, z: 12, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 24, z: 14, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    { x: 11, z: 30, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 11, z: 32, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 12, z: 31, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 19, z: 30, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 19, z: 32, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 20, z: 31, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Core Dense Structure
    { x: 14, z: 17, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 14, z: 21, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 14, z: 17, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 18, z: 17, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 12, z: 15, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 19, z: 23, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    { x: 2, z: 19, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 30, z: 19, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 3, z: 5, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 27, z: 5, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    { x: 15, z: 2, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 17, z: 36, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 8, z: 25, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 21, z: 25, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    { x: 8, z: 13, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 21, z: 13, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
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

function checkCollision(x, z, walls) {
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
        const x = Math.random() * 30 + 1;
        const z = Math.random() * 36 + 1;
        if (!checkCollision(x, z, walls)) {
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

const initialCollectibles = generateCollectibles(100);

// --- Preload Textures ---
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_1.png');
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_2.png');
useLoader.preload(THREE.TextureLoader, '/assets/personajes/player.png');
useLoader.preload(THREE.TextureLoader, '/assets/personajes/player_secondary.png');

// --- Components ---

function Maze({ walls }) {
    const textures = useLoader(THREE.TextureLoader, [
        '/assets/paredes/wall_brick.jpg',
        '/assets/paredes/wall_stone.jpg',
        '/assets/paredes/wall_marble.jpg',
        '/assets/paredes/wall_texture_3.png',
        '/assets/paredes/wall_texture_4.png',
        '/assets/texturas/wall_texture_2.png',
        '/assets/paredes/wall_background_3.jpg'
    ]);
    const [tex1, tex2, tex3, tex4, tex5, tex6, bgTex] = textures;

    useMemo(() => {
        textures.forEach(t => {
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.NearestFilter;
            t.wrapS = THREE.RepeatWrapping;
            t.wrapT = THREE.RepeatWrapping;
        });
    }, [textures]);

    const { g1, g2, g3, g4, g5, g6, bgGeom } = useMemo(() => {
        const t1g = [], t2g = [], t3g = [], t4g = [], t5g = [], t6g = [], bgg = [];

        // Zones
        const colDiv = 16;
        const row1 = 12.67;
        const row2 = 25.33;

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
                if (centerZ <= row1) {
                    if (centerX <= colDiv) t1g.push(g); else t2g.push(g);
                } else if (centerZ <= row2) {
                    if (centerX <= colDiv) t3g.push(g); else t4g.push(g);
                } else {
                    if (centerX <= colDiv) t5g.push(g); else t6g.push(g);
                }
            }
        });

        return {
            g1: t1g.length ? mergeBufferGeometries(t1g) : null,
            g2: t2g.length ? mergeBufferGeometries(t2g) : null,
            g3: t3g.length ? mergeBufferGeometries(t3g) : null,
            g4: t4g.length ? mergeBufferGeometries(t4g) : null,
            g5: t5g.length ? mergeBufferGeometries(t5g) : null,
            g6: t6g.length ? mergeBufferGeometries(t6g) : null,
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
            {g5 && <mesh geometry={g5} material={new THREE.MeshBasicMaterial({ map: tex5 })} />}
            {g6 && <mesh geometry={g6} material={new THREE.MeshBasicMaterial({ map: tex6 })} />}
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

// Enemy component moved to src/components/game/Enemy.jsx

// Crear zonas de patrulla para el mapa (32x38)
const patrolZones = createPatrolZones(32, 38, 2);

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

function Player({ position, direction, isInvulnerable, isPowerActive, isPaused }) {
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

    const [frame, setFrame] = useState(0);
    const [lastDirection, setLastDirection] = useState({ x: 1, z: 0 });
    const trailRef = useRef([]);
    const frameCount = 8;
    const animationSpeed = 10;

    useFrame((state) => {
        if (isPaused) return;

        const newFrame = Math.floor(state.clock.getElapsedTime() * animationSpeed) % frameCount;
        setFrame(newFrame);

        if (direction.x !== 0 || direction.z !== 0) {
            setLastDirection(direction);
        }

        if (isPowerActive) {
            trailRef.current.unshift({ x: position.x, z: position.z });
            if (trailRef.current.length > 5) trailRef.current.pop();
        } else {
            trailRef.current = [];
        }
    });

    const getCurrentTexture = () => {
        if (lastDirection.z < 0) return spritesheet1; // Up
        if (lastDirection.x < 0) return spritesheet1; // Left
        if (lastDirection.x > 0) return spritesheet2; // Right
        if (lastDirection.z > 0) return spritesheet2; // Down
        return spritesheet2; // Default
    };

    const getFlipX = () => {
        if (lastDirection.x < 0) return -1; // Flip for Left
        if (lastDirection.z > 0) return -1; // Flip for Down
        return 1;
    };

    const texture = getCurrentTexture().clone();
    texture.repeat.set(1 / frameCount, 1);
    texture.offset.x = frame / frameCount;

    return (
        <group>
            {isPowerActive && trailRef.current.map((pos, i) => (
                <mesh key={i} position={[pos.x, 0.5, pos.z]} rotation={[-Math.PI / 4, 0, 0]}>
                    <planeGeometry args={[0.8, 0.8]} />
                    <meshBasicMaterial color={i % 2 === 0 ? "gold" : "cyan"} transparent opacity={0.5 - i * 0.1} />
                </mesh>
            ))}
            <group position={[position.x, 0.5, position.z]}>
                {isPowerActive && (
                    <mesh rotation={[-Math.PI / 4, 0, 0]}>
                        <sphereGeometry args={[0.7, 16, 16]} />
                        <meshStandardMaterial color="#00FFFF" transparent opacity={0.3} emissive="#00FFFF" emissiveIntensity={1.5} />
                    </mesh>
                )}
                <mesh rotation={[-Math.PI / 4, 0, 0]} scale={[getFlipX(), 1, 1]}>
                    <planeGeometry args={[1.1, 1.1]} />
                    <meshStandardMaterial
                        map={texture}
                        transparent
                        side={THREE.DoubleSide}
                        opacity={isInvulnerable ? 0.5 : 1}
                        emissive={isPowerActive ? "#FF00FF" : "black"}
                        emissiveIntensity={isPowerActive ? 1 : 0}
                        alphaTest={0.5}
                        depthWrite={true}
                    />
                </mesh>
            </group>
        </group>
    );
}

function Floor() {
    const tex = useLoader(THREE.TextureLoader, '/assets/suelos/floor_texture.jpg');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 9.5);
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[16, -0.1, 19]}>
            <planeGeometry args={[32, 38]} />
            <meshBasicMaterial map={tex} />
        </mesh>
    );
}

export default function Level8({ onBack, onNextLevel, onLevelComplete }) {
    const [playerPos, setPlayerPos] = useState(INITIAL_PLAYER_POS);
    const [direction, setDirection] = useState({ x: 0, z: 0 });
    const [collectibles, setCollectibles] = useState(initialCollectibles);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [tokens, setTokens] = useState(0);
    const [isInvulnerable, setIsInvulnerable] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [finalScoreStats, setFinalScoreStats] = useState({ score: 0, bonus: 0, total: 0 });
    const isInvulnerableRef = useRef(false); // Immediate invulnerability check

    // UI State
    const [isPaused, setIsPaused] = useState(true);
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
    const [powerTimeLeft, setPowerTimeLeft] = useState(0);

    const [barrels, setBarrels] = useState([
        { id: 1, x: 8, z: 6, collected: false },
        { id: 2, x: 24, z: 6, collected: false },
        { id: 3, x: 16, z: 19, collected: false },
        { id: 4, x: 8, z: 32, collected: false },
        { id: 5, x: 24, z: 32, collected: false },
        { id: 6, x: 2, z: 2, collected: false },
        { id: 7, x: 30, z: 36, collected: false },
        { id: 8, x: 30, z: 2, collected: false },
    ]);

    const [enemies, setEnemies] = useState([]);
    const enemyIdRef = useRef(1);
    const collectedBarrelsRef = useRef(new Set());
    const collectedBonusesRef = useRef(new Set());

    // Special Bonuses
    const [specialBonuses, setSpecialBonuses] = useState([]);
    const [bonusFlags, setBonusFlags] = useState({ p30: false, p70: false });

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

    // Handle page visibility - pause music when page is hidden (browser closed, tab switched, etc.)
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

    // Sync ref with state for invulnerability
    useEffect(() => {
        isInvulnerableRef.current = isInvulnerable;
    }, [isInvulnerable]);

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
            // Level 8 is the final level, no need to unlock next level
        }
    }, [beersCollected, showVictoryModal, score, startTime, initialCollectibles.length]);

    const handleEnemyPositionUpdate = (enemyId, x, z) => {
        setEnemies(prevEnemies =>
            prevEnemies.map(enemy =>
                enemy.id === enemyId ? { ...enemy, x, z } : enemy
            )
        );
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

    // Global pointer release handler to fix stuck D-pad
    useEffect(() => {
        const handleGlobalPointerUp = () => {
            setDirection({ x: 0, z: 0 });
        };

        window.addEventListener('pointerup', handleGlobalPointerUp);
        window.addEventListener('pointercancel', handleGlobalPointerUp);
        window.addEventListener('touchend', handleGlobalPointerUp);
        window.addEventListener('touchcancel', handleGlobalPointerUp);

        return () => {
            window.removeEventListener('pointerup', handleGlobalPointerUp);
            window.removeEventListener('pointercancel', handleGlobalPointerUp);
            window.removeEventListener('touchend', handleGlobalPointerUp);
            window.removeEventListener('touchcancel', handleGlobalPointerUp);
        };
    }, []);

    // Player Movement and Item Collection
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused) return;

            // Player Movement
            if (direction.x !== 0 || direction.z !== 0) {
                const baseSpeed = 0.22;
                const speed = powerActive ? baseSpeed * 1.5 : baseSpeed;
                const newX = playerPos.x + direction.x * speed;
                const newZ = playerPos.z + direction.z * speed;
                if (!checkCollision(newX, newZ, walls)) {
                    setPlayerPos({ x: newX, z: newZ });

                    setCollectibles(prev => {
                        let changed = false;
                        const next = prev.map(c => {
                            if (!c.collected && Math.sqrt((newX - c.x) ** 2 + (newZ - c.z) ** 2) < 0.6) {
                                setScore(s => s + 10);
                                playCollectSound();
                                changed = true;
                                return { ...c, collected: true };
                            }
                            return c;
                        });
                        return changed ? next : prev;
                    });

                    setBarrels(prev => {
                        let tokensToAdd = 0;
                        let pointsToAdd = 0;
                        let hasChanges = false;

                        const next = prev.map(b => {
                            // Si ya está en la ref, asegurarse de que esté marcado como collected
                            if (collectedBarrelsRef.current.has(b.id) && !b.collected) {
                                hasChanges = true;
                                return { ...b, collected: true };
                            }
                            // Si está cerca y no ha sido recogido
                            if (!b.collected && !collectedBarrelsRef.current.has(b.id) && Math.sqrt((newX - b.x) ** 2 + (newZ - b.z) ** 2) < 0.8) {
                                collectedBarrelsRef.current.add(b.id);
                                tokensToAdd++;
                                pointsToAdd += 50;
                                hasChanges = true;
                                return { ...b, collected: true };
                            }
                            return b;
                        });

                        if (tokensToAdd > 0) {
                            setTokens(t => Math.min(3, t + tokensToAdd));
                            setScore(s => s + pointsToAdd);
                            playCollectSound();
                        }

                        return hasChanges ? next : prev;
                    });

                    // Check Special Bonuses
                    setSpecialBonuses(prev => {
                        let bonusScoreToAdd = 0;
                        let hasChanges = false;

                        const next = prev.map(b => {
                            if (!b.collected && !collectedBonusesRef.current.has(b.id) && Math.sqrt((newX - b.x) ** 2 + (newZ - b.z) ** 2) < 0.8) {
                                collectedBonusesRef.current.add(b.id);
                                bonusScoreToAdd += 500;
                                hasChanges = true;
                                return { ...b, collected: true };
                            }
                            return b;
                        });

                        if (bonusScoreToAdd > 0) {
                            setScore(s => s + bonusScoreToAdd);
                            playCollectSound();
                        }

                        return hasChanges ? next : prev;
                    });
                }
            }
        }, 16);
        return () => clearInterval(interval);
    }, [direction, playerPos, isPaused, powerActive]);

    // Enemy collision detection with player
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused) return;

            setEnemies(prev => prev.map(e => {
                const dist = Math.sqrt((playerPos.x - e.x) ** 2 + (playerPos.z - e.z) ** 2);

                // Si el jugador toca al enemigo con poder activo
                if (dist < 0.6 && powerActive && !e.isReturning) {
                    setScore(s => s + 150);
                    return { ...e, isReturning: true };
                }

                // Si el enemigo toca al jugador sin poder
                if (dist < 0.6 && !isInvulnerableRef.current && !e.isReturning && !powerActive) {
                    isInvulnerableRef.current = true;
                    setLives(l => {
                        const newLives = l - 1;
                        if (newLives <= 0) {
                            setIsPaused(true);
                            // Calculate score stats for Game Over
                            const elapsedSeconds = (Date.now() - startTime) / 1000;
                            const timeBonus = Math.max(0, Math.floor((180 - elapsedSeconds) * 10)); // 3 mins max time

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

                // Check if enemy reached doghouse while returning
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
    }, [playerPos, powerActive, isPaused]);

    // Role-based Spawning
    useEffect(() => {
        if (showIntroVideo) return;

        // Enemigo PURSUER que siempre persigue al jugador
        const timerPursuer = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: AIRoles.PURSUER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            showEnemyAlert("¡Apareció un perseguidor!");
            enemyIdRef.current++;
        }, 1000);

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
        }, 4000);

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
        }, 7000);

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
        }, 10000);

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
        }, 13000);

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
        }, 16000);

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
        }, 19000);

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
        }, 22000);

        const timer8 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: AIRoles.AMBUSHER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            enemyIdRef.current++;
        }, 25000);

        return () => {
            clearTimeout(timerPursuer);
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
            clearTimeout(timer5);
            clearTimeout(timer6);
            clearTimeout(timer7);
            clearTimeout(timer8);
        };
    }, [showIntroVideo]);

    const restartLevel = () => {
        setPlayerPos(INITIAL_PLAYER_POS);
        setDirection({ x: 0, z: 0 });
        setCollectibles(initialCollectibles.map(c => ({ ...c, collected: false })));
        setScore(0);
        setLives(3);
        setTokens(0);
        setIsInvulnerable(false);
        isInvulnerableRef.current = false;
        setPowerActive(false);
        setPowerTimeLeft(0);
        setEnemies([]);
        enemyIdRef.current = 1;
        collectedBarrelsRef.current.clear();
        collectedBonusesRef.current.clear();
        setSpecialBonuses([]);
        setBonusFlags({ p30: false, p70: false });
        setIsPaused(false);
        setShowSettingsModal(false);
        setShowSettingsModal(false);
        setShowGameOverModal(false);
        setShowVictoryModal(false);
        setBarrels([
            { id: 1, x: 8, z: 6, collected: false },
            { id: 2, x: 24, z: 6, collected: false },
            { id: 3, x: 16, z: 19, collected: false },
            { id: 4, x: 8, z: 32, collected: false },
            { id: 5, x: 24, z: 32, collected: false },
            { id: 6, x: 2, z: 2, collected: false },
            { id: 7, x: 30, z: 36, collected: false },
            { id: 8, x: 30, z: 2, collected: false },
        ]);
    };

    // Spawn special bonuses at 30% and 70% collection
    useEffect(() => {
        const totalBeers = collectibles.length;
        const collected = collectibles.filter(c => c.collected).length;
        const percentage = totalBeers > 0 ? collected / totalBeers : 0;

        const findFreePosition = () => {
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * 28 + 2;
                const z = Math.random() * 34 + 2;
                if (!checkCollision(x, z, walls)) {
                    return { x, z };
                }
            }
            return { x: 16, z: 19 };
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


            <Canvas camera={{ position: [16, 18, 26], fov: CAMERA_CONFIG.fov }} shadows>
                <ambientLight intensity={1.5} />
                <directionalLight position={[16, 24, 19]} intensity={1} />

                <Maze walls={walls} />
                <Floor />
                <Doghouse position={DOGHOUSE_POS} />

                <InstancedCollectibles collectibles={collectibles} />

                {barrels.map(b => !b.collected && <Barrel key={b.id} position={b} />)}

                {specialBonuses.filter(b => !b.collected).map(b => (
                    <SpecialBonus key={b.id} position={{ x: b.x, z: b.z }} />
                ))}

                <Player position={playerPos} direction={direction} isInvulnerable={isInvulnerable} isPowerActive={powerActive} isPaused={isPaused} />

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
                        isPowerActive={powerActive}
                        isPaused={isPaused}
                        rotation={PLAYER_ROTATION}
                        role={enemy.role}
                        assignedZone={enemy.zone}
                        doghousePos={DOGHOUSE_POS}
                        isReturning={enemy.isReturning || false}
                        spritesheet1Path="/assets/personajes/enemy_type_1.png"
                        spritesheet2Path="/assets/personajes/enemy_type_2.png"
                        debugMode={false}
                    />
                ))}

                <CameraController targetX={playerPos.x} targetZ={playerPos.z} />
            </Canvas>

            <div className="ui-overlay">
                <LevelHeader
                    lives={lives}
                    levelNumber={8}
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
                            onPointerEnter={(e) => (e.buttons > 0 || e.pressure > 0) && setDirection({ x: 0, z: -1 })}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <ArrowUp size={24} />
                        </button>
                    </div>
                    <div className="d-pad-row middle">
                        <button
                            className="d-pad-button left"
                            onPointerDown={() => setDirection({ x: -1, z: 0 })}
                            onPointerEnter={(e) => (e.buttons > 0 || e.pressure > 0) && setDirection({ x: -1, z: 0 })}
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
                            className="d-pad-button right"
                            onPointerDown={() => setDirection({ x: 1, z: 0 })}
                            onPointerEnter={(e) => (e.buttons > 0 || e.pressure > 0) && setDirection({ x: 1, z: 0 })}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <ArrowRight size={24} />
                        </button>
                    </div>
                    <div className="d-pad-row">
                        <button
                            className="d-pad-button down"
                            onPointerDown={() => setDirection({ x: 0, z: 1 })}
                            onPointerEnter={(e) => (e.buttons > 0 || e.pressure > 0) && setDirection({ x: 0, z: 1 })}
                            onContextMenu={(e) => e.preventDefault()}
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
                    <div className="settings-modal victory-modal">
                        <div className="settings-content glass-panel victory-content">
                            <h2>🎉 ¡JUEGO COMPLETADO! 🎉</h2>
                            <p className="score-text">¡Has completado todos los niveles!</p>
                            <p className="score-text" style={{ fontWeight: 'bold', color: '#FFD700' }}>Puntuación final: {score}</p>
                            <p className="unlock-text">¡Gracias por jugar Beer Run!</p>
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
                                <p>Cervezas recogidas: {initialCollectibles.length - collectibles.filter(c => !c.collected).length}</p>
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
                            src="/assets/videos/nivel 7.mp4"
                            autoPlay
                            playsInline

                            onLoadStart={() => setIsVideoLoading(true)}
                            onWaiting={() => setIsVideoLoading(true)}
                            onCanPlay={() => setIsVideoLoading(false)}
                            onPlaying={() => setIsVideoLoading(false)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isVideoLoading ? 0.5 : 1 }}
                            onEnded={() => { setShowIntroVideo(false); setIsPaused(false); }}
                            onClick={() => { setShowIntroVideo(false); setIsPaused(false); }}
                            onError={() => { setShowIntroVideo(false); setIsPaused(false); }}
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
                            onClick={() => { setShowIntroVideo(false); setIsPaused(false); }}
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
                    <div className="enemy-alert" style={{ background: 'rgba(255, 0, 255, 0.7)', borderColor: '#ff44ff', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}>
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


