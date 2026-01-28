import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, RotateCcw, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import LevelHeader from '../components/LevelHeader';
import './PacmanLevel.css';

const TILE_SIZE = 24;
const MAP_ROWS = 20;
const MAP_COLS = 19;
const PACMAN_SPEED = 0.1; // Tiles per frame
const GHOST_SPEED = 0.05;

// 1: Wall, 0: Dot, 2: Empty, 3: Power Pellet, 4: Ghost House
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

// Easing for smooth interpolation
const LERP_FACTOR = 0.5;

function PacmanLevel({ onBack, onNextLevel, onLevelComplete, userId }) {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameActive, setGameActive] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [win, setWin] = useState(false);
    const [paused, setPaused] = useState(false);
    const [bottleImage, setBottleImage] = useState(null);

    // Load assets
    useEffect(() => {
        const img = new Image();
        img.src = '/assets/collectible_bottle.png';
        img.onload = () => {
            setBottleImage(img);
        };
    }, []);

    // UI State for D-pad
    const keysPressed = useRef(new Set());
    const [, forceUpdate] = useState({});

    // Game State
    const gameState = useRef({
        map: JSON.parse(JSON.stringify(INITIAL_MAP)),
        pacman: { x: 9, y: 16, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, angle: 0, mouthOpen: 0 },
        ghosts: [
            { x: 9, y: 8, color: '#ef4444', dir: { x: 0, y: 0 }, mode: 'scatter' }, // Red jellyfish
            { x: 8, y: 10, color: '#a855f7', dir: { x: 0, y: 0 }, mode: 'chase' },  // Purple jellyfish
            { x: 10, y: 10, color: '#14b8a6', dir: { x: 0, y: 0 }, mode: 'chase' }, // Teal jellyfish
            { x: 9, y: 10, color: '#f472b6', dir: { x: 0, y: 0 }, mode: 'scatter' } // Pink jellyfish
        ],
        score: 0,
        dotsLeft: 0,
        frameCount: 0
    });

    // Calculate total dots
    useEffect(() => {
        let dots = 0;
        INITIAL_MAP.forEach(row => row.forEach(cell => {
            if (cell === 0 || cell === 3) dots++;
        }));
        gameState.current.dotsLeft = dots;
    }, []);

    // --- INPUT HANDLING ---
    const handleDirectionInput = (dir) => {
        if (!gameActive || paused) return;

        keysPressed.current.add(dir);
        forceUpdate({}); // Re-render for active class on buttons

        let nextX = 0;
        let nextY = 0;

        if (dir === 'up') nextY = -1;
        if (dir === 'down') nextY = 1;
        if (dir === 'left') nextX = -1;
        if (dir === 'right') nextX = 1;

        if (nextX !== 0 || nextY !== 0) {
            gameState.current.pacman.nextDir = { x: nextX, y: nextY };
        }
    };

    const handleDirectionRelease = (dir) => {
        keysPressed.current.delete(dir);
        forceUpdate({});
    };

    const isPressed = (dir) => keysPressed.current.has(dir);

    // Keyboard Controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key;
            if (key === 'ArrowUp' || key === 'w') handleDirectionInput('up');
            if (key === 'ArrowDown' || key === 's') handleDirectionInput('down');
            if (key === 'ArrowLeft' || key === 'a') handleDirectionInput('left');
            if (key === 'ArrowRight' || key === 'd') handleDirectionInput('right');
        };

        const handleKeyUp = (e) => {
            const key = e.key;
            if (key === 'ArrowUp' || key === 'w') handleDirectionRelease('up');
            if (key === 'ArrowDown' || key === 's') handleDirectionRelease('down');
            if (key === 'ArrowLeft' || key === 'a') handleDirectionRelease('left');
            if (key === 'ArrowRight' || key === 'd') handleDirectionRelease('right');
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameActive, paused]);

    // Game Loop
    useEffect(() => {
        if (!gameActive || paused || gameOver || win) return;

        let animationFrameId;
        const ctx = canvasRef.current.getContext('2d');

        const update = () => {
            gameState.current.frameCount++;
            const state = gameState.current;
            const { pacman, ghosts, map } = state;

            // --- PACMAN MOVEMENT ---
            const moveStep = PACMAN_SPEED;
            let moved = false;

            // Determine axis and direction of movement
            // dir.x: 1 (Right), -1 (Left)
            // dir.y: 1 (Down), -1 (Up)

            const p = pacman;

            // Calculate distance to center of current tile
            const tileX = Math.round(p.x);
            const tileY = Math.round(p.y);

            // We are "at center" if we are very close
            const distToCenterX = tileX - p.x;
            const distToCenterY = tileY - p.y;

            // Perpendicular alignment check
            const alignedX = Math.abs(distToCenterX) < 0.01;
            const alignedY = Math.abs(distToCenterY) < 0.01;

            // Logic: Move 'moveStep'. If we cross center, stop at center, evaluate turns, continue.

            // Current movement vector
            let dx = p.dir.x * moveStep;
            let dy = p.dir.y * moveStep;

            // Check if we will cross the center in this step
            // Crossing center logic:
            // If moving Right (dir.x > 0), and current x < tileX and new x >= tileX
            let crossedCenter = false;

            if (p.dir.x > 0 && p.x < tileX && (p.x + dx) >= tileX) crossedCenter = true;
            if (p.dir.x < 0 && p.x > tileX && (p.x + dx) <= tileX) crossedCenter = true;
            if (p.dir.y > 0 && p.y < tileY && (p.y + dy) >= tileY) crossedCenter = true;
            if (p.dir.y < 0 && p.y > tileY && (p.y + dy) <= tileY) crossedCenter = true;

            // Also treat "Stopped" or "Just Starting" as at center if close enough
            if (p.dir.x === 0 && p.dir.y === 0) {
                if (Math.abs(p.x - tileX) < 0.1 && Math.abs(p.y - tileY) < 0.1) {
                    p.x = tileX;
                    p.y = tileY;
                    crossedCenter = true; // Force evaluation
                }
            }

            if (crossedCenter) {
                // Snap to center
                p.x = tileX;
                p.y = tileY;

                // 1. Try Next Direction
                if (p.nextDir.x !== 0 || p.nextDir.y !== 0) {
                    const nextTx = tileX + p.nextDir.x;
                    const nextTy = tileY + p.nextDir.y;
                    if (map[nextTy] && map[nextTy][nextTx] !== 1) {
                        p.dir = { ...p.nextDir };
                        // p.nextDir = { x: 0, y: 0 }; // Optional: Consume input
                    }
                }

                // 2. Check walls for (possibly new) Current Direction
                const nextTx = tileX + p.dir.x;
                const nextTy = tileY + p.dir.y;
                if (map[nextTy] && map[nextTy][nextTx] === 1) {
                    p.dir = { x: 0, y: 0 };
                }

                // Continue movement with remainder? 
                // For simplicity/retro feel, just start fresh move from center in new dir
                // This loses a tiny bit of speed on turns but ensures grid alignment
                dx = p.dir.x * moveStep;
                dy = p.dir.y * moveStep;
            } else {
                // Not crossing center, but we might want to turn REVERSE at any time
                if (p.nextDir.x === -p.dir.x && p.nextDir.y === -p.dir.y) {
                    p.dir = { ...p.nextDir };
                    dx = p.dir.x * moveStep;
                    dy = p.dir.y * moveStep;
                }
                // Corner cutting logic can go here, but omitted for stability
            }

            p.x += dx;
            p.y += dy;


            // Wrap around
            if (pacman.x < 0) pacman.x = MAP_COLS - 1;
            if (pacman.x >= MAP_COLS) pacman.x = 0;

            // Eat Dots
            let currentTileX = Math.round(pacman.x);
            let currentTileY = Math.round(pacman.y);
            if (map[currentTileY] && (map[currentTileY][currentTileX] === 0 || map[currentTileY][currentTileX] === 3)) {
                if (map[currentTileY][currentTileX] === 3) {
                    // Power Pellet!
                    // TODO: Make ghosts vulnerable
                } else {
                    state.score += 10;
                }
                map[currentTileY][currentTileX] = 2; // Empty
                state.dotsLeft--;
                setScore(state.score);

                if (state.dotsLeft <= 0) {
                    setWin(true);
                    onLevelComplete && onLevelComplete(8); // Assuming this is level 8 ID based on request
                }
            }

            // --- GHOST MOVEMENT ---
            ghosts.forEach((ghost, i) => {
                // Simple random movement for now, refined later
                let gx = Math.round(ghost.x);
                let gy = Math.round(ghost.y);
                let gIsCenter = Math.abs(ghost.x - gx) < 0.1 && Math.abs(ghost.y - gy) < 0.1;

                if (gIsCenter) {
                    const possibleDirs = [
                        { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
                    ].filter(d => {
                        // Don't reverse
                        if (d.x === -ghost.dir.x && d.y === -ghost.dir.y && (ghost.dir.x !== 0 || ghost.dir.y !== 0)) return false;
                        // Don't hit wall
                        let nx = gx + d.x;
                        let ny = gy + d.y;
                        if (map[ny] && map[ny][nx] !== 1) return true;
                        return false;
                    });

                    if (possibleDirs.length > 0) {
                        const rand = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                        ghost.dir = rand;
                    } else {
                        // Dead end, reverse
                        ghost.dir = { x: -ghost.dir.x, y: -ghost.dir.y };
                    }
                }

                ghost.x += ghost.dir.x * GHOST_SPEED;
                ghost.y += ghost.dir.y * GHOST_SPEED;

                // Collision with Pacman
                let dist = Math.sqrt((ghost.x - pacman.x) ** 2 + (ghost.y - pacman.y) ** 2);
                if (dist < 0.5) {
                    console.log("Dead!");
                    // setLives(l => l - 1);
                    // Reset positions
                    // For now just basic game over or restart pos
                    setGameOver(true);
                }
            });

            // --- RENDER ---
            draw(ctx, state);

            animationFrameId = requestAnimationFrame(update);
        };

        update();
        return () => cancelAnimationFrame(animationFrameId);

    }, [gameActive, paused, gameOver, win]);

    // Helper function to draw wall border segments
    const drawWallSegments = (ctx, px, py, hasTop, hasBottom, hasLeft, hasRight, hasTopLeft, hasTopRight, hasBottomLeft, hasBottomRight) => {
        const inset = 3;
        const cornerRadius = 5;

        ctx.beginPath();

        // Top edge
        if (!hasTop) {
            const startX = hasLeft ? px : px + inset;
            const endX = hasRight ? px + TILE_SIZE : px + TILE_SIZE - inset;
            ctx.moveTo(startX, py + inset);
            ctx.lineTo(endX, py + inset);
        }

        // Bottom edge
        if (!hasBottom) {
            const startX = hasLeft ? px : px + inset;
            const endX = hasRight ? px + TILE_SIZE : px + TILE_SIZE - inset;
            ctx.moveTo(startX, py + TILE_SIZE - inset);
            ctx.lineTo(endX, py + TILE_SIZE - inset);
        }

        // Left edge
        if (!hasLeft) {
            const startY = hasTop ? py : py + inset;
            const endY = hasBottom ? py + TILE_SIZE : py + TILE_SIZE - inset;
            ctx.moveTo(px + inset, startY);
            ctx.lineTo(px + inset, endY);
        }

        // Right edge
        if (!hasRight) {
            const startY = hasTop ? py : py + inset;
            const endY = hasBottom ? py + TILE_SIZE : py + TILE_SIZE - inset;
            ctx.moveTo(px + TILE_SIZE - inset, startY);
            ctx.lineTo(px + TILE_SIZE - inset, endY);
        }

        // Draw corner arcs for outer corners
        if (!hasTop && !hasLeft) {
            ctx.moveTo(px + inset + cornerRadius, py + inset);
            ctx.arc(px + inset + cornerRadius, py + inset + cornerRadius, cornerRadius, -Math.PI / 2, Math.PI, true);
        }
        if (!hasTop && !hasRight) {
            ctx.moveTo(px + TILE_SIZE - inset, py + inset + cornerRadius);
            ctx.arc(px + TILE_SIZE - inset - cornerRadius, py + inset + cornerRadius, cornerRadius, 0, -Math.PI / 2, true);
        }
        if (!hasBottom && !hasLeft) {
            ctx.moveTo(px + inset, py + TILE_SIZE - inset - cornerRadius);
            ctx.arc(px + inset + cornerRadius, py + TILE_SIZE - inset - cornerRadius, cornerRadius, Math.PI, Math.PI / 2, true);
        }
        if (!hasBottom && !hasRight) {
            ctx.moveTo(px + TILE_SIZE - inset - cornerRadius, py + TILE_SIZE - inset);
            ctx.arc(px + TILE_SIZE - inset - cornerRadius, py + TILE_SIZE - inset - cornerRadius, cornerRadius, Math.PI / 2, 0, true);
        }

        // Inner corners (classic Pacman maze look)
        if (hasTop && hasLeft && !hasTopLeft) {
            ctx.moveTo(px, py + inset);
            ctx.arc(px + inset, py + inset, inset, Math.PI, Math.PI * 1.5);
        }
        if (hasTop && hasRight && !hasTopRight) {
            ctx.moveTo(px + TILE_SIZE - inset, py);
            ctx.arc(px + TILE_SIZE - inset, py + inset, inset, -Math.PI / 2, 0);
        }
        if (hasBottom && hasLeft && !hasBottomLeft) {
            ctx.moveTo(px + inset, py + TILE_SIZE);
            ctx.arc(px + inset, py + TILE_SIZE - inset, inset, Math.PI / 2, Math.PI);
        }
        if (hasBottom && hasRight && !hasBottomRight) {
            ctx.moveTo(px + TILE_SIZE, py + TILE_SIZE - inset);
            ctx.arc(px + TILE_SIZE - inset, py + TILE_SIZE - inset, inset, 0, Math.PI / 2);
        }

        ctx.stroke();
    };

    const draw = (ctx, state) => {
        const canvas = canvasRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const { map, pacman, ghosts } = state;

        // Draw underwater gradient background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, '#051525');
        bgGrad.addColorStop(0.5, '#0a2540');
        bgGrad.addColorStop(1, '#0d3a5c');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw animated bubbles in background
        const bubbleCount = 8;
        for (let i = 0; i < bubbleCount; i++) {
            const seed = i * 137.5;
            const bubbleX = ((seed + state.frameCount * 0.3) % canvas.width);
            const bubbleY = canvas.height - ((state.frameCount * (0.5 + i * 0.1) + seed * 3) % (canvas.height + 20));
            const bubbleSize = 3 + (i % 3) * 2;
            const opacity = 0.15 + (Math.sin(state.frameCount * 0.05 + i) * 0.1);

            ctx.beginPath();
            const bubbleGrad = ctx.createRadialGradient(bubbleX - 1, bubbleY - 1, 0, bubbleX, bubbleY, bubbleSize);
            bubbleGrad.addColorStop(0, `rgba(255, 255, 255, ${opacity + 0.2})`);
            bubbleGrad.addColorStop(0.5, `rgba(103, 232, 249, ${opacity})`);
            bubbleGrad.addColorStop(1, `rgba(34, 211, 238, ${opacity * 0.3})`);
            ctx.fillStyle = bubbleGrad;
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Subtle underwater grid pattern
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= MAP_COLS; i++) {
            ctx.beginPath();
            ctx.moveTo(i * TILE_SIZE, 0);
            ctx.lineTo(i * TILE_SIZE, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i <= MAP_ROWS; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * TILE_SIZE);
            ctx.lineTo(canvas.width, i * TILE_SIZE);
            ctx.stroke();
        }

        // Helper to check if cell is wall
        const isWall = (x, y) => {
            if (y < 0 || y >= MAP_ROWS || x < 0 || x >= MAP_COLS) return false;
            return map[y][x] === 1;
        };

        // First pass: Draw coral/rock wall fills with gradient
        for (let y = 0; y < MAP_ROWS; y++) {
            for (let x = 0; x < MAP_COLS; x++) {
                const cell = map[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;

                if (cell === 1) {
                    const wallGrad = ctx.createLinearGradient(px, py, px + TILE_SIZE, py + TILE_SIZE);
                    wallGrad.addColorStop(0, 'rgba(8, 145, 178, 0.4)');
                    wallGrad.addColorStop(1, 'rgba(5, 21, 37, 0.6)');
                    ctx.fillStyle = wallGrad;
                    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }
            }
        }

        // Second pass: Draw coral/neon borders with rounded corners
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let y = 0; y < MAP_ROWS; y++) {
            for (let x = 0; x < MAP_COLS; x++) {
                const cell = map[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;

                if (cell === 1) {
                    const hasTop = isWall(x, y - 1);
                    const hasBottom = isWall(x, y + 1);
                    const hasLeft = isWall(x - 1, y);
                    const hasRight = isWall(x + 1, y);
                    const hasTopLeft = isWall(x - 1, y - 1);
                    const hasTopRight = isWall(x + 1, y - 1);
                    const hasBottomLeft = isWall(x - 1, y + 1);
                    const hasBottomRight = isWall(x + 1, y + 1);

                    // Outer glow layer - coral/turquoise color
                    ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
                    ctx.lineWidth = 4;
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = '#06b6d4';
                    drawWallSegments(ctx, px, py, hasTop, hasBottom, hasLeft, hasRight, hasTopLeft, hasTopRight, hasBottomLeft, hasBottomRight);

                    // Inner bright line - bright cyan
                    ctx.strokeStyle = '#22d3ee';
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = '#67e8f9';
                    drawWallSegments(ctx, px, py, hasTop, hasBottom, hasLeft, hasRight, hasTopLeft, hasTopRight, hasBottomLeft, hasBottomRight);

                    ctx.shadowBlur = 0;
                }
            }
        }

        // Third pass: Draw pearls (dots) and jellyfish (power pellets)
        for (let y = 0; y < MAP_ROWS; y++) {
            for (let x = 0; x < MAP_COLS; x++) {
                const cell = map[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;
                const centerX = px + TILE_SIZE / 2;
                const centerY = py + TILE_SIZE / 2;

                if (cell === 0) {
                    // Normal dots - rendered as collectible bottles
                    if (bottleImage) {
                        // Draw bottle image centered in the tile
                        // Original tile is 24px, let's make the bottle roughly 16px high/wide to fit nicely
                        const size = 16;
                        ctx.drawImage(bottleImage, centerX - size / 2, centerY - size / 2, size, size);
                    } else {
                        // Fallback while loading
                        const pearlGrad = ctx.createRadialGradient(centerX - 1, centerY - 1, 0, centerX, centerY, 4);
                        pearlGrad.addColorStop(0, '#ffffff');
                        pearlGrad.addColorStop(0.3, '#e0f2fe');
                        pearlGrad.addColorStop(0.7, '#7dd3fc');
                        pearlGrad.addColorStop(1, '#38bdf8');

                        ctx.fillStyle = pearlGrad;
                        ctx.shadowBlur = 5;
                        ctx.shadowColor = '#38bdf8';
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }

                } else if (cell === 3) {
                    // Jellyfish-like power pellet with pulsing glow
                    const pulse = 1 + 0.3 * Math.sin(state.frameCount * 0.08);
                    const radius = 7 * pulse;

                    ctx.shadowBlur = 20 * pulse;
                    ctx.shadowColor = '#f0abfc';

                    const jellyGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
                    jellyGrad.addColorStop(0, '#ffffff');
                    jellyGrad.addColorStop(0.3, '#f5d0fe');
                    jellyGrad.addColorStop(0.6, '#e879f9');
                    jellyGrad.addColorStop(1, '#a855f7');

                    ctx.fillStyle = jellyGrad;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.fill();

                    // Inner bright core
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.shadowBlur = 0;
                }
            }
        }

        // Draw Pacman as a tropical fish
        const px = pacman.x * TILE_SIZE + TILE_SIZE / 2;
        const py = pacman.y * TILE_SIZE + TILE_SIZE / 2;

        ctx.save();
        ctx.translate(px, py);

        // Underwater glow effect - golden/orange fish
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#fb923c';

        // Gradient body - tropical fish colors
        const grad = ctx.createRadialGradient(0, 0, TILE_SIZE / 4, 0, 0, TILE_SIZE / 2);
        grad.addColorStop(0, '#fef3c7'); // Center highlight
        grad.addColorStop(0.5, '#fdba74'); // Orange mid
        grad.addColorStop(1, '#f97316'); // Deeper orange edge

        ctx.fillStyle = grad;
        ctx.beginPath();
        // Mouth open/close animation
        const mouthSize = 0.2 * Math.PI * Math.abs(Math.sin(state.frameCount * 0.2));
        let angle = 0;
        if (pacman.dir.x === 1) angle = 0;
        if (pacman.dir.x === -1) angle = Math.PI;
        if (pacman.dir.y === 1) angle = Math.PI / 2;
        if (pacman.dir.y === -1) angle = -Math.PI / 2;

        ctx.arc(0, 0, TILE_SIZE / 2 - 2, angle + mouthSize, angle + (Math.PI * 2) - mouthSize);
        ctx.lineTo(0, 0);
        ctx.fill();

        // Add fish eye
        ctx.shadowBlur = 0;
        const eyeOffsetX = pacman.dir.x !== 0 ? -pacman.dir.x * 3 : 0;
        const eyeOffsetY = pacman.dir.y !== 0 ? -pacman.dir.y * 3 : -3;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(eyeOffsetX, eyeOffsetY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(eyeOffsetX + (pacman.dir.x || 0), eyeOffsetY + (pacman.dir.y || 0), 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw Jellyfish (Ghosts)
        ghosts.forEach((g, idx) => {
            const gx = g.x * TILE_SIZE + TILE_SIZE / 2;
            const gy = g.y * TILE_SIZE + TILE_SIZE / 2;

            ctx.save();
            ctx.translate(gx, gy);

            // Jellyfish Glow
            ctx.shadowBlur = 18;
            ctx.shadowColor = g.color;

            // Create gradient for jellyfish body
            const jellyGrad = ctx.createRadialGradient(0, -4, 2, 0, -2, TILE_SIZE / 2);
            jellyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            jellyGrad.addColorStop(0.5, g.color);
            jellyGrad.addColorStop(1, g.color + '80');
            ctx.fillStyle = jellyGrad;

            // Jellyfish bell (dome shape)
            ctx.beginPath();
            ctx.ellipse(0, -2, TILE_SIZE / 2 - 2, TILE_SIZE / 3, 0, Math.PI, 0);
            ctx.fill();

            // Tentacles with wave animation
            ctx.shadowBlur = 8;
            ctx.strokeStyle = g.color;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            const tentacleCount = 4;
            const waveOffset = state.frameCount * 0.15 + idx;
            for (let i = 0; i < tentacleCount; i++) {
                const startX = -TILE_SIZE / 3 + (i * (TILE_SIZE * 2 / 3) / (tentacleCount - 1));
                ctx.beginPath();
                ctx.moveTo(startX, 2);
                // Wavy tentacle
                const wave1 = Math.sin(waveOffset + i) * 3;
                const wave2 = Math.sin(waveOffset + i + 1) * 3;
                ctx.quadraticCurveTo(startX + wave1, TILE_SIZE / 3, startX + wave2, TILE_SIZE / 2);
                ctx.stroke();
            }

            // Eyes - cute jellyfish eyes
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            const lookingX = g.dir ? g.dir.x * 1.5 : 0;
            const lookingY = g.dir ? g.dir.y * 1.5 : 0;

            ctx.beginPath();
            ctx.arc(-4, -6, 3.5, 0, Math.PI * 2);
            ctx.arc(4, -6, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(-4 + lookingX, -6 + lookingY, 1.8, 0, Math.PI * 2);
            ctx.arc(4 + lookingX, -6 + lookingY, 1.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        // Draw underwater light rays from top
        ctx.save();
        const rayOpacity = 0.03 + Math.sin(state.frameCount * 0.02) * 0.01;
        const rayGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
        rayGrad.addColorStop(0, `rgba(103, 232, 249, ${rayOpacity * 2})`);
        rayGrad.addColorStop(1, 'transparent');

        for (let i = 0; i < 3; i++) {
            const rayX = canvas.width * (0.2 + i * 0.3) + Math.sin(state.frameCount * 0.01 + i) * 20;
            ctx.beginPath();
            ctx.moveTo(rayX - 30, 0);
            ctx.lineTo(rayX + 30, 0);
            ctx.lineTo(rayX + 60, canvas.height * 0.6);
            ctx.lineTo(rayX - 60, canvas.height * 0.6);
            ctx.closePath();
            ctx.fillStyle = rayGrad;
            ctx.fill();
        }
        ctx.restore();
    };

    const startGame = () => {
        setGameActive(true);
        setScores(); // Reset functionality if needed
    };

    const setScores = () => {
        gameState.current.score = 0;
        setScore(0);
        setGameOver(false);
        setWin(false);
        // Reset positions code needed here
        gameState.current.pacman.x = 9;
        gameState.current.pacman.y = 16;
        gameState.current.pacman.dir = { x: 0, y: 0 };
        gameState.current.pacman.nextDir = { x: 0, y: 0 };
        // Reset dots...
        gameState.current.map = JSON.parse(JSON.stringify(INITIAL_MAP));
        let dots = 0;
        INITIAL_MAP.forEach(row => row.forEach(cell => {
            if (cell === 0 || cell === 3) dots++;
        }));
        gameState.current.dotsLeft = dots;
    };

    return (
        <div className="pacman-container">
            {/* Animated bubbles */}
            <div className="bubbles-container">
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
            </div>

            {/* Seaweed decoration */}
            <div className="seaweed-container">
                <div className="seaweed"></div>
                <div className="seaweed"></div>
                <div className="seaweed"></div>
                <div className="seaweed"></div>
                <div className="seaweed"></div>
                <div className="seaweed"></div>
            </div>

            <div className="game-header">
                <h2 className="level-title">NIVEL SUBMARINO</h2>
                <div className="score-board">SCORE: {score}</div>
            </div>

            <div className="canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    width={MAP_COLS * TILE_SIZE}
                    height={MAP_ROWS * TILE_SIZE}
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

            {/* D-PAD CONTROLS */}
            <div className="d-pad-container">
                <div className="d-pad-row">
                    <button
                        className={`d-pad-button up ${isPressed('up') ? 'active' : ''}`}
                        onPointerDown={() => handleDirectionInput('up')}
                        onPointerUp={() => handleDirectionRelease('up')}
                        onPointerLeave={() => handleDirectionRelease('up')}
                        onPointerEnter={(e) => (e.buttons > 0 || e.pressure > 0) && handleDirectionInput('up')}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <ArrowUp size={24} />
                    </button>
                </div>
                <div className="d-pad-row middle">
                    <button
                        className={`d-pad-button left ${isPressed('left') ? 'active' : ''}`}
                        onPointerDown={() => handleDirectionInput('left')}
                        onPointerUp={() => handleDirectionRelease('left')}
                        onPointerLeave={() => handleDirectionRelease('left')}
                        onPointerEnter={(e) => (e.buttons > 0 || e.pressure > 0) && handleDirectionInput('left')}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="d-pad-center">
                        {/* Empty center or place for pause/menu? For now just empty spacer */}
                    </div>
                    <button
                        className={`d-pad-button right ${isPressed('right') ? 'active' : ''}`}
                        onPointerDown={() => handleDirectionInput('right')}
                        onPointerUp={() => handleDirectionRelease('right')}
                        onPointerLeave={() => handleDirectionRelease('right')}
                        onPointerEnter={(e) => (e.buttons > 0 || e.pressure > 0) && handleDirectionInput('right')}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <ArrowRight size={24} />
                    </button>
                </div>
                <div className="d-pad-row">
                    <button
                        className={`d-pad-button down ${isPressed('down') ? 'active' : ''}`}
                        onPointerDown={() => handleDirectionInput('down')}
                        onPointerUp={() => handleDirectionRelease('down')}
                        onPointerLeave={() => handleDirectionRelease('down')}
                        onPointerEnter={(e) => (e.buttons > 0 || e.pressure > 0) && handleDirectionInput('down')}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <ArrowDown size={24} />
                    </button>
                </div>
            </div>

            <button onClick={onBack} className="back-button-footer">VOLVER</button>
        </div>
    );
}

export default PacmanLevel;
