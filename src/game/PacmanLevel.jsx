import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import './PacmanLevel.css';

// Constants - moved outside component to prevent recreation
const TILE_SIZE = 24;
const MAP_ROWS = 20;
const MAP_COLS = 19;
const PACMAN_SPEED = 0.1;
const GHOST_SPEED = 0.05;
const CANVAS_WIDTH = MAP_COLS * TILE_SIZE;
const CANVAS_HEIGHT = MAP_ROWS * TILE_SIZE;

// Pre-computed directions for ghost AI
const DIRECTIONS = [
    { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
];

const INITIAL_MAP = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 3, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 3, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 2, 1, 2, 1, 1, 1, 0, 1, 1, 1, 1],
    [2, 2, 2, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 1, 0, 1, 2, 2, 2],
    [1, 1, 1, 1, 0, 1, 2, 1, 1, 4, 1, 1, 2, 1, 0, 1, 1, 1, 1],
    [2, 2, 2, 2, 0, 2, 2, 1, 4, 4, 4, 1, 2, 2, 0, 2, 2, 2, 2],
    [1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1],
    [2, 2, 2, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 1, 0, 1, 2, 2, 2],
    [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 3, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Pre-compute total dots and wall neighbor data
const TOTAL_DOTS = INITIAL_MAP.flat().filter(c => c === 0 || c === 3).length;

const isWallAt = (x, y) => {
    if (y < 0 || y >= MAP_ROWS || x < 0 || x >= MAP_COLS) return false;
    return INITIAL_MAP[y][x] === 1;
};

// Pre-compute wall neighbor data for rendering optimization
const WALL_DATA = [];
for (let y = 0; y < MAP_ROWS; y++) {
    WALL_DATA[y] = [];
    for (let x = 0; x < MAP_COLS; x++) {
        if (INITIAL_MAP[y][x] === 1) {
            WALL_DATA[y][x] = {
                hasTop: isWallAt(x, y - 1),
                hasBottom: isWallAt(x, y + 1),
                hasLeft: isWallAt(x - 1, y),
                hasRight: isWallAt(x + 1, y),
                hasTopLeft: isWallAt(x - 1, y - 1),
                hasTopRight: isWallAt(x + 1, y - 1),
                hasBottomLeft: isWallAt(x - 1, y + 1),
                hasBottomRight: isWallAt(x + 1, y + 1)
            };
        }
    }
}

// Ghost colors - avoid recreating arrays
const GHOST_COLORS = ['#8B4513', '#D2691E', '#F5F5DC', '#2F2F2F'];
const COLLAR_COLORS = ['#ef4444', '#8b5cf6', '#22d3ee', '#f472b6'];

function PacmanLevel({ onBack, onNextLevel, onLevelComplete }) {
    const canvasRef = useRef(null);
    const wallCanvasRef = useRef(null); // Offscreen canvas for static walls
    const animFrameRef = useRef(null);
    const [score, setScore] = useState(0);
    const [gameActive, setGameActive] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [win, setWin] = useState(false);
    const [bottleImage, setBottleImage] = useState(null);
    const [activeDir, setActiveDir] = useState(null); // For button visual feedback

    // Game State - single ref to avoid multiple refs
    const gameState = useRef({
        map: null,
        pacman: { x: 9, y: 16, dirX: 0, dirY: 0, nextDirX: 0, nextDirY: 0 },
        ghosts: [
            { x: 9, y: 8, dirX: 0, dirY: 0 },
            { x: 8, y: 10, dirX: 0, dirY: 0 },
            { x: 10, y: 10, dirX: 0, dirY: 0 },
            { x: 9, y: 10, dirX: 0, dirY: 0 }
        ],
        score: 0,
        dotsLeft: TOTAL_DOTS,
        frameCount: 0,
        wallsDrawn: false
    });

    // Initialize map on mount
    useEffect(() => {
        gameState.current.map = INITIAL_MAP.map(row => [...row]);
        gameState.current.dotsLeft = TOTAL_DOTS;
    }, []);

    // Load bottle image
    useEffect(() => {
        const img = new Image();
        img.src = '/assets/collectible_bottle.png';
        img.onload = () => setBottleImage(img);
    }, []);

    // Direction input handler - memoized
    const handleDirectionInput = useCallback((dir) => {
        if (!gameActive) return;
        setActiveDir(dir);
        const p = gameState.current.pacman;
        switch (dir) {
            case 'up': p.nextDirX = 0; p.nextDirY = -1; break;
            case 'down': p.nextDirX = 0; p.nextDirY = 1; break;
            case 'left': p.nextDirX = -1; p.nextDirY = 0; break;
            case 'right': p.nextDirX = 1; p.nextDirY = 0; break;
        }
    }, [gameActive]);

    const handleDirectionRelease = useCallback((dir) => {
        setActiveDir(prev => prev === dir ? null : prev);
    }, []);

    // Keyboard controls
    useEffect(() => {
        const keyMap = {
            ArrowUp: 'up', w: 'up', W: 'up',
            ArrowDown: 'down', s: 'down', S: 'down',
            ArrowLeft: 'left', a: 'left', A: 'left',
            ArrowRight: 'right', d: 'right', D: 'right'
        };

        const handleKeyDown = (e) => {
            const dir = keyMap[e.key];
            if (dir) handleDirectionInput(dir);
        };

        const handleKeyUp = (e) => {
            const dir = keyMap[e.key];
            if (dir) handleDirectionRelease(dir);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleDirectionInput, handleDirectionRelease]);

    // Optimized Game Loop
    useEffect(() => {
        if (!gameActive || gameOver || win) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });

        // Create offscreen canvas for walls (drawn once)
        if (!wallCanvasRef.current) {
            wallCanvasRef.current = document.createElement('canvas');
            wallCanvasRef.current.width = CANVAS_WIDTH;
            wallCanvasRef.current.height = CANVAS_HEIGHT;
        }

        const update = () => {
            const state = gameState.current;
            state.frameCount++;
            const { pacman: p, ghosts, map } = state;

            // --- PACMAN MOVEMENT (optimized - no object creation) ---
            const tileX = Math.round(p.x);
            const tileY = Math.round(p.y);
            let dx = p.dirX * PACMAN_SPEED;
            let dy = p.dirY * PACMAN_SPEED;

            let crossedCenter = false;
            if (p.dirX > 0 && p.x < tileX && (p.x + dx) >= tileX) crossedCenter = true;
            else if (p.dirX < 0 && p.x > tileX && (p.x + dx) <= tileX) crossedCenter = true;
            else if (p.dirY > 0 && p.y < tileY && (p.y + dy) >= tileY) crossedCenter = true;
            else if (p.dirY < 0 && p.y > tileY && (p.y + dy) <= tileY) crossedCenter = true;
            else if (p.dirX === 0 && p.dirY === 0 && Math.abs(p.x - tileX) < 0.1 && Math.abs(p.y - tileY) < 0.1) {
                p.x = tileX;
                p.y = tileY;
                crossedCenter = true;
            }

            if (crossedCenter) {
                p.x = tileX;
                p.y = tileY;

                // Try next direction
                if (p.nextDirX !== 0 || p.nextDirY !== 0) {
                    const nextTx = tileX + p.nextDirX;
                    const nextTy = tileY + p.nextDirY;
                    if (map[nextTy] && map[nextTy][nextTx] !== 1) {
                        p.dirX = p.nextDirX;
                        p.dirY = p.nextDirY;
                    }
                }

                // Check wall collision
                const nextTx = tileX + p.dirX;
                const nextTy = tileY + p.dirY;
                if (!map[nextTy] || map[nextTy][nextTx] === 1) {
                    p.dirX = 0;
                    p.dirY = 0;
                }

                dx = p.dirX * PACMAN_SPEED;
                dy = p.dirY * PACMAN_SPEED;
            } else if (p.nextDirX === -p.dirX && p.nextDirY === -p.dirY) {
                p.dirX = p.nextDirX;
                p.dirY = p.nextDirY;
                dx = p.dirX * PACMAN_SPEED;
                dy = p.dirY * PACMAN_SPEED;
            }

            p.x += dx;
            p.y += dy;

            // Wrap around
            if (p.x < 0) p.x = MAP_COLS - 1;
            else if (p.x >= MAP_COLS) p.x = 0;

            // Eat dots
            const currentTileX = Math.round(p.x);
            const currentTileY = Math.round(p.y);
            const cell = map[currentTileY]?.[currentTileX];
            if (cell === 0 || cell === 3) {
                if (cell === 0) state.score += 10;
                map[currentTileY][currentTileX] = 2;
                state.dotsLeft--;
                setScore(state.score);

                if (state.dotsLeft <= 0) {
                    setWin(true);
                    onLevelComplete?.(8);
                    return;
                }
            }

            // --- GHOST MOVEMENT (optimized) ---
            for (let i = 0; i < ghosts.length; i++) {
                const g = ghosts[i];
                const gx = Math.round(g.x);
                const gy = Math.round(g.y);

                if (Math.abs(g.x - gx) < 0.1 && Math.abs(g.y - gy) < 0.1) {
                    // At center - choose direction
                    let validDirs = [];
                    for (let d = 0; d < 4; d++) {
                        const dir = DIRECTIONS[d];
                        // Don't reverse
                        if (dir.x === -g.dirX && dir.y === -g.dirY && (g.dirX !== 0 || g.dirY !== 0)) continue;
                        // Check wall
                        const nx = gx + dir.x;
                        const ny = gy + dir.y;
                        if (map[ny] && map[ny][nx] !== 1) {
                            validDirs.push(dir);
                        }
                    }

                    if (validDirs.length > 0) {
                        const chosen = validDirs[(Math.random() * validDirs.length) | 0];
                        g.dirX = chosen.x;
                        g.dirY = chosen.y;
                    } else {
                        g.dirX = -g.dirX;
                        g.dirY = -g.dirY;
                    }
                }

                g.x += g.dirX * GHOST_SPEED;
                g.y += g.dirY * GHOST_SPEED;

                // Collision check
                const distSq = (g.x - p.x) ** 2 + (g.y - p.y) ** 2;
                if (distSq < 0.25) {
                    setGameOver(true);
                    return;
                }
            }

            // --- RENDER ---
            draw(ctx, state);
            animFrameRef.current = requestAnimationFrame(update);
        };

        animFrameRef.current = requestAnimationFrame(update);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [gameActive, gameOver, win, onLevelComplete]);

    // Simplified wall segment drawing
    const drawWallSegments = useCallback((ctx, px, py, wd) => {
        const inset = 3;
        ctx.beginPath();

        if (!wd.hasTop) {
            ctx.moveTo(wd.hasLeft ? px : px + inset, py + inset);
            ctx.lineTo(wd.hasRight ? px + TILE_SIZE : px + TILE_SIZE - inset, py + inset);
        }
        if (!wd.hasBottom) {
            ctx.moveTo(wd.hasLeft ? px : px + inset, py + TILE_SIZE - inset);
            ctx.lineTo(wd.hasRight ? px + TILE_SIZE : px + TILE_SIZE - inset, py + TILE_SIZE - inset);
        }
        if (!wd.hasLeft) {
            ctx.moveTo(px + inset, wd.hasTop ? py : py + inset);
            ctx.lineTo(px + inset, wd.hasBottom ? py + TILE_SIZE : py + TILE_SIZE - inset);
        }
        if (!wd.hasRight) {
            ctx.moveTo(px + TILE_SIZE - inset, wd.hasTop ? py : py + inset);
            ctx.lineTo(px + TILE_SIZE - inset, wd.hasBottom ? py + TILE_SIZE : py + TILE_SIZE - inset);
        }
        ctx.stroke();
    }, []);

    // Optimized draw function with caching
    const draw = useCallback((ctx, state) => {
        const { map, pacman, ghosts } = state;
        const fc = state.frameCount;

        // Clear and draw background (solid color is faster than gradient every frame)
        ctx.fillStyle = '#0a2540';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw walls (use pre-computed data, minimal shadows)
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;

        for (let y = 0; y < MAP_ROWS; y++) {
            for (let x = 0; x < MAP_COLS; x++) {
                if (INITIAL_MAP[y][x] === 1) {
                    const px = x * TILE_SIZE;
                    const py = y * TILE_SIZE;
                    const wd = WALL_DATA[y][x];

                    // Simple wall fill
                    ctx.fillStyle = 'rgba(8, 145, 178, 0.3)';
                    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);

                    // Draw border segments
                    drawWallSegments(ctx, px, py, wd);
                }
            }
        }

        // Draw dots and power pellets
        const halfTile = TILE_SIZE / 2;
        for (let y = 0; y < MAP_ROWS; y++) {
            for (let x = 0; x < MAP_COLS; x++) {
                const cell = map[y][x];
                if (cell === 0 || cell === 3) {
                    const cx = x * TILE_SIZE + halfTile;
                    const cy = y * TILE_SIZE + halfTile;

                    if (cell === 0) {
                        if (bottleImage) {
                            ctx.drawImage(bottleImage, cx - 8, cy - 8, 16, 16);
                        } else {
                            ctx.fillStyle = '#7dd3fc';
                            ctx.beginPath();
                            ctx.arc(cx, cy, 3, 0, 6.283);
                            ctx.fill();
                        }
                    } else {
                        // Power pellet with simple pulse
                        const pulse = 7 + 2 * Math.sin(fc * 0.08);
                        ctx.fillStyle = '#e879f9';
                        ctx.beginPath();
                        ctx.arc(cx, cy, pulse, 0, 6.283);
                        ctx.fill();
                        ctx.fillStyle = '#fff';
                        ctx.beginPath();
                        ctx.arc(cx, cy, pulse * 0.3, 0, 6.283);
                        ctx.fill();
                    }
                }
            }
        }

        // Draw Pacman
        const px = pacman.x * TILE_SIZE + halfTile;
        const py = pacman.y * TILE_SIZE + halfTile;

        ctx.save();
        ctx.translate(px, py);
        ctx.fillStyle = '#fdba74';

        const mouthSize = 0.2 * Math.PI * Math.abs(Math.sin(fc * 0.2));
        let angle = 0;
        if (pacman.dirX === 1) angle = 0;
        else if (pacman.dirX === -1) angle = Math.PI;
        else if (pacman.dirY === 1) angle = Math.PI / 2;
        else if (pacman.dirY === -1) angle = -Math.PI / 2;

        ctx.beginPath();
        ctx.arc(0, 0, TILE_SIZE / 2 - 2, angle + mouthSize, angle + 6.283 - mouthSize);
        ctx.lineTo(0, 0);
        ctx.fill();

        // Eye
        const eyeX = pacman.dirX !== 0 ? -pacman.dirX * 3 : 0;
        const eyeY = pacman.dirY !== 0 ? -pacman.dirY * 3 : -3;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 3, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(eyeX + (pacman.dirX || 0), eyeY + (pacman.dirY || 0), 1.5, 0, 6.283);
        ctx.fill();
        ctx.restore();

        // Draw Dogs (simplified for performance)
        for (let i = 0; i < ghosts.length; i++) {
            const g = ghosts[i];
            const gx = g.x * TILE_SIZE + halfTile;
            const gy = g.y * TILE_SIZE + halfTile;

            ctx.save();
            ctx.translate(gx, gy);

            const facingRight = g.dirX >= 0;
            const bounceY = Math.sin(fc * 0.15 + i) * 1.5;
            const color = GHOST_COLORS[i];

            // Body
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(0, 3 + bounceY, 9, 6, 0, 0, 6.283);
            ctx.fill();

            // Head
            const headX = facingRight ? 6 : -6;
            ctx.beginPath();
            ctx.arc(headX, -4 + bounceY, 8, 0, 6.283);
            ctx.fill();

            // Ears
            ctx.beginPath();
            ctx.ellipse(facingRight ? headX - 6 : headX + 6, -2 + bounceY, 4, 7, 0, 0, 6.283);
            ctx.ellipse(facingRight ? headX + 4 : headX - 4, -1 + bounceY, 4, 8, 0, 0, 6.283);
            ctx.fill();

            // Snout
            ctx.fillStyle = '#FFFAF0';
            const snoutX = facingRight ? headX + 6 : headX - 6;
            ctx.beginPath();
            ctx.ellipse(snoutX, -2 + bounceY, 5, 4, 0, 0, 6.283);
            ctx.fill();

            // Nose
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(facingRight ? snoutX + 3 : snoutX - 3, -3 + bounceY, 2.5, 0, 6.283);
            ctx.fill();

            // Eye
            ctx.fillStyle = '#fff';
            const eyeX = facingRight ? headX + 2 : headX - 2;
            ctx.beginPath();
            ctx.arc(eyeX, -6 + bounceY, 4, 0, 6.283);
            ctx.fill();
            ctx.fillStyle = '#2d1b00';
            ctx.beginPath();
            ctx.arc(eyeX + g.dirX * 1.5, -6 + g.dirY + bounceY, 2.5, 0, 6.283);
            ctx.fill();

            // Collar
            ctx.fillStyle = COLLAR_COLORS[i];
            ctx.beginPath();
            ctx.ellipse(facingRight ? 2 : -2, bounceY, 7, 2, 0, 0, 6.283);
            ctx.fill();

            ctx.restore();
        }
    }, [bottleImage, drawWallSegments]);

    // Draw initial state
    useEffect(() => {
        if (canvasRef.current && gameState.current.map) {
            const ctx = canvasRef.current.getContext('2d', { alpha: false });
            draw(ctx, gameState.current);
        }
    }, [draw]);

    // Reset game state
    const resetGame = useCallback(() => {
        const state = gameState.current;
        state.score = 0;
        state.map = INITIAL_MAP.map(row => [...row]);
        state.dotsLeft = TOTAL_DOTS;
        state.frameCount = 0;

        // Reset pacman
        state.pacman.x = 9;
        state.pacman.y = 16;
        state.pacman.dirX = 0;
        state.pacman.dirY = 0;
        state.pacman.nextDirX = 0;
        state.pacman.nextDirY = 0;

        // Reset ghosts
        const ghostPositions = [[9, 8], [8, 10], [10, 10], [9, 10]];
        for (let i = 0; i < state.ghosts.length; i++) {
            state.ghosts[i].x = ghostPositions[i][0];
            state.ghosts[i].y = ghostPositions[i][1];
            state.ghosts[i].dirX = 0;
            state.ghosts[i].dirY = 0;
        }
    }, []);

    const startGame = useCallback(() => {
        resetGame();
        setScore(0);
        setGameOver(false);
        setWin(false);
        setGameActive(true);
    }, [resetGame]);

    // Memoized D-pad button to reduce re-renders
    const DPadButton = useMemo(() => {
        const Button = ({ dir, icon: Icon }) => (
            <button
                className={`d-pad-button ${dir} ${activeDir === dir ? 'active' : ''}`}
                onPointerDown={() => handleDirectionInput(dir)}
                onPointerUp={() => handleDirectionRelease(dir)}
                onPointerLeave={() => handleDirectionRelease(dir)}
                onContextMenu={(e) => e.preventDefault()}
            >
                <Icon size={24} />
            </button>
        );
        return Button;
    }, [activeDir, handleDirectionInput, handleDirectionRelease]);

    return (
        <div className="pacman-container">
            <div className="game-header">
                <h2 className="level-title">NIVEL SUBMARINO</h2>
                <div className="score-board">SCORE: {score}</div>
            </div>

            <div className="canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="game-canvas"
                />

                {!gameActive && !gameOver && !win && (
                    <div className="overlay">
                        <button onClick={startGame} className="start-btn">
                            <Play size={24} /> START GAME
                        </button>
                    </div>
                )}

                {gameOver && (
                    <div className="overlay">
                        <h2 className="game-over-text">GAME OVER</h2>
                        <button onClick={startGame} className="restart-btn">
                            <RotateCcw size={24} /> REINTENTAR
                        </button>
                        <button onClick={onBack} className="back-btn">
                            VOLVER AL MENU
                        </button>
                    </div>
                )}

                {win && (
                    <div className="overlay">
                        <h2 className="win-text">¡NIVEL COMPLETADO!</h2>
                        <button onClick={onNextLevel} className="next-btn">
                            SIGUIENTE NIVEL <Play size={24} />
                        </button>
                    </div>
                )}
            </div>

            <div className="d-pad-container">
                <div className="d-pad-row">
                    <DPadButton dir="up" icon={ArrowUp} />
                </div>
                <div className="d-pad-row middle">
                    <DPadButton dir="left" icon={ArrowLeft} />
                    <div className="d-pad-center" />
                    <DPadButton dir="right" icon={ArrowRight} />
                </div>
                <div className="d-pad-row">
                    <DPadButton dir="down" icon={ArrowDown} />
                </div>
            </div>

            <button onClick={onBack} className="back-button-footer">VOLVER</button>
        </div>
    );
}

export default PacmanLevel;
