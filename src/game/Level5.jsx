import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { useDrag } from '@use-gesture/react';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import LevelHeader from '../components/LevelHeader';
import './Level5.css';

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

// --- Walls Definition (From Level5.js) ---
const walls = [
    // Background
    { x: -2, z: -10, length: 60, height: 10, thickness: 1, orientation: 'vertical' },
    { x: -10, z: -2, length: 60, height: 10, thickness: 1, orientation: 'horizontal' },

    // External Borders (30x34)
    { x: 0, z: 0, length: 30, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 0, z: 34, length: 30, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 0, z: 0, length: 34, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 30, z: 0, length: 34, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Avenue 1 (Horizontal) - Con aberturas
    { x: 2, z: 15, length: 9, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 17, z: 15, length: 11, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 2, z: 19, length: 9, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 17, z: 19, length: 11, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    // Avenue 2 (Vertical) - Con aberturas
    { x: 12, z: 2, length: 12, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 12, z: 20, length: 12, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 16, z: 2, length: 12, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 16, z: 20, length: 12, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Top Left Quadrant
    { x: 2, z: 2, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 4, z: 2, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 4, z: 4, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 6, z: 4, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 6, z: 6, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 8, z: 3, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    // Alley 1
    { x: 2, z: 7, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 2, z: 7, length: 5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 2, z: 12, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 5, z: 9, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    // More turns
    { x: 7, z: 8, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 9, z: 8, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 9, z: 10, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 7, z: 10, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 7, z: 12, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    // Alley 2
    { x: 9, z: 3, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 9, z: 3, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 9, z: 6, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 10, z: 4, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Top Right Quadrant
    { x: 18, z: 2, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 20, z: 2, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 20, z: 4, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 22, z: 4, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 22, z: 6, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 24, z: 3, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    // Alley 3
    { x: 18, z: 7, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 18, z: 7, length: 5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 18, z: 12, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 21, z: 9, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    // More turns
    { x: 24, z: 8, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 26, z: 8, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 26, z: 10, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 24, z: 10, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 24, z: 12, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    // Alley 4
    { x: 26, z: 3, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 28, z: 3, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 26, z: 6, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 27, z: 4, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Bottom Left Quadrant
    { x: 2, z: 22, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 4, z: 22, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 4, z: 24, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 6, z: 24, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 6, z: 26, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 8, z: 23, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    // Alley 5
    { x: 2, z: 27, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 2, z: 27, length: 5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 2, z: 32, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 5, z: 29, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    // More turns
    { x: 7, z: 28, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 9, z: 28, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 9, z: 30, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 7, z: 30, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 7, z: 32, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    // Alley 6
    { x: 9, z: 21, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 9, z: 21, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 9, z: 24, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 10, z: 22, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Bottom Right Quadrant
    { x: 18, z: 22, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 20, z: 22, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 20, z: 24, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 22, z: 24, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 22, z: 26, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 24, z: 23, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    // Alley 7
    { x: 18, z: 27, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 18, z: 27, length: 5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 18, z: 32, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 21, z: 29, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    // More turns
    { x: 24, z: 28, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 26, z: 28, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 26, z: 30, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 24, z: 30, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 24, z: 32, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    // Alley 8
    { x: 26, z: 21, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 28, z: 21, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 26, z: 24, length: 2, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 27, z: 22, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Technical Details
    { x: 3, z: 5, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 5, z: 7, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 8, z: 6, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 10, z: 11, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 19, z: 5, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 23, z: 7, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 25, z: 6, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 27, z: 11, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 3, z: 25, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 5, z: 28, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 8, z: 26, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 10, z: 31, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 19, z: 25, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 23, z: 28, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 25, z: 26, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 27, z: 31, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Precision Obstacles
    { x: 10, z: 13, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 10, z: 21, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 18, z: 13, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 18, z: 21, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    { x: 9, z: 17, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 19, z: 17, length: 1.5, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Narrow Connectors
    { x: 4, z: 9, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 6, z: 11, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 8, z: 9, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    { x: 20, z: 9, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 22, z: 11, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 25, z: 9, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    { x: 4, z: 29, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 6, z: 31, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 8, z: 29, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    { x: 20, z: 29, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 22, z: 31, length: 1, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 25, z: 29, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
];

const doghousePos = { x: 6, z: 8 };

// --- Physics (Optimization) ---
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

// Simple collision for now (optimized grid not strictly necessary for this scale on web, but good practice)
// Using brute force for robustness in React state, or simple bounds check.
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
        const x = Math.random() * 28 + 1;
        const z = Math.random() * 32 + 1;
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

const initialCollectibles = generateCollectibles(145);

// Precargar texturas de enemigos ANTES de que se monte cualquier componente
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
                // 3 parts: bottom neon (10%), middle marble (80%), top neon (10%)
                const h = wall.height;
                const h1 = h * 0.1;
                const h2 = h * 0.8;
                const h3 = h * 0.1;

                const g1 = new THREE.BoxGeometry(width, h1, depth);
                g1.translate(centerX, h1 / 2, centerZ);
                // Adjust UVs?

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
            {/* Simplified rotation, billboard effect in native was complex */}
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

function Enemy({ position, playerPos, walls, isPowerActive, isPaused, enemyId, onPositionUpdate, role = 'normal' }) {
    const meshRef = useRef();
    const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_7.png');
    const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_8.png');

    const [currentFrame, setCurrentFrame] = useState(0);
    const [animationTime, setAnimationTime] = useState(0);
    const [direction, setDirection] = useState({ x: 1, z: 0 });
    const [mode, setMode] = useState('scatter');
    const [modeTimer, setModeTimer] = useState(0);
    const [lastIntersectionPos, setLastIntersectionPos] = useState({ x: -999, z: -999 });

    const frameCount = 8;
    const animationSpeed = 10;

    useMemo(() => {
        spritesheet1.magFilter = THREE.NearestFilter;
        spritesheet1.minFilter = THREE.NearestFilter;
        spritesheet2.magFilter = THREE.NearestFilter;
        spritesheet2.minFilter = THREE.NearestFilter;
    }, [spritesheet1, spritesheet2]);

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
            if (!checkCollision(testX, testZ, walls)) {
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
            return !checkCollision(testX, testZ, walls);
        });
    };

    useFrame((state, delta) => {
        if (isPaused) return;

        const distance = Math.sqrt(
            Math.pow(playerPos.x - position.x, 2) +
            Math.pow(playerPos.z - position.z, 2)
        );

        // Si está cerca y el poder está activo, aturdir (no mover)
        if (distance < 5 && isPowerActive) {
            // Mantener animación pero no mover
            setAnimationTime(prev => {
                const newTime = prev + delta * animationSpeed;
                const newFrame = Math.floor(newTime) % frameCount;
                setCurrentFrame(newFrame);
                return newTime;
            });
            return;
        }

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

        const canMove = !checkCollision(nextX, nextZ, walls);
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
            rotation={[-Math.PI / 4, PLAYER_ROTATION, 0]}
            scale={[getFlipX(), 1, 1]}
        >
            <planeGeometry args={[1.3, 1.3]} />
            <meshStandardMaterial
                map={texture}
                transparent
                side={THREE.DoubleSide}
                color={isPowerActive ? '#6666ff' : 'white'}
                alphaTest={0.5}
                depthWrite={true}
            />
        </mesh>
    );
}

function Player({ position, direction, isPowerActive, isInvulnerable, isPaused }) {
    const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/player.png');
    const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/player_secondary.png');
    const [frame, setFrame] = useState(0);

    useMemo(() => {
        spritesheet1.magFilter = THREE.NearestFilter;
        spritesheet1.minFilter = THREE.NearestFilter;
        spritesheet2.magFilter = THREE.NearestFilter;
        spritesheet2.minFilter = THREE.NearestFilter;
    }, [spritesheet1, spritesheet2]);

    useFrame((state) => {
        if (isPaused) return;
        setFrame(Math.floor(state.clock.getElapsedTime() * 10) % 8);
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

    const tex = getCurrentTexture();
    tex.repeat.set(1 / 8, 1);
    tex.offset.x = frame / 8;

    return (
        <group position={[position.x, 0.5, position.z]}>
            {isPowerActive && (
                <mesh rotation={[-Math.PI / 4, 0, 0]} renderOrder={9}>
                    <sphereGeometry args={[0.7, 16, 16]} />
                    <meshStandardMaterial color="#00FFFF" transparent opacity={0.3} emissive="#00FFFF" emissiveIntensity={1.5} depthWrite={false} />
                </mesh>
            )}
            <mesh rotation={[-Math.PI / 4, PLAYER_ROTATION, 0]} scale={[getFlipX(), 1, 1]} renderOrder={10}>
                <planeGeometry args={[1.1, 1.1]} />
                <meshStandardMaterial map={tex} transparent side={THREE.DoubleSide} opacity={isInvulnerable ? 0.5 : 1} alphaTest={0.5} depthWrite={false} />
            </mesh>
        </group>
    );
}

function Floor() {
    const tex = useLoader(THREE.TextureLoader, '/assets/suelos/floor_level5_texture.png');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(37.5, 37.5);
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, -0.1, 17]}>
            <planeGeometry args={[150, 150]} />
            <meshBasicMaterial map={tex} />
        </mesh>
    );
}

// Component to ensure enemy textures are loaded
function EnemyTextureLoader({ children }) {
    const [texturesLoaded, setTexturesLoaded] = useState(false);

    useEffect(() => {
        const loader = new THREE.TextureLoader();
        let loadedCount = 0;
        const totalTextures = 2;

        const checkLoaded = () => {
            loadedCount++;
            if (loadedCount === totalTextures) {
                setTexturesLoaded(true);
            }
        };

        loader.load('/assets/personajes/enemy_type_7.png', checkLoaded);
        loader.load('/assets/personajes/enemy_type_8.png', checkLoaded);
    }, []);

    if (!texturesLoaded) return null;
    return children;
}

// --- Main Level Component ---

export default function Level5({ onBack, onNextLevel, onLevelComplete }) {
    const [playerPos, setPlayerPos] = useState(INITIAL_PLAYER_POS);
    const [direction, setDirection] = useState({ x: 0, z: 0 });
    const [collectibles, setCollectibles] = useState(initialCollectibles);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [tokens, setTokens] = useState(0);
    const [powerActive, setPowerActive] = useState(false);
    const [powerTimeLeft, setPowerTimeLeft] = useState(0);
    const [isInvulnerable, setIsInvulnerable] = useState(false);

    // UI State
    const [isPaused, setIsPaused] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [showWinModal, setShowWinModal] = useState(false);
    const [showIntroVideo, setShowIntroVideo] = useState(true);
    const beersCollected = useMemo(() => collectibles.filter(c => c.collected).length, [collectibles]);
    const prevBeersCollectedRef = useRef(0);
    const invulnerabilityTimerRef = useRef(null);

    // Audio State
    const [isMuted, setIsMuted] = useState(false);
    const musicRef = useRef(null);

    // Initial Barrels
    const [barrels, setBarrels] = useState([
        { id: 1, x: 3.5, z: 9, collected: false },
        { id: 2, x: 27.5, z: 4.5, collected: false },
        { id: 3, x: 19.5, z: 29.5, collected: false },
    ]);

    const [enemies, setEnemies] = useState([]);
    const enemyIdRef = useRef(1);
    const collectedBarrelsRef = useRef(new Set());

    // --- Audio Logic ---
    useEffect(() => {
        if (showIntroVideo) return;

        musicRef.current = new Audio('/assets/audio/La Sifrina – “Gluten Free Queen”.wav'); // Verify correct track
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

    useEffect(() => {
        if (!musicRef.current) return;
        if (isMuted) {
            musicRef.current.pause();
        } else {
            musicRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
    }, [isMuted]);

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
    };

    // Sync score and sound with collected beers
    useEffect(() => {
        if (beersCollected > prevBeersCollectedRef.current) {
            const diff = beersCollected - prevBeersCollectedRef.current;
            setScore(s => s + diff * 10);
            playCollectSound();
        }
        prevBeersCollectedRef.current = beersCollected;
    }, [beersCollected]);

    const restartLevel = () => {
        setPlayerPos(INITIAL_PLAYER_POS);
        setDirection({ x: 0, z: 0 });
        setCollectibles(initialCollectibles.map(c => ({ ...c, collected: false })));
        setScore(0);
        setLives(3);
        setTokens(0);
        collectedBarrelsRef.current.clear();
        setBarrels([
            { id: 1, x: 3.5, z: 9, collected: false },
            { id: 2, x: 27.5, z: 4.5, collected: false },
            { id: 3, x: 19.5, z: 29.5, collected: false },
        ]);
        setEnemies([]);
        enemyIdRef.current = 1;
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
    };

    const activatePower = () => {
        if (tokens > 0 && !powerActive) {
            setTokens(prev => prev - 1);
            setPowerActive(true);
            setPowerTimeLeft(6);
        }
    };

    const handleSwipe = (newDir) => {
        if (!isPaused) setDirection(newDir);
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
        if (score >= 150 && !showWinModal) {
            setIsPaused(true);
            setShowWinModal(true);
            if (onLevelComplete) {
                onLevelComplete(4); // Nivel 4 completed (Level5.jsx), unlock Nivel 5
            }
        }
    }, [score, showWinModal, onLevelComplete]);

    // Keyboard controls
    useEffect(() => {
        const k = (e) => {
            if (isPaused) return;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') setDirection({ x: 0, z: -1 });
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') setDirection({ x: 0, z: 1 });
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setDirection({ x: -1, z: 0 });
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setDirection({ x: 1, z: 0 });
            if (e.key === ' ') {
                e.preventDefault();
                activatePower();
            }
        };
        const ku = (e) => {
            if (isPaused) return;
            // In original code, keyup stopped movement if key matched direction.
            // We'll keep it simple to match other levels or existing logic?
            // Existing logic:
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
        window.addEventListener('keydown', k);
        window.addEventListener('keyup', ku);
        return () => { window.removeEventListener('keydown', k); window.removeEventListener('keyup', ku); };
    }, [direction, isPaused, tokens, powerActive]);

    // Game Loop interval for non-visual logic
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused) return;
            if (direction.x !== 0 || direction.z !== 0) {
                // Move logic
                const speed = 0.2; // approx per tick
                const newX = playerPos.x + direction.x * speed;
                const newZ = playerPos.z + direction.z * speed;
                if (!checkCollision(newX, newZ, walls)) {
                    setPlayerPos({ x: newX, z: newZ });

                    // Collectibles
                    setCollectibles(prev => {
                        let changed = false;
                        const next = prev.map(c => {
                            if (!c.collected && Math.sqrt((newX - c.x) ** 2 + (newZ - c.z) ** 2) < 0.6) {
                                changed = true;
                                return { ...c, collected: true };
                            }
                            return c;
                        });
                        return changed ? next : prev;
                    });

                    // Barrels
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
                                pointsToAdd += 25;
                                hasChanges = true;
                                return { ...b, collected: true };
                            }
                            return b;
                        });

                        if (tokensToAdd > 0) {
                            setTokens(t => t + tokensToAdd);
                            setScore(s => s + pointsToAdd);
                            playBarrelSound();
                        }

                        return hasChanges ? next : prev;
                    });
                }
            }
        }, 16); // 60fps logic
        return () => clearInterval(interval);
    }, [direction, playerPos, isPaused]);

    // Enemy Spawning with roles
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

    // Enemy collision detection with player
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused || isInvulnerable) return;

            const hitByEnemy = enemies.some(enemy => {
                const distance = Math.sqrt(
                    Math.pow(playerPos.x - enemy.x, 2) + Math.pow(playerPos.z - enemy.z, 2)
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
            }
        }, 50);

        return () => clearInterval(interval);
    }, [enemies, playerPos, isInvulnerable, isPaused, lives]);


    return (
        <div className="game-container">
            <GestureLayer onSwipe={handleSwipe} />

            <Canvas camera={{ position: [14, 18, 26], fov: CAMERA_CONFIG.fov }} shadows>
                <ambientLight intensity={1.5} />
                <directionalLight position={[15, 22, 17]} intensity={1} />

                <Suspense fallback={null}>
                    <Maze walls={walls} />
                    <Floor />
                    <Doghouse position={doghousePos} />

                    <InstancedCollectibles collectibles={collectibles} />

                    {barrels.map(b => !b.collected && <Barrel key={b.id} position={b} />)}

                    <Player position={playerPos} direction={direction} isPowerActive={powerActive} isInvulnerable={isInvulnerable} isPaused={isPaused} />

                    <EnemyTextureLoader>
                        {enemies.map(enemy => (
                            <Enemy
                                key={enemy.id}
                                enemyId={enemy.id}
                                role={enemy.role || 'normal'}
                                position={{ x: enemy.x, z: enemy.z }}
                                playerPos={playerPos}
                                walls={walls}
                                onPositionUpdate={(x, z) => handleEnemyPositionUpdate(enemy.id, x, z)}
                                isPowerActive={powerActive}
                                isPaused={isPaused}
                            />
                        ))}
                    </EnemyTextureLoader>

                    <CameraController targetX={playerPos.x} targetZ={playerPos.z} />
                </Suspense>
            </Canvas>

            <div className="ui-overlay">
                <LevelHeader
                    lives={lives}
                    levelNumber={5}
                    beersCollected={beersCollected}
                    totalBeers={initialCollectibles.length}
                    score={score}
                />

                <div className="power-button-container">
                    <button
                        onClick={activatePower}
                        disabled={tokens === 0}
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
                            {score >= 150 && onNextLevel && (
                                <button className="modal-button" onClick={onNextLevel} style={{ backgroundColor: '#4CAF50', marginBottom: '10px' }}>
                                    Avanzar al siguiente nivel
                                </button>
                            )}
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
                    <div className="settings-modal victory-modal">
                        <div className="settings-content glass-panel victory-content">
                            <h2 style={{ fontSize: '2.5em', marginBottom: '20px' }}>🎉 ¡NIVEL COMPLETADO! 🎉</h2>
                            <p style={{ fontSize: '1.2em', marginBottom: '10px' }}>¡Has conseguido {score} puntos!</p>
                            <p style={{ fontSize: '1em', marginBottom: '30px', color: '#4CAF50' }}>¡El siguiente nivel está desbloqueado!</p>
                            {onNextLevel && (
                                <button className="modal-button" onClick={onNextLevel} style={{ backgroundColor: '#4CAF50', marginBottom: '10px' }}>
                                    <Play size={20} /> Siguiente Nivel
                                </button>
                            )}
                            <button className="modal-button cancel-button" onClick={onBack}>
                                <Home size={20} /> Volver al Menú
                            </button>
                        </div>
                    </div>
                )}
            </div>

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
                    <video
                        src="/assets/videos/NIVEL 4 FINAL.mp4"
                        autoPlay
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onEnded={() => setShowIntroVideo(false)}
                        onClick={() => setShowIntroVideo(false)}
                        onError={() => setShowIntroVideo(false)}
                    />
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
                            fontWeight: 'bold'
                        }}
                    >
                        Saltar
                    </button>
                </div>
            )}
        </div>
    );
}

function GestureLayer({ onSwipe }) {
    const bind = useDrag(({ movement: [mx, my], last }) => {
        const threshold = 10;
        if (Math.abs(mx) > threshold || Math.abs(my) > threshold) {
            if (Math.abs(mx) > Math.abs(my)) {
                onSwipe(mx > 0 ? { x: 1, z: 0 } : { x: -1, z: 0 });
            } else {
                onSwipe(my > 0 ? { x: 0, z: 1 } : { x: 0, z: -1 });
            }
        }
    }, { filterTaps: true, threshold: 10 });
    return <div {...bind()} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5, touchAction: 'none' }} />;
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
