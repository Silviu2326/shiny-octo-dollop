import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { useDrag } from '@use-gesture/react';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import LevelHeader from '../components/LevelHeader';
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

const initialCollectibles = generateCollectibles(160);

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

function Enemy({ position, playerPos, walls, isPowerActive, isPaused, enemyId, onPositionUpdate, role = 'normal', isReturning = false }) {
    const meshRef = useRef();
    const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_1.png');
    const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_2.png');

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
            case 'chaser':
                return {
                    scatterDuration: 4 + baseVariation,
                    chaseDuration: 8 + baseVariation,
                    straightBias: 0.8,
                };
            case 'cutter':
                return {
                    scatterDuration: 6 + baseVariation,
                    chaseDuration: 4 + baseVariation,
                    straightBias: 0.3,
                };
            case 'rotator':
                return {
                    scatterDuration: 3 + baseVariation,
                    chaseDuration: 3 + baseVariation,
                    straightBias: 0.5,
                };
            case 'lazy':
                return {
                    scatterDuration: 7 + baseVariation,
                    chaseDuration: 3 + baseVariation,
                    straightBias: 0.6,
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

        // Si está regresando a la casa, movimiento directo rápido
        if (isReturning) {
            const targetX = DOGHOUSE_POS.x;
            const targetZ = DOGHOUSE_POS.z;
            const dx = targetX - position.x;
            const dz = targetZ - position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > 0.5) {
                const angle = Math.atan2(dz, dx);
                const returnSpeed = 8.0; // Velocidad rápida de regreso
                const moveX = Math.cos(angle) * returnSpeed * delta;
                const moveZ = Math.sin(angle) * returnSpeed * delta;
                const nextX = position.x + moveX;
                const nextZ = position.z + moveZ;

                if (!checkCollision(nextX, nextZ, walls)) {
                    onPositionUpdate(nextX, nextZ);
                }
            }

            setAnimationTime(prev => {
                const newTime = prev + delta * animationSpeed * 2;
                const newFrame = Math.floor(newTime) % frameCount;
                setCurrentFrame(newFrame);
                return newTime;
            });
            return;
        }

        const distance = Math.sqrt(
            Math.pow(playerPos.x - position.x, 2) +
            Math.pow(playerPos.z - position.z, 2)
        );

        // Si el poder está activo, moverse más lento (aturdido)
        const stunned = isPowerActive;
        if (stunned && meshRef.current) {
            meshRef.current.rotation.z += delta * 5;
        } else if (meshRef.current) {
            meshRef.current.rotation.z = 0;
        }

        if (distance > 30) return;

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

        // Velocidad según rol y estado
        let baseSpeed = 4.28;
        if (role === 'lazy') baseSpeed = 3.5;
        if (role === 'chaser') baseSpeed = 5.0;
        const speed = stunned ? baseSpeed * 0.4 : baseSpeed;

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
        <group position={[position.x, 0.5, position.z]}>
            <mesh
                ref={meshRef}
                rotation={[-Math.PI / 4, PLAYER_ROTATION, 0]}
                scale={[getFlipX(), 1, 1]}
            >
                <planeGeometry args={[1.3, 1.3]} />
                <meshStandardMaterial
                    map={texture}
                    transparent
                    side={THREE.DoubleSide}
                    color={isReturning ? 'grey' : 'white'}
                    alphaTest={0.5}
                    depthWrite={true}
                />
            </mesh>
        </group>
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
    const trailRef = useRef([]);
    const frameCount = 8;
    const animationSpeed = 10;

    useFrame((state) => {
        if (isPaused) return;

        const newFrame = Math.floor(state.clock.getElapsedTime() * animationSpeed) % frameCount;
        setFrame(newFrame);

        if (isPowerActive) {
            trailRef.current.unshift({ x: position.x, z: position.z });
            if (trailRef.current.length > 5) trailRef.current.pop();
        } else {
            trailRef.current = [];
        }
    });

    const getCurrentTexture = () => {
        if (direction.z < 0) return spritesheet1; // Up
        if (direction.x < 0) return spritesheet1; // Left
        if (direction.x > 0) return spritesheet2; // Right
        if (direction.z > 0) return spritesheet2; // Down
        return spritesheet2; // Default
    };

    const getFlipX = () => {
        if (direction.x < 0) return -1; // Flip for Left
        if (direction.z > 0) return -1; // Flip for Down
        return 1;
    };

    const texture = getCurrentTexture();
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
    const isInvulnerableRef = useRef(false); // Immediate invulnerability check

    // UI State
    const [isPaused, setIsPaused] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [showVictoryModal, setShowVictoryModal] = useState(false);
    const [showIntroVideo, setShowIntroVideo] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const musicRef = useRef(null);

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

    useEffect(() => {
        if (!musicRef.current) return;
        if (isMuted) {
            musicRef.current.pause();
        } else {
            musicRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
    }, [isMuted]);

    // Sync ref with state for invulnerability
    useEffect(() => {
        isInvulnerableRef.current = isInvulnerable;
    }, [isInvulnerable]);

    const toggleMute = () => setIsMuted(prev => !prev);

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
    useEffect(() => {
        if (score >= 150 && !showVictoryModal) {
            setIsPaused(true);
            setShowVictoryModal(true);
            // Level 8 is the final level, no need to unlock next level
        }
    }, [score, showVictoryModal]);

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

    const handleSwipe = (newDir) => {
        if (!isPaused) setDirection(newDir);
    };

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
                                pointsToAdd += 25;
                                hasChanges = true;
                                return { ...b, collected: true };
                            }
                            return b;
                        });

                        if (tokensToAdd > 0) {
                            setTokens(t => t + tokensToAdd);
                            setScore(s => s + pointsToAdd);
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

                if (dist < 0.6) {
                    if (powerActive && !e.isReturning) {
                        setScore(s => s + 200);
                        return { ...e, isReturning: true };
                    } else if (!isInvulnerableRef.current && !e.isReturning && !powerActive) {
                        isInvulnerableRef.current = true;
                        setLives(l => {
                            const newLives = l - 1;
                            if (newLives <= 0) {
                                setShowGameOverModal(true);
                                setIsPaused(true);
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
        const timer1 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current++,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: 'chaser',
                    isReturning: false,
                }
            ]);
        }, 1000);

        const timer2 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current++,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: 'cutter',
                    isReturning: false,
                }
            ]);
        }, 3000);

        const timer3 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current++,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: 'rotator',
                    isReturning: false,
                }
            ]);
        }, 6000);

        const timer4 = setTimeout(() => {
            setEnemies(prevEnemies => [
                ...prevEnemies,
                {
                    id: enemyIdRef.current++,
                    x: DOGHOUSE_POS.x,
                    z: DOGHOUSE_POS.z,
                    role: 'lazy',
                    isReturning: false,
                }
            ]);
        }, 9000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
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
        isInvulnerableRef.current = false;
        setPowerActive(false);
        setPowerTimeLeft(0);
        setEnemies([]);
        enemyIdRef.current = 1;
        collectedBarrelsRef.current.clear();
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

    return (
        <div className="game-container">
            <GestureLayer onSwipe={handleSwipe} />

            <Canvas camera={{ position: [16, 18, 26], fov: CAMERA_CONFIG.fov }} shadows>
                <ambientLight intensity={1.5} />
                <directionalLight position={[16, 24, 19]} intensity={1} />

                <Maze walls={walls} />
                <Floor />
                <Doghouse position={DOGHOUSE_POS} />

                <InstancedCollectibles collectibles={collectibles} />

                {barrels.map(b => !b.collected && <Barrel key={b.id} position={b} />)}

                <Player position={playerPos} direction={direction} isInvulnerable={isInvulnerable} isPowerActive={powerActive} isPaused={isPaused} />

                {enemies.map(enemy => (
                    <Enemy
                        key={enemy.id}
                        enemyId={enemy.id}
                        position={{ x: enemy.x, z: enemy.z }}
                        playerPos={playerPos}
                        walls={walls}
                        onPositionUpdate={(x, z) => handleEnemyPositionUpdate(enemy.id, x, z)}
                        isPowerActive={powerActive}
                        isPaused={isPaused}
                        role={enemy.role}
                        isReturning={enemy.isReturning || false}
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
                />

                <div className="power-button-container">
                    <button
                        onClick={activatePower}
                        disabled={tokens === 0}
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

                {showVictoryModal && (
                    <div className="settings-modal victory-modal">
                        <div className="settings-content glass-panel victory-content">
                            <h2 style={{ fontSize: '2.5em', marginBottom: '20px' }}>🎉 ¡JUEGO COMPLETADO! 🎉</h2>
                            <p style={{ fontSize: '1.2em', marginBottom: '10px' }}>¡Has completado todos los niveles!</p>
                            <p style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#FFD700', marginBottom: '30px' }}>Puntuación final: {score}</p>
                            <p style={{ fontSize: '1em', marginBottom: '30px', color: '#4CAF50' }}>¡Gracias por jugar Beer Run!</p>
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
                        <video
                            src="/assets/videos/nivel 7.mp4"
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
