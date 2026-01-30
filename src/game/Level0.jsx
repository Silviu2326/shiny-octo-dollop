import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import './Level0.css';
import LevelHeader from '../components/LevelHeader';
import { saveScore } from '../services/supabase';
import { getGameUI } from '../utils/translations';

// --- Configuration & Constants ---
const CELL_SIZE = 5;
const WALL_HEIGHT = 10;
const INITIAL_PLAYER_POS = { x: 2, z: 2 };

// Walls definition (same as Level1.js)
const walls = [
    // Background walls
    { x: -2, z: -10, length: 60, height: 10, thickness: 1, orientation: 'vertical' },
    { x: -10, z: -2, length: 60, height: 10, thickness: 1, orientation: 'horizontal' },

    // Exterior walls
    { x: 0, z: 0, length: 24, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 0, z: 28, length: 24, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 0, z: 0, length: 28, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 24, z: 0, length: 28, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Main vertical corridors
    { x: 6, z: 3, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 6, z: 17, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 12, z: 3, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 12, z: 17, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    { x: 18, z: 3, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 18, z: 17, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },

    // Horizontal corridors
    { x: 3, z: 7, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 9, z: 7, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 15, z: 7, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    { x: 3, z: 14, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 9, z: 14, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 15, z: 14, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    { x: 3, z: 21, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 9, z: 21, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
    { x: 15, z: 21, length: 3, height: 0.6, thickness: 0.2, orientation: 'horizontal' },

    // Extra complexity walls
    { x: 3, z: 3, length: 5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 15, z: 3, length: 5, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 9, z: 10, length: 4, height: 0.6, thickness: 0.2, orientation: 'vertical' },
    { x: 21, z: 10, length: 8, height: 0.6, thickness: 0.2, orientation: 'vertical' },
];

// --- Physics / Collision Logic ---
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
    while (collectibles.length < count) {
        const x = Math.random() * 22 + 1;
        const z = Math.random() * 26 + 1;
        if (!checkCollision(x, z, walls)) {
            const tooClose = collectibles.some(c => {
                const distance = Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(z - c.z, 2));
                return distance < 1;
            });
            if (!tooClose) {
                collectibles.push({ id: id++, x, z });
            }
        }
    }
    return collectibles;
}

const initialCollectibles = generateCollectibles(80);

// --- 3D Components ---

function Maze({ walls }) {
    const textureUrls = {
        brick: '/assets/paredes/wall_brick.jpg',
        gold: '/assets/paredes/wall_gold.png',
        background: '/assets/paredes/wall_background.png'
    };

    const brickTexture = useLoader(THREE.TextureLoader, textureUrls.brick);
    const goldTexture = useLoader(THREE.TextureLoader, textureUrls.gold);
    const backgroundTexture = useLoader(THREE.TextureLoader, textureUrls.background);

    useMemo(() => {
        [brickTexture, goldTexture, backgroundTexture].forEach(t => {
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.NearestFilter;
            t.wrapS = THREE.RepeatWrapping;
            t.wrapT = THREE.RepeatWrapping;
        });
    }, [brickTexture, goldTexture, backgroundTexture]);

    const { brickGeometry, goldGeometry, backgroundGeometry } = useMemo(() => {
        const brickGeometries = [];
        const goldGeometries = [];
        const backgroundGeometries = [];

        walls.forEach(wall => {
            const isHorizontal = wall.orientation === 'horizontal';
            const isBackgroundWall = wall.height > 2;

            const centerX = isHorizontal ? wall.x + wall.length / 2 : wall.x;
            const centerZ = isHorizontal ? wall.z : wall.z + wall.length / 2;
            const width = isHorizontal ? wall.length : wall.thickness;
            const depth = isHorizontal ? wall.thickness : wall.length;

            if (isBackgroundWall) {
                const geometry = new THREE.BoxGeometry(width, wall.height, depth);
                geometry.translate(centerX, wall.height / 2, centerZ);
                const uvs = geometry.attributes.uv;
                for (let i = 0; i < uvs.count; i++) {
                    // uvs.setXY(i, uvs.getX(i), uvs.getY(i)); // Keep default UVs
                }
                backgroundGeometries.push(geometry);
            } else {
                const bottomHeight = wall.height * 0.8;
                const topHeight = wall.height * 0.2;
                const bottomY = bottomHeight / 2;
                const topY = bottomHeight + topHeight / 2;

                const bottomGeo = new THREE.BoxGeometry(width, bottomHeight, depth);
                bottomGeo.translate(centerX, bottomY, centerZ);
                const bottomUVs = bottomGeo.attributes.uv;
                for (let i = 0; i < bottomUVs.count; i++) {
                    bottomUVs.setXY(i, bottomUVs.getX(i) * wall.length, bottomUVs.getY(i));
                }
                brickGeometries.push(bottomGeo);

                const topGeo = new THREE.BoxGeometry(width, topHeight, depth);
                topGeo.translate(centerX, topY, centerZ);
                const topUVs = topGeo.attributes.uv;
                for (let i = 0; i < topUVs.count; i++) {
                    topUVs.setXY(i, topUVs.getX(i) * wall.length, topUVs.getY(i));
                }
                goldGeometries.push(topGeo);
            }
        });

        return {
            brickGeometry: brickGeometries.length > 0 ? mergeBufferGeometries(brickGeometries) : null,
            goldGeometry: goldGeometries.length > 0 ? mergeBufferGeometries(goldGeometries) : null,
            backgroundGeometry: backgroundGeometries.length > 0 ? mergeBufferGeometries(backgroundGeometries) : null
        };
    }, [walls]);

    return (
        <group>
            {backgroundGeometry && (
                <mesh geometry={backgroundGeometry}>
                    <meshBasicMaterial map={backgroundTexture} color="#ffffff" />
                </mesh>
            )}
            {brickGeometry && (
                <mesh geometry={brickGeometry}>
                    <meshBasicMaterial map={brickTexture} />
                </mesh>
            )}
            {goldGeometry && (
                <mesh geometry={goldGeometry}>
                    <meshBasicMaterial map={goldTexture} />
                </mesh>
            )}
        </group>
    );
}

function Player({ position, direction, onPositionUpdate, walls, rotation, isPaused }) {
    const meshRef = useRef();
    const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/player.png');
    const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/player_secondary.png');

    const [currentFrame, setCurrentFrame] = useState(0);

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

        if (direction.x !== 0 || direction.z !== 0) {
            const speed = 4.5;
            const newX = position.x + direction.x * speed * delta;
            const newZ = position.z + direction.z * speed * delta;

            if (!checkCollision(newX, newZ, walls)) {
                onPositionUpdate(newX, newZ);
            }

            // Simple animation frame update
            const time = state.clock.getElapsedTime();
            const newFrame = Math.floor(time * animationSpeed) % frameCount;
            setCurrentFrame(newFrame);
        }
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

    const texture = getCurrentTexture().clone(); // Clone to avoid sharing state
    texture.repeat.set(1 / frameCount, 1);
    texture.offset.x = currentFrame / frameCount;

    return (
        <mesh
            ref={meshRef}
            position={[position.x, 0.5, position.z]}
            rotation={[-Math.PI / 4, rotation, 0]}
            scale={[getFlipX(), 1, 1]}
        >
            <planeGeometry args={[1.1, 1.1]} />
            <meshStandardMaterial
                map={texture}
                transparent={true}
                side={THREE.DoubleSide}
                alphaTest={0.5}
            />
        </mesh>
    );
}

function Collectible({ position }) {
    const texture = useLoader(THREE.TextureLoader, '/assets/collectible_bottle.png');
    useMemo(() => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
    }, [texture]);

    return (
        <mesh position={[position.x, 0.4, position.z]} rotation={[-Math.PI / 4, Math.PI / 4.8, 0]}>
            <planeGeometry args={[0.6, 0.6]} />
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

function Floor() {
    const texture = useLoader(THREE.TextureLoader, '/assets/suelos/floor_texture.jpg');
    useMemo(() => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(40 / 5, 45 / 5);
    }, [texture]);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, -0.1, 14]}>
            <planeGeometry args={[40, 45]} />
            <meshBasicMaterial map={texture} />
        </mesh>
    );
}

function CameraController({ targetX, targetZ }) {
    useFrame(({ camera }) => {
        const rotation = Math.PI / 4.8;
        const distance = 7;
        const height = 5;

        const offsetX = Math.sin(rotation) * distance;
        const offsetZ = Math.cos(rotation) * distance;

        // Smooth camera movement (lerp)
        camera.position.x += (targetX + offsetX - camera.position.x) * 0.1;
        camera.position.y = height;
        camera.position.z += (targetZ + offsetZ - camera.position.z) * 0.1;

        camera.lookAt(targetX, 0, targetZ);
    });
    return null;
}

// --- Main Component ---

export default function Level0({ onBack, onNextLevel, onLevelComplete, userId, language = 'en' }) {
    const gameUI = getGameUI(language);
    const [playerPos, setPlayerPos] = useState(INITIAL_PLAYER_POS);
    const [direction, setDirection] = useState({ x: 0, z: 0 });
    const [collectibles, setCollectibles] = useState(initialCollectibles);
    const [score, setScore] = useState(0);
    const [showTutorial, setShowTutorial] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [lives, setLives] = useState(3);
    const [showVictory, setShowVictory] = useState(false);
    const [showGameOver, setShowGameOver] = useState(false);
    const [startTime] = useState(Date.now()); // Para medir tiempo de juego

    const totalBeers = initialCollectibles.length;
    const beersCollected = totalBeers - collectibles.length;

    // Audio ref for visibility handling
    const musicRef = useRef(null);

    // Check for victory
    useEffect(() => {
        if (score >= 150 && !showVictory) {
            setShowVictory(true);
            setIsPaused(true);

            // Calcular tiempo transcurrido
            const timeSeconds = Math.floor((Date.now() - startTime) / 1000);

            // Guardar puntuación en Supabase
            if (userId) {
                console.log('💾 [Level0] Guardando puntuación para usuario:', userId);
                saveScore(userId, 0, score, beersCollected, timeSeconds)
                    .then(result => {
                        if (result.success) {
                            console.log('✅ [Level0] Puntuación guardada exitosamente');

                            // Enviar mensaje a la app nativa si existe
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'SCORE_SAVED',
                                    level: 0,
                                    score: score,
                                    beersCollected: beersCollected,
                                    time: timeSeconds
                                }));
                            }
                        } else {
                            console.error('❌ [Level0] Error guardando puntuación:', result.error);
                        }
                    })
                    .catch(err => {
                        console.error('❌ [Level0] Excepción guardando puntuación:', err);
                    });
            } else {
                console.warn('⚠️ [Level0] No hay userId, no se guardó la puntuación');
            }

            if (onLevelComplete) {
                onLevelComplete(0); // Level 0 completed, unlock level 1
            }
        }
    }, [score, showVictory, onLevelComplete, userId, beersCollected, startTime]);

    // Audio
    useEffect(() => {
        musicRef.current = new Audio('/assets/audio/music_background.mp3');
        musicRef.current.loop = true;
        musicRef.current.volume = 0.4;
        musicRef.current.play().catch(e => console.log("Audio play failed (user interaction required):", e));

        return () => {
            if (musicRef.current) {
                musicRef.current.pause();
                musicRef.current.currentTime = 0;
                musicRef.current = null;
            }
        };
    }, []);

    // Handle page visibility - pause music when page is hidden (browser closed, tab switched, etc.)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!musicRef.current) return;

            if (document.visibilityState === 'hidden') {
                musicRef.current.pause();
            } else if (document.visibilityState === 'visible') {
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
    }, []);

    const playCollectSound = () => {
        const sfx = new Audio('/assets/audio/sfx_collect.mp3');
        sfx.volume = 0.6;
        sfx.play().catch(e => console.log("SFX play failed:", e));
    };

    // Keyboard Controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showTutorial) {
                setShowTutorial(false); // Dismiss tutorial on any key
                return;
            }

            // DEBUG: Press 'P' to instantly win (for testing)
            if (e.key === 'p' || e.key === 'P') {
                setScore(200); // Trigger victory
                return;
            }

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    setDirection({ x: 0, z: -1 });
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    setDirection({ x: 0, z: 1 });
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    setDirection({ x: -1, z: 0 });
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    setDirection({ x: 1, z: 0 });
                    break;
            }
        };

        const handleKeyUp = (e) => {
            // Optional: Stop moving on key up, or keep moving like snake styling
            // Native app seemed to use swipe for continuous movement?
            // Let's implement continuous movement for now (snake-like) as per app logic "direction state"
            // But usually web games stop on key up. Let's try stop on key up for better control.

            const key = e.key.toLowerCase();
            const currentDir = direction;
            if (
                (key === 'w' && currentDir.z === -1) ||
                (key === 's' && currentDir.z === 1) ||
                (key === 'a' && currentDir.x === -1) ||
                (key === 'd' && currentDir.x === 1) ||
                (key === 'arrowup' && currentDir.z === -1) ||
                (key === 'arrowdown' && currentDir.z === 1) ||
                (key === 'arrowleft' && currentDir.x === -1) ||
                (key === 'arrowright' && currentDir.x === 1)
            ) {
                setDirection({ x: 0, z: 0 });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [showTutorial, direction]);

    // Touch/Swipe Controls for Mobile
    useEffect(() => {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        const minSwipeDistance = 30; // Minimum distance for a swipe

        const handleTouchStart = (e) => {
            // Allow buttons and interactive elements to work normally
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }

            if (showTutorial) {
                setShowTutorial(false);
                return;
            }
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchMove = (e) => {
            // Allow buttons and interactive elements to work normally
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }

            e.preventDefault();
            touchEndX = e.touches[0].clientX;
            touchEndY = e.touches[0].clientY;
        };

        const handleTouchEnd = () => {
            if (showTutorial) return;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            // Check if swipe distance is sufficient
            if (absDeltaX < minSwipeDistance && absDeltaY < minSwipeDistance) {
                return;
            }

            // Determine swipe direction
            if (absDeltaX > absDeltaY) {
                // Horizontal swipe
                if (deltaX > 0) {
                    setDirection({ x: 1, z: 0 }); // Right
                } else {
                    setDirection({ x: -1, z: 0 }); // Left
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    setDirection({ x: 0, z: 1 }); // Down
                } else {
                    setDirection({ x: 0, z: -1 }); // Up
                }
            }
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [showTutorial]);

    const handlePositionUpdate = (x, z) => {
        setPlayerPos({ x, z });

        // Collectibles collision
        setCollectibles(prev => {
            const remaining = prev.filter(c => {
                const dist = Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(z - c.z, 2));
                if (dist < 0.5) {
                    setScore(s => s + 10);
                    playCollectSound();
                    return false;
                }
                return true;
            });
            return remaining;
        });
    };

    return (
        <div className="level0-game-container">
            <Canvas camera={{ position: [12, 15, 20], fov: 60 }} shadows>
                <ambientLight intensity={1.5} />
                <pointLight position={[10, 10, 10]} intensity={2.0} />

                <Maze walls={walls} />
                <Floor />
                <Player
                    position={playerPos}
                    direction={direction}
                    onPositionUpdate={handlePositionUpdate}
                    walls={walls}
                    rotation={1.1} // Original prop
                    isPaused={isPaused}
                />

                {collectibles.map(c => (
                    <Collectible key={c.id} position={c} />
                ))}

                <CameraController targetX={playerPos.x} targetZ={playerPos.z} />
            </Canvas>

            {/* UI Overlay */}
            <div className="level0-ui-overlay">
                <LevelHeader
                    lives={lives}
                    levelNumber={1}
                    beersCollected={beersCollected}
                    score={score}
                    language={language}
                />

                <button className="level0-back-button-style" onClick={onBack}>
                    {gameUI.exit}
                </button>

                {showTutorial && (
                    <div className="level0-tutorial-modal-wrapper animate-fade-in">
                        <div className="level0-tutorial-content-box glass-panel">
                            <h2>{language === 'es' ? '¡Bienvenido!' : 'Welcome!'}</h2>
                            <p>{language === 'es' ? 'Usa las flechas o W/A/S/D para moverte.' : 'Use arrows or W/A/S/D to move.'}</p>
                            <p>{language === 'es' ? 'Recoge todas las cervezas' : 'Collect all the beers'}</p>
                            <button onClick={() => setShowTutorial(false)}>{gameUI.play}</button>
                        </div>
                    </div>
                )}

                {/* Game Over Modal - UNIQUE STYLE */}
                {showGameOver && (
                    <div className="level0-super-loss-modal-wrapper animate-fade-in">
                        <div className="level0-super-loss-content-box glass-panel">
                            <h2 className="level0-super-loss-main-title">{gameUI.youLost}</h2>
                            <p className="level0-super-loss-sub-message">{gameUI.outOfLives}</p>

                            <div className="level0-super-loss-stats-container">
                                <p className="level0-super-loss-stat-item">{gameUI.baseScore || 'Base Score'}: {score}</p>
                                <p className="level0-super-loss-stat-item">{gameUI.timeBonus || 'Time Bonus'}: 0</p>
                                <p className="level0-super-loss-stat-item highlight-total" style={{ color: '#ff6b6b' }}>{gameUI.totalScore || 'Total'}: {score}</p>
                                <p className="level0-super-loss-stat-item small-text">{gameUI.beersCollected}: {beersCollected}</p>
                            </div>

                            <div className="level0-super-loss-button-row">
                                <button
                                    className="level0-super-loss-button level0-super-loss-button-primary"
                                    onClick={() => {
                                        setShowGameOver(false);
                                        setScore(0);
                                        setCollectibles(generateCollectibles(80)); // Reset collectibles
                                        setPlayerPos(INITIAL_PLAYER_POS);
                                        setLives(3);
                                        setIsPaused(false);
                                    }}
                                >
                                    {gameUI.tryAgain}
                                </button>
                                <button
                                    className="level0-super-loss-button level0-super-loss-button-secondary"
                                    onClick={onBack}
                                >
                                    {gameUI.backToMenu}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>



            {/* Victory Modal - OUTSIDE ui-overlay para que z-index:999999 funcione */}
            {showVictory && (
                <div className="level0-super-victory-modal-wrapper animate-fade-in">
                    <div className="level0-super-victory-content-box glass-panel">
                        <h2 className="level0-super-victory-main-title">🎉 {gameUI.levelCompleted} 🎉</h2>
                        <p className="level0-super-victory-sub-message">{language === 'es' ? `Has conseguido ${score} puntos` : `You got ${score} points`}</p>
                        <div className="level0-super-victory-stats-container">
                            <p className="level0-super-victory-stat-item">{gameUI.beersCollected}: {beersCollected}/{totalBeers}</p>
                        </div>
                        <div className="level0-super-victory-button-row">
                            <button
                                className="level0-super-victory-button level0-super-victory-button-primary"
                                onClick={() => {
                                    if (onNextLevel) onNextLevel();
                                }}
                            >
                                {gameUI.nextLevel}
                            </button>
                            <button
                                className="level0-super-victory-button level0-super-victory-button-secondary"
                                onClick={onBack}
                            >
                                {gameUI.backToMenu}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
