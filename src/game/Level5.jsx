import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { useDrag } from '@use-gesture/react';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import LevelHeader from '../components/LevelHeader';
import './Level5.css';
import Enemy from '../components/game/Enemy';
import { AIRoles, createPatrolZones, assignZone } from './ai/EnemyAI';

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

    // Obstaculos adicionales eliminados para simplificar el laberinto

];

const doghousePos = { x: 6, z: 8 };

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
        const x = Math.random() * 28 + 1;
        const z = Math.random() * 32 + 1;
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

const initialCollectibles = generateCollectibles(80);

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

// Enemy component is imported

function Player({ position, direction, onPositionUpdate, isPowerActive, isInvulnerable, isPaused }) {
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
                        rotation={[-Math.PI / 4, PLAYER_ROTATION, 0]}
                        scale={[getFlipX(), 1, 1]}
                        renderOrder={9 - index}
                    >
                        <planeGeometry args={[1.1, 1.1]} />
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
            <mesh position={[position.x, 0.5, position.z]} rotation={[-Math.PI / 4, PLAYER_ROTATION, 0]} scale={[getFlipX(), 1, 1]} renderOrder={10}>
                <planeGeometry args={[1.1, 1.1]} />
                <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} opacity={pulseOpacity} alphaTest={0.5} depthWrite={false} emissive={isPowerActive ? "#FFD700" : "#000000"} emissiveIntensity={isPowerActive ? 0.8 : 0} />
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

// Crear zonas de patrulla para el mapa (30x34)
const patrolZones = createPatrolZones(30, 34, 2);

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
    const [startTime, setStartTime] = useState(Date.now());
    const [finalScoreStats, setFinalScoreStats] = useState({ score: 0, bonus: 0, total: 0 });

    // UI State
    const [isPaused, setIsPaused] = useState(true);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [showWinModal, setShowWinModal] = useState(false);
    const [showIntroVideo, setShowIntroVideo] = useState(true);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);
    const videoRef = useRef(null);
    const beersCollected = useMemo(() => collectibles.filter(c => c.collected).length, [collectibles]);

    const [barrels, setBarrels] = useState([
        { id: 1, x: 3.5, z: 9, collected: false },
        { id: 2, x: 27.5, z: 4.5, collected: false },
        { id: 3, x: 19.5, z: 29.5, collected: false },
    ]);
    const invulnerabilityTimerRef = useRef(null);

    // Audio State
    const [isMuted, setIsMuted] = useState(false);
    const musicRef = useRef(null);


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

    // Restart start time when tutorial closes
    useEffect(() => {
        if (!showIntroVideo) {
            setStartTime(Date.now());
        }
    }, [showIntroVideo]);

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

        // 3. Check Enemies (Player runs into Enemy)
        if (!isInvulnerable) {
            enemiesRef.current.forEach(enemy => {
                if (enemy.isReturning) return;
                const dist = Math.sqrt((newX - enemy.x) ** 2 + (newZ - enemy.z) ** 2);
                if (dist < 0.5) { // Adjusted distance to 0.5 (was 0.4 and 0.6 separately)
                    handlePlayerEnemyCollision(enemy, newX, newZ);
                }
            });
        }
    };

    const handlePlayerEnemyCollision = (enemy, playerX, playerZ) => {
        const now = Date.now();
        if (now - lastHitTimeRef.current < 500) return; // Debounce

        // Shield active logic
        if (powerActive) {
            setScore(s => s + 200);
            setEnemies(prev => prev.map(e =>
                e.id === enemy.id ? { ...e, isReturning: true } : e
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

                // Calculate score stats for Game Over
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
                const x = Math.random() * 28 + 2;
                const z = Math.random() * 34 + 2;
                if (!checkCollision(x, z, walls)) {
                    return { x, z };
                }
            }
            return { x: 15, z: 18 };
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
            showPowerAlert("¡INVENCIBILIDAD! ¡APROVECHA!");
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
                onLevelComplete(4); // Nivel 4 completed (Level5.jsx), unlock Nivel 5
            }
        }
    }, [beersCollected, showWinModal, onLevelComplete, score, startTime, initialCollectibles.length]);

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
            // Optional: Stop moving on key up 
            // But existing D-Pad logic sets it to 0,0 anyway.
            // We'll mimic Level 6 behavior or just reset if no key pressed?
            // Level 5 original behavior seemed to be just setDirection. Use standard stop.
            setDirection({ x: 0, z: 0 });
        };
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

    // Enemy Returning Logic (Moved from old game loop)
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused) return;

            setEnemies(prev => prev.map(enemy => {
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


    // Enemy Spawning with roles (6 enemigos total para Level 5)
    useEffect(() => {
        if (showIntroVideo) return;

        // Enemigo PURSUER que siempre persigue al jugador
        const timerPursuer = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: doghousePos.x,
                    z: doghousePos.z,
                    role: AIRoles.PURSUER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            showEnemyAlert("¡Apareció un perseguidor!");
            enemyIdRef.current++;
        }, 3000);

        const timer1 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: doghousePos.x,
                    z: doghousePos.z,
                    role: AIRoles.STRAIGHT,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            showEnemyAlert("¡Apareció un enemigo!");
            enemyIdRef.current++;
        }, 7000);

        const timer2 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: doghousePos.x,
                    z: doghousePos.z,
                    role: AIRoles.TURNER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            showEnemyAlert("¡Cuidado, otro enemigo!");
            enemyIdRef.current++;
        }, 12000);

        const timer3 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: doghousePos.x,
                    z: doghousePos.z,
                    role: AIRoles.FREQUENT,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            showEnemyAlert("¡Más peligro!");
            enemyIdRef.current++;
        }, 17000);

        const timer4 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: doghousePos.x,
                    z: doghousePos.z,
                    role: AIRoles.CHASER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            enemyIdRef.current++;
        }, 22000);

        const timer5 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current,
                    x: doghousePos.x,
                    z: doghousePos.z,
                    role: AIRoles.CUTTER,
                    zone: assignZone(enemyIdRef.current, patrolZones),
                    isReturning: false
                }
            ]);
            enemyIdRef.current++;
        }, 27000);

        return () => {
            clearTimeout(timerPursuer);
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
            clearTimeout(timer5);
        };
    }, [showIntroVideo, showWinModal, showGameOverModal]);


    return (
        <div className="game-container">


            <Canvas camera={{ position: [14, 18, 26], fov: CAMERA_CONFIG.fov }} shadows>
                <ambientLight intensity={1.5} />
                <directionalLight position={[15, 22, 17]} intensity={1} />

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

                    <EnemyTextureLoader>
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
                                doghousePos={doghousePos}
                                isReturning={enemy.isReturning}
                                spritesheet1Path="/assets/personajes/enemy_type_7.png"
                                spritesheet2Path="/assets/personajes/enemy_type_8.png"
                                debugMode={false}
                                slowDownOnPower={false}
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
                            onPointerCancel={() => setDirection({ x: 0, z: 0 })}
                            onContextMenu={(e) => e.preventDefault()}
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
                            onPointerCancel={() => setDirection({ x: 0, z: 0 })}
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
                            className="d-pad-button right"
                            onPointerDown={() => setDirection({ x: 1, z: 0 })}
                            onPointerUp={() => setDirection({ x: 0, z: 0 })}
                            onPointerLeave={() => setDirection({ x: 0, z: 0 })}
                            onPointerCancel={() => setDirection({ x: 0, z: 0 })}
                            onContextMenu={(e) => e.preventDefault()}
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
                            onPointerCancel={() => setDirection({ x: 0, z: 0 })}
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
                        src="/assets/videos/NIVEL 4 FINAL.mp4"
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
