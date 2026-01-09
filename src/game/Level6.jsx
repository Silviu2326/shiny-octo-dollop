import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { useDrag } from '@use-gesture/react';
import LevelHeader from '../components/LevelHeader';
import './Level0.css';

// --- Constants & Configuration ---
const CELL_SIZE = 5;
const INITIAL_PLAYER_POS = { x: 5, z: 3 };
const CAMERA_CONFIG = {
    rotation: Math.PI / 4.8,
    distance: 9,
    height: 7,
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
        <mesh position={[position.x, 0.6, position.z]} rotation={[0, -Math.PI / 4, 0]}>
            <planeGeometry args={[1.2, 1.2]} />
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} />
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
            <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} />
        </mesh>
    );
}

function Enemy({ position, isReturning, isPowerActive }) {
    const texture1 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_5.png');

    // Simple visual for returning state
    const color = isReturning ? 'grey' : (isPowerActive ? 'blue' : 'white');

    return (
        <mesh position={[position.x, 0.5, position.z]} rotation={[-Math.PI / 4, 0, 0]}>
            <planeGeometry args={[1.3, 1.3]} />
            <meshStandardMaterial
                map={texture1}
                transparent
                side={THREE.DoubleSide}
                color={color}
            />
        </mesh>
    );
}

function Player({ position, rotation, isPowerActive, isInvulnerable }) {
    const t1 = useLoader(THREE.TextureLoader, '/assets/personajes/player.png');
    const [frame, setFrame] = useState(0);

    useFrame((state) => {
        setFrame(Math.floor(state.clock.getElapsedTime() * 10) % 8);
    });

    const tex = t1.clone();
    tex.repeat.set(1 / 8, 1);
    tex.offset.x = frame / 8;
    tex.magFilter = THREE.NearestFilter;

    return (
        <group position={[position.x, 0.5, position.z]}>
            {isPowerActive && (
                <mesh rotation={[-Math.PI / 4, 0, 0]}>
                    <sphereGeometry args={[0.7, 16, 16]} />
                    <meshStandardMaterial color="#00FFFF" transparent opacity={0.3} emissive="#00FFFF" emissiveIntensity={1.5} />
                </mesh>
            )}
            <mesh rotation={[-Math.PI / 4, rotation, 0]}>
                <planeGeometry args={[1.1, 1.1]} />
                <meshStandardMaterial map={tex} transparent side={THREE.DoubleSide} opacity={isInvulnerable ? 0.5 : 1} />
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

export default function Level6({ onBack }) {
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
        { id: 1, x: 15, z: 18, collected: false },
        { id: 2, x: 8, z: 11, collected: false },
        { id: 3, x: 22, z: 11, collected: false },
        { id: 4, x: 8, z: 25, collected: false },
        { id: 5, x: 22, z: 25, collected: false },
        { id: 6, x: 5, z: 18, collected: false },
        { id: 7, x: 25, z: 18, collected: false },
    ]);

    const [enemies, setEnemies] = useState([]);

    // Logic Loop
    useFrame((state, delta) => {
        // No-op for now in React state, driven by effects below
    });

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

    // Game Loop interval
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

            // Enemy AI and Collision
            setEnemies(prev => prev.map(e => {
                let { x, z, isReturning } = e;

                // Collision with player
                const dist = Math.sqrt((playerPos.x - x) ** 2 + (playerPos.z - z) ** 2);

                // If hit by player while empowered
                if (dist < 0.8 && powerActive && !isReturning) {
                    setScore(s => s + 200);
                    return { ...e, isReturning: true };
                }

                // If hit player while normal
                if (dist < 0.5 && !powerActive && !isInvulnerable && !isReturning) {
                    setLives(l => l - 1);
                    setIsInvulnerable(true);
                    setTimeout(() => setIsInvulnerable(false), 3000);
                }

                // Movement
                let targetX = playerPos.x;
                let targetZ = playerPos.z;
                let speed = 0.09;

                if (isReturning) {
                    targetX = DOGHOUSE_POS.x;
                    targetZ = DOGHOUSE_POS.z;
                    speed = 0.2; // Return fast
                    if (Math.sqrt((x - targetX) ** 2 + (z - targetZ) ** 2) < 0.5) {
                        return { ...e, x: DOGHOUSE_POS.x, z: DOGHOUSE_POS.z, isReturning: false };
                    }
                } else if (powerActive) {
                    // Run away? Or just stay/slow? Native says "Scatter" or "Stun". 
                    // We'll just slow down heavily for this implementation
                    speed = 0.03;
                }

                const dx = targetX - x;
                const dz = targetZ - z;
                const angle = Math.atan2(dz, dx);

                let ex = x + Math.cos(angle) * speed;
                let ez = z + Math.sin(angle) * speed;

                if (!checkCollision(ex, ez, walls)) {
                    return { ...e, x: ex, z: ez };
                }
                return e;
            }));

        }, 16);
        return () => clearInterval(interval);
    }, [direction, playerPos, isInvulnerable, powerActive]);

    // Enemy Spawning
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

            <Canvas camera={{ position: [15, 20, 30], fov: 60 }} shadows>
                <ambientLight intensity={1.5} />
                <directionalLight position={[15, 24, 18]} intensity={1} />

                <Maze walls={walls} />
                <Floor />
                <Doghouse position={DOGHOUSE_POS} />

                <InstancedCollectibles collectibles={collectibles} />

                {barrels.map(b => !b.collected && <Barrel key={b.id} position={b} />)}

                <Player position={playerPos} rotation={PLAYER_ROTATION} isPowerActive={powerActive} isInvulnerable={isInvulnerable} />

                {enemies.map(e => <Enemy key={e.id} position={e} isReturning={e.isReturning} isPowerActive={powerActive} />)}

                <CameraController targetX={playerPos.x} targetZ={playerPos.z} />
            </Canvas>

            <div className="ui-overlay">
                <LevelHeader
                    lives={lives}
                    levelNumber={6}
                    beersCollected={initialCollectibles.length - collectibles.filter(c => !c.collected).length}
                    score={score}
                />

                <div style={{ position: 'absolute', bottom: 20, right: 20, pointerEvents: 'auto' }}>
                    <button
                        onClick={() => { if (tokens > 0) { setTokens(t => t - 1); setPowerActive(true); setTimeout(() => setPowerActive(false), 6000); } }}
                        style={{ padding: 20, borderRadius: '50%', background: powerActive ? 'blue' : (tokens > 0 ? 'gold' : 'grey'), border: '4px solid white', fontSize: 24, color: 'white' }}
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
        camera.position.x += (targetX + offsetX - camera.position.x) * 0.1;
        camera.position.z += (targetZ + offsetZ - camera.position.z) * 0.1;
        camera.lookAt(targetX, 0, targetZ);
    });
    return null;
}
