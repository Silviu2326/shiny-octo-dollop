/**
 * ENEMY COMPONENT CON IA AVANZADA
 * Versión mejorada del componente Enemy usando el sistema de IA avanzado
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createAdvancedEnemyAI,
  updateAdvancedEnemyAI
} from '../../game/ai/EnemyAI_Advanced';

function EnemyAdvanced({
  enemyId,
  position,
  playerPos,
  playerDirection,
  walls,
  onPositionUpdate,
  checkCollision,
  isPowerActive = false,
  isPaused = false,
  rotation = 1.1,
  role,
  assignedZone,
  doghousePos,
  isReturning = false,
  spritesheet1Path = '/assets/personajes/enemy_type_9.png',
  spritesheet2Path = '/assets/personajes/enemy_type_10.png',
  debugMode = false,
  coordinator = null  // NUEVO: Coordinador de enemigos
}) {
  const meshRef = useRef();

  // Cargar texturas
  const spritesheet1 = useLoader(THREE.TextureLoader, spritesheet1Path);
  const spritesheet2 = useLoader(THREE.TextureLoader, spritesheet2Path);

  useMemo(() => {
    spritesheet1.magFilter = THREE.NearestFilter;
    spritesheet1.minFilter = THREE.NearestFilter;
    spritesheet2.magFilter = THREE.NearestFilter;
    spritesheet2.minFilter = THREE.NearestFilter;
  }, [spritesheet1, spritesheet2]);

  // Estados
  const [direction, setDirection] = useState({ x: 1, z: 0 });
  const [lastDirection, setLastDirection] = useState({ x: 1, z: 0 });
  const [currentFrame, setCurrentFrame] = useState(0);
  const [animationTime, setAnimationTime] = useState(0);
  const [debugInfo, setDebugInfo] = useState(null);

  // NUEVA: Instancia de IA avanzada
  const [aiInstance] = useState(() =>
    createAdvancedEnemyAI(enemyId, role, walls, checkCollision)
  );

  // Animación
  const frameCount = 8;
  const animationSpeed = 10;

  // Registro en coordinador al montar
  useEffect(() => {
    if (coordinator) {
      coordinator.registerEnemy(enemyId, position, role);
    }
  }, [coordinator, enemyId, position, role]);

  useFrame((state, delta) => {
    if (isPaused) return;

    // Si está regresando a casa (modo especial)
    if (isReturning && doghousePos) {
      handleReturningToHome(delta);
      return;
    }

    // Actualizar en coordinador
    if (coordinator) {
      coordinator.updateEnemy(enemyId, position, 'active');
    }

    // Preparar contexto para la IA
    const context = {
      enemyId,
      enemyPos: position,
      enemyDir: direction,
      playerPos,
      playerDir: playerDirection,
      walls,
      checkCollision,
      isPaused,
      isPowerActive,
      isReturning,
      assignedZone,
      doghousePos,
      coordinator,
      role
    };

    // NUEVA: Actualizar IA avanzada
    const result = updateAdvancedEnemyAI(aiInstance, context, delta);

    // Aplicar resultado
    if (result.shouldMove) {
      const newDir = result.direction;
      setDirection(newDir);

      if (newDir.x !== 0 || newDir.z !== 0) {
        setLastDirection(newDir);
      }

      // Calcular velocidad
      const baseSpeed = isPowerActive ? 1.5 : 4.0;
      const speed = baseSpeed * (result.speedMultiplier || 1.0);

      // Calcular nueva posición
      const newX = position.x + newDir.x * speed * delta;
      const newZ = position.z + newDir.z * speed * delta;

      // Mover si es válido
      if (!checkCollision(newX, newZ, walls)) {
        onPositionUpdate(newX, newZ);

        // Actualizar animación
        setAnimationTime(prev => {
          const newTime = prev + delta * animationSpeed;
          const newFrame = Math.floor(newTime) % frameCount;
          setCurrentFrame(newFrame);
          return newTime;
        });
      }
    }

    // Guardar info de debug
    if (debugMode && result.debugInfo) {
      setDebugInfo(result.debugInfo);
    }
  });

  /**
   * Manejo especial para regreso a casa
   */
  const handleReturningToHome = (delta) => {
    if (!doghousePos) return;

    const dx = doghousePos.x - position.x;
    const dz = doghousePos.z - position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.5) {
      const angle = Math.atan2(dz, dx);
      const newDir = {
        x: Math.cos(angle),
        z: Math.sin(angle)
      };

      setDirection(newDir);
      setLastDirection(newDir);

      const speed = 8.0; // Velocidad rápida de retorno
      const newX = position.x + newDir.x * speed * delta;
      const newZ = position.z + newDir.z * speed * delta;

      if (!checkCollision(newX, newZ, walls)) {
        onPositionUpdate(newX, newZ);

        setAnimationTime(prev => {
          const newTime = prev + delta * animationSpeed;
          const newFrame = Math.floor(newTime) % frameCount;
          setCurrentFrame(newFrame);
          return newTime;
        });
      }
    }
  };

  /**
   * Obtiene la textura según la dirección
   */
  const getCurrentTexture = () => {
    if (lastDirection.z < 0) return spritesheet1;
    if (lastDirection.x < 0) return spritesheet1;
    if (lastDirection.x > 0) return spritesheet2;
    if (lastDirection.z > 0) return spritesheet2;
    return spritesheet2;
  };

  /**
   * Determina si voltear el sprite
   */
  const getFlipX = () => {
    if (lastDirection.x < 0) return -1;
    if (lastDirection.z > 0) return -1;
    return 1;
  };

  // Preparar textura
  const texture = getCurrentTexture().clone();
  texture.repeat.set(1 / frameCount, 1);
  texture.offset.x = currentFrame / frameCount;

  // Color según estado
  const getEmissiveColor = () => {
    if (isReturning) return "#4CAF50";  // Verde (regresando)
    if (isPowerActive) return "#0000FF";  // Azul (vulnerable)
    return "#FF0000";  // Rojo (peligroso)
  };

  const emissiveIntensity = isPowerActive ? 0.8 : (isReturning ? 0.5 : 0.3);

  return (
    <>
      {/* Enemigo principal */}
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
          emissive={getEmissiveColor()}
          emissiveIntensity={emissiveIntensity}
          depthWrite={true}
        />
      </mesh>

      {/* Debug: Mostrar información de IA */}
      {debugMode && debugInfo && (
        <>
          {/* Línea hacia el objetivo */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([
                  position.x, 0.5, position.z,
                  position.x + direction.x * 3, 0.5, position.z + direction.z * 3
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#00FF00" linewidth={2} />
          </line>

          {/* Texto de debug (simplificado) */}
          <sprite position={[position.x, 1.5, position.z]} scale={[2, 0.5, 1]}>
            <spriteMaterial color="#FFFFFF" transparent opacity={0.8} />
          </sprite>
        </>
      )}

      {/* Visualización del cono de visión (debug) */}
      {debugMode && (
        <mesh
          position={[position.x, 0.1, position.z]}
          rotation={[-Math.PI / 2, 0, Math.atan2(direction.z, direction.x)]}
        >
          <ringGeometry args={[0, 8, 16, 1, 0, Math.PI * 0.75]} />
          <meshBasicMaterial
            color="#FFFF00"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </>
  );
}

export default EnemyAdvanced;
