import React, { useState, useEffect, useRef, useCallback } from 'react';
import './FroggerLevel.css';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Heart, Trophy } from 'lucide-react';

// Configuration
const GRID_ROWS = 11;
const GRID_COLS = 9;
const GAME_SPEED = 16; // ~60fps

// Row Types
// 0: Goal
// 1-4: River (Logs/Turtles)
// 5: Safe Zone (Middle)
// 6-9: Road (Cars)
// 10: Start

const INITIAL_PLAYER = { x: 4, y: 10 }; // Center bottom

const OBSTACLES_CONFIG = [
    // River (Left to Right, Right to Left...)
    { row: 1, type: 'log', speed: 0.003, width: 2, image: '/assets/cervezas/collectible_bottle.png', count: 3 },
    { row: 2, type: 'log', speed: -0.005, width: 3, image: '/assets/cervezas/collectible_bottle.png', count: 2 },
    { row: 3, type: 'log', speed: 0.006, width: 2, image: '/assets/cervezas/collectible_bottle.png', count: 3 },
    { row: 4, type: 'log', speed: -0.004, width: 2, image: '/assets/cervezas/collectible_bottle.png', count: 3 },

    // Road
    { row: 6, type: 'car', speed: -0.005, width: 1, image: '/assets/barriles/barrel_chatgpt.png', count: 3 },
    { row: 7, type: 'car', speed: 0.008, width: 1, image: '/assets/cervezas/collectible_medusa.png', count: 2 },
    { row: 8, type: 'car', speed: -0.006, width: 1, image: '/assets/barriles/barrel_chatgpt.png', count: 3 },
    { row: 9, type: 'car', speed: 0.004, width: 1, image: '/assets/cervezas/collectible_medusa.png', count: 3 },
];

const FroggerLevel = ({ onBack, onNextLevel, onLevelComplete }) => {
    const [playerPos, setPlayerPos] = useState(INITIAL_PLAYER);
    const [entities, setEntities] = useState([]);
    const [lives, setLives] = useState(3);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState('playing'); // playing, won, lost
    const [gameTime, setGameTime] = useState(0);

    const requestRef = useRef();
    const playerRef = useRef(INITIAL_PLAYER); // Ref for loop access without closure staleness
    const entitiesRef = useRef([]);

    // Initialize Entities
    useEffect(() => {
        let newEntities = [];
        let idCounter = 0;

        OBSTACLES_CONFIG.forEach(config => {
            const spacing = 1 / config.count;
            for (let i = 0; i < config.count; i++) {
                newEntities.push({
                    id: idCounter++,
                    row: config.row,
                    x: i * spacing + Math.random() * 0.1, // Initial offset spread
                    width: config.width / GRID_COLS, // Normalized width
                    speed: config.speed,
                    type: config.type,
                    image: config.image
                });
            }
        });

        setEntities(newEntities);
        entitiesRef.current = newEntities;
        playerRef.current = INITIAL_PLAYER;
    }, [lives]); // Re-init on life loss if we wanted full reset, but usually just player resets

    // Game Loop
    const animate = useCallback((time) => {
        if (gameState !== 'playing') return;

        // Update Entities
        entitiesRef.current = entitiesRef.current.map(entity => {
            let newX = entity.x + entity.speed;
            if (newX > 1.2) newX = -0.2; // Wrap right
            if (newX < -0.2) newX = 1.2; // Wrap left
            return { ...entity, x: newX };
        });

        setEntities([...entitiesRef.current]);

        // Check Collisions
        checkCollisions();

        requestRef.current = requestAnimationFrame(animate);
    }, [gameState]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [animate]);

    const checkCollisions = () => {
        const pX = playerRef.current.x / (GRID_COLS - 1); // Normalize player X to 0-1
        const pY = playerRef.current.y;
        // Player is roughly 1 cell wide, so 1/GRID_COLS
        const pWidth = 0.6 / GRID_COLS; // Hitbox slightly smaller than visual

        let onLog = false;
        let inRiver = pY >= 1 && pY <= 4;

        for (let ent of entitiesRef.current) {
            if (ent.row === pY) {
                // Check Overlap
                // Entity is at ent.x (0-1 range). 
                // Player is approximately at (playerRef.current.x / GRID_COLS) (0-1 range but discrete steps usually)

                // Let's stick to normalized X for everything to make it smooth
                // Player visual X is discreet grid, but conceptually could be smooth. 
                // For classic frogger, player hops are discrete.

                const entStart = ent.x;
                const entEnd = ent.x + (ent.width); // width is already normalized

                // Normalize player position for interaction
                const playerCenter = (playerRef.current.x + 0.5) / GRID_COLS;

                // Simply check if player center is within entity X range
                if (playerCenter > entStart && playerCenter < entEnd) {
                    if (ent.type === 'car') {
                        handleDeath();
                        return;
                    } else if (ent.type === 'log') {
                        onLog = true;
                        // Move player with log
                        const newGridX = playerRef.current.x + (ent.speed * GRID_COLS); // Approximate movement mapping back to grid units? 
                        // No, keeping player on grid is better for "hopping" game feel, 
                        // BUT in Frogger you drift.

                        // Let's implement Drift:
                        // We need floating point player X for drift
                        // Updating playerRef directly with drift
                        // THIS IS TRICKY mixing grid movement and drift.
                        // Simplified: Just die if in river and NOT colliding.
                    }
                }
            }
        }

        if (inRiver && !onLog) {
            handleDeath();
        }
    };

    const handleDeath = () => {
        setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
                setGameState('lost');
            }
            return newLives;
        });
        // Reset player
        setPlayerPos(INITIAL_PLAYER);
        playerRef.current = INITIAL_PLAYER;
    };

    const handleWin = () => {
        setScore(s => s + 1000);
        setGameState('won');
    };

    const movePlayer = (dx, dy) => {
        if (gameState !== 'playing') return;

        const newPos = {
            x: Math.max(0, Math.min(GRID_COLS - 1, playerRef.current.x + dx)),
            y: Math.max(0, Math.min(GRID_ROWS - 1, playerRef.current.y + dy))
        };

        setPlayerPos(newPos);
        playerRef.current = newPos;

        // Score for moving up
        if (dy < 0) setScore(s => s + 10);

        // Check Win
        if (newPos.y === 0) {
            handleWin();
        }
    };

    return (
        <div className="frogger-container">
            <div className="frogger-header">
                <h2>FROGGER BEER</h2>
                <div className="frogger-stats">
                    <div className="lives-container">
                        {[...Array(lives)].map((_, i) => <Heart key={i} fill="red" color="red" size={20} />)}
                    </div>
                    <span>SCORE: {score}</span>
                </div>
            </div>

            <div className="frogger-game-area">
                {/* Environment Layers */}
                <div className="river-zone" />
                <div className="road-zone" />
                <div className="safe-zone zone-start" />
                <div className="safe-zone zone-middle" />
                <div className="safe-zone zone-goal">
                    {[...Array(5)].map((_, i) => <div key={i} className="goal-slot" />)}
                </div>

                {/* Render Entities */}
                {entities.map(ent => (
                    <div
                        key={ent.id}
                        className={`sprite entity-${ent.type}`}
                        style={{
                            left: `${ent.x * 100}%`,
                            top: `${(ent.row / GRID_ROWS) * 100}%`,
                            width: `${ent.width * 100}%`, // proportional width
                            height: `${100 / GRID_ROWS}%`,
                            backgroundImage: `url(${ent.image})`,
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                        }}
                    />
                ))}

                {/* Render Player */}
                <div
                    className="sprite player"
                    style={{
                        left: `${(playerPos.x / GRID_COLS) * 100}%`,
                        top: `${(playerPos.y / GRID_ROWS) * 100}%`,
                        width: `${100 / GRID_COLS}%`,
                        height: `${100 / GRID_ROWS}%`,
                        backgroundImage: 'url("/assets/drive-download-20260109T123100Z-1-001/COOL CAT.png")',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.5))'
                    }}
                />
            </div>

            <div className="frogger-controls">
                <div></div>
                <div className="control-btn btn-up" onPointerDown={() => movePlayer(0, -1)}><ArrowUp /></div>
                <div></div>
                <div className="control-btn btn-left" onPointerDown={() => movePlayer(-1, 0)}><ArrowLeft /></div>
                <div className="control-btn btn-down" onPointerDown={() => movePlayer(0, 1)}><ArrowDown /></div>
                <div className="control-btn btn-right" onPointerDown={() => movePlayer(1, 0)}><ArrowRight /></div>
            </div>

            {gameState === 'lost' && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>GAME OVER</h2>
                        <button className="restart-btn" onClick={() => { setLives(3); setScore(0); setGameState('playing'); }}>Reintentar</button>
                        <button className="back-btn" onClick={onBack}>Salir</button>
                    </div>
                </div>
            )}

            {gameState === 'won' && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <Trophy size={64} color="gold" />
                        <h2>¡AMETA ALCANZADA!</h2>
                        <p>Has cruzado el bar con éxito.</p>
                        <button className="restart-btn" onClick={() => onNextLevel()}>Siguiente Nivel</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default FroggerLevel;
