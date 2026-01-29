import React, { useState, useEffect, useRef, useCallback } from 'react';
import './FroggerLevel.css';
import './FroggerLevelButtons.css';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Heart, Trophy, Beer, Star } from 'lucide-react';
import { getGameUI } from '../utils/translations';

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
    // River (Left to Right, Right to Left...) - TRONCOS flotantes
    { row: 1, type: 'log', speed: 0.003, width: 2, count: 3 },
    { row: 2, type: 'log', speed: -0.005, width: 3, count: 2 },
    { row: 3, type: 'log', speed: 0.006, width: 2, count: 3 },

    // Road - BARRILES de cerveza rodando
    { row: 6, type: 'barrel', speed: -0.005, width: 1.2, count: 3 },
    { row: 7, type: 'barrel', speed: 0.008, width: 1.2, count: 2 },
    { row: 8, type: 'barrel', speed: -0.006, width: 1.2, count: 3 },
];

const FroggerLevel = ({ onBack, onNextLevel, onLevelComplete, language = 'en' }) => {
    // Configuration defined directly to ensure updates
    const gameUI = getGameUI(language);


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
    }, [lives]); // Re-init on life loss

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

        // Update Player Render (important for drift)
        // We only update if state is playing to avoid overwriting reset on death
        if (gameState === 'playing') {
            setPlayerPos({ ...playerRef.current });
        }

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
                    if (ent.type === 'barrel') {
                        handleDeath();
                        return;
                    } else if (ent.type === 'log') {
                        onLog = true;
                        // Move player with log
                        // ent.speed is normalized (0-1), map to grid units
                        playerRef.current.x += ent.speed * GRID_COLS;
                    }
                }
            }
        }

        if (inRiver) {
            if (!onLog) {
                handleDeath();
            } else {
                // Check edge death (drifted off screen)
                // Allow a small buffer (0.5) before killing
                if (playerRef.current.x < -0.5 || playerRef.current.x > GRID_COLS - 0.5) {
                    handleDeath();
                }
            }
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
                <h2><Beer size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />FROGGER BEER<Beer size={24} style={{ verticalAlign: 'middle', marginLeft: '8px' }} /></h2>
                <div className="frogger-stats">
                    <div className="lives-container">
                        {[...Array(lives)].map((_, i) => <Heart key={i} fill="#ff4757" color="#ff6b81" size={18} />)}
                    </div>
                    <span><Star size={14} style={{ verticalAlign: 'middle', marginRight: '4px', color: '#ffd54f' }} />{score}</span>
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
                            ...(ent.image ? {
                                backgroundImage: `url(${ent.image})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                            } : {})
                        }}
                    >
                        {/* Inner detail for log if needed, can be done in CSS */}
                    </div>
                ))}

                {/* Render Player */}
                <div
                    className="sprite player"
                    style={{
                        left: `${(playerPos.x / GRID_COLS) * 100}%`,
                        top: `${(playerPos.y / GRID_ROWS) * 100}%`,
                        width: `${100 / GRID_COLS}%`,
                        height: `${100 / GRID_ROWS}%`,
                        backgroundImage: 'url("/assets/drive-download-20260109T123100Z-1-001/image-removebg-preview (33).png")',
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
                        <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                            <Beer size={48} color="#e74c3c" style={{ animation: 'trophyBounce 1s ease-in-out infinite' }} />
                        </div>
                        <h2>{gameUI.gameOver}</h2>
                        <p style={{ marginBottom: '20px', opacity: 0.8 }}>{gameUI.beerSpilled}</p>
                        <div className="modal-buttons">
                            <button className="restart-btn" onClick={() => { setLives(3); setScore(0); setGameState('playing'); }}>{gameUI.tryAgain}</button>
                            <button className="back-btn" onClick={onBack}>{gameUI.exit}</button>
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'won' && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <Trophy size={72} color="#ffd700" style={{ filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))' }} />
                            <Star size={24} color="#ffd700" style={{ position: 'absolute', top: '-10px', right: '-15px', animation: 'heartPulse 0.5s ease-in-out infinite' }} />
                            <Star size={18} color="#ffd700" style={{ position: 'absolute', top: '5px', left: '-20px', animation: 'heartPulse 0.7s ease-in-out infinite' }} />
                        </div>
                        <h2>{gameUI.goalReached}</h2>
                        <p>{gameUI.crossedBarSuccess} {score}</p>
                        <div className="modal-buttons">
                            <button className="restart-btn" onClick={() => onNextLevel()}>{gameUI.nextLevel}</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default FroggerLevel;
