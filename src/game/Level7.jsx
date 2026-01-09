import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { useDrag } from '@use-gesture/react';
import LevelHeader from '../components/LevelHeader';
import './Level0.css';

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
        const x = Math.random() * 28 + 1;
        const z = Math.random() * 34 + 1;
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

const initialCollectibles = generateCollectibles(150);

// --- Components ---

function Maze({ walls }) {
    const textures = useLoader(THREE.TextureLoader, [
        '/assets/paredes/wall_texture_4.png',
        '/assets/paredes/wall_background_2.jpg',
        '/assets/paredes/wall_background_3.jpg'
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
        <mesh position={[position.x, 0.6, position.z]} rotation={[0, -Math.PI / 6, 0]}>
            <planeGeometry args={[1.2, 1.2]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} />
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
        <instancedMesh ref={meshRef} args={[null, null, collectibles.length]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} alphaTest={0.5} />
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

function Enemy({ position, playerPos, walls, onPositionUpdate, rotation, isPowerActive, isPaused, isStunned, doghousePos, isReturning, onReturnComplete }) {
    const meshRef = useRef();

    // Load both spritesheets
    // Texture 1: Right/Down (enemy_type_3.png)
    // Texture 2: Left/Up   (enemy_type_4.png)
    const t1 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_3.png');
    const t2 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_4.png');

    // Clone textures to allow independent frame updates per enemy instance
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
    const [direction, setDirection] = useState({ x: 1, z: 0 });
    const [mode, setMode] = useState('scatter');
    const [modeTimer, setModeTimer] = useState(Math.random() * 2);
    const [lastIntersectionPos, setLastIntersectionPos] = useState({ x: -999, z: -999 });
    const [stunVisualTime, setStunVisualTime] = useState(0);

    const stunTimerRef = useRef(0);

    const frameCount = 8;
    const animationSpeed = 10;
    const chaseTime = useMemo(() => 6 + Math.random() * 3, []);
    const scatterTime = useMemo(() => 6 + Math.random() * 3, []);

    // Helper: Check for intersections
    const isAtIntersection = (x, z, lastPos) => {
        const distanceFromLast = Math.sqrt(Math.pow(x - lastPos.x, 2) + Math.pow(z - lastPos.z, 2));
        if (distanceFromLast < 1.5) return false;

        const directions = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
        let availableDirections = 0;
        directions.forEach(dir => {
            if (!checkCollision(x + dir.x * 0.6, z + dir.z * 0.6, walls)) {
                availableDirections++;
            }
        });
        return availableDirections > 2;
    };

    const getValidDirections = (x, z, currentDir) => {
        const directions = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
        return directions.filter(dir => {
            if (dir.x === -currentDir.x && dir.z === -currentDir.z) return false;
            return !checkCollision(x + dir.x * 0.5, z + dir.z * 0.5, walls);
        });
    };

    useFrame((state, delta) => {
        if (isPaused) return;

        if (isStunned || isPowerActive) {
            if (isStunned) setStunVisualTime(prev => prev + delta * 10);
            if (isPowerActive) stunTimerRef.current += delta;
        }

        // Returning logic
        if (isReturning) {
            const distToHome = Math.sqrt(Math.pow(doghousePos.x - position.x, 2) + Math.pow(doghousePos.z - position.z, 2));
            if (distToHome < 0.5) {
                setMode('scatter');
                onReturnComplete();
                return;
            }

            const returnSpeed = 3.5;
            const dx = doghousePos.x - position.x;
            const dz = doghousePos.z - position.z;
            const totalDist = Math.sqrt(dx * dx + dz * dz);

            if (totalDist > 0) {
                const dirX = dx / totalDist;
                const dirZ = dz / totalDist;
                const nextX = position.x + dirX * returnSpeed * delta;
                const nextZ = position.z + dirZ * returnSpeed * delta;

                if (!checkCollision(nextX, nextZ, walls)) {
                    onPositionUpdate(nextX, nextZ);
                }
            }
            // Animate while returning
            const newFrame = Math.floor(state.clock.elapsedTime * animationSpeed) % frameCount;
            setCurrentFrame(newFrame);
            return;
        }

        if (isStunned) return;

        const distToPlayer = Math.sqrt(Math.pow(playerPos.x - position.x, 2) + Math.pow(playerPos.z - position.z, 2));
        if (distToPlayer > 30) return;

        // Mode Switching
        setModeTimer(prev => {
            const newTimer = prev + delta;
            const limit = mode === 'scatter' ? scatterTime : chaseTime;
            if (newTimer >= limit) {
                setMode(curr => curr === 'scatter' ? 'chase' : 'scatter');
                return 0;
            }
            return newTimer;
        });

        // Movement
        const baseSpeed = 4.73;
        const speed = isPowerActive ? baseSpeed * 0.5 : baseSpeed;
        const nextX = position.x + direction.x * speed * delta;
        const nextZ = position.z + direction.z * speed * delta;

        const canMove = !checkCollision(nextX, nextZ, walls);
        const atInt = isAtIntersection(position.x, position.z, lastIntersectionPos);
        const shouldChangeStunDir = isPowerActive && stunTimerRef.current > 0.2;

        if (atInt || !canMove || shouldChangeStunDir) {
            const validDirs = getValidDirections(position.x, position.z, direction);
            if (validDirs.length > 0) {
                let newDir;
                if (isPowerActive) {
                    newDir = validDirs[Math.floor(Math.random() * validDirs.length)];
                    stunTimerRef.current = 0;
                } else if (mode === 'scatter') {
                    // Scatter logic
                    newDir = validDirs.reduce((best, dir) => {
                        const futureX = position.x + dir.x * 5;
                        const futureZ = position.z + dir.z * 5;
                        const distCenter = Math.sqrt(Math.pow(futureX - 15, 2) + Math.pow(futureZ - 18, 2));
                        const bestFutureX = position.x + best.x * 5;
                        const bestFutureZ = position.z + best.z * 5;
                        const bestDistCenter = Math.sqrt(Math.pow(bestFutureX - 15, 2) + Math.pow(bestFutureZ - 18, 2));
                        return distCenter > bestDistCenter ? dir : best;
                    });
                    if (Math.random() < 0.3) {
                        newDir = validDirs[Math.floor(Math.random() * validDirs.length)];
                    }
                } else {
                    // Chase
                    const dx = playerPos.x - position.x;
                    const dz = playerPos.z - position.z;
                    newDir = validDirs.reduce((best, dir) => {
                        const score = dir.x * dx + dir.z * dz;
                        const bestScore = best.x * dx + best.z * dz;
                        return score > bestScore ? dir : best;
                    });
                }
                setDirection(newDir);
                if (atInt) setLastIntersectionPos({ x: position.x, z: position.z });
            } else if (!canMove) {
                setDirection({ x: -direction.x, z: -direction.z });
            }
        }

        if (canMove) {
            onPositionUpdate(nextX, nextZ);
            const newFrame = Math.floor(state.clock.elapsedTime * animationSpeed) % frameCount;
            setCurrentFrame(newFrame);
        }
    });

    const getCurrentTexture = () => {
        if (direction.x > 0 || direction.z > 0) return spritesheet1;
        return spritesheet2;
    };

    const getFlipX = () => {
        // User requested inversion for Right/Down spritesheet (S1)
        if (direction.x > 0) return -1; // Right -> Flip (-1) instead of 1
        if (direction.z > 0) return 1;  // Down -> Normal (1) instead of -1

        if (direction.x < 0) return -1; // Left -> Flip (-1)
        return 1; // Default/Up
    };

    const texture = getCurrentTexture();
    texture.repeat.set(1 / frameCount, 1);
    texture.offset.x = currentFrame / frameCount;

    return (
        <group position={[position.x, 0.5, position.z]}>
            {isStunned && (
                <>
                    <mesh position={[0, 0.3, 0]} rotation={[0, stunVisualTime, 0]}>
                        <ringGeometry args={[0.4, 0.5, 8]} />
                        <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={2} transparent opacity={0.8} />
                    </mesh>
                    <mesh position={[0, 0.4, 0]} rotation={[0, -stunVisualTime * 1.5, 0]}>
                        <ringGeometry args={[0.3, 0.35, 6]} />
                        <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={2} transparent opacity={0.6} />
                    </mesh>
                </>
            )}

            <mesh
                ref={meshRef}
                rotation={[-Math.PI / 4, 0, 0]}
                scale={[getFlipX(), 1, 1]}
            >
                <planeGeometry args={[1.3, 1.3]} />
                <meshStandardMaterial
                    map={texture}
                    transparent
                    side={THREE.DoubleSide}
                    alphaTest={0.5}
                    emissive={isStunned ? "#FFFF00" : "#000000"}
                    emissiveIntensity={isStunned ? 0.5 : 0}
                    depthWrite
                />
            </mesh>
        </group>
    );
}

function Player({ position, direction, isInvulnerable, shockwaveActive, shockwaveRadius }) {
    const t1 = useLoader(THREE.TextureLoader, '/assets/personajes/player.png');
    const t2 = useLoader(THREE.TextureLoader, '/assets/personajes/player_secondary.png');

    // Clone to ensure independent settings
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
    const frameCount = 8;
    const animationSpeed = 10;

    useFrame((state) => {
        const newFrame = Math.floor(state.clock.elapsedTime * animationSpeed) % frameCount;
        setCurrentFrame(newFrame);
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
    texture.offset.x = currentFrame / frameCount;

    return (
        <group position={[position.x, 0.5, position.z]}>
            {shockwaveActive && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
                    <ringGeometry args={[shockwaveRadius - 0.5, shockwaveRadius, 32]} />
                    <meshBasicMaterial color="#FF6600" transparent opacity={0.6} side={THREE.DoubleSide} />
                </mesh>
            )}
            <mesh
                rotation={[-Math.PI / 4, 0, 0]}
                scale={[getFlipX(), 1, 1]}
            >
                <planeGeometry args={[1.1, 1.1]} />
                <meshStandardMaterial
                    map={texture}
                    transparent
                    side={THREE.DoubleSide}
                    opacity={isInvulnerable ? 0.5 : 1}
                    depthWrite={!isInvulnerable}
                />
            </mesh>
        </group>
    );
}

function Floor() {
    const tex = useLoader(THREE.TextureLoader, '/assets/suelos/floor_texture.jpg');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(7.5, 9);
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, -0.1, 18]}>
            <planeGeometry args={[30, 36]} />
            <meshBasicMaterial map={tex} />
        </mesh>
    );
}

// --- Main Level Component ---

export default function Level7({ onBack }) {
    const [playerPos, setPlayerPos] = useState(INITIAL_PLAYER_POS);
    const [direction, setDirection] = useState({ x: 0, z: 0 });
    const [collectibles, setCollectibles] = useState(initialCollectibles);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [tokens, setTokens] = useState(0);
    const [isInvulnerable, setIsInvulnerable] = useState(false);

    // Power-up State
    const [powerActive, setPowerActive] = useState(false);
    const [shockwaveActive, setShockwaveActive] = useState(false);
    const [shockwaveRadius, setShockwaveRadius] = useState(0);
    const [powerTimeLeft, setPowerTimeLeft] = useState(0);

    const [barrels, setBarrels] = useState([
        { id: 1, x: 15, z: 9, collected: false },
        { id: 2, x: 15, z: 27, collected: false },
        { id: 3, x: 5, z: 18, collected: false },
        { id: 4, x: 25, z: 18, collected: false },
        { id: 5, x: 3, z: 3, collected: false },
        { id: 6, x: 27, z: 33, collected: false },
    ]);

    const [enemies, setEnemies] = useState([]);

    const activatePower = () => {
        if (tokens > 0 && !powerActive) {
            setTokens(t => t - 1);
            setPowerActive(true);
            setShockwaveActive(true);
            setShockwaveRadius(0);
            setPowerTimeLeft(6);

            // Animate shockwave radius
            let r = 0;
            const interval = setInterval(() => {
                r += 0.5;
                setShockwaveRadius(r);
                if (r >= 5) {
                    clearInterval(interval);
                    setShockwaveActive(false);
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

            // Auto turn off power active flag for button cooldown after 6s
            setTimeout(() => setPowerActive(false), 6000);
        }
    };

    const handleSwipe = (newDir) => setDirection(newDir);

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

    const handleEnemyPositionUpdate = (id, x, z) => {
        setEnemies(prev => prev.map(e => e.id === id ? { ...e, x, z } : e));
    };

    const handleReturnComplete = (id) => {
        setEnemies(prev => prev.map(e => e.id === id ? { ...e, isReturning: false } : e));
    };

    useEffect(() => {
        const interval = setInterval(() => {
            // Player Movement
            if (direction.x !== 0 || direction.z !== 0) {
                const speed = 0.22;
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

            // Enemy AI - Global State Updates
            setEnemies(prev => prev.map(e => {
                // Un-stun check
                if (e.stunned && Date.now() > e.stunTime) {
                    return { ...e, stunned: false };
                }

                let { x, z, isReturning } = e;

                // Collision with player
                const dist = Math.sqrt((playerPos.x - x) ** 2 + (playerPos.z - z) ** 2);
                if (dist < 0.5 && !isInvulnerable && !isReturning && !e.stunned) {
                    setLives(l => l - 1);
                    setIsInvulnerable(true);
                    setTimeout(() => setIsInvulnerable(false), 3000);
                }

                // Movement is now handled by the Enemy component itself.
                return e;
            }));

        }, 16);
        return () => clearInterval(interval);
    }, [direction, playerPos, isInvulnerable]);

    useEffect(() => {
        const timeouts = [
            setTimeout(() => setEnemies(e => [...e, { id: 1, x: DOGHOUSE_POS.x, z: DOGHOUSE_POS.z }]), 2000),
            setTimeout(() => setEnemies(e => [...e, { id: 2, x: DOGHOUSE_POS.x, z: DOGHOUSE_POS.z }]), 5000),
            setTimeout(() => setEnemies(e => [...e, { id: 3, x: DOGHOUSE_POS.x, z: DOGHOUSE_POS.z }]), 9000),
            setTimeout(() => setEnemies(e => [...e, { id: 4, x: DOGHOUSE_POS.x, z: DOGHOUSE_POS.z }]), 15000),
        ];
        return () => timeouts.forEach(clearTimeout);
    }, []);

    return (
        <div className="game-container">
            <GestureLayer onSwipe={handleSwipe} />

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
                    isInvulnerable={isInvulnerable}
                    shockwaveActive={shockwaveActive}
                    shockwaveRadius={shockwaveRadius}
                />

                {enemies.map(e => (
                    <Enemy
                        key={e.id}
                        position={e}
                        playerPos={playerPos}
                        walls={walls}
                        doghousePos={DOGHOUSE_POS}
                        isPowerActive={powerActive}
                        isReturning={e.isReturning}
                        isStunned={e.stunned}
                        rotation={0}
                        onPositionUpdate={(x, z) => handleEnemyPositionUpdate(e.id, x, z)}
                        onReturnComplete={() => handleReturnComplete(e.id)}
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
                />

                <div style={{ position: 'absolute', bottom: 20, right: 20, pointerEvents: 'auto' }}>
                    <button
                        onClick={activatePower}
                        style={{ padding: 20, borderRadius: '50%', background: powerTimeLeft > 0 ? 'orange' : (tokens > 0 ? 'gold' : 'grey'), border: '4px solid white', fontSize: 24, color: 'white' }}
                    >
                        💥 {tokens}
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
