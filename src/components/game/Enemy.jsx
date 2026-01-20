import React, { useState, useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import {
  AIRoles,
  AIStates,
  updateEnemyAI,
  createEnemyAIState,
  getStateDebugColor
} from '../../game/ai/EnemyAI';

/**
 * Componente Enemy unificado para todos los niveles
 *
 * @param {Object} props - Propiedades del enemigo
 * @param {Object} props.position - Posición actual del enemigo {x, z}
 * @param {Object} props.playerPos - Posición del jugador {x, z}
 * @param {Object} props.playerDirection - Dirección del jugador {x, z}
 * @param {Array} props.walls - Array de muros
 * @param {Function} props.onPositionUpdate - Callback (x, z) cuando se mueve
 * @param {number} props.rotation - Rotación base para el sprite
 * @param {boolean} props.isPowerActive - Si el poder está activo
 * @param {boolean} props.isPaused - Si el juego está pausado
 * @param {number} props.enemyId - ID único del enemigo
 * @param {string} props.role - Rol del enemigo (usar AIRoles)
 * @param {boolean} props.isReturning - Si está regresando a casa
 * @param {Object} props.doghousePos - Posición de la casa {x, z}
 * @param {Function} props.checkCollision - Función de detección de colisiones
 * @param {Object} props.assignedZone - Zona asignada para patrullaje
 * @param {string} props.spritesheet1Path - Ruta a spritesheet 1
 * @param {string} props.spritesheet2Path - Ruta a spritesheet 2
 * @param {boolean} props.debugMode - Mostrar información de debug
 * @param {boolean} props.isStunned - Si el enemigo está aturdido
 * @param {number} props.stunEndTime - Timestamp cuando termina el aturdimiento
 */
export default function Enemy({
  position,
  playerPos,
  playerDirection = { x: 0, z: 0 },
  walls,
  onPositionUpdate,
  rotation = 1.1,
  isPowerActive = false,
  isPaused = false,
  enemyId,
  role = AIRoles.NORMAL,
  isReturning = false,
  doghousePos = null,
  checkCollision,
  assignedZone = null,
  spritesheet1Path = '/assets/personajes/enemy_type_1.png',
  spritesheet2Path = '/assets/personajes/enemy_type_2.png',
  debugMode = false,
  slowDownOnPower = true,
  isStunned = false,
  stunEndTime = 0,
  // Custom colors per level
  colorNormal = 'white',
  colorVulnerable = '#6666ff',
  colorHit = 'grey'
}) {
  const meshRef = useRef();

  // Cargar texturas
  const spritesheet1 = useLoader(THREE.TextureLoader, spritesheet1Path);
  const spritesheet2 = useLoader(THREE.TextureLoader, spritesheet2Path);

  // Estado de animación
  const [currentFrame, setCurrentFrame] = useState(0);
  const [animationTime, setAnimationTime] = useState(0);
  const frameCount = 8;
  const animationSpeed = 10;

  // Configurar texturas
  useMemo(() => {
    spritesheet1.magFilter = THREE.NearestFilter;
    spritesheet1.minFilter = THREE.NearestFilter;
    spritesheet2.magFilter = THREE.NearestFilter;
    spritesheet2.minFilter = THREE.NearestFilter;
  }, [spritesheet1, spritesheet2]);

  // Estado de IA
  const [aiState, setAiState] = useState(() => createEnemyAIState(role));
  const timeSinceSpawnRef = useRef(0);

  // Estado de animación de aturdimiento
  const [stunRotation, setStunRotation] = useState(0);

  // Frame loop
  useFrame((state, delta) => {
    if (isPaused) return;

    timeSinceSpawnRef.current += delta;

    // Actualizar animación de aturdimiento
    if (isStunned) {
      setStunRotation(prev => prev + delta * 5); // Giro de estrellas
    }

    // Si está aturdido, no actualizar IA ni movimiento
    if (isStunned) {
      // Actualizar animación de frame pero no movimiento
      setAnimationTime(prev => prev + delta);
      const newFrame = Math.floor(state.clock.elapsedTime * animationSpeed) % frameCount;
      setCurrentFrame(newFrame);
      return;
    }

    // Actualizar IA
    const aiUpdate = updateEnemyAI({
      // Posiciones
      enemyPos: position,
      playerPos,
      direction: aiState.direction,

      // Estado actual
      currentState: aiState.state,
      mode: aiState.mode,
      modeTimer: aiState.modeTimer,
      lastIntersectionPos: aiState.lastIntersectionPos,
      lastSeenPlayerPos: aiState.lastSeenPlayerPos,
      searchTimer: aiState.searchTimer,

      // Configuración
      roleConfig: aiState.config,
      walls,
      checkCollision,

      // Contexto
      delta,
      isPaused,
      isPowerActive,
      isReturning,
      timeSinceSpawn: timeSinceSpawnRef.current,

      // Opcionales
      assignedZone,
      doghousePos,
      playerDirection,
      slowDownOnPower
    });

    // Actualizar estado de IA
    setAiState(prev => ({
      ...prev,
      direction: aiUpdate.newDirection,
      state: aiUpdate.newState,
      mode: aiUpdate.newMode,
      modeTimer: aiUpdate.newModeTimer,
      lastIntersectionPos: aiUpdate.newLastIntersectionPos || prev.lastIntersectionPos
    }));

    // Actualizar última posición vista del jugador si está persiguiendo
    if (aiUpdate.newState === AIStates.CHASE) {
      setAiState(prev => ({
        ...prev,
        lastSeenPlayerPos: { ...playerPos }
      }));
    }

    // Mover enemigo si es posible
    if (aiUpdate.shouldMove) {
      const speed = aiUpdate.speed || aiState.config.speed;
      const newX = position.x + aiUpdate.newDirection.x * speed * delta;
      const newZ = position.z + aiUpdate.newDirection.z * speed * delta;
      onPositionUpdate(newX, newZ);
    }

    // Actualizar animación
    setAnimationTime(prev => {
      const newTime = prev + delta * animationSpeed;
      const newFrame = Math.floor(newTime) % frameCount;
      setCurrentFrame(newFrame);
      return newTime;
    });

    // Efecto visual de aturdimiento (REMOVIDO: solo resetear rotación)
    if (meshRef.current) {
      meshRef.current.rotation.z = 0;
    }
  });

  // Seleccionar textura según dirección
  const getCurrentTexture = () => {
    if (aiState.direction.x > 0 || aiState.direction.z > 0) {
      return spritesheet1;
    } else {
      return spritesheet2;
    }
  };

  // Determinar flip horizontal
  const getFlipX = () => {
    if (aiState.direction.z > 0) return -1;
    if (aiState.direction.x < 0) return -1;
    return 1;
  };

  // Configurar frame de textura
  const texture = getCurrentTexture();
  texture.repeat.set(1 / frameCount, 1);
  texture.offset.x = currentFrame / frameCount;

  // Color según estado (para poder o debug)
  const getColor = () => {
    if (isReturning) return colorHit;
    if (isPowerActive) return colorVulnerable;
    if (debugMode) return getStateDebugColor(aiState.state);
    return colorNormal;
  };

  return (
    <group position={[position.x, 0.5, position.z]}>
      {/* Efecto de aturdimiento: estrellas girando */}
      {isStunned && (
        <>
          {[0, 1, 2, 3].map((i) => {
            const angle = stunRotation + (i * Math.PI / 2);
            const radius = 0.7;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            return (
              <group key={i} position={[x, 0.5, z]} rotation={[0, 0, stunRotation * 2]}>
                {/* Estrella simple con 4 puntas */}
                <mesh rotation={[-Math.PI / 4, 0, 0]}>
                  <boxGeometry args={[0.15, 0.4, 0.05]} />
                  <meshBasicMaterial color="#FFD700" />
                </mesh>
                <mesh rotation={[-Math.PI / 4, 0, Math.PI / 2]}>
                  <boxGeometry args={[0.15, 0.4, 0.05]} />
                  <meshBasicMaterial color="#FFD700" />
                </mesh>
              </group>
            );
          })}
          {/* Círculo de aturdimiento en el suelo */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
            <ringGeometry args={[0.5, 0.7, 32]} />
            <meshBasicMaterial color="#FFD700" transparent opacity={0.4} />
          </mesh>
          {/* Efecto de "mareo" visual sobre el enemigo */}
          <mesh rotation={[-Math.PI / 4, 0, 0]} position={[0, 0.8, 0]}>
            <ringGeometry args={[0.3, 0.4, 16]} />
            <meshBasicMaterial color="#FFFF00" transparent opacity={0.6} />
          </mesh>
        </>
      )}

      {/* Debug: Mostrar estado */}
      {debugMode && (
        <>
          {/* Círculo de detección */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
            <ringGeometry args={[aiState.config.detectionRadius - 0.2, aiState.config.detectionRadius, 32]} />
            <meshBasicMaterial
              color={getStateDebugColor(aiState.state)}
              transparent
              opacity={0.2}
            />
          </mesh>

          {/* Línea de dirección */}
          <mesh position={[aiState.direction.x * 0.5, 0, aiState.direction.z * 0.5]}>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshBasicMaterial color="yellow" />
          </mesh>
        </>
      )}

      {/* Sprite del enemigo */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 4, rotation, 0]}
        scale={[getFlipX(), 1, 1]}
      >
        <planeGeometry args={[1.3, 1.3]} />
        <meshStandardMaterial
          map={texture}
          transparent
          side={THREE.DoubleSide}
          color={getColor()}
          alphaTest={0.5}
          depthWrite={true}
          emissive={isReturning ? colorHit : (isPowerActive ? colorVulnerable : '#000000')}
          emissiveIntensity={isReturning ? 1.5 : (isPowerActive ? 0.5 : 0)}
        />
      </mesh>
    </group>
  );
}
