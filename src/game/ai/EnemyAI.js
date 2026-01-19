/**
 * Sistema de IA Centralizado para Enemigos
 * Beer Run Game
 *
 * Este archivo contiene toda la lógica de IA compartida entre niveles
 */

// ============================================================================
// CONFIGURACIÓN DE ROLES
// ============================================================================

export const AIRoles = {
  NORMAL: 'normal',
  STRAIGHT: 'straight',
  TURNER: 'turner',
  FREQUENT: 'frequent',
  CHASER: 'chaser',
  CUTTER: 'cutter',
  ROTATOR: 'rotator',
  LAZY: 'lazy',
  AMBUSHER: 'ambusher',
  FLANKER: 'flanker',
  PATROL: 'patrol',
  SWARM: 'swarm',
  PURSUER: 'pursuer'
};

export const AIStates = {
  IDLE: 'idle',
  PATROL: 'patrol',
  ALERT: 'alert',
  CHASE: 'chase',
  SEARCH: 'search',
  FLEE: 'flee',
  RETURN: 'return'
};

/**
 * Configuración de comportamiento por rol
 */
export const getRoleConfig = (role) => {
  const baseVariation = Math.random() * 2;

  const configs = {
    [AIRoles.NORMAL]: {
      scatterDuration: 5 + baseVariation,
      chaseDuration: 5 + baseVariation,
      straightBias: 0.5,
      speed: 2.52,
      detectionRadius: 20,
      chaseRadius: 18,
      losePlayerDistance: 25,
      description: 'Comportamiento equilibrado básico'
    },

    [AIRoles.STRAIGHT]: {
      scatterDuration: 6 + baseVariation,
      chaseDuration: 5 + baseVariation,
      straightBias: 0.7,
      speed: 2.8,
      detectionRadius: 22,
      chaseRadius: 20,
      losePlayerDistance: 28,
      description: 'Prefiere seguir en línea recta, perseguidor directo'
    },

    [AIRoles.TURNER]: {
      scatterDuration: 5 + baseVariation,
      chaseDuration: 6 + baseVariation,
      straightBias: 0.2,
      speed: 2.8,
      detectionRadius: 18,
      chaseRadius: 16,
      losePlayerDistance: 22,
      description: 'Gira frecuentemente, impredecible'
    },

    [AIRoles.FREQUENT]: {
      scatterDuration: 3 + baseVariation,
      chaseDuration: 3 + baseVariation,
      straightBias: 0.5,
      speed: 3.0,
      detectionRadius: 20,
      chaseRadius: 18,
      losePlayerDistance: 25,
      description: 'Cambia de modo frecuentemente'
    },

    [AIRoles.CHASER]: {
      scatterDuration: 4 + baseVariation,
      chaseDuration: 8 + baseVariation,
      straightBias: 0.8,
      speed: 3.5,
      detectionRadius: 25,
      chaseRadius: 23,
      losePlayerDistance: 30,
      usePrediction: true,
      description: 'Perseguidor agresivo, muy rápido y persistente'
    },

    [AIRoles.CUTTER]: {
      scatterDuration: 6 + baseVariation,
      chaseDuration: 4 + baseVariation,
      straightBias: 0.3,
      speed: 3.0,
      detectionRadius: 20,
      chaseRadius: 18,
      losePlayerDistance: 25,
      useInterception: true,
      description: 'Intenta cortar el camino del jugador'
    },

    [AIRoles.ROTATOR]: {
      scatterDuration: 3 + baseVariation,
      chaseDuration: 3 + baseVariation,
      straightBias: 0.5,
      speed: 3.0,
      detectionRadius: 20,
      chaseRadius: 18,
      losePlayerDistance: 25,
      description: 'Cambios de dirección impredecibles'
    },

    [AIRoles.LAZY]: {
      scatterDuration: 7 + baseVariation,
      chaseDuration: 3 + baseVariation,
      straightBias: 0.6,
      speed: 2.45,
      detectionRadius: 15,
      chaseRadius: 13,
      losePlayerDistance: 20,
      description: 'Lento y perezoso, persecución breve'
    },

    [AIRoles.AMBUSHER]: {
      scatterDuration: 10 + baseVariation,
      chaseDuration: 15 + baseVariation,
      straightBias: 0.6,
      speed: 2.8,
      detectionRadius: 12,
      chaseRadius: 10,
      losePlayerDistance: 30,
      useAmbushBehavior: true,
      description: 'Espera en chokepoints y embosca'
    },

    [AIRoles.FLANKER]: {
      scatterDuration: 4 + baseVariation,
      chaseDuration: 8 + baseVariation,
      straightBias: 0.5,
      speed: 3.15,
      detectionRadius: 22,
      chaseRadius: 20,
      losePlayerDistance: 28,
      useInterception: true,
      description: 'Rodea al jugador e intercepta'
    },

    [AIRoles.PATROL]: {
      scatterDuration: 20 + baseVariation,
      chaseDuration: 3 + baseVariation,
      straightBias: 0.8,
      speed: 2.66,
      detectionRadius: 18,
      chaseRadius: 16,
      losePlayerDistance: 22,
      usePatrolPath: true,
      description: 'Patrulla zona asignada, persecución breve'
    },

    [AIRoles.SWARM]: {
      scatterDuration: 5 + baseVariation,
      chaseDuration: 10 + baseVariation,
      straightBias: 0.6,
      speed: 3.36,
      detectionRadius: 20,
      chaseRadius: 18,
      losePlayerDistance: 25,
      useCoordination: true,
      description: 'Coordinación con grupo'
    },

    [AIRoles.PURSUER]: {
      scatterDuration: 1 + baseVariation * 0.5,
      chaseDuration: 999,
      straightBias: 0.7,
      speed: 2.8,
      detectionRadius: 100,
      chaseRadius: 100,
      losePlayerDistance: 999,
      usePrediction: true,
      alwaysChase: true,
      maxDistanceFromPlayer: 12,
      description: 'Perseguidor constante, siempre visible en pantalla'
    }
  };

  return configs[role] || configs[AIRoles.NORMAL];
};

// ============================================================================
// UTILIDADES DE GEOMETRÍA Y COLISIÓN
// ============================================================================

/**
 * Calcula la distancia entre dos puntos
 */
export const getDistance = (pos1, pos2) => {
  return Math.sqrt(
    Math.pow(pos1.x - pos2.x, 2) +
    Math.pow(pos1.z - pos2.z, 2)
  );
};

/**
 * Normaliza una dirección
 */
export const normalizeDirection = (dir) => {
  const length = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
  if (length === 0) return { x: 0, z: 0 };
  return {
    x: dir.x / length,
    z: dir.z / length
  };
};

/**
 * Calcula el ángulo entre dos puntos
 */
export const getAngle = (from, to) => {
  return Math.atan2(to.z - from.z, to.x - from.x);
};

/**
 * Obtiene las 4 direcciones cardinales
 */
export const getCardinalDirections = () => {
  return [
    { x: 1, z: 0 },   // Derecha
    { x: -1, z: 0 },  // Izquierda
    { x: 0, z: 1 },   // Abajo
    { x: 0, z: -1 }   // Arriba
  ];
};

// ============================================================================
// DETECCIÓN DE INTERSECCIONES
// ============================================================================

/**
 * Detecta si una posición es una intersección
 * @param {Object} pos - Posición actual {x, z}
 * @param {Object} lastPos - Última intersección {x, z}
 * @param {Function} checkCollision - Función de colisión
 * @param {Array} walls - Array de muros
 * @returns {boolean}
 */
export const isAtIntersection = (pos, lastPos, checkCollision, walls) => {
  // Cooldown de distancia para evitar detecciones múltiples
  const distanceFromLast = getDistance(pos, lastPos);
  if (distanceFromLast < 1.5) return false;

  // Contar direcciones disponibles
  const directions = getCardinalDirections();
  let availableDirections = 0;

  directions.forEach(dir => {
    const testX = pos.x + dir.x * 0.6;
    const testZ = pos.z + dir.z * 0.6;
    if (!checkCollision(testX, testZ, walls)) {
      availableDirections++;
    }
  });

  // Es una intersección si hay más de 2 direcciones disponibles
  return availableDirections > 2;
};

/**
 * Obtiene direcciones válidas desde una posición
 * @param {Object} pos - Posición actual
 * @param {Object} currentDir - Dirección actual
 * @param {Function} checkCollision - Función de colisión
 * @param {Array} walls - Array de muros
 * @param {boolean} allowReverse - Permitir reversión
 * @returns {Array}
 */
export const getValidDirections = (pos, currentDir, checkCollision, walls, allowReverse = false) => {
  const directions = getCardinalDirections();

  return directions.filter(dir => {
    // No permitir reversa a menos que sea necesario
    if (!allowReverse && dir.x === -currentDir.x && dir.z === -currentDir.z) {
      return false;
    }

    // Verificar si la dirección está libre
    const testX = pos.x + dir.x * 0.5;
    const testZ = pos.z + dir.z * 0.5;
    return !checkCollision(testX, testZ, walls);
  });
};

// ============================================================================
// ALGORITMOS DE DECISIÓN
// ============================================================================

/**
 * Predice la posición futura del jugador
 * @param {Object} playerPos - Posición actual del jugador
 * @param {Object} playerDir - Dirección del jugador
 * @param {number} steps - Pasos a predecir
 * @returns {Object}
 */
export const predictPlayerPosition = (playerPos, playerDir, steps = 8) => {
  return {
    x: playerPos.x + playerDir.x * steps * 0.5,
    z: playerPos.z + playerDir.z * steps * 0.5
  };
};

/**
 * Calcula punto de intercepción adelante del jugador
 * @param {Object} enemyPos - Posición del enemigo
 * @param {Object} playerPos - Posición del jugador
 * @param {Object} playerDir - Dirección del jugador
 * @returns {Object}
 */
export const calculateInterceptPoint = (enemyPos, playerPos, playerDir) => {
  // Estimar cuántos pasos adelante interceptar
  const distance = getDistance(enemyPos, playerPos);
  const interceptDistance = Math.min(5, distance / 2);

  return {
    x: playerPos.x + playerDir.x * interceptDistance,
    z: playerPos.z + playerDir.z * interceptDistance
  };
};

/**
 * Elige dirección en modo scatter (aleatorio con sesgo)
 * @param {Array} validDirs - Direcciones válidas
 * @param {Object} currentDir - Dirección actual
 * @param {number} straightBias - Probabilidad de seguir recto (0-1)
 * @returns {Object}
 */
export const chooseScatterDirection = (validDirs, currentDir, straightBias = 0.5) => {
  if (validDirs.length === 0) return currentDir;

  // Intentar continuar en la misma dirección
  const continueDir = validDirs.find(dir =>
    dir.x === currentDir.x && dir.z === currentDir.z
  );

  if (continueDir && Math.random() < straightBias) {
    return continueDir;
  }

  // Dirección aleatoria
  return validDirs[Math.floor(Math.random() * validDirs.length)];
};

/**
 * Elige dirección en modo chase (persecución)
 * @param {Array} validDirs - Direcciones válidas
 * @param {Object} enemyPos - Posición del enemigo
 * @param {Object} targetPos - Posición objetivo
 * @returns {Object}
 */
export const chooseChaseDirection = (validDirs, enemyPos, targetPos) => {
  if (validDirs.length === 0) return { x: 0, z: 0 };

  const dx = targetPos.x - enemyPos.x;
  const dz = targetPos.z - enemyPos.z;

  // Elegir dirección que más acerca al objetivo
  return validDirs.reduce((best, dir) => {
    const score = dir.x * dx + dir.z * dz;
    const bestScore = best.x * dx + best.z * dz;
    return score > bestScore ? dir : best;
  });
};

/**
 * Elige dirección de huida (opuesto al jugador)
 * @param {Array} validDirs - Direcciones válidas
 * @param {Object} enemyPos - Posición del enemigo
 * @param {Object} playerPos - Posición del jugador
 * @returns {Object}
 */
export const chooseFleeDirection = (validDirs, enemyPos, playerPos) => {
  if (validDirs.length === 0) return { x: 0, z: 0 };

  const dx = enemyPos.x - playerPos.x; // Invertido
  const dz = enemyPos.z - playerPos.z; // Invertido

  return validDirs.reduce((best, dir) => {
    const score = dir.x * dx + dir.z * dz;
    const bestScore = best.x * dx + best.z * dz;
    return score > bestScore ? dir : best;
  });
};

// ============================================================================
// ZONAS Y PATRULLAJE
// ============================================================================

/**
 * Define zonas de patrulla en el mapa
 * @param {number} mapWidth - Ancho del mapa
 * @param {number} mapHeight - Alto del mapa
 * @param {number} divisions - Divisiones (2 = 4 cuadrantes, 3 = 9 cuadrantes)
 * @returns {Array}
 */
export const createPatrolZones = (mapWidth = 32, mapHeight = 38, divisions = 2) => {
  const zones = [];
  const zoneWidth = mapWidth / divisions;
  const zoneHeight = mapHeight / divisions;

  for (let i = 0; i < divisions; i++) {
    for (let j = 0; j < divisions; j++) {
      zones.push({
        id: `zone_${i}_${j}`,
        centerX: (i + 0.5) * zoneWidth,
        centerZ: (j + 0.5) * zoneHeight,
        minX: i * zoneWidth,
        maxX: (i + 1) * zoneWidth,
        minZ: j * zoneHeight,
        maxZ: (j + 1) * zoneHeight,
        radius: Math.min(zoneWidth, zoneHeight) / 2
      });
    }
  }

  return zones;
};

/**
 * Asigna una zona a un enemigo
 * @param {number} enemyId - ID del enemigo
 * @param {Array} zones - Array de zonas
 * @returns {Object}
 */
export const assignZone = (enemyId, zones) => {
  return zones[enemyId % zones.length];
};

/**
 * Obtiene dirección hacia el centro de una zona
 * @param {Object} pos - Posición actual
 * @param {Object} zone - Zona objetivo
 * @param {Array} validDirs - Direcciones válidas
 * @returns {Object}
 */
export const getZoneDirection = (pos, zone, validDirs) => {
  if (validDirs.length === 0) return { x: 0, z: 0 };

  const dx = zone.centerX - pos.x;
  const dz = zone.centerZ - pos.z;

  return validDirs.reduce((best, dir) => {
    const score = dir.x * dx + dir.z * dz;
    const bestScore = best.x * dx + best.z * dz;
    return score > bestScore ? dir : best;
  });
};

/**
 * Verifica si está dentro de una zona
 * @param {Object} pos - Posición
 * @param {Object} zone - Zona
 * @returns {boolean}
 */
export const isInZone = (pos, zone) => {
  return pos.x >= zone.minX &&
    pos.x <= zone.maxX &&
    pos.z >= zone.minZ &&
    pos.z <= zone.maxZ;
};

// ============================================================================
// MÁQUINA DE ESTADOS DE IA
// ============================================================================

/**
 * Actualiza el estado de la IA según las condiciones
 * @param {Object} params - Parámetros de estado
 * @returns {string} - Nuevo estado
 */
export const updateAIState = ({
  currentState,
  distance,
  config,
  isPowerActive,
  timeSinceSpawn,
  searchTimer,
  hasLineOfSight
}) => {
  // Comportamiento especial para PURSUER - siempre persigue
  if (config.alwaysChase) {
    if (isPowerActive) {
      return AIStates.FLEE;
    }
    if (timeSinceSpawn < 1) {
      return AIStates.IDLE;
    }
    return AIStates.CHASE;
  }

  switch (currentState) {
    case AIStates.IDLE:
      if (timeSinceSpawn > 2) {
        return AIStates.PATROL;
      }
      break;

    case AIStates.PATROL:
      if (isPowerActive && distance < config.detectionRadius) {
        return AIStates.FLEE;
      }
      if (distance < config.detectionRadius && hasLineOfSight) {
        return AIStates.ALERT;
      }
      break;

    case AIStates.ALERT:
      if (isPowerActive) {
        return AIStates.FLEE;
      }
      if (distance < config.chaseRadius) {
        return AIStates.CHASE;
      }
      if (distance > config.detectionRadius * 1.5) {
        return AIStates.PATROL;
      }
      break;

    case AIStates.CHASE:
      if (isPowerActive) {
        return AIStates.FLEE;
      }
      if (distance > config.losePlayerDistance || !hasLineOfSight) {
        return AIStates.SEARCH;
      }
      break;

    case AIStates.SEARCH:
      if (isPowerActive) {
        return AIStates.FLEE;
      }
      if (distance < config.detectionRadius && hasLineOfSight) {
        return AIStates.CHASE;
      }
      if (searchTimer <= 0) {
        return AIStates.PATROL;
      }
      break;

    case AIStates.FLEE:
      if (!isPowerActive) {
        return AIStates.PATROL;
      }
      break;

    case AIStates.RETURN:
      // Estado gestionado externamente
      break;
  }

  return currentState;
};

/**
 * Obtiene el objetivo de movimiento según el estado
 * @param {Object} params - Parámetros
 * @returns {Object} - Posición objetivo
 */
export const getMovementTarget = ({
  state,
  enemyPos,
  playerPos,
  playerDir,
  lastSeenPos,
  assignedZone,
  doghousePos,
  config
}) => {
  switch (state) {
    case AIStates.IDLE:
      return enemyPos; // No mover

    case AIStates.PATROL:
      if (assignedZone) {
        return { x: assignedZone.centerX, z: assignedZone.centerZ };
      }
      return enemyPos;

    case AIStates.ALERT:
    case AIStates.CHASE:
      if (config.usePrediction) {
        return predictPlayerPosition(playerPos, playerDir, 8);
      }
      if (config.useInterception) {
        return calculateInterceptPoint(enemyPos, playerPos, playerDir);
      }
      return playerPos;

    case AIStates.SEARCH:
      return lastSeenPos || playerPos;

    case AIStates.FLEE:
      // Retorna posición opuesta al jugador (se manejará con chooseFleeDirection)
      return playerPos;

    case AIStates.RETURN:
      return doghousePos;

    default:
      return playerPos;
  }
};

// ============================================================================
// FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN DE IA
// ============================================================================

/**
 * Actualiza la IA del enemigo (llamar en useFrame)
 * @param {Object} params - Parámetros completos
 * @returns {Object} - { newDirection, newState, shouldMove }
 */
export const updateEnemyAI = ({
  // Posiciones
  enemyPos,
  playerPos,
  direction,

  // Estado actual
  currentState,
  mode,
  modeTimer,
  lastIntersectionPos,
  lastSeenPlayerPos,
  searchTimer,

  // Configuración
  roleConfig,
  walls,
  checkCollision,

  // Contexto
  delta,
  isPaused,
  isPowerActive,
  isReturning,
  timeSinceSpawn = 999,

  // Opcionales
  assignedZone = null,
  doghousePos = null,
  playerDirection = { x: 0, z: 0 },
  slowDownOnPower = true
}) => {
  if (isPaused) {
    return {
      newDirection: direction,
      newState: currentState,
      newMode: mode,
      newModeTimer: modeTimer,
      shouldMove: false
    };
  }

  const distance = getDistance(enemyPos, playerPos);

  // Manejo especial de retorno a casa
  if (isReturning && doghousePos) {
    const dx = doghousePos.x - enemyPos.x;
    const dz = doghousePos.z - enemyPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.5) {
      const angle = Math.atan2(dz, dx);
      const newDir = {
        x: Math.cos(angle),
        z: Math.sin(angle)
      };
      return {
        newDirection: normalizeDirection(newDir),
        newState: AIStates.RETURN,
        newMode: mode,
        newModeTimer: modeTimer,
        shouldMove: true,
        speed: 5.6 // Velocidad rápida de retorno
      };
    }
  }

  // Culling por distancia (excepto PURSUER que siempre está activo)
  if (distance > 30 && currentState !== AIStates.RETURN && !roleConfig.alwaysChase) {
    return {
      newDirection: direction,
      newState: currentState,
      newMode: mode,
      newModeTimer: modeTimer,
      shouldMove: false
    };
  }

  // Actualizar timer de modo
  let newModeTimer = modeTimer + delta;
  let newMode = mode;

  const currentDuration = mode === 'scatter'
    ? roleConfig.scatterDuration
    : roleConfig.chaseDuration;

  if (newModeTimer >= currentDuration) {
    newMode = mode === 'scatter' ? 'chase' : 'scatter';
    newModeTimer = 0;
  }

  // Actualizar estado de IA
  const newState = updateAIState({
    currentState,
    distance,
    config: roleConfig,
    isPowerActive,
    timeSinceSpawn,
    searchTimer,
    hasLineOfSight: true // Simplificado, se puede mejorar con raycasting
  });

  // Obtener objetivo de movimiento
  const target = getMovementTarget({
    state: newState,
    enemyPos,
    playerPos,
    playerDir: playerDirection,
    lastSeenPos: lastSeenPlayerPos,
    assignedZone,
    doghousePos,
    config: roleConfig
  });

  // Calcular próxima posición
  let speed = (isPowerActive && slowDownOnPower) ? roleConfig.speed * 0.4 : roleConfig.speed;

  // Comportamiento especial PURSUER: acelerar si está muy lejos para mantenerse visible
  if (roleConfig.alwaysChase && roleConfig.maxDistanceFromPlayer) {
    if (distance > roleConfig.maxDistanceFromPlayer) {
      // Acelerar proporcionalmente a la distancia para alcanzar al jugador
      const catchUpMultiplier = Math.min(2.0, 1 + (distance - roleConfig.maxDistanceFromPlayer) / 10);
      speed = roleConfig.speed * catchUpMultiplier;
    }
  }

  const nextX = enemyPos.x + direction.x * speed * delta;
  const nextZ = enemyPos.z + direction.z * speed * delta;

  const canMove = !checkCollision(nextX, nextZ, walls);
  const atIntersection = isAtIntersection(
    enemyPos,
    lastIntersectionPos,
    checkCollision,
    walls
  );

  let newDirection = direction;
  let newLastIntersectionPos = lastIntersectionPos;

  // Decidir dirección en intersección o si está bloqueado
  if (atIntersection || !canMove) {
    let validDirs = getValidDirections(enemyPos, direction, checkCollision, walls, false);

    // Si no hay direcciones válidas, permitir reversión
    if (validDirs.length === 0) {
      validDirs = getValidDirections(enemyPos, direction, checkCollision, walls, true);
    }

    if (validDirs.length > 0) {
      // Elegir dirección según el modo y estado
      if (newState === AIStates.FLEE || (newState === AIStates.PATROL && isPowerActive)) {
        newDirection = chooseFleeDirection(validDirs, enemyPos, playerPos);
      } else if (newMode === 'scatter' && (!assignedZone || isInZone(enemyPos, assignedZone))) {
        newDirection = chooseScatterDirection(validDirs, direction, roleConfig.straightBias);
      } else if (newMode === 'scatter' && assignedZone) {
        // Moverse hacia zona asignada
        newDirection = getZoneDirection(enemyPos, assignedZone, validDirs);
      } else {
        // Modo chase
        newDirection = chooseChaseDirection(validDirs, enemyPos, target);
      }

      if (atIntersection) {
        newLastIntersectionPos = { x: enemyPos.x, z: enemyPos.z };
      }
    }
  }

  return {
    newDirection,
    newState,
    newMode,
    newModeTimer,
    newLastIntersectionPos,
    shouldMove: canMove,
    speed
  };
};

// ============================================================================
// HOOK DE REACT PARA USO FÁCIL (OPCIONAL)
// ============================================================================

/**
 * Hook personalizado para enemigos
 * Uso: const enemyAI = useEnemyAI({ ... });
 */
export const createEnemyAIState = (role = AIRoles.NORMAL) => {
  return {
    role,
    config: getRoleConfig(role),
    direction: { x: 1, z: 0 },
    state: AIStates.IDLE,
    mode: 'scatter',
    modeTimer: 0,
    lastIntersectionPos: { x: -999, z: -999 },
    lastSeenPlayerPos: null,
    searchTimer: 0,
    timeSinceSpawn: 0
  };
};

// ============================================================================
// UTILIDADES DE DEBUG
// ============================================================================

/**
 * Obtiene color según el estado de IA
 */
export const getStateDebugColor = (state) => {
  const colors = {
    [AIStates.IDLE]: '#888888',
    [AIStates.PATROL]: '#4CAF50',
    [AIStates.ALERT]: '#FFC107',
    [AIStates.CHASE]: '#F44336',
    [AIStates.SEARCH]: '#2196F3',
    [AIStates.FLEE]: '#9C27B0',
    [AIStates.RETURN]: '#00BCD4'
  };
  return colors[state] || '#FFFFFF';
};

/**
 * Obtiene información de debug formateada
 */
export const getDebugInfo = (enemyAI) => {
  return {
    role: enemyAI.role,
    state: enemyAI.state,
    mode: enemyAI.mode,
    speed: enemyAI.config.speed,
    direction: `(${enemyAI.direction.x.toFixed(1)}, ${enemyAI.direction.z.toFixed(1)})`
  };
};

export default {
  AIRoles,
  AIStates,
  getRoleConfig,
  updateEnemyAI,
  createEnemyAIState,
  createPatrolZones,
  assignZone,
  getDistance,
  predictPlayerPosition,
  calculateInterceptPoint
};
