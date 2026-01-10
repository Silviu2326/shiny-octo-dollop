import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { useDrag } from '@use-gesture/react';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import LevelHeader from '../components/LevelHeader';
import './Level6.css';

// --- Constants & Configuration ---
const CELL_SIZE = 5;
const INITIAL_PLAYER_POS = { x: 5, z: 3 };
const CAMERA_CONFIG = {
    rotation: Math.PI / 4.8,
    distance: 7,
    height: 5,
    fov: 60,
};
const PLAYER_ROTATION = 1.1;
const DOGHOUSE_POS = { x: 8, z: 3 };

// --- Walls Definition (From Level6.js) ---
const walls = [
    // Background
    { x: -2, z: -10, length: 60, height: 10, thickness: 1, orientation: 'vertical', isBackground: true },
    { x: -10, z: -2, length: 60, height: 10, thickness: 1, orientation: 'horizontal', isBackground: true },

    // Exterior Borders
    { x: 0, z: 0, length: 30, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 0, z: 36, length: 30, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 0, z: 0, length: 36, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 30, z: 0, length: 36, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Central Cross (The "Aspa")
    { x: 13, z: 16, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 17, z: 16, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 13, z: 20, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 17, z: 20, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Top Left Arm
    { x: 9, z: 12, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 11, z: 12, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 7, z: 10, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 5, z: 8, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    // Top Right Arm
    { x: 19, z: 12, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 19, z: 12, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 23, z: 10, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 24, z: 8, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    // Bottom Left Arm
    { x: 9, z: 24, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 11, z: 22, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 7, z: 26, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 5, z: 28, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    // Bottom Right Arm
    { x: 19, z: 24, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 19, z: 22, length: 3, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 23, z: 26, length: 2, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 24, z: 28, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    // Bypasses (Stress Ring)
    { x: 13, z: 9, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 13, z: 29, length: 6, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 4, z: 15, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 6, z: 14, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 26, z: 15, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 25, z: 14, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Periphery Blocks
    { x: 2, z: 5, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 3, z: 2, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 24, z: 5, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 28, z: 2, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 2, z: 32, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 3, z: 30, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 24, z: 32, length: 4, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 28, z: 30, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Long Side Walls
    { x: 2, z: 12, length: 12, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 29, z: 12, length: 12, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Precision Obstacles
    { x: 14, z: 14, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 14, z: 22, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 6, z: 18, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 24, z: 18, length: 1, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
];

// --- Physics ---
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
                return dist < 0.5;
            });
            if (!tooClose) {
                collectibles.push({ id: id++, x, z, collected: false });
            }
        }
    }
    return collectibles;
}

const initialCollectibles = generateCollectibles(155);

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

function Enemy({ position, playerPos, walls, onPositionUpdate, rotation, isPowerActive, isPaused, doghousePos, isReturning, onReturnComplete }) {
    const meshRef = useRef();

    // Load both spritesheets
    // Texture 1: Right/Down (enemy_type_5.png)
    // Texture 2: Left/Up   (enemy_type_6.png)
    const t1 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_5.png');
    const t2 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_6.png');

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
    const [direction, setDirection] = useState({ x: 1, z: 0 }); // Start moving right
    const [mode, setMode] = useState('scatter');
    const [modeTimer, setModeTimer] = useState(Math.random() * 2);
    const [lastIntersectionPos, setLastIntersectionPos] = useState({ x: -999, z: -999 });

    const stunTimerRef = useRef(0);

    // Constants
    const frameCount = 8;
    const animationSpeed = 10;
    const chaseTime = useMemo(() => 5 + Math.random() * 4, []);
    const scatterTime = useMemo(() => 5 + Math.random() * 4, []);

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
            if (dir.x === -currentDir.x && dir.z === -currentDir.z) return false; // Don't reverse
            return !checkCollision(x + dir.x * 0.5, z + dir.z * 0.5, walls);
        });
    };

    useFrame((state, delta) => {
        if (isPaused) return;

        if (isPowerActive) {
            stunTimerRef.current += delta;
        }

        // --- Logic matching Level6.js (native) ---
        const distToPlayer = Math.sqrt(Math.pow(playerPos.x - position.x, 2) + Math.pow(playerPos.z - position.z, 2));

        // Return to Doghouse Logic
        if (isReturning) {
            const distToHome = Math.sqrt(Math.pow(doghousePos.x - position.x, 2) + Math.pow(doghousePos.z - position.z, 2));
            if (distToHome < 0.5) {
                setMode('scatter');
                onReturnComplete();
                return;
            }

            // Move towards home
            const returnSpeed = 3.5;
            const dx = doghousePos.x - position.x;
            const dz = doghousePos.z - position.z;
            const totalDist = Math.sqrt(dx * dx + dz * dz);

            if (totalDist > 0) {
                const dirX = dx / totalDist;
                const dirZ = dz / totalDist;
                // Simple movement towards home, taking checkCollision into account only if needed
                // Native code does: if (!checkCollision) move.
                const nextX = position.x + dirX * returnSpeed * delta;
                const nextZ = position.z + dirZ * returnSpeed * delta;

                if (!checkCollision(nextX, nextZ, walls)) {
                    onPositionUpdate(nextX, nextZ);
                }
            }
            // Animate
            const newFrame = Math.floor(state.clock.elapsedTime * animationSpeed) % frameCount;
            setCurrentFrame(newFrame);
            return;
        }

        // Logic Limit
        if (distToPlayer > 30) return;

        // Mode Switching
        if (!isPowerActive) {
            setModeTimer(prev => {
                const newTimer = prev + delta;
                const limit = mode === 'scatter' ? scatterTime : chaseTime;
                if (newTimer >= limit) {
                    setMode(curr => curr === 'scatter' ? 'chase' : 'scatter');
                    return 0;
                }
                return newTimer;
            });
        }

        // Movement
        const speed = isPowerActive ? 0.5 : 4.95;
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
                    newDir = validDirs[Math.floor(Math.random() * validDirs.length)];
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
                // Dead end, turn around
                setDirection({ x: -direction.x, z: -direction.z });
            }
        }

        if (canMove) {
            onPositionUpdate(nextX, nextZ);
            // Animate
            const newFrame = Math.floor(state.clock.elapsedTime * animationSpeed) % frameCount;
            setCurrentFrame(newFrame);
        }
    });

    // Determine correct texture and flip based on direction
    const getCurrentTexture = () => {
        // Texture 1 (Type 5) is for Right/Down (usually)
        // Texture 2 (Type 6) is for Left/Up
        // Native logic: if (dir.x > 0 || dir.z > 0) -> spritesheet1
        if (direction.x > 0 || direction.z > 0) {
            return spritesheet1;
        } else {
            return spritesheet2;
        }
    };

    const getFlipX = () => {
        // Native logic: Left or Down -> flip?
        // Native: if (direction.z > 0) return -1;
        //         if (direction.x < 0) return -1;
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
            rotation={[-Math.PI / 4, 0, 0]} // Keep 0 Y rotation, flip handling via scale
            scale={[getFlipX(), 1, 1]}
        >
            <planeGeometry args={[1.3, 1.3]} />
            <meshStandardMaterial
                map={texture}
                transparent
                side={THREE.DoubleSide}
                alphaTest={0.5}
                color={isReturning ? 'grey' : isPowerActive ? 'blue' : 'white'}
                emissive={isReturning ? "#888888" : (isPowerActive ? "#0000FF" : "#000000")}
                emissiveIntensity={isReturning ? 0.5 : (isPowerActive ? 0.6 : 0)}
            />
        </mesh>
    );
}

function Player({ position, direction, isPowerActive, isInvulnerable }) {
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

    useFrame((state, delta) => {
        // Always animate or only when moving? Native animates when moving. 
        // But here we might want idle loop? 
        // Native: checks "if (direction.x !== 0 || direction.z !== 0)" inside Player useFrame
        // But we are passing "direction" prop which is current input. 
        // However, "position" is updated by parent.
        // Let's just loop animation for now to be safe/lively.
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
            {isPowerActive && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
                    <ringGeometry args={[0.4, 0.6, 32]} />
                    <meshBasicMaterial color="#FFFF00" transparent opacity={0.5} side={THREE.DoubleSide} />
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
                    alphaTest={0.5}
                    opacity={isInvulnerable ? 0.5 : 1}
                    depthWrite={!isInvulnerable} // Avoid depth issues when transparent
                    color={isPowerActive ? '#FFFF00' : 'white'}
                    emissive={isPowerActive ? '#FFFF00' : '#000000'}
                    emissiveIntensity={isPowerActive ? 0.5 : 0}
                />
            </mesh>
        </group>
    );
}

function Floor() {
    const tex = useLoader(THREE.TextureLoader, '/assets/suelos/Captura de pantalla 2025-11-27 232617.png');
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

export default function Level6({ onBack, onNextLevel }) {
    const [playerPos, setPlayerPos] = useState(INITIAL_PLAYER_POS);
    const [direction, setDirection] = useState({ x: 0, z: 0 });
    const [collectibles, setCollectibles] = useState(initialCollectibles);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [tokens, setTokens] = useState(0);
    const [powerActive, setPowerActive] = useState(false);
    const [powerTimeLeft, setPowerTimeLeft] = useState(0);
    const [isInvulnerable, setIsInvulnerable] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [showVictoryModal, setShowVictoryModal] = useState(false);
    const [showIntroVideo, setShowIntroVideo] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const musicRef = useRef(null);

    // Initial Barrels
    const [barrels, setBarrels] = useState([
        { id: 1, x: 15, z: 18, collected: false },
        { id: 2, x: 8, z: 11, collected: false },
        { id: 3, x: 22, z: 11, collected: false },
    ]);

    const [enemies, setEnemies] = useState([]);
    const enemiesRef = useRef(enemies);
    const lastHitTimeRef = useRef(0);

    useEffect(() => {
        enemiesRef.current = enemies;
    }, [enemies]);

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
        const remainingCollectibles = collectibles.filter(c => !c.collected).length;
        if (remainingCollectibles === 0 && initialCollectibles.length > 0) {
            setIsPaused(true);
            setShowVictoryModal(true);
        }
    }, [collectibles]);

    // --- Game Logic ---

    const activatePower = () => {
        if (tokens > 0 && !powerActive) {
            setTokens(prev => prev - 1);
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

    // Keyboard controls
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

    // Game Loop interval
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused) return;

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
                                playCollectSound();
                                changed = true;
                                return { ...c, collected: true };
                            }
                            return c;
                        });
                        return changed ? next : prev;
                    });

                    // Barrels
                    let tokensToAdd = 0;
                    let scoreToAdd = 0;
                    let barrelsChanged = false;

                    const newBarrels = barrels.map(b => {
                        if (!b.collected && Math.sqrt((newX - b.x) ** 2 + (newZ - b.z) ** 2) < 0.8) {
                            tokensToAdd += 1;
                            scoreToAdd += 25;
                            barrelsChanged = true;
                            return { ...b, collected: true };
                        }
                        return b;
                    });

                    if (barrelsChanged) {
                        setTokens(t => t + tokensToAdd);
                        setScore(s => s + scoreToAdd);
                        playCollectSound();
                        setBarrels(newBarrels);
                    }
                }
            }

            // Enemy AI and Collision
            // Enemy AI and Collision
            const currentEnemies = enemiesRef.current;
            let hitOccurred = false;
            let updates = [];

            currentEnemies.forEach(e => {
                const { x, z, isReturning, id } = e;
                const dist = Math.sqrt((playerPos.x - x) ** 2 + (playerPos.z - z) ** 2);

                if (dist < 0.8 && powerActive && !isReturning) {
                    setScore(s => s + 200);
                    updates.push({ id, isReturning: true });
                } else if (dist < 0.5 && !powerActive && !isInvulnerable && !isReturning) {
                    hitOccurred = true;
                }
            });

            if (updates.length > 0) {
                setEnemies(prev => prev.map(e => {
                    const update = updates.find(u => u.id === e.id);
                    return update ? { ...e, ...update } : e;
                }));
            }

            if (hitOccurred) {
                const now = Date.now();
                if (now - lastHitTimeRef.current > 500) {
                    const newLives = lives - 1;
                    setLives(newLives);

                    if (newLives <= 0) {
                        setShowGameOverModal(true);
                        setIsPaused(true);
                    } else {
                        playLoseLifeSound();
                        setIsInvulnerable(true);
                        setTimeout(() => setIsInvulnerable(false), 3000);
                    }
                    lastHitTimeRef.current = now;
                }
            }

        }, 16);
        return () => clearInterval(interval);
    }, [direction, playerPos, isInvulnerable, powerActive, isPaused, barrels]);

    // Enemy Spawning
    useEffect(() => {
        const timeouts = [
            setTimeout(() => setEnemies(e => [...e, { id: 1, x: DOGHOUSE_POS.x, z: DOGHOUSE_POS.z }]), 100),
            setTimeout(() => setEnemies(e => [...e, { id: 2, x: DOGHOUSE_POS.x, z: DOGHOUSE_POS.z }]), 5000),
            setTimeout(() => setEnemies(e => [...e, { id: 3, x: DOGHOUSE_POS.x, z: DOGHOUSE_POS.z }]), 9000),
            setTimeout(() => setEnemies(e => [...e, { id: 4, x: DOGHOUSE_POS.x, z: DOGHOUSE_POS.z }]), 15000),
        ];
        return () => timeouts.forEach(clearTimeout);
    }, []);

    const handleEnemyPositionUpdate = (id, x, z) => {
        setEnemies(prev => prev.map(e => e.id === id ? { ...e, x, z } : e));
    };

    const handleReturnComplete = (id) => {
        setEnemies(prev => prev.map(e => e.id === id ? { ...e, isReturning: false } : e));
    };

    const restartLevel = () => {
        setPlayerPos(INITIAL_PLAYER_POS);
        setDirection({ x: 0, z: 0 });
        setCollectibles(initialCollectibles.map(c => ({ ...c, collected: false })));
        setScore(0);
        setLives(3);
        setTokens(0);
        setPowerActive(false);
        setPowerTimeLeft(0);
        setEnemies([]); // Logic to respawn needed, but simple clear is okay for now
        setIsInvulnerable(false);
        setIsPaused(false);
        setShowSettingsModal(false);
        setShowSettingsModal(false);
        setShowGameOverModal(false);
        setShowVictoryModal(false);
        setBarrels([
            { id: 1, x: 15, z: 18, collected: false },
            { id: 2, x: 8, z: 11, collected: false },
            { id: 3, x: 22, z: 11, collected: false },
            { id: 4, x: 8, z: 25, collected: false },
            { id: 5, x: 22, z: 25, collected: false },
            { id: 6, x: 5, z: 18, collected: false },
            { id: 7, x: 25, z: 18, collected: false },
        ]);
    };

    return (
        <div className="game-container">
            <GestureLayer onSwipe={handleSwipe} />

            <Canvas camera={{ position: [14, 16, 24], fov: 60 }} shadows>
                <ambientLight intensity={1.5} />
                <directionalLight position={[15, 24, 18]} intensity={1} />

                <Maze walls={walls} />
                <Floor />
                <Doghouse position={DOGHOUSE_POS} />

                <InstancedCollectibles collectibles={collectibles} />

                {barrels.map(b => !b.collected && <Barrel key={b.id} position={b} />)}

                <Player position={playerPos} direction={direction} isPowerActive={powerActive} isInvulnerable={isInvulnerable} />

                {enemies.map(e => (
                    <Enemy
                        key={e.id}
                        position={e}
                        playerPos={playerPos}
                        walls={walls}
                        doghousePos={DOGHOUSE_POS}
                        isPowerActive={powerActive}
                        isReturning={e.isReturning}
                        rotation={0}
                        onPositionUpdate={(x, z) => handleEnemyPositionUpdate(e.id, x, z)}
                        onReturnComplete={() => handleReturnComplete(e.id)}
                        isPaused={isPaused}
                    />
                ))}

                <CameraController targetX={playerPos.x} targetZ={playerPos.z} />
            </Canvas>

            <div className="ui-overlay">
                <LevelHeader
                    lives={lives}
                    levelNumber={6}
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
                            <h2 style={{ fontSize: '2.5em', marginBottom: '20px' }}>¡FELICIDADES! 🎉</h2>
                            <p style={{ fontSize: '1.2em', marginBottom: '10px' }}>¡Has recogido todas las cervezas!</p>
                            <p style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#2C1810', marginBottom: '30px' }}>Puntuación: {score}</p>
                            {onNextLevel && (
                                <button className="modal-button" onClick={onNextLevel} style={{ backgroundColor: '#4CAF50', marginBottom: '10px' }}>
                                    <Play size={20} /> Siguiente Nivel
                                </button>
                            )}
                            <button className="modal-button" onClick={restartLevel}>
                                <RotateCcw size={20} /> Jugar de Nuevo
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
                                <p>Cervezas recogidas: {initialCollectibles.length - collectibles.filter(c => !c.collected).length}</p>
                            </div>
                            {score >= 150 && onNextLevel && (
                                <button className="modal-button" onClick={onNextLevel} style={{ backgroundColor: '#4CAF50', marginBottom: '10px' }}>
                                    <Play size={20} /> Avanzar al siguiente nivel
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
                        <video
                            src="/assets/videos/NIVEL%205%20FINAL.mp4"
                            autoPlay
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onEnded={() => setShowIntroVideo(false)}
                            onClick={() => setShowIntroVideo(false)}
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
