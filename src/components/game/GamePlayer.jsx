import React, { useState, useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * GamePlayer - Componente reutilizable del jugador
 *
 * @param {Object} props
 * @param {Object} props.position - Posición actual del jugador { x, z }
 * @param {Object} props.direction - Dirección de movimiento { x, z }
 * @param {Function} props.onPositionUpdate - Callback cuando la posición cambia (newX, newZ)
 * @param {Function} props.checkCollision - Función para verificar colisiones (x, z) => boolean
 * @param {number} props.rotation - Rotación del jugador en radianes
 * @param {boolean} props.isPaused - Si el juego está pausado
 * @param {number} [props.speed=4.5] - Velocidad de movimiento
 * @param {Object} [props.sprites] - Texturas personalizadas para sprites
 * @param {string} [props.sprites.primary] - Sprite principal (arriba/izquierda)
 * @param {string} [props.sprites.secondary] - Sprite secundario (abajo/derecha)
 * @param {number} [props.size=1.1] - Tamaño del sprite
 * @param {number} [props.heightOffset=0.5] - Altura sobre el suelo
 */
export default function GamePlayer({
  position,
  direction,
  onPositionUpdate,
  checkCollision,
  rotation,
  isPaused,
  speed = 4.5,
  sprites = {
    primary: '/assets/personajes/player.png',
    secondary: '/assets/personajes/player_secondary.png'
  },
  size = 1.1,
  heightOffset = 0.5,
  isInvulnerable = false
}) {
  const meshRef = useRef();
  const [currentFrame, setCurrentFrame] = useState(0);

  // Cargar spritesheets
  const spritesheet1 = useLoader(THREE.TextureLoader, sprites.primary);
  const spritesheet2 = useLoader(THREE.TextureLoader, sprites.secondary);

  // Configurar texturas para pixel art
  useMemo(() => {
    spritesheet1.magFilter = THREE.NearestFilter;
    spritesheet1.minFilter = THREE.NearestFilter;
    spritesheet2.magFilter = THREE.NearestFilter;
    spritesheet2.minFilter = THREE.NearestFilter;
  }, [spritesheet1, spritesheet2]);

  const frameCount = 8;
  const animationSpeed = 10;

  const [lastDirection, setLastDirection] = useState({ x: 1, z: 0 });

  const materialRef = useRef();
  const pulseTimeRef = useRef(0);

  // Actualizar posición y animación en cada frame
  useFrame((state, delta) => {
    if (isPaused) return;

    // Lógica de parpadeo (Invulnerabilidad)
    if (isInvulnerable) {
      pulseTimeRef.current += delta * 15;
      const opacity = Math.sin(pulseTimeRef.current) * 0.5 + 0.5;
      if (materialRef.current) materialRef.current.opacity = opacity;
    } else {
      if (materialRef.current && materialRef.current.opacity !== 1) {
        materialRef.current.opacity = 1;
      }
      pulseTimeRef.current = 0;
    }

    // Si hay movimiento
    if (direction.x !== 0 || direction.z !== 0) {
      setLastDirection(direction); // Guardar última dirección
      const newX = position.x + direction.x * speed * delta;
      const newZ = position.z + direction.z * speed * delta;

      // Verificar colisión antes de mover
      if (checkCollision && !checkCollision(newX, newZ)) {
        onPositionUpdate(newX, newZ);
      }

      // Animar sprite
      const time = state.clock.getElapsedTime();
      const newFrame = Math.floor(time * animationSpeed) % frameCount;
      setCurrentFrame(newFrame);
    }
  });

  // Determinar qué textura usar según la dirección
  const getCurrentTexture = () => {
    // Usar lastDirection en lugar de direction para mantener el sprite cuando está parado
    if (lastDirection.z < 0) return spritesheet1; // Arriba
    if (lastDirection.x < 0) return spritesheet1; // Izquierda
    if (lastDirection.x > 0) return spritesheet2; // Derecha
    if (lastDirection.z > 0) return spritesheet2; // Abajo
    return spritesheet2; // Default
  };

  // Determinar si se debe voltear horizontalmente
  const getFlipX = () => {
    if (lastDirection.x < 0) return -1;
    if (lastDirection.z > 0) return -1;
    return 1;
  };

  // Clonar textura y configurar frame actual
  const texture = getCurrentTexture().clone();
  texture.repeat.set(1 / frameCount, 1);
  texture.offset.x = currentFrame / frameCount;

  return (
    <mesh
      ref={meshRef}
      position={[position.x, heightOffset, position.z]}
      rotation={[-Math.PI / 4, rotation, 0]}
      scale={[getFlipX(), 1, 1]}
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        ref={materialRef}
        map={texture}
        transparent={true}
        side={THREE.DoubleSide}
        alphaTest={0.5}
        depthWrite={true}
      />
    </mesh>
  );
}
