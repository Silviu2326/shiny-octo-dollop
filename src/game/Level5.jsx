import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { useDrag } from '@use-gesture/react';
import LevelHeader from '../components/LevelHeader';
import './Level0.css'; // Reusing Level 0 styles for consistency, or we can create Level5.css

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

    // Avenue 1 (Horizontal)
    { x: 2, z: 15, length: 26, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 2, z: 19, length: 26, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    // Avenue 2 (Vertical)
    { x: 12, z: 2, length: 30, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 16, z: 2, length: 30, height: 0.6, thickness: 0.2, orientation: 'vertical' },

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

const doghousePos = { x: 6, z: 17 };

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
            {neonGeo && <mesh geometry={neonGeo} material={new THREE.MeshStandardMaterial({ map: neon, emissive: '#FFD700', emissiveIntensity: 2.5 })} />}
        </group>
    );
}

function Doghouse({ position }) {
    const texture = useLoader(THREE.TextureLoader, '/assets/casetas/doghouse_level5.png');

    return (
        <mesh position={[position.x, 0.6, position.z]} rotation={[0, -Math.PI / 4, 0]}>
            {/* Simplified rotation, billboard effect in native was complex */}
            <planeGeometry args={[1.2, 1.2]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} />
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
        <instancedMesh ref={meshRef} args={[null, null, collectibles.length]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} alphaTest={0.5} />
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

function Enemy({ position, playerPos, walls, isPowerActive, isPaused, enemyId, direction }) {
    const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_7.png');
    const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_8.png');

    const [currentFrame, setCurrentFrame] = useState(0);
    const frameCount = 8;

    useMemo(() => {
        spritesheet1.magFilter = THREE.NearestFilter;
        spritesheet1.minFilter = THREE.NearestFilter;
        spritesheet2.magFilter = THREE.NearestFilter;
        spritesheet2.minFilter = THREE.NearestFilter;
    }, [spritesheet1, spritesheet2]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        setCurrentFrame(Math.floor(t * 10) % frameCount);
    });

    const getCurrentTexture = () => {
        if (!direction) return spritesheet1;
        const dx = direction.x || 0;
        const dz = direction.z || 0;

        if (dx > 0 || dz > 0) {
            return spritesheet1;
        } else {
            return spritesheet2;
        }
    };

    const getFlipX = () => {
        if (!direction) return 1;
        const dz = direction.z || 0;
        const dx = direction.x || 0;

        if (dz > 0) return -1;
        if (dx < 0) return -1;
        return 1;
    };

    const texture = getCurrentTexture();
    texture.repeat.set(1 / frameCount, 1);
    texture.offset.x = currentFrame / frameCount;

    return (
        <mesh position={[position.x, 0.5, position.z]} rotation={[-Math.PI / 4, PLAYER_ROTATION, 0]} scale={[getFlipX(), 1, 1]}>
            <planeGeometry args={[1.3, 1.3]} />
            <meshStandardMaterial
                map={texture}
                transparent
                side={THREE.DoubleSide}
                color={isPowerActive ? '#4444ff' : 'white'}
                emissive={isPowerActive ? '#2222ff' : 'black'}
                emissiveIntensity={isPowerActive ? 0.5 : 0}
                alphaTest={0.5}
            />
        </mesh>
    );
}

function Player({ position, direction, isPowerActive, isInvulnerable }) {
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
                <mesh rotation={[-Math.PI / 4, 0, 0]}>
                    <sphereGeometry args={[0.7, 16, 16]} />
                    <meshStandardMaterial color="#00FFFF" transparent opacity={0.3} emissive="#00FFFF" emissiveIntensity={1.5} />
                </mesh>
            )}
            <mesh rotation={[-Math.PI / 4, PLAYER_ROTATION, 0]} scale={[getFlipX(), 1, 1]}>
                <planeGeometry args={[1.1, 1.1]} />
                <meshStandardMaterial map={tex} transparent side={THREE.DoubleSide} opacity={isInvulnerable ? 0.5 : 1} alphaTest={0.5} />
            </mesh>
        </group>
    );
}

function Floor() {
    const tex = useLoader(THREE.TextureLoader, '/assets/suelos/floor_texture.jpg');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(7.5, 8.5);
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, -0.1, 17]}>
            <planeGeometry args={[30, 34]} />
            <meshBasicMaterial map={tex} />
        </mesh>
    );
}

// --- Main Level Component ---

export default function Level5({ onBack }) {
    const [playerPos, setPlayerPos] = useState(INITIAL_PLAYER_POS);
    const [direction, setDirection] = useState({ x: 0, z: 0 });
    const [collectibles, setCollectibles] = useState(initialCollectibles);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [tokens, setTokens] = useState(0);
    const [powerActive, setPowerActive] = useState(false);
    const [isInvulnerable, setIsInvulnerable] = useState(false);

    // Initial Barrels
    const [barrels, setBarrels] = useState([
        { id: 1, x: 3.5, z: 9, collected: false },
        { id: 2, x: 10, z: 4.5, collected: false },
        { id: 3, x: 19.5, z: 9, collected: false },
        { id: 4, x: 27, z: 4.5, collected: false },
        { id: 5, x: 3.5, z: 29.5, collected: false },
        { id: 6, x: 10, z: 22.5, collected: false },
        { id: 7, x: 19.5, z: 29.5, collected: false },
        { id: 8, x: 27, z: 22.5, collected: false },
    ]);

    const [enemies, setEnemies] = useState([]); // Logic for AI needed

    // Logic Loop (Movement, Collision)


    // Audio...

    // Controls...

    // Since this is a specialized task to "Port Level 5", I will implement the gesture layer and structure.

    const handleSwipe = (newDir) => setDirection(newDir);

    // Keyboard controls
    useEffect(() => {
        const k = (e) => {
            if (e.key === 'ArrowUp' || e.key === 'w') setDirection({ x: 0, z: -1 });
            if (e.key === 'ArrowDown' || e.key === 's') setDirection({ x: 0, z: 1 });
            if (e.key === 'ArrowLeft' || e.key === 'a') setDirection({ x: -1, z: 0 });
            if (e.key === 'ArrowRight' || e.key === 'd') setDirection({ x: 1, z: 0 });
        };
        const ku = () => setDirection({ x: 0, z: 0 });
        window.addEventListener('keydown', k);
        window.addEventListener('keyup', ku);
        return () => { window.removeEventListener('keydown', k); window.removeEventListener('keyup', ku); };
    }, []);

    // Game Loop interval for non-visual logic
    useEffect(() => {
        const interval = setInterval(() => {
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
                                setScore(s => s + 10);
                                changed = true;
                                return { ...c, collected: true };
                            }
                            return c;
                        });
                        return changed ? next : prev;
                    });

                    // Barrels
                    setBarrels(prev => {
                        let changed = false;
                        const next = prev.map(b => {
                            if (!b.collected && Math.sqrt((newX - b.x) ** 2 + (newZ - b.z) ** 2) < 0.8) {
                                setTokens(t => t + 1);
                                setScore(s => s + 25);
                                changed = true;
                                return { ...b, collected: true };
                            }
                            return b;
                        });
                        return changed ? next : prev;
                    });
                }
            }
        }, 16); // 60fps logic
        return () => clearInterval(interval);
    }, [direction, playerPos]);

    // Enemy Spawning
    useEffect(() => {
        // Simplified spawn logic
        const timeouts = [
            setTimeout(() => setEnemies(e => [...e, { id: 1, x: doghousePos.x, z: doghousePos.z, direction: { x: 1, z: 0 } }]), 3000),
            setTimeout(() => setEnemies(e => [...e, { id: 2, x: doghousePos.x, z: doghousePos.z, direction: { x: 1, z: 0 } }]), 7000),
        ];
        return () => timeouts.forEach(clearTimeout);
    }, []);

    // Enemy AI Movement (Basic)
    useEffect(() => {
        const interval = setInterval(() => {
            setEnemies(prev => prev.map(e => {
                // Simple chase or random move
                const dx = playerPos.x - e.x;
                const dz = playerPos.z - e.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < 0.5 && !isInvulnerable && !powerActive) {
                    setLives(l => l - 1);
                    setIsInvulnerable(true);
                    setTimeout(() => setIsInvulnerable(false), 3000);
                }

                if (dist < 5 && powerActive) {
                    // Stunned, don't move or move randomly small amount
                    return e;
                }

                // Move towards player slowly
                const moveSpeed = 0.08;
                const angle = Math.atan2(dz, dx);
                const moveX = Math.cos(angle) * moveSpeed;
                const moveZ = Math.sin(angle) * moveSpeed;
                let ex = e.x + moveX;
                let ez = e.z + moveZ;

                if (!checkCollision(ex, ez, walls)) {
                    // Store normalized direction for sprite animation
                    const dirX = moveX > 0 ? 1 : (moveX < 0 ? -1 : 0);
                    const dirZ = moveZ > 0 ? 1 : (moveZ < 0 ? -1 : 0);
                    return { ...e, x: ex, z: ez, direction: { x: dirX, z: dirZ } };
                }
                return e;
            }));
        }, 50);
        return () => clearInterval(interval);
    }, [playerPos, isInvulnerable, powerActive]);


    return (
        <div className="game-container">
            <GestureLayer onSwipe={handleSwipe} />

            <Canvas camera={{ position: [14, 18, 26], fov: CAMERA_CONFIG.fov }} shadows>
                <ambientLight intensity={1.5} />
                <directionalLight position={[15, 22, 17]} intensity={1} />

                <Maze walls={walls} />
                <Floor />
                <Doghouse position={doghousePos} />

                <InstancedCollectibles collectibles={collectibles} />

                {barrels.map(b => !b.collected && <Barrel key={b.id} position={b} />)}

                <Player position={playerPos} direction={direction} isPowerActive={powerActive} isInvulnerable={isInvulnerable} />

                {enemies.map(e => <Enemy key={e.id} position={e} direction={e.direction || { x: 1, z: 0 }} isPowerActive={powerActive} />)}

                <CameraController targetX={playerPos.x} targetZ={playerPos.z} />
            </Canvas>

            <div className="ui-overlay">
                <LevelHeader
                    lives={lives}
                    levelNumber={5}
                    beersCollected={initialCollectibles.length - collectibles.filter(c => !c.collected).length}
                    score={score}
                />

                <div style={{ position: 'absolute', bottom: 20, right: 20, pointerEvents: 'auto' }}>
                    <button
                        onClick={() => { if (tokens > 0) { setTokens(t => t - 1); setPowerActive(true); setTimeout(() => setPowerActive(false), 6000); } }}
                        style={{ padding: 20, borderRadius: '50%', background: powerActive ? 'cyan' : (tokens > 0 ? 'gold' : 'grey'), border: '4px solid white', fontSize: 24 }}
                    >
                        ⚡ {tokens}
                    </button>
                </div>

                <button className="back-button" onClick={onBack}>Salir</button>
            </div>
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
