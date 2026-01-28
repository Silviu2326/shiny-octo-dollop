import React, { useState, useEffect, useCallback, useRef } from 'react';
import './TetrisLevel.css';
import { Trophy, RotateCw, ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';

// Tetromino definitions
const TETROMINOS = {
    0: { shape: [[0]], color: '0, 0, 0' },
    I: {
        shape: [
            [0, 'I', 0, 0],
            [0, 'I', 0, 0],
            [0, 'I', 0, 0],
            [0, 'I', 0, 0]
        ],
        image: '/assets/cervezas/collectible_bottle.png',
        color: '80, 227, 230',
    },
    J: {
        shape: [
            [0, 'J', 0],
            [0, 'J', 0],
            ['J', 'J', 0]
        ],
        image: '/assets/cervezas/collectible_medusa.png',
        color: '36, 95, 223',
    },
    L: {
        shape: [
            [0, 'L', 0],
            [0, 'L', 0],
            [0, 'L', 'L']
        ],
        image: '/assets/cervezas/collectible_morena.png',
        color: '223, 173, 36',
    },
    O: {
        shape: [
            ['O', 'O'],
            ['O', 'O']
        ],
        image: '/assets/cervezas/collectible_sifrina.png',
        color: '223, 217, 36',
    },
    S: {
        shape: [
            [0, 'S', 'S'],
            ['S', 'S', 0],
            [0, 0, 0]
        ],
        image: '/assets/cervezas/collectible_candela.png',
        color: '48, 211, 56',
    },
    T: {
        shape: [
            [0, 0, 0],
            ['T', 'T', 'T'],
            [0, 'T', 0]
        ],
        image: '/assets/cervezas/collectible_guajira.png',
        color: '132, 61, 198',
    },
    Z: {
        shape: [
            ['Z', 'Z', 0],
            [0, 'Z', 'Z'],
            [0, 0, 0]
        ],
        image: '/assets/cervezas/collectible_bottle.png', // Reuse bottle for Z
        color: '227, 78, 78',
    },
};

const RANDOM_TETROMINO = () => {
    const tetrominos = 'IJLOSTZ';
    const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
    return TETROMINOS[randTetromino];
};

const STAGE_WIDTH = 12;
const STAGE_HEIGHT = 20;

const createStage = () =>
    Array.from(Array(STAGE_HEIGHT), () =>
        new Array(STAGE_WIDTH).fill([0, 'empty'])
    );

const checkCollision = (player, stage, { x: moveX, y: moveY }) => {
    for (let y = 0; y < player.tetromino.length; y += 1) {
        for (let x = 0; x < player.tetromino[y].length; x += 1) {
            // Check that we're on an actual Tetromino cell
            if (player.tetromino[y][x] !== 0) {
                if (
                    // 1. Check that our move is inside the game areas height (y)
                    !stage[y + player.pos.y + moveY] ||
                    // 2. Check that our move is inside the game areas width (x)
                    !stage[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
                    // 3. Check that the cell isn't set to clear (which means it's us)
                    stage[y + player.pos.y + moveY][x + player.pos.x + moveX][1] ===
                    'merged'
                ) {
                    return true;
                }
            }
        }
    }
    return false;
};

const TetrisLevel = ({ onBack, onNextLevel, onLevelComplete, userId }) => {
    const [stage, setStage] = useState(createStage());
    const [dropTime, setDropTime] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [rows, setRows] = useState(0);
    const [level, setLevel] = useState(0);

    const [player, setPlayer] = useState({
        pos: { x: 0, y: 0 },
        tetromino: TETROMINOS[0].shape,
        collided: false,
    });

    const [nextPiece, setNextPiece] = useState(RANDOM_TETROMINO());

    const movePlayer = (dir) => {
        if (!checkCollision(player, stage, { x: dir, y: 0 })) {
            setPlayer((prev) => ({ ...prev, pos: { ...prev.pos, x: prev.pos.x + dir } }));
        }
    };

    const startGame = () => {
        // Reset everything
        setStage(createStage());
        setDropTime(700);
        setGameOver(false);
        setScore(0);
        setRows(0);
        setLevel(0);

        // Initial random piece
        const initialPiece = RANDOM_TETROMINO();
        setPlayer({
            pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
            tetromino: initialPiece.shape,
            collided: false,
        });
        setNextPiece(RANDOM_TETROMINO());
    };

    const rotate = (matrix, dir) => {
        // Transpose
        const rotated = matrix.map((_, index) =>
            matrix.map((col) => col[index])
        );
        // Reverse each row to get a rotated matrix
        if (dir > 0) return rotated.map((row) => row.reverse());
        return rotated.reverse();
    };

    const playerRotate = (stage, dir) => {
        const clonedPlayer = JSON.parse(JSON.stringify(player));
        clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

        const pos = clonedPlayer.pos.x;
        let offset = 1;
        while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
            clonedPlayer.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > clonedPlayer.tetromino[0].length) {
                rotate(clonedPlayer.tetromino, -dir);
                clonedPlayer.pos.x = pos;
                return;
            }
        }
        setPlayer(clonedPlayer);
    };

    const drop = () => {
        // Increase level every 10 rows
        if (rows > (level + 1) * 10) {
            setLevel((prev) => prev + 1);
            // Increase speed
            setDropTime(1000 / (level + 1) + 200);
        }

        if (!checkCollision(player, stage, { x: 0, y: 1 })) {
            setPlayer((prev) => ({ ...prev, pos: { ...prev.pos, y: prev.pos.y + 1 } }));
        } else {
            // Game Over check
            if (player.pos.y < 1) {
                setGameOver(true);
                setDropTime(null);
            }
            setPlayer((prev) => ({ ...prev, collided: true }));
        }
    };

    const keyUp = ({ keyCode }) => {
        if (!gameOver) {
            if (keyCode === 40) { // Down arrow
                setDropTime(1000 / (level + 1) + 200);
            }
        }
    };

    const dropPlayer = () => {
        drop();
    };

    const move = ({ keyCode }) => {
        if (!gameOver) {
            if (keyCode === 37) { // Left
                movePlayer(-1);
            } else if (keyCode === 39) { // Right
                movePlayer(1);
            } else if (keyCode === 40) { // Down
                dropPlayer();
            } else if (keyCode === 38) { // Up (Rotate)
                playerRotate(stage, 1);
            }
        }
    };

    useInterval(() => {
        drop();
    }, dropTime);

    // Initial Start
    useEffect(() => {
        startGame();
        window.addEventListener('keydown', move);
        window.addEventListener('keyup', keyUp);
        return () => {
            window.removeEventListener('keydown', move);
            window.removeEventListener('keyup', keyUp);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Update stage
    useEffect(() => {
        const sweepRows = (newStage) => {
            return newStage.reduce((ack, row) => {
                if (row.findIndex((cell) => cell[0] === 0) === -1) {
                    setRows((prev) => prev + 1);
                    setScore((prev) => prev + 100); // 100 points per line
                    ack.unshift(new Array(newStage[0].length).fill([0, 'empty']));
                    return ack;
                }
                ack.push(row);
                return ack;
            }, []);
        };

        const updateStage = (prevStage) => {
            // First flush the stage from the previous render
            const newStage = prevStage.map((row) =>
                row.map((cell) => (cell[1] === 'clear' ? [0, 'empty'] : cell))
            );

            // Then draw the tetromino
            player.tetromino.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        if (
                            newStage[y + player.pos.y] &&
                            newStage[y + player.pos.y][x + player.pos.x]
                        ) {
                            newStage[y + player.pos.y][x + player.pos.x] = [
                                value,
                                `${player.collided ? 'merged' : 'clear'}`,
                            ];
                        }
                    }
                });
            });

            // Then check collisions
            if (player.collided) {
                setPlayer({
                    pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
                    tetromino: nextPiece.shape,
                    collided: false,
                });
                setNextPiece(RANDOM_TETROMINO());
                return sweepRows(newStage);
            }

            return newStage;
        };

        setStage((prev) => updateStage(prev));

    }, [player, nextPiece]);

    // Check for level complete (e.g. 1000 points)
    useEffect(() => {
        if (score >= 1000 && !gameOver) {
            // Option to auto-win or just persist high score
            // For now, let's say 1000 points unlocks next level
            onLevelComplete(9); // Assuming 9 is Tetris Level ID
        }
    }, [score, gameOver, onLevelComplete]);

    return (
        <div className="tetris-container" role="button" tabIndex="0" onKeyDown={move} onKeyUp={keyUp}>
            <div className="tetris-header">
                <h2>TETRIS CHALLENGE</h2>
                <p>Consigue 1000 puntos para ganar</p>
            </div>

            <div className="tetris-game-area">
                <div className="tetris-board">
                    {stage.map((row, y) =>
                        row.map((cell, x) => (
                            <Cell key={`${x}-${y}`} type={cell[0]} />
                        ))
                    )}
                </div>

                <div className="tetris-stats">
                    <div className="stat-box">
                        <div className="stat-label">Puntuación</div>
                        <div className="stat-value">{score}</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-label">Líneas</div>
                        <div className="stat-value">{rows}</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-label">Nivel</div>
                        <div className="stat-value">{level}</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-label">Siguiente</div>
                        <div className="next-piece-preview">
                            {createPreview(nextPiece)}
                        </div>
                    </div>

                    <button className="back-btn" onClick={onBack} style={{ marginTop: 'auto', width: '100%', fontSize: '14px' }}>
                        Salir
                    </button>
                </div>
            </div>

            <div className="tetris-controls-mobile">
                <div className="control-btn control-left" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); movePlayer(-1); }}><ArrowLeft /></div>
                <div className="control-btn control-rotate" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); playerRotate(stage, 1); }}><RotateCw /></div>
                <div className="control-btn control-right" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); movePlayer(1); }}><ArrowRight /></div>
                <div className="control-btn control-down" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); dropPlayer(); }}><ArrowDown /></div>
            </div>

            {gameOver && (
                <div className="game-over-modal">
                    <h1 className="game-over-title">GAME OVER</h1>
                    <p className="game-over-score">Puntuación final: {score}</p>
                    <div>
                        <button className="restart-btn" onClick={startGame}>Reintentar</button>
                        <button className="back-btn" onClick={onBack}>Salir</button>
                    </div>
                </div>
            )}

            {score >= 1000 && (
                <div className="game-over-modal" style={{ background: 'rgba(0, 100, 0, 0.9)' }}>
                    <Trophy size={64} color="gold" style={{ marginBottom: 20 }} />
                    <h1 className="game-over-title" style={{ color: 'gold' }}>¡NIVEL COMPLETADO!</h1>
                    <p className="game-over-score">¡Has superado los 1000 puntos!</p>
                    <button className="restart-btn" onClick={() => onNextLevel()}>Siguiente Nivel</button>
                </div>
            )}
        </div>
    );
};

// Helper for custom interval hook
function useInterval(callback, delay) {
    const savedCallback = useRef();

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}

// Sub-component for individual cell
// Sub-component for individual cell
const Cell = React.memo(({ type }) => {
    const isFilled = type !== 0;
    const tetromino = TETROMINOS[type];

    return (
        <div className={`tetris-cell ${isFilled ? 'cell-filled' : 'cell-empty'}`}>
            {isFilled && tetromino.image && (
                <div style={{
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    width: '80%',
                    height: '80%',
                    backgroundImage: `url(${tetromino.image})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    zIndex: 1,
                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))'
                }} />
            )}
            {/* Optional background tint based on piece color if needed, but glass effect covers it */}
            {isFilled && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: `rgba(${tetromino.color}, 0.2)`, /* Subtle tint matching the original color */
                    borderRadius: '4px'
                }} />
            )}
        </div>
    );
});

// Helper to render next piece preview
const createPreview = (tetromino) => {
    // Create a 4x4 grid
    const grid = Array(4).fill(0).map(() => Array(4).fill(0));
    const shape = tetromino.shape;

    // Center logic approximate
    const startX = Math.floor((4 - shape[0].length) / 2);
    const startY = Math.floor((4 - shape.length) / 2);

    return grid.map((row, y) =>
        row.map((_, x) => {
            let type = 0;
            if (y >= startY && y < startY + shape.length) {
                if (x >= startX && x < startX + shape[0].length) {
                    type = shape[y - startY][x - startX];
                }
            }

            const isFilled = type !== 0;
            const tetromino = TETROMINOS[type] || {};

            return (
                <div
                    key={`${y}-${x}`}
                    className="preview-cell"
                    style={{
                        position: 'relative',
                        backgroundColor: isFilled ? 'rgba(255,255,55,0.1)' : 'transparent',
                        borderRadius: '2px'
                    }}
                >
                    {isFilled && tetromino.image && (
                        <div style={{
                            position: 'absolute',
                            top: '5%',
                            left: '5%',
                            width: '90%',
                            height: '90%',
                            backgroundImage: `url(${tetromino.image})`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }} />
                    )}
                </div>
            );
        })
    );
};

export default TetrisLevel;
