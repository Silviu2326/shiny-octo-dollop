import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import './WoodLevel.css';

// Constants
const TILE_SIZE = 24;
const MAP_ROWS = 20;
const MAP_COLS = 19;
const PACMAN_SPEED = 0.1;
const GHOST_SPEED = 0.055;
const CANVAS_WIDTH = MAP_COLS * TILE_SIZE;
const CANVAS_HEIGHT = MAP_ROWS * TILE_SIZE;

const DIRECTIONS = [
    { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
];

// Different map layout for variety
const INITIAL_MAP = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 3, 1, 2, 2, 0, 2, 2, 2, 1, 2, 2, 2, 0, 2, 2, 1, 3, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 2, 1, 0, 1, 1, 1, 0, 1, 2, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 2, 1, 1, 1, 2, 1, 0, 1, 1, 1, 0, 1],
    [2, 0, 0, 0, 0, 0, 1, 2, 1, 4, 1, 2, 1, 0, 0, 0, 0, 0, 2],
    [1, 0, 1, 1, 1, 0, 1, 2, 1, 4, 1, 2, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 3, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 3, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const TOTAL_DOTS = INITIAL_MAP.flat().filter(c => c === 0 || c === 3).length;

const isWallAt = (x, y) => {
    if (y < 0 || y >= MAP_ROWS || x < 0 || x >= MAP_COLS) return false;
    return INITIAL_MAP[y][x] === 1;
};

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
            };
        }
    }
}

// Dog colors for enemies (same as PacmanLevel)
const GHOST_COLORS = ['#8B4513', '#D2691E', '#F5F5DC', '#2F2F2F'];
const COLLAR_COLORS = ['#ef4444', '#8b5cf6', '#22d3ee', '#f472b6'];

function WoodLevel({ onBack, onNextLevel, onLevelComplete }) {
    const canvasRef = useRef(null);
    const animFrameRef = useRef(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameActive, setGameActive] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [win, setWin] = useState(false);
    const [activeDir, setActiveDir] = useState(null);
    const [catSprite, setCatSprite] = useState(null);
    const spriteSize = useRef({ width: 0, height: 0 }); // Size of each sprite in the sheet

    const gameState = useRef({
        map: null,
        pacman: { x: 9, y: 17, dirX: 0, dirY: 0, nextDirX: 0, nextDirY: 0 },
        ghosts: [
            { x: 9, y: 9, dirX: 0, dirY: 0 },
            { x: 8, y: 11, dirX: 0, dirY: 0 },
            { x: 10, y: 11, dirX: 0, dirY: 0 },
            { x: 9, y: 11, dirX: 0, dirY: 0 }
        ],
        score: 0,
        dotsLeft: TOTAL_DOTS,
        frameCount: 0,
        invulnerable: false,
        invulnerableUntil: 0,
    });

    useEffect(() => {
        gameState.current.map = INITIAL_MAP.map(row => [...row]);
        gameState.current.dotsLeft = TOTAL_DOTS;
    }, []);

    // Load cat spritesheet
    useEffect(() => {
        const img = new Image();
        img.src = '/assets/image-removebg-preview (32).png';
        img.onload = () => {
            // Spritesheet is 2x2, so each sprite is half the width and height
            spriteSize.current = {
                width: img.width / 2,
                height: img.height / 2
            };
            setCatSprite(img);
        };
    }, []);

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

    useEffect(() => {
        if (!gameActive || gameOver || win) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });

        const update = () => {
            const state = gameState.current;
            state.frameCount++;
            const { pacman: p, ghosts, map } = state;

            // Pacman movement
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

                if (p.nextDirX !== 0 || p.nextDirY !== 0) {
                    const nextTx = tileX + p.nextDirX;
                    const nextTy = tileY + p.nextDirY;
                    if (map[nextTy] && map[nextTy][nextTx] !== 1) {
                        p.dirX = p.nextDirX;
                        p.dirY = p.nextDirY;
                    }
                }

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

            if (p.x < 0) p.x = MAP_COLS - 1;
            else if (p.x >= MAP_COLS) p.x = 0;

            // Eat dots
            const currentTileX = Math.round(p.x);
            const currentTileY = Math.round(p.y);
            const cell = map[currentTileY]?.[currentTileX];
            if (cell === 0 || cell === 3) {
                if (cell === 0) state.score += 10;
                else state.score += 50;
                map[currentTileY][currentTileX] = 2;
                state.dotsLeft--;
                setScore(state.score);

                if (state.dotsLeft <= 0) {
                    setWin(true);
                    onLevelComplete?.(9);
                    return;
                }
            }

            // Ghost movement
            for (let i = 0; i < ghosts.length; i++) {
                const g = ghosts[i];
                const gx = Math.round(g.x);
                const gy = Math.round(g.y);

                if (Math.abs(g.x - gx) < 0.1 && Math.abs(g.y - gy) < 0.1) {
                    let validDirs = [];
                    for (let d = 0; d < 4; d++) {
                        const dir = DIRECTIONS[d];
                        if (dir.x === -g.dirX && dir.y === -g.dirY && (g.dirX !== 0 || g.dirY !== 0)) continue;
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

                // Check if invulnerability has expired
                if (state.invulnerable && state.frameCount >= state.invulnerableUntil) {
                    state.invulnerable = false;
                }

                // Collision (only if not invulnerable)
                const distSq = (g.x - p.x) ** 2 + (g.y - p.y) ** 2;
                if (distSq < 0.25 && !state.invulnerable) {
                    setLives(prevLives => {
                        const newLives = prevLives - 1;
                        if (newLives <= 0) {
                            setGameOver(true);
                        }
                        return newLives;
                    });

                    // Activate invulnerability for 3 seconds (180 frames at ~60fps)
                    state.invulnerable = true;
                    state.invulnerableUntil = state.frameCount + 180;
                    break; // Exit ghost loop after collision
                }
            }

            draw(ctx, state);
            animFrameRef.current = requestAnimationFrame(update);
        };

        animFrameRef.current = requestAnimationFrame(update);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [gameActive, gameOver, win, onLevelComplete, catSprite]);

    const draw = useCallback((ctx, state) => {
        const { map, pacman, ghosts } = state;
        const fc = state.frameCount;

        // Wood background
        ctx.fillStyle = '#2d1f14';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw wood grain lines
        ctx.strokeStyle = 'rgba(60, 40, 20, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < CANVAS_HEIGHT; i += 8) {
            ctx.beginPath();
            ctx.moveTo(0, i + Math.sin(i * 0.1) * 2);
            ctx.lineTo(CANVAS_WIDTH, i + Math.sin(i * 0.1 + 1) * 2);
            ctx.stroke();
        }

        // Draw walls (wooden planks style)
        for (let y = 0; y < MAP_ROWS; y++) {
            for (let x = 0; x < MAP_COLS; x++) {
                if (INITIAL_MAP[y][x] === 1) {
                    const px = x * TILE_SIZE;
                    const py = y * TILE_SIZE;
                    const wd = WALL_DATA[y][x];

                    // Wood plank fill
                    const grad = ctx.createLinearGradient(px, py, px + TILE_SIZE, py + TILE_SIZE);
                    grad.addColorStop(0, '#8B4513');
                    grad.addColorStop(0.5, '#A0522D');
                    grad.addColorStop(1, '#6B3E26');
                    ctx.fillStyle = grad;
                    ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

                    // Wood grain detail
                    ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(px + 4, py + TILE_SIZE / 2);
                    ctx.lineTo(px + TILE_SIZE - 4, py + TILE_SIZE / 2);
                    ctx.stroke();

                    // Border
                    ctx.strokeStyle = '#5D3A1A';
                    ctx.lineWidth = 2;
                    if (!wd.hasTop) {
                        ctx.beginPath();
                        ctx.moveTo(px, py + 2);
                        ctx.lineTo(px + TILE_SIZE, py + 2);
                        ctx.stroke();
                    }
                    if (!wd.hasBottom) {
                        ctx.beginPath();
                        ctx.moveTo(px, py + TILE_SIZE - 2);
                        ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE - 2);
                        ctx.stroke();
                    }
                    if (!wd.hasLeft) {
                        ctx.beginPath();
                        ctx.moveTo(px + 2, py);
                        ctx.lineTo(px + 2, py + TILE_SIZE);
                        ctx.stroke();
                    }
                    if (!wd.hasRight) {
                        ctx.beginPath();
                        ctx.moveTo(px + TILE_SIZE - 2, py);
                        ctx.lineTo(px + TILE_SIZE - 2, py + TILE_SIZE);
                        ctx.stroke();
                    }
                }
            }
        }

        // Draw collectibles (bottles) and power pellets (mushrooms)
        const halfTile = TILE_SIZE / 2;

        // Ensure images are loaded once
        if (!state.bottleImage) {
            const img = new Image();
            img.src = '/assets/collectible_bottle.png';
            state.bottleImage = img;
        }
        if (!state.morenaImage) {
            const img = new Image();
            img.src = '/assets/cervezas/collectible_morena.png';
            state.morenaImage = img;
        }

        for (let y = 0; y < MAP_ROWS; y++) {
            for (let x = 0; x < MAP_COLS; x++) {
                const cell = map[y][x];
                if (cell === 0 || cell === 3) {
                    const cx = x * TILE_SIZE + halfTile;
                    const cy = y * TILE_SIZE + halfTile;

                    if (cell === 0) {
                        // Bottle (small dot)
                        if (state.bottleImage && state.bottleImage.complete) {
                            const size = 18;
                            ctx.drawImage(state.bottleImage, cx - size / 2, cy - size / 2, size, size);
                        } else {
                            ctx.fillStyle = '#8B4513';
                            ctx.beginPath();
                            ctx.ellipse(cx, cy, 4, 4, 0, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    } else {
                        // Power Pellet (Morena Beer)
                        const pulse = 1 + 0.15 * Math.sin(fc * 0.1);

                        if (state.morenaImage && state.morenaImage.complete) {
                            const size = 26 * pulse;
                            ctx.save();
                            ctx.shadowColor = 'gold';
                            ctx.shadowBlur = 10;
                            ctx.drawImage(state.morenaImage, cx - size / 2, cy - size / 2, size, size);
                            ctx.restore();
                        } else {
                            // Fallback rendering
                            ctx.fillStyle = '#DC143C';
                            ctx.beginPath();
                            ctx.ellipse(cx, cy, 8 * pulse, 6 * pulse, 0, Math.PI, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
            }
        }

        // Draw Cat using spritesheet
        const px = pacman.x * TILE_SIZE + halfTile;
        const py = pacman.y * TILE_SIZE + halfTile;

        // Blinking effect when invulnerable (show every other 5 frames)
        const isVisible = !state.invulnerable || Math.floor(fc / 5) % 2 === 0;

        if (isVisible) {
            if (catSprite && spriteSize.current.width > 0) {
                const sw = spriteSize.current.width;
                const sh = spriteSize.current.height;
                const drawSize = 32; // Size to draw on canvas

                // Animate between open/closed mouth sprites (use row 0 and row 1)
                const mouthFrame = Math.floor(fc * 0.1) % 2;

                // Always use right-facing sprites (column 1) and rotate/flip as needed
                const spriteCol = 1;
                const spriteRow = mouthFrame;

                // Source coordinates in spritesheet
                const sx = spriteCol * sw;
                const sy = spriteRow * sh;

                // Add glow effect and transformations
                ctx.save();

                // Change glow color when invulnerable
                if (state.invulnerable) {
                    ctx.shadowColor = '#ffffff';
                    ctx.globalAlpha = 0.8;
                } else {
                    ctx.shadowColor = '#ff6600';
                }
                ctx.shadowBlur = 12;

                // Move to pacman position (center point for rotation)
                ctx.translate(px, py);

                // Rotate/flip based on direction
                if (pacman.dirX === -1) {
                    // Moving left - flip horizontally
                    ctx.scale(-1, 1);
                } else if (pacman.dirY === -1) {
                    // Moving up - rotate -90 degrees
                    ctx.rotate(-Math.PI / 2);
                } else if (pacman.dirY === 1) {
                    // Moving down - rotate 90 degrees
                    ctx.rotate(Math.PI / 2);
                }
                // Moving right (dirX === 1) or not moving - no transformation needed

                // Draw the sprite centered at origin (we already translated to px, py)
                ctx.drawImage(
                    catSprite,
                    sx, sy, sw, sh,  // source rectangle
                    -drawSize / 2, -drawSize / 2, drawSize, drawSize  // destination rectangle (centered)
                );

                ctx.restore();
            } else {
                // Fallback: draw simple circle if sprite not loaded
                ctx.fillStyle = '#ff8c00';
                ctx.beginPath();
                ctx.arc(px, py, 12, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw Dogs (enemies)
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
    }, [catSprite]);

    useEffect(() => {
        if (canvasRef.current && gameState.current.map) {
            const ctx = canvasRef.current.getContext('2d', { alpha: false });
            draw(ctx, gameState.current);
        }
    }, [draw, catSprite]);

    const resetGame = useCallback(() => {
        const state = gameState.current;
        state.score = 0;
        state.map = INITIAL_MAP.map(row => [...row]);
        state.dotsLeft = TOTAL_DOTS;
        state.frameCount = 0;
        state.invulnerable = false;
        state.invulnerableUntil = 0;

        state.pacman.x = 9;
        state.pacman.y = 17;
        state.pacman.dirX = 0;
        state.pacman.dirY = 0;
        state.pacman.nextDirX = 0;
        state.pacman.nextDirY = 0;

        const ghostPositions = [[9, 9], [8, 11], [10, 11], [9, 11]];
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
        setLives(3);
        setGameOver(false);
        setWin(false);
        setGameActive(true);
    }, [resetGame]);

    const DPadButton = useMemo(() => {
        const Button = ({ dir, icon: Icon }) => (
            <button
                className={`wood-d-pad-button ${dir} ${activeDir === dir ? 'active' : ''}`}
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
        <div className="wood-container">
            {/* Falling leaves */}
            <div className="leaves-container">
                {[...Array(15)].map((_, i) => <div key={i} className="leaf" />)}
            </div>

            <div className="wood-game-header">
                <h2 className="wood-level-title">MORENA PACMAN</h2>
                <div className="wood-lives-container">
                    {[...Array(lives)].map((_, i) => (
                        <img
                            key={i}
                            src="/assets/image-removebg-preview (4) (1).png"
                            alt="vida"
                            className="wood-life-icon"
                        />
                    ))}
                </div>
                <div className="wood-score-board">SCORE: {score}</div>
            </div>

            <div className="wood-canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="wood-game-canvas"
                />

                {!gameActive && !gameOver && !win && (
                    <div className="wood-overlay">
                        <button onClick={startGame} className="wood-start-btn">
                            <Play size={24} /> START GAME
                        </button>
                    </div>
                )}

                {gameOver && (
                    <div className="wood-overlay">
                        <h2 className="wood-game-over-text">GAME OVER</h2>
                        <button onClick={startGame} className="wood-restart-btn">
                            <RotateCcw size={24} /> REINTENTAR
                        </button>
                        <button onClick={onBack} className="wood-back-btn">
                            VOLVER AL MENU
                        </button>
                    </div>
                )}

                {win && (
                    <div className="wood-overlay">
                        <h2 className="wood-win-text">¡NIVEL COMPLETADO!</h2>
                        <button onClick={onNextLevel} className="wood-next-btn">
                            SIGUIENTE NIVEL <Play size={24} />
                        </button>
                    </div>
                )}
            </div>

            <div className="wood-d-pad-container">
                <div className="wood-d-pad-row">
                    <DPadButton dir="up" icon={ArrowUp} />
                </div>
                <div className="wood-d-pad-row middle">
                    <DPadButton dir="left" icon={ArrowLeft} />
                    <div className="wood-d-pad-center" />
                    <DPadButton dir="right" icon={ArrowRight} />
                </div>
                <div className="wood-d-pad-row">
                    <DPadButton dir="down" icon={ArrowDown} />
                </div>
            </div>

            <button onClick={onBack} className="wood-back-button-footer">VOLVER</button>
        </div>
    );
}

export default WoodLevel;
