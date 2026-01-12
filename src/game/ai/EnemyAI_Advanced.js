/**
 * ============================================================================
 * SISTEMA DE IA AVANZADO PARA ENEMIGOS
 * Beer Run Game - Advanced AI System
 * ============================================================================
 *
 * Características:
 * - Aprendizaje de patrones del jugador
 * - Coordinación inteligente entre enemigos
 * - Pathfinding A* para navegación óptima
 * - Predicción avanzada de movimiento
 * - Sistema de visión con raycasting
 * - Toma de decisiones por utilidad
 * - Memoria y adaptación dinámica
 */

import {
  getDistance,
  normalizeDirection,
  getCardinalDirections,
  AIRoles,
  AIStates
} from './EnemyAI';

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN AVANZADA
// ============================================================================

export const AdvancedAIConfig = {
  PLAYER_MEMORY_LENGTH: 30,           // Registros de posición del jugador
  PATTERN_DETECTION_THRESHOLD: 5,     // Repeticiones para detectar patrón
  COORDINATION_RADIUS: 15,            // Radio para coordinar con otros enemigos
  VISION_ANGLE: Math.PI * 0.75,       // Ángulo de visión (135 grados)
  HEARING_RADIUS: 12,                 // Radio de "audición" del movimiento
  PATH_RECALC_INTERVAL: 0.5,          // Recalcular ruta cada X segundos
  TACTICAL_POSITION_RADIUS: 8,        // Radio para posiciones tácticas
  LEARNING_RATE: 0.1,                 // Velocidad de aprendizaje
  TRAP_DETECTION_DEPTH: 5,            // Profundidad para detectar trampas
};

// ============================================================================
// MEMORIA DEL JUGADOR Y ANÁLISIS DE PATRONES
// ============================================================================

/**
 * Clase para rastrear y analizar el comportamiento del jugador
 */
export class PlayerMemory {
  constructor() {
    this.positionHistory = [];
    this.directionHistory = [];
    this.collectionPoints = [];
    this.frequentPaths = new Map();
    this.preferredDirections = { up: 0, down: 0, left: 0, right: 0 };
    this.averageSpeed = 0;
    this.escapePatterns = [];
    this.favoriteZones = new Map();
  }

  /**
   * Registra una nueva posición del jugador
   */
  addPosition(pos, direction, isMoving) {
    const now = Date.now();

    // Añadir a historial
    this.positionHistory.push({
      pos: { ...pos },
      dir: { ...direction },
      time: now,
      moving: isMoving
    });

    // Limitar tamaño del historial
    if (this.positionHistory.length > AdvancedAIConfig.PLAYER_MEMORY_LENGTH) {
      this.positionHistory.shift();
    }

    // Actualizar direcciones preferidas
    if (isMoving) {
      if (direction.z < 0) this.preferredDirections.up++;
      if (direction.z > 0) this.preferredDirections.down++;
      if (direction.x < 0) this.preferredDirections.left++;
      if (direction.x > 0) this.preferredDirections.right++;
    }

    // Calcular velocidad promedio
    this.calculateAverageSpeed();
  }

  /**
   * Registra cuando el jugador recoge algo
   */
  addCollectionPoint(pos) {
    this.collectionPoints.push({ ...pos, time: Date.now() });
    if (this.collectionPoints.length > 50) {
      this.collectionPoints.shift();
    }
  }

  /**
   * Calcula la velocidad promedio del jugador
   */
  calculateAverageSpeed() {
    if (this.positionHistory.length < 2) return;

    let totalSpeed = 0;
    let count = 0;

    for (let i = 1; i < this.positionHistory.length; i++) {
      const prev = this.positionHistory[i - 1];
      const curr = this.positionHistory[i];

      const dist = getDistance(prev.pos, curr.pos);
      const time = (curr.time - prev.time) / 1000;

      if (time > 0) {
        totalSpeed += dist / time;
        count++;
      }
    }

    this.averageSpeed = count > 0 ? totalSpeed / count : 0;
  }

  /**
   * Predice la próxima posición del jugador basándose en patrones
   */
  predictNextPosition(currentPos, currentDir, steps = 5) {
    if (this.positionHistory.length < 3) {
      // Predicción básica si no hay suficiente historial
      return {
        x: currentPos.x + currentDir.x * steps * 0.5,
        z: currentPos.z + currentDir.z * steps * 0.5,
        confidence: 0.3
      };
    }

    // Analizar patrón reciente
    const recentHistory = this.positionHistory.slice(-10);
    let avgDirX = 0, avgDirZ = 0;

    recentHistory.forEach(entry => {
      if (entry.moving) {
        avgDirX += entry.dir.x;
        avgDirZ += entry.dir.z;
      }
    });

    const count = recentHistory.filter(e => e.moving).length;
    if (count > 0) {
      avgDirX /= count;
      avgDirZ /= count;
    }

    // Combinar dirección actual con tendencia histórica
    const weight = 0.7; // Peso para dirección actual
    const finalDirX = currentDir.x * weight + avgDirX * (1 - weight);
    const finalDirZ = currentDir.z * weight + avgDirZ * (1 - weight);

    return {
      x: currentPos.x + finalDirX * steps * 0.6,
      z: currentPos.z + finalDirZ * steps * 0.6,
      confidence: Math.min(0.9, 0.4 + (count / 10) * 0.5)
    };
  }

  /**
   * Detecta si el jugador está en un patrón de escape
   */
  isInEscapePattern() {
    if (this.positionHistory.length < 5) return false;

    const recent = this.positionHistory.slice(-5);
    let changeCount = 0;

    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const curr = recent[i];

      if (prev.dir.x !== curr.dir.x || prev.dir.z !== curr.dir.z) {
        changeCount++;
      }
    }

    // Si cambia de dirección más de 3 veces en 5 frames, está escapando
    return changeCount >= 3;
  }

  /**
   * Obtiene la dirección más probable del jugador
   */
  getMostLikelyDirection() {
    const total = Object.values(this.preferredDirections).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    const probs = {
      up: this.preferredDirections.up / total,
      down: this.preferredDirections.down / total,
      left: this.preferredDirections.left / total,
      right: this.preferredDirections.right / total
    };

    const max = Math.max(...Object.values(probs));
    const direction = Object.keys(probs).find(k => probs[k] === max);

    const dirMap = {
      up: { x: 0, z: -1 },
      down: { x: 0, z: 1 },
      left: { x: -1, z: 0 },
      right: { x: 1, z: 0 }
    };

    return dirMap[direction] || { x: 0, z: 0 };
  }
}

// ============================================================================
// SISTEMA DE PATHFINDING A*
// ============================================================================

/**
 * Implementación del algoritmo A* para navegación óptima
 */
export class AStarPathfinder {
  constructor(walls, checkCollision, gridSize = 1) {
    this.walls = walls;
    this.checkCollision = checkCollision;
    this.gridSize = gridSize;
    this.cache = new Map();
    this.cacheMaxAge = 2000; // 2 segundos
  }

  /**
   * Calcula la ruta óptima entre dos puntos
   */
  findPath(start, goal, maxNodes = 300) {
    // Verificar caché
    const cacheKey = `${Math.floor(start.x)},${Math.floor(start.z)}-${Math.floor(goal.x)},${Math.floor(goal.z)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.time < this.cacheMaxAge) {
      return cached.path;
    }

    // Nodos explorados
    const openSet = [{
      pos: start,
      g: 0,
      h: this.heuristic(start, goal),
      parent: null
    }];

    const closedSet = new Set();
    const gScores = new Map();
    gScores.set(this.posKey(start), 0);

    let iterations = 0;

    while (openSet.length > 0 && iterations < maxNodes) {
      iterations++;

      // Obtener nodo con menor f = g + h
      openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
      const current = openSet.shift();

      // Si llegamos al objetivo
      if (getDistance(current.pos, goal) < this.gridSize * 1.5) {
        const path = this.reconstructPath(current);
        this.cache.set(cacheKey, { path, time: Date.now() });
        return path;
      }

      const currentKey = this.posKey(current.pos);
      closedSet.add(currentKey);

      // Explorar vecinos
      const neighbors = this.getNeighbors(current.pos);

      for (const neighbor of neighbors) {
        const neighborKey = this.posKey(neighbor);

        if (closedSet.has(neighborKey)) continue;

        const tentativeG = current.g + getDistance(current.pos, neighbor);
        const existingG = gScores.get(neighborKey);

        if (existingG === undefined || tentativeG < existingG) {
          gScores.set(neighborKey, tentativeG);

          const neighborNode = {
            pos: neighbor,
            g: tentativeG,
            h: this.heuristic(neighbor, goal),
            parent: current
          };

          // Añadir o actualizar en openSet
          const existingIndex = openSet.findIndex(n =>
            this.posKey(n.pos) === neighborKey
          );

          if (existingIndex === -1) {
            openSet.push(neighborNode);
          } else {
            openSet[existingIndex] = neighborNode;
          }
        }
      }
    }

    // No se encontró camino, retornar null
    return null;
  }

  /**
   * Heurística para A* (distancia Manhattan)
   */
  heuristic(pos, goal) {
    return Math.abs(pos.x - goal.x) + Math.abs(pos.z - goal.z);
  }

  /**
   * Reconstruye el camino desde el nodo final
   */
  reconstructPath(node) {
    const path = [];
    let current = node;

    while (current) {
      path.unshift(current.pos);
      current = current.parent;
    }

    return path;
  }

  /**
   * Obtiene vecinos válidos de una posición
   */
  getNeighbors(pos) {
    const neighbors = [];
    const directions = [
      { x: 1, z: 0 },
      { x: -1, z: 0 },
      { x: 0, z: 1 },
      { x: 0, z: -1 },
      // Diagonales (opcional)
      { x: 1, z: 1 },
      { x: 1, z: -1 },
      { x: -1, z: 1 },
      { x: -1, z: -1 }
    ];

    for (const dir of directions) {
      const newPos = {
        x: pos.x + dir.x * this.gridSize,
        z: pos.z + dir.z * this.gridSize
      };

      if (!this.checkCollision(newPos.x, newPos.z, this.walls)) {
        neighbors.push(newPos);
      }
    }

    return neighbors;
  }

  /**
   * Genera una clave única para una posición
   */
  posKey(pos) {
    return `${Math.floor(pos.x / this.gridSize)},${Math.floor(pos.z / this.gridSize)}`;
  }

  /**
   * Limpia la caché antigua
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.time > this.cacheMaxAge) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================================================
// SISTEMA DE VISIÓN Y DETECCIÓN
// ============================================================================

/**
 * Sistema de visión con raycasting para detección realista
 */
export class VisionSystem {
  /**
   * Verifica si el enemigo tiene línea de visión al jugador
   */
  static hasLineOfSight(enemyPos, enemyDir, playerPos, walls, checkCollision) {
    const distance = getDistance(enemyPos, playerPos);
    const maxDistance = 25;

    if (distance > maxDistance) return false;

    // Verificar ángulo de visión
    const toPlayer = {
      x: playerPos.x - enemyPos.x,
      z: playerPos.z - enemyPos.z
    };

    const angle = Math.atan2(toPlayer.z, toPlayer.x);
    const enemyAngle = Math.atan2(enemyDir.z, enemyDir.x);

    let angleDiff = Math.abs(angle - enemyAngle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

    if (angleDiff > AdvancedAIConfig.VISION_ANGLE / 2) {
      return false; // Fuera del cono de visión
    }

    // Raycasting para verificar obstáculos
    return this.raycast(enemyPos, playerPos, walls, checkCollision);
  }

  /**
   * Realiza un raycast entre dos puntos
   */
  static raycast(from, to, walls, checkCollision, steps = 20) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const z = from.z + dz * t;

      if (checkCollision(x, z, walls)) {
        return false; // Hay una pared en el camino
      }
    }

    return true;
  }

  /**
   * Detecta si el jugador está haciendo ruido (moviéndose rápido)
   */
  static canHearPlayer(enemyPos, playerPos, playerVelocity) {
    const distance = getDistance(enemyPos, playerPos);
    const speed = Math.sqrt(playerVelocity.x ** 2 + playerVelocity.z ** 2);

    // El radio de audición aumenta con la velocidad
    const hearingRadius = AdvancedAIConfig.HEARING_RADIUS * (1 + speed * 0.5);

    return distance < hearingRadius;
  }
}

// ============================================================================
// SISTEMA DE COORDINACIÓN ENTRE ENEMIGOS
// ============================================================================

/**
 * Gestiona la comunicación y coordinación entre enemigos
 */
export class EnemyCoordinator {
  constructor() {
    this.enemies = new Map();
    this.formations = new Map();
    this.sharedMemory = {
      lastKnownPlayerPos: null,
      playerEscapeRoutes: [],
      currentThreatLevel: 0
    };
  }

  /**
   * Registra un enemigo en el sistema
   */
  registerEnemy(id, position, role) {
    this.enemies.set(id, {
      id,
      position,
      role,
      assignment: null,
      lastUpdate: Date.now()
    });
  }

  /**
   * Actualiza la posición de un enemigo
   */
  updateEnemy(id, position, state) {
    const enemy = this.enemies.get(id);
    if (enemy) {
      enemy.position = position;
      enemy.state = state;
      enemy.lastUpdate = Date.now();
    }
  }

  /**
   * Obtiene enemigos cercanos para coordinación
   */
  getNearbyEnemies(position, radius = AdvancedAIConfig.COORDINATION_RADIUS) {
    const nearby = [];

    for (const [id, enemy] of this.enemies.entries()) {
      const dist = getDistance(position, enemy.position);
      if (dist < radius && dist > 0) {
        nearby.push({ ...enemy, distance: dist });
      }
    }

    return nearby.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Calcula posiciones tácticas para rodear al jugador
   */
  calculateSurroundPositions(playerPos, enemyCount) {
    const positions = [];
    const radius = AdvancedAIConfig.TACTICAL_POSITION_RADIUS;

    for (let i = 0; i < enemyCount; i++) {
      const angle = (Math.PI * 2 * i) / enemyCount;
      positions.push({
        x: playerPos.x + Math.cos(angle) * radius,
        z: playerPos.z + Math.sin(angle) * radius,
        role: 'surround'
      });
    }

    return positions;
  }

  /**
   * Planifica una emboscada coordinada
   */
  planAmbush(playerPos, playerDirection, availableEnemies) {
    const plan = {
      blockers: [],   // Enemigos que bloquean el camino
      chasers: [],    // Enemigos que persiguen
      flankers: []    // Enemigos que rodean
    };

    // Calcular posición de bloqueo adelante del jugador
    const blockPos = {
      x: playerPos.x + playerDirection.x * 8,
      z: playerPos.z + playerDirection.z * 8
    };

    // Asignar roles
    availableEnemies.forEach((enemy, index) => {
      if (index === 0) {
        plan.blockers.push({ enemyId: enemy.id, targetPos: blockPos });
      } else if (index % 2 === 0) {
        plan.flankers.push({ enemyId: enemy.id, side: 'left' });
      } else {
        plan.flankers.push({ enemyId: enemy.id, side: 'right' });
      }
    });

    return plan;
  }

  /**
   * Actualiza la memoria compartida
   */
  updateSharedMemory(key, value) {
    this.sharedMemory[key] = value;
  }

  /**
   * Obtiene información de la memoria compartida
   */
  getSharedMemory(key) {
    return this.sharedMemory[key];
  }

  /**
   * Limpia enemigos inactivos
   */
  cleanupInactiveEnemies(maxAge = 5000) {
    const now = Date.now();
    for (const [id, enemy] of this.enemies.entries()) {
      if (now - enemy.lastUpdate > maxAge) {
        this.enemies.delete(id);
      }
    }
  }
}

// ============================================================================
// SISTEMA DE TOMA DE DECISIONES POR UTILIDAD
// ============================================================================

/**
 * Sistema de Utility AI para decisiones inteligentes
 */
export class UtilityAI {
  /**
   * Evalúa todas las acciones posibles y elige la mejor
   */
  static evaluateActions(context) {
    const actions = [
      { name: 'CHASE_DIRECT', utility: this.utilityChase(context) },
      { name: 'CHASE_PREDICT', utility: this.utilityPredictiveChase(context) },
      { name: 'AMBUSH', utility: this.utilityAmbush(context) },
      { name: 'PATROL', utility: this.utilityPatrol(context) },
      { name: 'COORDINATE', utility: this.utilityCoordinate(context) },
      { name: 'BLOCK_PATH', utility: this.utilityBlockPath(context) },
      { name: 'SEARCH', utility: this.utilitySearch(context) },
      { name: 'FLEE', utility: this.utilityFlee(context) }
    ];

    // Ordenar por utilidad
    actions.sort((a, b) => b.utility - a.utility);

    // Añadir aleatoriedad controlada (10% de exploración)
    if (Math.random() < 0.1 && actions.length > 1) {
      return actions[1].name;
    }

    return actions[0].name;
  }

  /**
   * Utilidad de persecución directa
   */
  static utilityChase(ctx) {
    if (!ctx.hasLineOfSight) return 0;

    const distanceFactor = Math.max(0, 1 - ctx.distance / 30);
    const healthFactor = ctx.isPowerActive ? 0.2 : 1.0;
    const roleBonus = ctx.role === AIRoles.CHASER ? 0.3 : 0;

    return (0.6 * distanceFactor + 0.3 * healthFactor + roleBonus) * 100;
  }

  /**
   * Utilidad de persecución predictiva
   */
  static utilityPredictiveChase(ctx) {
    if (!ctx.hasLineOfSight && !ctx.recentlySeenPlayer) return 0;

    const predictionConfidence = ctx.playerMemory?.predictNextPosition(
      ctx.playerPos, ctx.playerDir
    )?.confidence || 0;

    const distanceFactor = Math.max(0, 1 - ctx.distance / 25);
    const roleBonus = [AIRoles.CUTTER, AIRoles.FLANKER].includes(ctx.role) ? 0.3 : 0;

    return (0.5 * predictionConfidence + 0.3 * distanceFactor + roleBonus) * 100;
  }

  /**
   * Utilidad de emboscada
   */
  static utilityAmbush(ctx) {
    if (ctx.isPowerActive) return 0;

    const isAmbusher = ctx.role === AIRoles.AMBUSHER;
    const playerIsMoving = ctx.playerDir.x !== 0 || ctx.playerDir.z !== 0;
    const goodPosition = ctx.distance > 10 && ctx.distance < 20;

    let utility = 0;
    if (isAmbusher) utility += 40;
    if (playerIsMoving) utility += 30;
    if (goodPosition) utility += 30;

    return utility;
  }

  /**
   * Utilidad de patrulla
   */
  static utilityPatrol(ctx) {
    const noThreat = ctx.distance > 20;
    const inZone = ctx.assignedZone && ctx.isInZone;
    const roleBonus = ctx.role === AIRoles.PATROL ? 0.4 : 0;

    if (!noThreat) return 10;

    return (0.4 + (inZone ? 0.3 : 0) + roleBonus) * 100;
  }

  /**
   * Utilidad de coordinación
   */
  static utilityCoordinate(ctx) {
    const nearbyEnemies = ctx.nearbyEnemies?.length || 0;
    const roleBonus = [AIRoles.SWARM, AIRoles.FLANKER].includes(ctx.role) ? 0.3 : 0;
    const distanceFactor = ctx.distance < 15 ? 0.5 : 0.2;

    return (nearbyEnemies * 0.15 + distanceFactor + roleBonus) * 100;
  }

  /**
   * Utilidad de bloqueo de camino
   */
  static utilityBlockPath(ctx) {
    if (!ctx.hasLineOfSight) return 0;

    const isCutter = ctx.role === AIRoles.CUTTER;
    const playerIsMoving = ctx.playerDir.x !== 0 || ctx.playerDir.z !== 0;
    const goodDistance = ctx.distance > 5 && ctx.distance < 15;

    let utility = 0;
    if (isCutter) utility += 40;
    if (playerIsMoving) utility += 30;
    if (goodDistance) utility += 30;

    return utility;
  }

  /**
   * Utilidad de búsqueda
   */
  static utilitySearch(ctx) {
    const lostPlayer = !ctx.hasLineOfSight && ctx.recentlySeenPlayer;
    const searchTime = ctx.timeSinceLastSeen || 0;

    if (!lostPlayer) return 0;

    return Math.max(0, 60 - searchTime * 10);
  }

  /**
   * Utilidad de huida
   */
  static utilityFlee(ctx) {
    if (!ctx.isPowerActive) return 0;

    const distanceFactor = Math.max(0, 1 - ctx.distance / 15);
    const vulnerabilityFactor = 1.0;

    return (distanceFactor * vulnerabilityFactor) * 100;
  }
}

// ============================================================================
// CONTROLADOR PRINCIPAL DE IA AVANZADA
// ============================================================================

/**
 * Clase principal que integra todos los sistemas
 */
export class AdvancedEnemyAI {
  constructor(enemyId, role, walls, checkCollision) {
    this.enemyId = enemyId;
    this.role = role;
    this.walls = walls;
    this.checkCollision = checkCollision;

    // Sistemas
    this.pathfinder = new AStarPathfinder(walls, checkCollision);
    this.currentPath = null;
    this.pathRecalcTimer = 0;

    // Estado
    this.state = AIStates.IDLE;
    this.lastAction = null;
    this.currentGoal = null;

    // Memoria y aprendizaje
    this.playerMemory = new PlayerMemory();
    this.lastSeenPlayerPos = null;
    this.timeSinceLastSeen = 0;
    this.mistakeCount = 0;
    this.successCount = 0;

    // Táctica
    this.tacticalPosition = null;
    this.coordinationPlan = null;
  }

  /**
   * Actualización principal de la IA (llamar cada frame)
   */
  update(context, delta) {
    // Actualizar memoria del jugador
    this.playerMemory.addPosition(
      context.playerPos,
      context.playerDir,
      context.playerDir.x !== 0 || context.playerDir.z !== 0
    );

    // Verificar línea de visión
    const hasLineOfSight = VisionSystem.hasLineOfSight(
      context.enemyPos,
      context.enemyDir,
      context.playerPos,
      this.walls,
      this.checkCollision
    );

    // Actualizar tiempo desde última vez visto
    if (hasLineOfSight) {
      this.lastSeenPlayerPos = { ...context.playerPos };
      this.timeSinceLastSeen = 0;
    } else {
      this.timeSinceLastSeen += delta;
    }

    // Preparar contexto para decisiones
    const decisionContext = {
      ...context,
      hasLineOfSight,
      recentlySeenPlayer: this.timeSinceLastSeen < 5,
      timeSinceLastSeen: this.timeSinceLastSeen,
      playerMemory: this.playerMemory,
      nearbyEnemies: context.coordinator?.getNearbyEnemies(context.enemyPos),
      distance: getDistance(context.enemyPos, context.playerPos),
      role: this.role,
      assignedZone: context.assignedZone,
      isInZone: context.assignedZone && this.isInZone(context.enemyPos, context.assignedZone)
    };

    // Toma de decisiones
    const bestAction = UtilityAI.evaluateActions(decisionContext);

    // Ejecutar acción
    const result = this.executeAction(bestAction, decisionContext, delta);

    return result;
  }

  /**
   * Ejecuta la acción seleccionada
   */
  executeAction(action, context, delta) {
    this.lastAction = action;

    switch (action) {
      case 'CHASE_DIRECT':
        return this.actionChaseDirect(context, delta);

      case 'CHASE_PREDICT':
        return this.actionChasePredictive(context, delta);

      case 'AMBUSH':
        return this.actionAmbush(context, delta);

      case 'PATROL':
        return this.actionPatrol(context, delta);

      case 'COORDINATE':
        return this.actionCoordinate(context, delta);

      case 'BLOCK_PATH':
        return this.actionBlockPath(context, delta);

      case 'SEARCH':
        return this.actionSearch(context, delta);

      case 'FLEE':
        return this.actionFlee(context, delta);

      default:
        return this.actionPatrol(context, delta);
    }
  }

  /**
   * Acción: Persecución directa
   */
  actionChaseDirect(context, delta) {
    return this.moveTowardsTarget(
      context.enemyPos,
      context.playerPos,
      context,
      delta
    );
  }

  /**
   * Acción: Persecución predictiva
   */
  actionChasePredictive(context, delta) {
    const prediction = this.playerMemory.predictNextPosition(
      context.playerPos,
      context.playerDir,
      8
    );

    return this.moveTowardsTarget(
      context.enemyPos,
      prediction,
      context,
      delta
    );
  }

  /**
   * Acción: Emboscada
   */
  actionAmbush(context, delta) {
    // Calcular posición de emboscada adelante del jugador
    const ambushPos = {
      x: context.playerPos.x + context.playerDir.x * 10,
      z: context.playerPos.z + context.playerDir.z * 10
    };

    return this.moveTowardsTarget(
      context.enemyPos,
      ambushPos,
      context,
      delta,
      true // usar pathfinding
    );
  }

  /**
   * Acción: Patrulla
   */
  actionPatrol(context, delta) {
    if (!context.assignedZone) {
      return { direction: context.enemyDir, shouldMove: false };
    }

    const target = {
      x: context.assignedZone.centerX,
      z: context.assignedZone.centerZ
    };

    return this.moveTowardsTarget(context.enemyPos, target, context, delta);
  }

  /**
   * Acción: Coordinación con otros enemigos
   */
  actionCoordinate(context, delta) {
    // Obtener posición de formación
    const nearbyEnemies = context.nearbyEnemies || [];

    if (nearbyEnemies.length > 0 && context.coordinator) {
      const surroundPositions = context.coordinator.calculateSurroundPositions(
        context.playerPos,
        nearbyEnemies.length + 1
      );

      // Tomar la primera posición disponible
      if (surroundPositions.length > 0) {
        return this.moveTowardsTarget(
          context.enemyPos,
          surroundPositions[0],
          context,
          delta
        );
      }
    }

    // Fallback a persecución
    return this.actionChaseDirect(context, delta);
  }

  /**
   * Acción: Bloquear camino
   */
  actionBlockPath(context, delta) {
    // Calcular punto de intercepción
    const playerSpeed = Math.sqrt(
      context.playerDir.x ** 2 + context.playerDir.z ** 2
    );

    const interceptDistance = Math.min(12, context.distance / 2);

    const interceptPoint = {
      x: context.playerPos.x + context.playerDir.x * interceptDistance,
      z: context.playerPos.z + context.playerDir.z * interceptDistance
    };

    return this.moveTowardsTarget(
      context.enemyPos,
      interceptPoint,
      context,
      delta,
      true // usar pathfinding
    );
  }

  /**
   * Acción: Búsqueda
   */
  actionSearch(context, delta) {
    const lastSeen = this.lastSeenPlayerPos || context.playerPos;

    // Buscar en área alrededor de última posición conocida
    const searchRadius = 5;
    const randomOffset = {
      x: (Math.random() - 0.5) * searchRadius,
      z: (Math.random() - 0.5) * searchRadius
    };

    const searchTarget = {
      x: lastSeen.x + randomOffset.x,
      z: lastSeen.z + randomOffset.z
    };

    return this.moveTowardsTarget(
      context.enemyPos,
      searchTarget,
      context,
      delta
    );
  }

  /**
   * Acción: Huida
   */
  actionFlee(context, delta) {
    // Dirección opuesta al jugador
    const awayDir = {
      x: context.enemyPos.x - context.playerPos.x,
      z: context.enemyPos.z - context.playerPos.z
    };

    const normalized = normalizeDirection(awayDir);
    const fleeTarget = {
      x: context.enemyPos.x + normalized.x * 10,
      z: context.enemyPos.z + normalized.z * 10
    };

    return this.moveTowardsTarget(
      context.enemyPos,
      fleeTarget,
      context,
      delta,
      false,
      1.5 // velocidad aumentada
    );
  }

  /**
   * Función auxiliar para moverse hacia un objetivo
   */
  moveTowardsTarget(from, to, context, delta, usePathfinding = false, speedMultiplier = 1.0) {
    this.pathRecalcTimer += delta;

    // Usar A* si está habilitado y es momento de recalcular
    if (usePathfinding && (!this.currentPath || this.pathRecalcTimer > AdvancedAIConfig.PATH_RECALC_INTERVAL)) {
      this.currentPath = this.pathfinder.findPath(from, to);
      this.pathRecalcTimer = 0;

      // Limpiar caché periódicamente
      if (Math.random() < 0.1) {
        this.pathfinder.cleanCache();
      }
    }

    // Si tenemos una ruta, seguirla
    let target = to;
    if (this.currentPath && this.currentPath.length > 1) {
      target = this.currentPath[1]; // Siguiente paso en la ruta

      // Si llegamos al siguiente paso, removerlo
      if (getDistance(from, target) < 0.5) {
        this.currentPath.shift();
      }
    }

    // Calcular dirección hacia el objetivo
    const dx = target.x - from.x;
    const dz = target.z - from.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.1) {
      return { direction: context.enemyDir, shouldMove: false };
    }

    const direction = {
      x: dx / dist,
      z: dz / dist
    };

    return {
      direction: normalizeDirection(direction),
      shouldMove: true,
      speedMultiplier,
      state: this.lastAction,
      debugInfo: {
        action: this.lastAction,
        hasPath: !!this.currentPath,
        pathLength: this.currentPath?.length || 0
      }
    };
  }

  /**
   * Verifica si está dentro de una zona
   */
  isInZone(pos, zone) {
    return pos.x >= zone.minX &&
           pos.x <= zone.maxX &&
           pos.z >= zone.minZ &&
           pos.z <= zone.maxZ;
  }
}

// ============================================================================
// FUNCIÓN DE INTEGRACIÓN CON EL SISTEMA EXISTENTE
// ============================================================================

/**
 * Crea una instancia de IA avanzada
 */
export const createAdvancedEnemyAI = (enemyId, role, walls, checkCollision) => {
  return new AdvancedEnemyAI(enemyId, role, walls, checkCollision);
};

/**
 * Actualiza la IA avanzada (equivalente a updateEnemyAI)
 */
export const updateAdvancedEnemyAI = (aiInstance, context, delta) => {
  return aiInstance.update(context, delta);
};

export default {
  AdvancedEnemyAI,
  createAdvancedEnemyAI,
  updateAdvancedEnemyAI,
  PlayerMemory,
  AStarPathfinder,
  VisionSystem,
  EnemyCoordinator,
  UtilityAI,
  AdvancedAIConfig
};
