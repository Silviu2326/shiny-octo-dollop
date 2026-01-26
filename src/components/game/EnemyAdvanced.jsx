import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import {
  AIRoles,
  AIStates,
  getDistance,
  normalizeDirection
} from '../../game/ai/EnemyAI';

// Convierte cualquier dirección a una de las 4 direcciones cardinales (sin diagonales)
const toCardinalDirection = (direction) => {
  const { x, z } = direction;

  // Si no hay movimiento, mantener dirección anterior o default
  if (Math.abs(x) < 0.01 && Math.abs(z) < 0.01) {
    return null; // No hay dirección válida
  }

  // Elegir la dirección dominante (mayor valor absoluto)
  if (Math.abs(x) >= Math.abs(z)) {
    return { x: x > 0 ? 1 : -1, z: 0 };
  } else {
    return { x: 0, z: z > 0 ? 1 : -1 };
  }
};

// Verifica si dos direcciones son opuestas (giro de 180°)
const areOppositeDirections = (dir1, dir2) => {
  return (dir1.x === -dir2.x && dir1.x !== 0) || (dir1.z === -dir2.z && dir1.z !== 0);
};

// Obtiene una dirección perpendicular (giro de 90°)
const getPerpendicularDirection = (currentDir, targetDir) => {
  // Si estamos en eje X, girar a eje Z
  if (currentDir.x !== 0) {
    return { x: 0, z: targetDir.z !== 0 ? targetDir.z : 1 };
  }
  // Si estamos en eje Z, girar a eje X
  return { x: targetDir.x !== 0 ? targetDir.x : 1, z: 0 };
};

// Compara si dos direcciones son iguales
const isSameDirection = (dir1, dir2) => {
  return dir1.x === dir2.x && dir1.z === dir2.z;
};
import {
  AdvancedEnemyAI,
  EnemyCoordinator,
  VisionSystem
} from '../../game/ai/EnemyAI_Advanced';

/**
 * Componente Enemy con IA Avanzada
 * Usa el sistema de IA avanzado con pathfinding A*, prediccion, coordinacion, etc.
 */
export default function EnemyAdvanced({
  position,
  playerPos,
  playerDirection = { x: 0, z: 0 },
  walls,
  onPositionUpdate,
  rotation = 1.1,
  isPowerActive = false,
  isPaused = false,
  enemyId,
  role = AIRoles.CHASER,
  isReturning = false,
  doghousePos = null,
  checkCollision,
  assignedZone = null,
  spritesheet1Path = '/assets/personajes/enemy_type_11.png',
  spritesheet2Path = '/assets/personajes/enemy_type_12.png',
  debugMode = false,
  slowDownOnPower = true,
  coordinator = null, // EnemyCoordinator compartido
  colorNormal = 'white',
  colorVulnerable = '#6666ff',
  colorHit = 'grey'
}) {
  const meshRef = useRef();

  // Cargar texturas
  const spritesheet1 = useLoader(THREE.TextureLoader, spritesheet1Path);
  const spritesheet2 = useLoader(THREE.TextureLoader, spritesheet2Path);

  // Estado de animacion
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

  // Instancia de IA Avanzada (persistente)
  const advancedAIRef = useRef(null);
  const [currentDirection, setCurrentDirection] = useState({ x: 1, z: 0 });
  const [currentState, setCurrentState] = useState('PATROL');
  const timeSinceSpawnRef = useRef(0);

  // Control de cambio de dirección suave
  const directionCooldownRef = useRef(0);
  const DIRECTION_COOLDOWN = 0.35; // Segundos mínimos entre cambios de dirección
  const lockedDirectionRef = useRef({ x: 1, z: 0 }); // Dirección actual bloqueada

  // Inicializar IA avanzada
  useEffect(() => {
    advancedAIRef.current = new AdvancedEnemyAI(
      enemyId,
      role,
      walls,
      checkCollision
    );

    // Registrar en coordinador si existe
    if (coordinator) {
      coordinator.registerEnemy(enemyId, position, role);
    }

    return () => {
      // Limpiar al desmontar
      advancedAIRef.current = null;
    };
  }, [enemyId, role]);

  // Frame loop
  useFrame((state, delta) => {
    if (isPaused) return;

    timeSinceSpawnRef.current += delta;

    // Si no hay IA inicializada, salir
    if (!advancedAIRef.current) return;

    // Actualizar cooldown de dirección
    if (directionCooldownRef.current > 0) {
      directionCooldownRef.current -= delta;
    }

    // Manejo especial de retorno a casa
    if (isReturning && doghousePos) {
      const dx = doghousePos.x - position.x;
      const dz = doghousePos.z - position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.5) {
        const returnSpeed = 5.6 * delta;
        // Convertir a dirección cardinal (sin diagonales)
        let desiredDir = toCardinalDirection({ x: dx, z: dz });

        // Si no hay dirección válida, usar la actual
        if (!desiredDir) {
          desiredDir = lockedDirectionRef.current;
        }

        // Aplicar restricciones de giro solo si el cooldown terminó
        let finalDir = lockedDirectionRef.current;
        if (directionCooldownRef.current <= 0 && !isSameDirection(desiredDir, lockedDirectionRef.current)) {
          // Evitar giros de 180°
          if (areOppositeDirections(lockedDirectionRef.current, desiredDir)) {
            finalDir = getPerpendicularDirection(lockedDirectionRef.current, desiredDir);
          } else {
            finalDir = desiredDir;
          }
          lockedDirectionRef.current = finalDir;
          directionCooldownRef.current = DIRECTION_COOLDOWN;
        }

        const newX = position.x + finalDir.x * returnSpeed;
        const newZ = position.z + finalDir.z * returnSpeed;
        onPositionUpdate(newX, newZ);

        setCurrentDirection(finalDir);
        setCurrentState('RETURN');
      }

      // Actualizar animacion
      setAnimationTime(prev => prev + delta);
      const newFrame = Math.floor(state.clock.elapsedTime * animationSpeed) % frameCount;
      setCurrentFrame(newFrame);
      return;
    }

    // Contexto para la IA avanzada
    const context = {
      enemyPos: position,
      enemyDir: currentDirection,
      playerPos,
      playerDir: playerDirection,
      isPowerActive,
      assignedZone,
      coordinator,
      doghousePos
    };

    // Actualizar IA avanzada
    const aiResult = advancedAIRef.current.update(context, delta);

    // Actualizar coordinador si existe
    if (coordinator) {
      coordinator.updateEnemy(enemyId, position, aiResult.state);
    }

    // Aplicar movimiento
    if (aiResult.shouldMove) {
      let speed = 3.0; // Velocidad base

      // Aplicar multiplicador de velocidad de la IA
      if (aiResult.speedMultiplier) {
        speed *= aiResult.speedMultiplier;
      }

      // Reducir velocidad si el poder esta activo
      if (isPowerActive && slowDownOnPower) {
        speed *= 0.4;
      }

      // Convertir a dirección cardinal (sin diagonales)
      let desiredDir = toCardinalDirection(aiResult.direction);

      // Si no hay dirección válida, usar la actual
      if (!desiredDir) {
        desiredDir = lockedDirectionRef.current;
      }

      // Aplicar restricciones de giro solo si el cooldown terminó
      let finalDir = lockedDirectionRef.current;
      if (directionCooldownRef.current <= 0 && !isSameDirection(desiredDir, lockedDirectionRef.current)) {
        // Evitar giros de 180°
        if (areOppositeDirections(lockedDirectionRef.current, desiredDir)) {
          finalDir = getPerpendicularDirection(lockedDirectionRef.current, desiredDir);
        } else {
          finalDir = desiredDir;
        }
        lockedDirectionRef.current = finalDir;
        directionCooldownRef.current = DIRECTION_COOLDOWN;
      }

      const newX = position.x + finalDir.x * speed * delta;
      const newZ = position.z + finalDir.z * speed * delta;

      // Verificar colision antes de mover
      if (!checkCollision(newX, newZ, walls)) {
        onPositionUpdate(newX, newZ);
      } else {
        // Si hay colisión, intentar cambiar de dirección inmediatamente
        directionCooldownRef.current = 0;
      }

      setCurrentDirection(finalDir);
    }

    // Actualizar estado para debug
    if (aiResult.state) {
      setCurrentState(aiResult.state);
    }

    // Actualizar animacion
    setAnimationTime(prev => {
      const newTime = prev + delta * animationSpeed;
      const newFrame = Math.floor(newTime) % frameCount;
      setCurrentFrame(newFrame);
      return newTime;
    });
  });

  // Seleccionar textura segun direccion
  const getCurrentTexture = () => {
    if (currentDirection.x > 0 || currentDirection.z > 0) {
      return spritesheet1;
    } else {
      return spritesheet2;
    }
  };

  // Determinar flip horizontal
  const getFlipX = () => {
    if (currentDirection.z > 0) return -1;
    if (currentDirection.x < 0) return -1;
    return 1;
  };

  // Configurar frame de textura
  const texture = getCurrentTexture();
  texture.repeat.set(1 / frameCount, 1);
  texture.offset.x = currentFrame / frameCount;

  // Color segun estado
  const getColor = () => {
    if (isReturning) return colorHit;
    if (isPowerActive) return colorVulnerable;
    return colorNormal;
  };

  // Color de debug segun accion de IA
  const getDebugColor = () => {
    const colors = {
      'CHASE_DIRECT': '#F44336',
      'CHASE_PREDICT': '#E91E63',
      'AMBUSH': '#9C27B0',
      'PATROL': '#4CAF50',
      'COORDINATE': '#2196F3',
      'BLOCK_PATH': '#FF9800',
      'SEARCH': '#00BCD4',
      'FLEE': '#9C27B0',
      'RETURN': '#607D8B'
    };
    return colors[currentState] || '#FFFFFF';
  };

  return (
    <group position={[position.x, 0.5, position.z]}>
      {/* Debug: Mostrar estado y radio de deteccion */}
      {debugMode && (
        <>
          {/* Circulo de deteccion */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
            <ringGeometry args={[4.8, 5, 32]} />
            <meshBasicMaterial
              color={getDebugColor()}
              transparent
              opacity={0.3}
            />
          </mesh>

          {/* Linea de direccion */}
          <mesh position={[currentDirection.x * 0.8, 0, currentDirection.z * 0.8]}>
            <boxGeometry args={[0.15, 0.6, 0.15]} />
            <meshBasicMaterial color="yellow" />
          </mesh>

          {/* Etiqueta de estado */}
          <mesh position={[0, 1.2, 0]}>
            <planeGeometry args={[1.5, 0.4]} />
            <meshBasicMaterial color={getDebugColor()} transparent opacity={0.8} />
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
