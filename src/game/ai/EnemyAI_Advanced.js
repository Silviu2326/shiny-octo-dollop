/**
 * ============================================================================
 * SISTEMA DE IA ULTRA-AVANZADO PARA ENEMIGOS
 * Beer Run Game - Elite AI System v2.0
 * ============================================================================
 *
 * Nuevas Capacidades:
 * - Predicción neural simulada con múltiples modelos
 * - Aprendizaje adaptativo en tiempo real
 * - Tácticas de manada con formaciones dinámicas
 * - Sistema de personalidad y emociones
 * - Detección de patrones y contra-estrategias
 * - Comunicación telepática entre enemigos
 * - Predicción de rutas de escape
 * - Sistema de amenaza dinámica
 * - Comportamiento emergente complejo
 */

import {
  getDistance,
  normalizeDirection,
  getCardinalDirections,
  AIRoles,
  AIStates
} from './EnemyAI';

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN ELITE
// ============================================================================

export const AdvancedAIConfig = {
  // Memoria y Aprendizaje
  PLAYER_MEMORY_LENGTH: 60,
  PATTERN_DETECTION_THRESHOLD: 3,
  LEARNING_RATE: 0.15,
  ADAPTATION_SPEED: 0.08,

  // Percepción
  VISION_ANGLE: Math.PI * 0.85,
  PERIPHERAL_VISION_ANGLE: Math.PI * 1.2,
  HEARING_RADIUS: 15,
  DANGER_SENSE_RADIUS: 8,

  // Coordinación
  COORDINATION_RADIUS: 20,
  TELEPATHY_RANGE: 50,
  FORMATION_UPDATE_INTERVAL: 0.3,

  // Pathfinding
  PATH_RECALC_INTERVAL: 0.25,
  PATH_CACHE_TIME: 1500,
  MAX_PATH_NODES: 500,

  // Tácticas
  TACTICAL_POSITION_RADIUS: 10,
  AMBUSH_PREPARATION_TIME: 2.0,
  PINCER_ANGLE: Math.PI / 3,
  TRAP_DETECTION_DEPTH: 8,

  // Personalidad
  AGGRESSION_DECAY: 0.02,
  FRUSTRATION_BUILDUP: 0.05,
  CONFIDENCE_BOOST: 0.1,

  // Dificultad Dinámica
  DIFFICULTY_ADAPTATION_RATE: 0.03,
  MIN_DIFFICULTY: 0.5,
  MAX_DIFFICULTY: 2.0,

  // Anti-Atasco
  STUCK_DETECTION_TIME: 0.5,
  STUCK_DISTANCE_THRESHOLD: 0.3,
  STUCK_HISTORY_LENGTH: 15,
  WALL_SLIDE_STRENGTH: 0.8,
  UNSTUCK_RANDOM_STRENGTH: 2.0,
  CORNER_DETECTION_RANGE: 1.5,
  WALL_AVOIDANCE_DISTANCE: 0.8,
  PATH_SMOOTHING_ITERATIONS: 3,

  // IA ULTRA-AVANZADA
  MAP_ANALYSIS_INTERVAL: 2.0,       // Analizar mapa cada X segundos
  CHOKEPOINT_DETECTION_RADIUS: 3,   // Radio para detectar cuellos de botella
  ESCAPE_ROUTE_PREDICTION_DEPTH: 5, // Profundidad de predicción de rutas
  MIND_GAME_PROBABILITY: 0.15,      // Probabilidad de hacer mind games
  FEINT_DURATION: 0.8,              // Duración de fintas
  PRESSURE_OPTIMAL_DISTANCE: 6,     // Distancia óptima para presionar
  TRAP_DETECTION_SENSITIVITY: 0.7,  // Sensibilidad para detectar trampas
  ADAPTATION_MEMORY_SIZE: 20,       // Tamaño de memoria para adaptación
  HERDING_STRENGTH: 0.6,            // Fuerza del pastoreo (empujar jugador)
  ZONE_CONTROL_WEIGHT: 0.4,         // Peso del control de zonas
  COLLECTIBLE_GUARD_RADIUS: 8,      // Radio para guardar coleccionables
  PSYCHOLOGICAL_PRESSURE_MULT: 1.2, // Multiplicador de presión psicológica
};

// Estados emocionales de la IA
export const AIEmotions = {
  CALM: 'calm',
  ALERT: 'alert',
  AGGRESSIVE: 'aggressive',
  FRUSTRATED: 'frustrated',
  CONFIDENT: 'confident',
  FEARFUL: 'fearful',
  VENGEFUL: 'vengeful'
};

// Tipos de formación
export const FormationTypes = {
  SPREAD: 'spread',
  PINCER: 'pincer',
  SURROUND: 'surround',
  WEDGE: 'wedge',
  LINE: 'line',
  AMBUSH: 'ambush',
  HUNTER_KILLER: 'hunter_killer'
};

// ============================================================================
// SISTEMA DE PREDICCIÓN NEURAL SIMULADO
// ============================================================================

export class NeuralPredictor {
  constructor() {
    this.weights = {
      momentum: 0.7,
      pattern: 0.2,
      random: 0.1
    };
    this.patternMemory = [];
    this.predictionHistory = [];
    this.accuracy = 0.5;
  }

  /**
   * Predice la posición futura usando múltiples modelos
   */
  predict(playerHistory, currentPos, currentDir, steps = 8) {
    if (playerHistory.length < 5) {
      return this.simplePrediction(currentPos, currentDir, steps);
    }

    // Modelo 1: Momentum (continuar dirección actual)
    const momentumPred = this.momentumModel(currentPos, currentDir, steps);

    // Modelo 2: Patrón histórico
    const patternPred = this.patternModel(playerHistory, currentPos, steps);

    // Modelo 3: Tendencia de zona
    const zonePred = this.zoneModel(playerHistory, currentPos, steps);

    // Modelo 4: Anti-predicción (qué haría un jugador inteligente)
    const antiPred = this.antiPredictionModel(playerHistory, currentPos, currentDir, steps);

    // Combinar predicciones con pesos adaptativos
    const combined = {
      x: momentumPred.x * this.weights.momentum * 0.4 +
         patternPred.x * this.weights.pattern * 0.3 +
         zonePred.x * 0.15 +
         antiPred.x * 0.15,
      z: momentumPred.z * this.weights.momentum * 0.4 +
         patternPred.z * this.weights.pattern * 0.3 +
         zonePred.z * 0.15 +
         antiPred.z * 0.15,
      confidence: this.calculateConfidence(playerHistory)
    };

    this.recordPrediction(combined, currentPos);
    return combined;
  }

  simplePrediction(pos, dir, steps) {
    return {
      x: pos.x + dir.x * steps * 0.5,
      z: pos.z + dir.z * steps * 0.5,
      confidence: 0.3
    };
  }

  momentumModel(pos, dir, steps) {
    const speed = Math.sqrt(dir.x * dir.x + dir.z * dir.z) || 1;
    return {
      x: pos.x + (dir.x / speed) * steps * 0.6,
      z: pos.z + (dir.z / speed) * steps * 0.6
    };
  }

  patternModel(history, currentPos, steps) {
    // Buscar patrones repetitivos en el historial
    const recentMoves = history.slice(-15);
    let avgDx = 0, avgDz = 0, count = 0;

    for (let i = 1; i < recentMoves.length; i++) {
      const dx = recentMoves[i].pos.x - recentMoves[i-1].pos.x;
      const dz = recentMoves[i].pos.z - recentMoves[i-1].pos.z;
      avgDx += dx;
      avgDz += dz;
      count++;
    }

    if (count > 0) {
      avgDx /= count;
      avgDz /= count;
    }

    return {
      x: currentPos.x + avgDx * steps * 1.5,
      z: currentPos.z + avgDz * steps * 1.5
    };
  }

  zoneModel(history, currentPos, steps) {
    // Predecir basándose en zonas frecuentes
    const zones = new Map();

    history.forEach(entry => {
      const zoneKey = `${Math.floor(entry.pos.x / 5)},${Math.floor(entry.pos.z / 5)}`;
      zones.set(zoneKey, (zones.get(zoneKey) || 0) + 1);
    });

    let maxZone = null;
    let maxCount = 0;

    zones.forEach((count, key) => {
      if (count > maxCount) {
        maxCount = count;
        maxZone = key;
      }
    });

    if (maxZone) {
      const [zx, zz] = maxZone.split(',').map(Number);
      return {
        x: (zx + 0.5) * 5,
        z: (zz + 0.5) * 5
      };
    }

    return currentPos;
  }

  antiPredictionModel(history, currentPos, currentDir, steps) {
    // Predecir lo que un jugador inteligente NO haría
    // (continuar en línea recta cuando hay enemigos cerca)
    const recentChanges = this.countDirectionChanges(history.slice(-10));

    if (recentChanges > 4) {
      // Jugador está haciendo zigzag, predecir que seguirá
      const lastTwo = history.slice(-2);
      if (lastTwo.length === 2) {
        const turnDir = {
          x: lastTwo[1].dir.x - lastTwo[0].dir.x,
          z: lastTwo[1].dir.z - lastTwo[0].dir.z
        };
        return {
          x: currentPos.x + (currentDir.x + turnDir.x * 0.5) * steps * 0.5,
          z: currentPos.z + (currentDir.z + turnDir.z * 0.5) * steps * 0.5
        };
      }
    }

    // Asumir que el jugador intentará esquivar
    const perpendicular = { x: -currentDir.z, z: currentDir.x };
    const side = Math.random() > 0.5 ? 1 : -1;

    return {
      x: currentPos.x + currentDir.x * steps * 0.3 + perpendicular.x * side * 2,
      z: currentPos.z + currentDir.z * steps * 0.3 + perpendicular.z * side * 2
    };
  }

  countDirectionChanges(history) {
    let changes = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i].dir.x !== history[i-1].dir.x ||
          history[i].dir.z !== history[i-1].dir.z) {
        changes++;
      }
    }
    return changes;
  }

  calculateConfidence(history) {
    const recentAccuracy = this.evaluateRecentPredictions();
    const historyQuality = Math.min(1, history.length / 30);
    return Math.min(0.95, recentAccuracy * 0.6 + historyQuality * 0.4);
  }

  evaluateRecentPredictions() {
    if (this.predictionHistory.length < 5) return 0.5;

    let accurateCount = 0;
    const recent = this.predictionHistory.slice(-10);

    recent.forEach(pred => {
      if (pred.error < 3) accurateCount++;
    });

    return accurateCount / recent.length;
  }

  recordPrediction(prediction, actualPos) {
    this.predictionHistory.push({
      predicted: prediction,
      actual: actualPos,
      time: Date.now(),
      error: 0
    });

    // Evaluar predicción anterior
    if (this.predictionHistory.length > 1) {
      const prev = this.predictionHistory[this.predictionHistory.length - 2];
      prev.error = getDistance(prev.predicted, actualPos);

      // Ajustar pesos basándose en precisión
      this.adaptWeights(prev.error);
    }

    if (this.predictionHistory.length > 50) {
      this.predictionHistory.shift();
    }
  }

  adaptWeights(error) {
    const learningRate = 0.05;

    if (error < 2) {
      // Predicción buena, mantener pesos
      return;
    } else if (error > 5) {
      // Predicción mala, dar más peso a patrones
      this.weights.pattern = Math.min(0.5, this.weights.pattern + learningRate);
      this.weights.momentum = Math.max(0.3, this.weights.momentum - learningRate);
    }

    // Normalizar
    const total = this.weights.momentum + this.weights.pattern + this.weights.random;
    this.weights.momentum /= total;
    this.weights.pattern /= total;
    this.weights.random /= total;
  }
}

// ============================================================================
// MEMORIA DEL JUGADOR MEJORADA
// ============================================================================

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
    this.deathLocations = [];
    this.closeCallLocations = [];
    this.powerUpUsagePatterns = [];
    this.reactionTimes = [];
    this.behaviorProfile = {
      aggression: 0.5,
      caution: 0.5,
      predictability: 0.5,
      skillLevel: 0.5
    };
  }

  addPosition(pos, direction, isMoving, nearbyEnemyCount = 0) {
    const now = Date.now();
    const entry = {
      pos: { ...pos },
      dir: { ...direction },
      time: now,
      moving: isMoving,
      pressure: nearbyEnemyCount
    };

    this.positionHistory.push(entry);

    if (this.positionHistory.length > AdvancedAIConfig.PLAYER_MEMORY_LENGTH) {
      this.positionHistory.shift();
    }

    if (isMoving) {
      this.updatePreferredDirections(direction);
      this.updateZoneFrequency(pos);
    }

    this.calculateAverageSpeed();
    this.analyzePatterns();
    this.updateBehaviorProfile();
  }

  updatePreferredDirections(direction) {
    if (direction.z < -0.5) this.preferredDirections.up++;
    if (direction.z > 0.5) this.preferredDirections.down++;
    if (direction.x < -0.5) this.preferredDirections.left++;
    if (direction.x > 0.5) this.preferredDirections.right++;
  }

  updateZoneFrequency(pos) {
    const zoneKey = `${Math.floor(pos.x / 4)},${Math.floor(pos.z / 4)}`;
    this.favoriteZones.set(zoneKey, (this.favoriteZones.get(zoneKey) || 0) + 1);
  }

  addCollectionPoint(pos) {
    this.collectionPoints.push({ ...pos, time: Date.now() });
    if (this.collectionPoints.length > 100) {
      this.collectionPoints.shift();
    }
  }

  addDeathLocation(pos, killerInfo) {
    this.deathLocations.push({
      pos: { ...pos },
      time: Date.now(),
      killer: killerInfo
    });
  }

  addCloseCall(pos, enemyPos) {
    this.closeCallLocations.push({
      playerPos: { ...pos },
      enemyPos: { ...enemyPos },
      time: Date.now()
    });

    if (this.closeCallLocations.length > 30) {
      this.closeCallLocations.shift();
    }
  }

  calculateAverageSpeed() {
    if (this.positionHistory.length < 2) return;

    let totalSpeed = 0;
    let count = 0;

    for (let i = 1; i < this.positionHistory.length; i++) {
      const prev = this.positionHistory[i - 1];
      const curr = this.positionHistory[i];
      const dist = getDistance(prev.pos, curr.pos);
      const time = (curr.time - prev.time) / 1000;

      if (time > 0 && time < 1) {
        totalSpeed += dist / time;
        count++;
      }
    }

    this.averageSpeed = count > 0 ? totalSpeed / count : 0;
  }

  analyzePatterns() {
    if (this.positionHistory.length < 10) return;

    // Detectar patrones de movimiento repetitivos
    const recent = this.positionHistory.slice(-20);
    const patterns = [];

    for (let patternLen = 3; patternLen <= 6; patternLen++) {
      const pattern = recent.slice(-patternLen);
      let matches = 0;

      for (let i = 0; i < recent.length - patternLen * 2; i++) {
        const segment = recent.slice(i, i + patternLen);
        if (this.patternsMatch(pattern, segment)) {
          matches++;
        }
      }

      if (matches >= 2) {
        patterns.push({ sequence: pattern, frequency: matches });
      }
    }

    if (patterns.length > 0) {
      this.escapePatterns = patterns.sort((a, b) => b.frequency - a.frequency);
    }
  }

  patternsMatch(p1, p2, threshold = 2) {
    if (p1.length !== p2.length) return false;

    let totalDiff = 0;
    for (let i = 0; i < p1.length; i++) {
      totalDiff += getDistance(p1[i].pos, p2[i].pos);
    }

    return totalDiff / p1.length < threshold;
  }

  updateBehaviorProfile() {
    if (this.positionHistory.length < 20) return;

    const recent = this.positionHistory.slice(-30);

    // Calcular agresividad (movimiento hacia enemigos vs huida)
    const movingTowardsDanger = recent.filter(e => e.pressure > 0 && e.moving).length;
    this.behaviorProfile.aggression = movingTowardsDanger / recent.length;

    // Calcular cautela (cambios de dirección cuando hay peligro)
    const dirChangesUnderPressure = this.countDirectionChangesUnderPressure(recent);
    this.behaviorProfile.caution = Math.min(1, dirChangesUnderPressure / 10);

    // Calcular predictabilidad
    const directionVariance = this.calculateDirectionVariance(recent);
    this.behaviorProfile.predictability = 1 - Math.min(1, directionVariance);

    // Estimar nivel de habilidad
    const escapeSuccessRate = this.closeCallLocations.length > 0 ?
      1 - (this.deathLocations.length / (this.closeCallLocations.length + this.deathLocations.length)) : 0.5;
    this.behaviorProfile.skillLevel = escapeSuccessRate;
  }

  countDirectionChangesUnderPressure(history) {
    let changes = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i].pressure > 0 &&
          (history[i].dir.x !== history[i-1].dir.x ||
           history[i].dir.z !== history[i-1].dir.z)) {
        changes++;
      }
    }
    return changes;
  }

  calculateDirectionVariance(history) {
    const directions = history.filter(e => e.moving).map(e => e.dir);
    if (directions.length < 2) return 0;

    let variance = 0;
    for (let i = 1; i < directions.length; i++) {
      const diff = Math.abs(directions[i].x - directions[i-1].x) +
                   Math.abs(directions[i].z - directions[i-1].z);
      variance += diff;
    }

    return variance / directions.length;
  }

  predictNextPosition(currentPos, currentDir, steps = 5) {
    if (this.positionHistory.length < 3) {
      return {
        x: currentPos.x + currentDir.x * steps * 0.5,
        z: currentPos.z + currentDir.z * steps * 0.5,
        confidence: 0.3
      };
    }

    // Usar patrones detectados si existen
    if (this.escapePatterns.length > 0) {
      const topPattern = this.escapePatterns[0];
      const lastInPattern = topPattern.sequence[topPattern.sequence.length - 1];

      return {
        x: currentPos.x + lastInPattern.dir.x * steps * 0.6,
        z: currentPos.z + lastInPattern.dir.z * steps * 0.6,
        confidence: 0.7 + topPattern.frequency * 0.1
      };
    }

    // Predicción basada en historial reciente
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

    const weight = 0.6;
    const finalDirX = currentDir.x * weight + avgDirX * (1 - weight);
    const finalDirZ = currentDir.z * weight + avgDirZ * (1 - weight);

    return {
      x: currentPos.x + finalDirX * steps * 0.6,
      z: currentPos.z + finalDirZ * steps * 0.6,
      confidence: Math.min(0.9, 0.4 + (count / 10) * 0.5)
    };
  }

  isInEscapePattern() {
    if (this.positionHistory.length < 5) return false;

    const recent = this.positionHistory.slice(-5);
    let changeCount = 0;

    for (let i = 1; i < recent.length; i++) {
      if (recent[i].dir.x !== recent[i-1].dir.x ||
          recent[i].dir.z !== recent[i-1].dir.z) {
        changeCount++;
      }
    }

    return changeCount >= 3;
  }

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

  getMostDangerousZones() {
    return this.deathLocations.map(d => ({
      pos: d.pos,
      danger: 1.0
    }));
  }

  getFavoriteZones() {
    const zones = [];
    this.favoriteZones.forEach((count, key) => {
      const [x, z] = key.split(',').map(Number);
      zones.push({
        centerX: (x + 0.5) * 4,
        centerZ: (z + 0.5) * 4,
        frequency: count
      });
    });
    return zones.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
  }
}

// ============================================================================
// SISTEMA DE PATHFINDING A* MEJORADO
// ============================================================================

export class AStarPathfinder {
  constructor(walls, checkCollision, gridSize = 0.8) {
    this.walls = walls;
    this.checkCollision = checkCollision;
    this.gridSize = gridSize;
    this.cache = new Map();
    this.cacheMaxAge = AdvancedAIConfig.PATH_CACHE_TIME;
    this.dynamicObstacles = new Map();
  }

  addDynamicObstacle(id, pos, radius = 1) {
    this.dynamicObstacles.set(id, { pos, radius, time: Date.now() });
  }

  removeDynamicObstacle(id) {
    this.dynamicObstacles.delete(id);
  }

  findPath(start, goal, maxNodes = AdvancedAIConfig.MAX_PATH_NODES, avoidPositions = []) {
    const cacheKey = `${Math.floor(start.x * 2)},${Math.floor(start.z * 2)}-${Math.floor(goal.x * 2)},${Math.floor(goal.z * 2)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.time < this.cacheMaxAge && avoidPositions.length === 0) {
      return cached.path;
    }

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

      openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
      const current = openSet.shift();

      if (getDistance(current.pos, goal) < this.gridSize * 1.5) {
        const path = this.reconstructPath(current);
        this.cache.set(cacheKey, { path, time: Date.now() });
        return path;
      }

      const currentKey = this.posKey(current.pos);
      closedSet.add(currentKey);

      const neighbors = this.getNeighbors(current.pos, avoidPositions);

      for (const neighbor of neighbors) {
        const neighborKey = this.posKey(neighbor.pos);

        if (closedSet.has(neighborKey)) continue;

        const moveCost = neighbor.isDiagonal ? 1.414 : 1;
        const avoidanceCost = neighbor.avoidancePenalty || 0;
        const tentativeG = current.g + getDistance(current.pos, neighbor.pos) * moveCost + avoidanceCost;

        const existingG = gScores.get(neighborKey);

        if (existingG === undefined || tentativeG < existingG) {
          gScores.set(neighborKey, tentativeG);

          const neighborNode = {
            pos: neighbor.pos,
            g: tentativeG,
            h: this.heuristic(neighbor.pos, goal),
            parent: current
          };

          const existingIndex = openSet.findIndex(n => this.posKey(n.pos) === neighborKey);

          if (existingIndex === -1) {
            openSet.push(neighborNode);
          } else {
            openSet[existingIndex] = neighborNode;
          }
        }
      }
    }

    return null;
  }

  findFlankingPath(start, target, flankSide = 'left', flankDistance = 5) {
    const perpendicular = flankSide === 'left'
      ? { x: -(target.z - start.z), z: target.x - start.x }
      : { x: target.z - start.z, z: -(target.x - start.x) };

    const length = Math.sqrt(perpendicular.x ** 2 + perpendicular.z ** 2) || 1;
    const normalized = { x: perpendicular.x / length, z: perpendicular.z / length };

    const flankPoint = {
      x: target.x + normalized.x * flankDistance,
      z: target.z + normalized.z * flankDistance
    };

    return this.findPath(start, flankPoint);
  }

  findAmbushPath(start, playerPos, playerDir, ambushDistance = 8) {
    const ambushPoint = {
      x: playerPos.x + playerDir.x * ambushDistance,
      z: playerPos.z + playerDir.z * ambushDistance
    };

    return this.findPath(start, ambushPoint);
  }

  heuristic(pos, goal) {
    // Heurística octile para permitir movimiento diagonal
    const dx = Math.abs(pos.x - goal.x);
    const dz = Math.abs(pos.z - goal.z);
    return dx + dz + (1.414 - 2) * Math.min(dx, dz);
  }

  reconstructPath(node) {
    const path = [];
    let current = node;

    while (current) {
      path.unshift(current.pos);
      current = current.parent;
    }

    return this.smoothPath(path);
  }

  smoothPath(path) {
    if (path.length <= 2) return path;

    const smoothed = [path[0]];
    let current = 0;

    while (current < path.length - 1) {
      let furthest = current + 1;

      for (let i = path.length - 1; i > current + 1; i--) {
        if (this.hasLineOfSight(path[current], path[i])) {
          furthest = i;
          break;
        }
      }

      smoothed.push(path[furthest]);
      current = furthest;
    }

    return smoothed;
  }

  hasLineOfSight(from, to) {
    const steps = Math.ceil(getDistance(from, to) / (this.gridSize * 0.5));

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const z = from.z + (to.z - from.z) * t;

      if (this.checkCollision(x, z, this.walls)) {
        return false;
      }
    }

    return true;
  }

  getNeighbors(pos, avoidPositions = []) {
    const neighbors = [];
    const directions = [
      { x: 1, z: 0, isDiagonal: false },
      { x: -1, z: 0, isDiagonal: false },
      { x: 0, z: 1, isDiagonal: false },
      { x: 0, z: -1, isDiagonal: false },
      { x: 1, z: 1, isDiagonal: true },
      { x: 1, z: -1, isDiagonal: true },
      { x: -1, z: 1, isDiagonal: true },
      { x: -1, z: -1, isDiagonal: true }
    ];

    for (const dir of directions) {
      const newPos = {
        x: pos.x + dir.x * this.gridSize,
        z: pos.z + dir.z * this.gridSize
      };

      if (this.checkCollision(newPos.x, newPos.z, this.walls)) continue;

      // Verificar obstáculos dinámicos
      let blocked = false;
      for (const [, obstacle] of this.dynamicObstacles) {
        if (getDistance(newPos, obstacle.pos) < obstacle.radius) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;

      // Calcular penalización por evitar posiciones
      let avoidancePenalty = 0;
      for (const avoidPos of avoidPositions) {
        const dist = getDistance(newPos, avoidPos);
        if (dist < 3) {
          avoidancePenalty += (3 - dist) * 2;
        }
      }

      neighbors.push({
        pos: newPos,
        isDiagonal: dir.isDiagonal,
        avoidancePenalty
      });
    }

    return neighbors;
  }

  posKey(pos) {
    return `${Math.floor(pos.x / this.gridSize)},${Math.floor(pos.z / this.gridSize)}`;
  }

  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.time > this.cacheMaxAge) {
        this.cache.delete(key);
      }
    }

    // Limpiar obstáculos dinámicos antiguos
    for (const [id, obstacle] of this.dynamicObstacles.entries()) {
      if (now - obstacle.time > 5000) {
        this.dynamicObstacles.delete(id);
      }
    }
  }
}

// ============================================================================
// SISTEMA DE VISIÓN AVANZADO
// ============================================================================

export class VisionSystem {
  static hasLineOfSight(enemyPos, enemyDir, playerPos, walls, checkCollision) {
    const distance = getDistance(enemyPos, playerPos);
    const maxDistance = 30;

    if (distance > maxDistance) return false;

    const toPlayer = {
      x: playerPos.x - enemyPos.x,
      z: playerPos.z - enemyPos.z
    };

    const angle = Math.atan2(toPlayer.z, toPlayer.x);
    const enemyAngle = Math.atan2(enemyDir.z, enemyDir.x);

    let angleDiff = Math.abs(angle - enemyAngle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

    // Visión central clara
    if (angleDiff <= AdvancedAIConfig.VISION_ANGLE / 2) {
      return this.raycast(enemyPos, playerPos, walls, checkCollision);
    }

    // Visión periférica (menos confiable a mayor distancia)
    if (angleDiff <= AdvancedAIConfig.PERIPHERAL_VISION_ANGLE / 2) {
      const peripheralRange = maxDistance * 0.5;
      if (distance < peripheralRange) {
        return this.raycast(enemyPos, playerPos, walls, checkCollision);
      }
    }

    return false;
  }

  static raycast(from, to, walls, checkCollision, steps = 25) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const z = from.z + dz * t;

      if (checkCollision(x, z, walls)) {
        return false;
      }
    }

    return true;
  }

  static canHearPlayer(enemyPos, playerPos, playerVelocity, playerIsMoving) {
    if (!playerIsMoving) return false;

    const distance = getDistance(enemyPos, playerPos);
    const speed = Math.sqrt(playerVelocity.x ** 2 + playerVelocity.z ** 2);
    const hearingRadius = AdvancedAIConfig.HEARING_RADIUS * (1 + speed * 0.3);

    return distance < hearingRadius;
  }

  static senseDanger(enemyPos, playerPos, isPowerActive) {
    if (!isPowerActive) return false;

    const distance = getDistance(enemyPos, playerPos);
    return distance < AdvancedAIConfig.DANGER_SENSE_RADIUS;
  }

  static getVisibilityScore(enemyPos, enemyDir, playerPos, walls, checkCollision) {
    const hasLOS = this.hasLineOfSight(enemyPos, enemyDir, playerPos, walls, checkCollision);
    if (!hasLOS) return 0;

    const distance = getDistance(enemyPos, playerPos);
    const distanceScore = Math.max(0, 1 - distance / 30);

    const toPlayer = {
      x: playerPos.x - enemyPos.x,
      z: playerPos.z - enemyPos.z
    };
    const angle = Math.atan2(toPlayer.z, toPlayer.x);
    const enemyAngle = Math.atan2(enemyDir.z, enemyDir.x);
    let angleDiff = Math.abs(angle - enemyAngle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
    const angleScore = Math.max(0, 1 - angleDiff / Math.PI);

    return distanceScore * 0.5 + angleScore * 0.5;
  }
}

// ============================================================================
// SISTEMA ANTI-ATASCO INTELIGENTE
// ============================================================================

export class StuckDetector {
  constructor(checkCollision, walls) {
    this.checkCollision = checkCollision;
    this.walls = walls;
    this.positionHistory = [];
    this.stuckTime = 0;
    this.isStuck = false;
    this.stuckSeverity = 0; // 0-1, qué tan atascado está
    this.lastUnstuckTime = 0;
    this.unstuckAttempts = 0;
    this.lastValidDirection = null;
    this.wallContactTime = 0;
    this.consecutiveCollisions = 0;
  }

  /**
   * Actualiza el detector con la posición actual
   */
  update(currentPos, delta) {
    const now = Date.now();

    // Añadir posición al historial
    this.positionHistory.push({
      pos: { ...currentPos },
      time: now
    });

    // Mantener solo las últimas N posiciones
    if (this.positionHistory.length > AdvancedAIConfig.STUCK_HISTORY_LENGTH) {
      this.positionHistory.shift();
    }

    // Detectar si está atascado
    this.detectStuck(delta);

    return {
      isStuck: this.isStuck,
      severity: this.stuckSeverity,
      suggestion: this.getSuggestion(currentPos)
    };
  }

  /**
   * Detecta si el enemigo está atascado
   */
  detectStuck(delta) {
    if (this.positionHistory.length < 5) {
      this.isStuck = false;
      this.stuckSeverity = 0;
      return;
    }

    // Calcular movimiento total en las últimas posiciones
    let totalMovement = 0;
    const recent = this.positionHistory.slice(-10);

    for (let i = 1; i < recent.length; i++) {
      totalMovement += getDistance(recent[i].pos, recent[i - 1].pos);
    }

    const avgMovement = totalMovement / (recent.length - 1);

    // Si el movimiento promedio es muy bajo, está atascado
    if (avgMovement < AdvancedAIConfig.STUCK_DISTANCE_THRESHOLD) {
      this.stuckTime += delta;

      if (this.stuckTime > AdvancedAIConfig.STUCK_DETECTION_TIME) {
        this.isStuck = true;
        // Severidad aumenta con el tiempo atascado
        this.stuckSeverity = Math.min(1, (this.stuckTime - AdvancedAIConfig.STUCK_DETECTION_TIME) / 2);
      }
    } else {
      // Se está moviendo, resetear
      this.stuckTime = Math.max(0, this.stuckTime - delta * 2);
      if (this.stuckTime < AdvancedAIConfig.STUCK_DETECTION_TIME * 0.5) {
        this.isStuck = false;
        this.stuckSeverity = Math.max(0, this.stuckSeverity - delta);
        this.unstuckAttempts = 0;
      }
    }

    // Detectar oscilación (moviéndose de un lado a otro)
    if (this.detectOscillation()) {
      this.isStuck = true;
      this.stuckSeverity = Math.max(this.stuckSeverity, 0.5);
    }
  }

  /**
   * Detecta si el enemigo está oscilando entre dos posiciones
   */
  detectOscillation() {
    if (this.positionHistory.length < 8) return false;

    const recent = this.positionHistory.slice(-8);
    let directionChanges = 0;
    let prevDir = null;

    for (let i = 1; i < recent.length; i++) {
      const dx = recent[i].pos.x - recent[i - 1].pos.x;
      const dz = recent[i].pos.z - recent[i - 1].pos.z;

      if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
        const currentDir = Math.atan2(dz, dx);

        if (prevDir !== null) {
          let angleDiff = Math.abs(currentDir - prevDir);
          if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

          // Si cambió de dirección más de 90 grados
          if (angleDiff > Math.PI * 0.5) {
            directionChanges++;
          }
        }
        prevDir = currentDir;
      }
    }

    // Si cambió de dirección muchas veces, está oscilando
    return directionChanges >= 4;
  }

  /**
   * Registra una colisión
   */
  recordCollision() {
    this.consecutiveCollisions++;
    this.wallContactTime = Date.now();

    if (this.consecutiveCollisions > 3) {
      this.isStuck = true;
      this.stuckSeverity = Math.min(1, this.stuckSeverity + 0.3);
    }
  }

  /**
   * Registra movimiento exitoso
   */
  recordSuccessfulMove() {
    this.consecutiveCollisions = 0;
  }

  /**
   * Obtiene una sugerencia para desatascarse
   */
  getSuggestion(currentPos) {
    if (!this.isStuck) return null;

    this.unstuckAttempts++;

    // Encontrar direcciones libres
    const freeDirections = this.findFreeDirections(currentPos);

    if (freeDirections.length === 0) {
      // Completamente atrapado, intentar cualquier dirección con fuerza
      return {
        type: 'force_escape',
        direction: this.getRandomDirection(),
        strength: AdvancedAIConfig.UNSTUCK_RANDOM_STRENGTH
      };
    }

    // Si hay pocas opciones, elegir la mejor
    if (freeDirections.length <= 2) {
      return {
        type: 'limited_escape',
        direction: freeDirections[0].dir,
        strength: 1.2
      };
    }

    // Elegir dirección aleatoria de las disponibles para variar
    const randomFree = freeDirections[Math.floor(Math.random() * freeDirections.length)];
    return {
      type: 'random_escape',
      direction: randomFree.dir,
      strength: 1.0
    };
  }

  /**
   * Encuentra direcciones sin colisión
   */
  findFreeDirections(pos) {
    const directions = [
      { x: 1, z: 0, name: 'right' },
      { x: -1, z: 0, name: 'left' },
      { x: 0, z: 1, name: 'down' },
      { x: 0, z: -1, name: 'up' },
      { x: 0.707, z: 0.707, name: 'down-right' },
      { x: 0.707, z: -0.707, name: 'up-right' },
      { x: -0.707, z: 0.707, name: 'down-left' },
      { x: -0.707, z: -0.707, name: 'up-left' }
    ];

    const freeDirections = [];
    const testDistance = 1.0;

    for (const dir of directions) {
      const testPos = {
        x: pos.x + dir.x * testDistance,
        z: pos.z + dir.z * testDistance
      };

      if (!this.checkCollision(testPos.x, testPos.z, this.walls)) {
        // Verificar también un poco más adelante
        const testPos2 = {
          x: pos.x + dir.x * testDistance * 2,
          z: pos.z + dir.z * testDistance * 2
        };

        const clearance = this.checkCollision(testPos2.x, testPos2.z, this.walls) ? 1 : 2;

        freeDirections.push({
          dir: { x: dir.x, z: dir.z },
          name: dir.name,
          clearance
        });
      }
    }

    // Ordenar por claridad (más espacio libre primero)
    return freeDirections.sort((a, b) => b.clearance - a.clearance);
  }

  /**
   * Obtiene una dirección aleatoria
   */
  getRandomDirection() {
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.cos(angle),
      z: Math.sin(angle)
    };
  }

  /**
   * Resetea el detector
   */
  reset() {
    this.positionHistory = [];
    this.stuckTime = 0;
    this.isStuck = false;
    this.stuckSeverity = 0;
    this.unstuckAttempts = 0;
    this.consecutiveCollisions = 0;
  }
}

// ============================================================================
// SISTEMA DE NAVEGACIÓN INTELIGENTE
// ============================================================================

export class SmartNavigator {
  constructor(checkCollision, walls) {
    this.checkCollision = checkCollision;
    this.walls = walls;
  }

  /**
   * Calcula una dirección que evita paredes con wall-sliding
   */
  getSmartDirection(currentPos, desiredDir, currentDir) {
    // Primero intentar la dirección deseada
    const testDist = 0.8;
    const testPos = {
      x: currentPos.x + desiredDir.x * testDist,
      z: currentPos.z + desiredDir.z * testDist
    };

    if (!this.checkCollision(testPos.x, testPos.z, this.walls)) {
      return { direction: desiredDir, type: 'direct' };
    }

    // La dirección deseada tiene colisión, intentar wall-sliding
    const wallSlideResult = this.calculateWallSlide(currentPos, desiredDir);

    if (wallSlideResult) {
      return { direction: wallSlideResult, type: 'wall_slide' };
    }

    // No se puede deslizar, buscar mejor alternativa
    const alternativeDir = this.findBestAlternative(currentPos, desiredDir, currentDir);

    if (alternativeDir) {
      return { direction: alternativeDir, type: 'alternative' };
    }

    // Último recurso: dirección perpendicular
    const perpendicular = this.getPerpendicularDirection(currentPos, desiredDir);
    return { direction: perpendicular, type: 'perpendicular' };
  }

  /**
   * Calcula el deslizamiento por pared
   */
  calculateWallSlide(pos, dir) {
    const testDist = 0.8;

    // Intentar componente X solamente
    if (Math.abs(dir.x) > 0.1) {
      const testX = { x: pos.x + dir.x * testDist, z: pos.z };
      if (!this.checkCollision(testX.x, testX.z, this.walls)) {
        return normalizeDirection({ x: dir.x, z: 0 });
      }
    }

    // Intentar componente Z solamente
    if (Math.abs(dir.z) > 0.1) {
      const testZ = { x: pos.x, z: pos.z + dir.z * testDist };
      if (!this.checkCollision(testZ.x, testZ.z, this.walls)) {
        return normalizeDirection({ x: 0, z: dir.z });
      }
    }

    // Intentar diagonales
    const diagonals = [
      { x: dir.x * 0.707 + dir.z * 0.707, z: dir.z * 0.707 - dir.x * 0.707 },
      { x: dir.x * 0.707 - dir.z * 0.707, z: dir.z * 0.707 + dir.x * 0.707 }
    ];

    for (const diag of diagonals) {
      const testDiag = { x: pos.x + diag.x * testDist, z: pos.z + diag.z * testDist };
      if (!this.checkCollision(testDiag.x, testDiag.z, this.walls)) {
        return normalizeDirection(diag);
      }
    }

    return null;
  }

  /**
   * Encuentra la mejor dirección alternativa
   */
  findBestAlternative(pos, desiredDir, currentDir) {
    const angles = [
      Math.PI / 6,   // 30 grados
      -Math.PI / 6,
      Math.PI / 4,   // 45 grados
      -Math.PI / 4,
      Math.PI / 3,   // 60 grados
      -Math.PI / 3,
      Math.PI / 2,   // 90 grados
      -Math.PI / 2
    ];

    const baseAngle = Math.atan2(desiredDir.z, desiredDir.x);

    for (const offset of angles) {
      const testAngle = baseAngle + offset;
      const testDir = {
        x: Math.cos(testAngle),
        z: Math.sin(testAngle)
      };

      const testPos = {
        x: pos.x + testDir.x * 0.8,
        z: pos.z + testDir.z * 0.8
      };

      if (!this.checkCollision(testPos.x, testPos.z, this.walls)) {
        // Verificar que no vuelve sobre sí mismo
        const dotWithCurrent = testDir.x * currentDir.x + testDir.z * currentDir.z;
        if (dotWithCurrent > -0.5) { // No es reversa
          return testDir;
        }
      }
    }

    return null;
  }

  /**
   * Obtiene dirección perpendicular libre
   */
  getPerpendicularDirection(pos, dir) {
    // Perpendicular izquierda
    const leftPerp = { x: -dir.z, z: dir.x };
    const testLeft = { x: pos.x + leftPerp.x * 0.8, z: pos.z + leftPerp.z * 0.8 };

    // Perpendicular derecha
    const rightPerp = { x: dir.z, z: -dir.x };
    const testRight = { x: pos.x + rightPerp.x * 0.8, z: pos.z + rightPerp.z * 0.8 };

    const leftFree = !this.checkCollision(testLeft.x, testLeft.z, this.walls);
    const rightFree = !this.checkCollision(testRight.x, testRight.z, this.walls);

    if (leftFree && rightFree) {
      // Ambas libres, elegir aleatoriamente
      return Math.random() > 0.5 ? leftPerp : rightPerp;
    } else if (leftFree) {
      return leftPerp;
    } else if (rightFree) {
      return rightPerp;
    }

    // Ninguna libre, ir hacia atrás
    return { x: -dir.x, z: -dir.z };
  }

  /**
   * Detecta si hay una esquina cercana
   */
  detectCorner(pos, dir) {
    const range = AdvancedAIConfig.CORNER_DETECTION_RANGE;

    // Verificar adelante
    const ahead = !this.checkCollision(pos.x + dir.x * range, pos.z + dir.z * range, this.walls);

    // Verificar a los lados
    const leftDir = { x: -dir.z, z: dir.x };
    const rightDir = { x: dir.z, z: -dir.x };

    const left = !this.checkCollision(pos.x + leftDir.x * range, pos.z + leftDir.z * range, this.walls);
    const right = !this.checkCollision(pos.x + rightDir.x * range, pos.z + rightDir.z * range, this.walls);

    if (!ahead) {
      if (left && !right) return { type: 'corner_left', escapeDir: leftDir };
      if (right && !left) return { type: 'corner_right', escapeDir: rightDir };
      if (!left && !right) return { type: 'dead_end', escapeDir: { x: -dir.x, z: -dir.z } };
    }

    return null;
  }

  /**
   * Obtiene información de paredes cercanas
   */
  getNearbyWalls(pos) {
    const checkDist = AdvancedAIConfig.WALL_AVOIDANCE_DISTANCE;
    const walls = {
      front: false,
      back: false,
      left: false,
      right: false,
      frontLeft: false,
      frontRight: false,
      backLeft: false,
      backRight: false
    };

    const directions = [
      { key: 'front', x: 0, z: -1 },
      { key: 'back', x: 0, z: 1 },
      { key: 'left', x: -1, z: 0 },
      { key: 'right', x: 1, z: 0 },
      { key: 'frontLeft', x: -0.707, z: -0.707 },
      { key: 'frontRight', x: 0.707, z: -0.707 },
      { key: 'backLeft', x: -0.707, z: 0.707 },
      { key: 'backRight', x: 0.707, z: 0.707 }
    ];

    for (const d of directions) {
      walls[d.key] = this.checkCollision(pos.x + d.x * checkDist, pos.z + d.z * checkDist, this.walls);
    }

    return walls;
  }

  /**
   * Calcula vector de repulsión de paredes
   */
  getWallRepulsion(pos) {
    const checkDist = AdvancedAIConfig.WALL_AVOIDANCE_DISTANCE;
    let repulsionX = 0;
    let repulsionZ = 0;

    const testPoints = [
      { x: 1, z: 0 },
      { x: -1, z: 0 },
      { x: 0, z: 1 },
      { x: 0, z: -1 },
      { x: 0.707, z: 0.707 },
      { x: 0.707, z: -0.707 },
      { x: -0.707, z: 0.707 },
      { x: -0.707, z: -0.707 }
    ];

    for (const point of testPoints) {
      const testX = pos.x + point.x * checkDist;
      const testZ = pos.z + point.z * checkDist;

      if (this.checkCollision(testX, testZ, this.walls)) {
        // Hay pared, agregar repulsión en dirección opuesta
        repulsionX -= point.x * 0.5;
        repulsionZ -= point.z * 0.5;
      }
    }

    // Normalizar si hay repulsión
    const magnitude = Math.sqrt(repulsionX * repulsionX + repulsionZ * repulsionZ);
    if (magnitude > 0.1) {
      return {
        x: repulsionX / magnitude,
        z: repulsionZ / magnitude,
        strength: Math.min(1, magnitude)
      };
    }

    return null;
  }
}

// ============================================================================
// ANALIZADOR DE MAPA ESTRATÉGICO
// ============================================================================

export class MapAnalyzer {
  constructor(walls, checkCollision, mapWidth = 32, mapHeight = 38) {
    this.walls = walls;
    this.checkCollision = checkCollision;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    // Datos del análisis
    this.chokepoints = [];
    this.safeZones = [];
    this.dangerZones = [];
    this.openAreas = [];
    this.corridors = [];
    this.intersections = [];
    this.deadEnds = [];
    this.strategicPositions = [];

    this.lastAnalysisTime = 0;
    this.gridResolution = 1.5;
    this.analyzed = false;
  }

  /**
   * Analiza el mapa completo
   */
  analyze() {
    if (this.analyzed) return;

    this.findChokepoints();
    this.findOpenAreas();
    this.findIntersections();
    this.findDeadEnds();
    this.calculateStrategicPositions();

    this.analyzed = true;
  }

  /**
   * Encuentra cuellos de botella (zonas estrechas)
   */
  findChokepoints() {
    this.chokepoints = [];

    for (let x = 2; x < this.mapWidth - 2; x += this.gridResolution) {
      for (let z = 2; z < this.mapHeight - 2; z += this.gridResolution) {
        if (this.checkCollision(x, z, this.walls)) continue;

        const openness = this.calculateOpenness(x, z);

        if (openness > 0.2 && openness < 0.4) {
          // Es un área relativamente estrecha
          const adjacentOpen = this.countAdjacentOpenCells(x, z);

          if (adjacentOpen >= 2 && adjacentOpen <= 4) {
            this.chokepoints.push({
              x, z,
              openness,
              importance: (0.4 - openness) * 2 // Más estrecho = más importante
            });
          }
        }
      }
    }

    // Ordenar por importancia
    this.chokepoints.sort((a, b) => b.importance - a.importance);
    this.chokepoints = this.chokepoints.slice(0, 20); // Top 20
  }

  /**
   * Encuentra áreas abiertas (buenas para emboscadas desde múltiples ángulos)
   */
  findOpenAreas() {
    this.openAreas = [];

    for (let x = 3; x < this.mapWidth - 3; x += this.gridResolution * 2) {
      for (let z = 3; z < this.mapHeight - 3; z += this.gridResolution * 2) {
        if (this.checkCollision(x, z, this.walls)) continue;

        const openness = this.calculateOpenness(x, z);

        if (openness > 0.7) {
          this.openAreas.push({
            x, z,
            openness,
            radius: openness * 5
          });
        }
      }
    }
  }

  /**
   * Encuentra intersecciones (puntos de decisión)
   */
  findIntersections() {
    this.intersections = [];

    for (let x = 2; x < this.mapWidth - 2; x += this.gridResolution) {
      for (let z = 2; z < this.mapHeight - 2; z += this.gridResolution) {
        if (this.checkCollision(x, z, this.walls)) continue;

        const directions = this.getAvailableDirections(x, z);

        if (directions >= 3) {
          this.intersections.push({
            x, z,
            directions,
            importance: directions / 4
          });
        }
      }
    }
  }

  /**
   * Encuentra callejones sin salida (trampas potenciales)
   */
  findDeadEnds() {
    this.deadEnds = [];

    for (let x = 2; x < this.mapWidth - 2; x += this.gridResolution) {
      for (let z = 2; z < this.mapHeight - 2; z += this.gridResolution) {
        if (this.checkCollision(x, z, this.walls)) continue;

        const directions = this.getAvailableDirections(x, z);

        if (directions === 1) {
          this.deadEnds.push({ x, z, danger: 1.0 });
        }
      }
    }
  }

  /**
   * Calcula posiciones estratégicas óptimas
   */
  calculateStrategicPositions() {
    this.strategicPositions = [];

    // Posiciones cerca de chokepoints son estratégicas
    for (const cp of this.chokepoints) {
      const guardPositions = this.findGuardPositions(cp.x, cp.z);
      this.strategicPositions.push(...guardPositions);
    }

    // Posiciones en intersecciones también
    for (const inter of this.intersections) {
      this.strategicPositions.push({
        x: inter.x,
        z: inter.z,
        type: 'intersection',
        value: inter.importance
      });
    }
  }

  /**
   * Encuentra posiciones de guardia cerca de un punto
   */
  findGuardPositions(x, z) {
    const positions = [];
    const radius = 3;
    const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];

    for (const angle of angles) {
      const gx = x + Math.cos(angle) * radius;
      const gz = z + Math.sin(angle) * radius;

      if (!this.checkCollision(gx, gz, this.walls)) {
        positions.push({
          x: gx, z: gz,
          type: 'guard',
          value: 0.8,
          guardsPoint: { x, z }
        });
      }
    }

    return positions;
  }

  /**
   * Calcula qué tan abierta es una posición
   */
  calculateOpenness(x, z) {
    let openCount = 0;
    const testRadius = 2;
    const testPoints = 16;

    for (let i = 0; i < testPoints; i++) {
      const angle = (Math.PI * 2 * i) / testPoints;
      const tx = x + Math.cos(angle) * testRadius;
      const tz = z + Math.sin(angle) * testRadius;

      if (!this.checkCollision(tx, tz, this.walls)) {
        openCount++;
      }
    }

    return openCount / testPoints;
  }

  /**
   * Cuenta direcciones disponibles desde un punto
   */
  getAvailableDirections(x, z) {
    const directions = [
      { dx: 1, dz: 0 },
      { dx: -1, dz: 0 },
      { dx: 0, dz: 1 },
      { dx: 0, dz: -1 }
    ];

    let count = 0;
    for (const dir of directions) {
      if (!this.checkCollision(x + dir.dx * 1.5, z + dir.dz * 1.5, this.walls)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Cuenta celdas abiertas adyacentes
   */
  countAdjacentOpenCells(x, z) {
    let count = 0;
    const offsets = [
      { dx: 1, dz: 0 }, { dx: -1, dz: 0 },
      { dx: 0, dz: 1 }, { dx: 0, dz: -1 },
      { dx: 1, dz: 1 }, { dx: 1, dz: -1 },
      { dx: -1, dz: 1 }, { dx: -1, dz: -1 }
    ];

    for (const off of offsets) {
      if (!this.checkCollision(x + off.dx, z + off.dz, this.walls)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Obtiene el chokepoint más cercano a una posición
   */
  getNearestChokepoint(pos) {
    if (this.chokepoints.length === 0) return null;

    let nearest = this.chokepoints[0];
    let minDist = getDistance(pos, nearest);

    for (const cp of this.chokepoints) {
      const dist = getDistance(pos, cp);
      if (dist < minDist) {
        minDist = dist;
        nearest = cp;
      }
    }

    return { point: nearest, distance: minDist };
  }

  /**
   * Obtiene posiciones estratégicas cerca de un punto
   */
  getStrategicPositionsNear(pos, radius = 15) {
    return this.strategicPositions.filter(sp =>
      getDistance(pos, sp) < radius
    ).sort((a, b) => b.value - a.value);
  }

  /**
   * Verifica si una posición es un callejón sin salida
   */
  isDeadEnd(pos) {
    for (const de of this.deadEnds) {
      if (getDistance(pos, de) < 2) return true;
    }
    return false;
  }

  /**
   * Obtiene la zona más peligrosa para el jugador cerca de una posición
   */
  getMostDangerousZone(playerPos, radius = 10) {
    const nearDeadEnds = this.deadEnds.filter(de =>
      getDistance(playerPos, de) < radius
    );

    if (nearDeadEnds.length > 0) {
      return nearDeadEnds[0];
    }

    return null;
  }
}

// ============================================================================
// PREDICTOR DE RUTAS DE ESCAPE
// ============================================================================

export class EscapeRoutePredictor {
  constructor(mapAnalyzer, checkCollision, walls) {
    this.mapAnalyzer = mapAnalyzer;
    this.checkCollision = checkCollision;
    this.walls = walls;
    this.escapeRouteCache = new Map();
    this.playerEscapeHistory = [];
  }

  /**
   * Predice las rutas de escape más probables del jugador
   */
  predictEscapeRoutes(playerPos, playerDir, enemyPositions, depth = 5) {
    const routes = [];
    const visited = new Set();

    // Direcciones posibles de escape
    const escapeDirections = this.calculateEscapeDirections(playerPos, enemyPositions);

    for (const escapeDir of escapeDirections) {
      const route = this.traceEscapeRoute(playerPos, escapeDir, enemyPositions, depth, visited);
      if (route && route.length > 0) {
        routes.push({
          direction: escapeDir,
          path: route,
          safety: this.evaluateRouteSafety(route, enemyPositions),
          probability: this.calculateEscapeProbability(escapeDir, playerDir, playerPos)
        });
      }
    }

    // Ordenar por probabilidad
    routes.sort((a, b) => b.probability - a.probability);

    return routes.slice(0, 4); // Top 4 rutas más probables
  }

  /**
   * Calcula direcciones de escape basadas en posiciones de enemigos
   */
  calculateEscapeDirections(playerPos, enemyPositions) {
    const directions = [];

    // Dirección opuesta al centro de masa de enemigos
    if (enemyPositions.length > 0) {
      let avgX = 0, avgZ = 0;
      for (const enemy of enemyPositions) {
        avgX += enemy.x;
        avgZ += enemy.z;
      }
      avgX /= enemyPositions.length;
      avgZ /= enemyPositions.length;

      const awayDir = normalizeDirection({
        x: playerPos.x - avgX,
        z: playerPos.z - avgZ
      });
      directions.push({ ...awayDir, priority: 1.0 });
    }

    // Direcciones cardinales
    const cardinals = [
      { x: 1, z: 0 }, { x: -1, z: 0 },
      { x: 0, z: 1 }, { x: 0, z: -1 },
      { x: 0.707, z: 0.707 }, { x: 0.707, z: -0.707 },
      { x: -0.707, z: 0.707 }, { x: -0.707, z: -0.707 }
    ];

    for (const dir of cardinals) {
      const testPos = {
        x: playerPos.x + dir.x * 2,
        z: playerPos.z + dir.z * 2
      };

      if (!this.checkCollision(testPos.x, testPos.z, this.walls)) {
        // Calcular qué tan lejos está de los enemigos
        let minEnemyDist = 999;
        for (const enemy of enemyPositions) {
          const dist = getDistance(testPos, enemy);
          if (dist < minEnemyDist) minEnemyDist = dist;
        }

        directions.push({
          ...dir,
          priority: minEnemyDist / 20 // Normalizar
        });
      }
    }

    // Ordenar por prioridad
    directions.sort((a, b) => b.priority - a.priority);

    return directions.slice(0, 6);
  }

  /**
   * Traza una ruta de escape
   */
  traceEscapeRoute(startPos, direction, enemyPositions, depth, visited) {
    const route = [{ ...startPos }];
    let currentPos = { ...startPos };
    let currentDir = { ...direction };

    for (let i = 0; i < depth; i++) {
      const nextPos = {
        x: currentPos.x + currentDir.x * 2,
        z: currentPos.z + currentDir.z * 2
      };

      const posKey = `${Math.floor(nextPos.x)},${Math.floor(nextPos.z)}`;
      if (visited.has(posKey)) break;
      visited.add(posKey);

      if (this.checkCollision(nextPos.x, nextPos.z, this.walls)) {
        // Intentar girar
        const newDir = this.findAlternativeDirection(currentPos, currentDir);
        if (newDir) {
          currentDir = newDir;
          continue;
        } else {
          break;
        }
      }

      route.push({ ...nextPos });
      currentPos = nextPos;

      // Ajustar dirección para alejarse de enemigos
      currentDir = this.adjustDirectionAwayFromEnemies(currentPos, currentDir, enemyPositions);
    }

    return route;
  }

  /**
   * Encuentra dirección alternativa cuando hay obstáculo
   */
  findAlternativeDirection(pos, dir) {
    const alternatives = [
      { x: -dir.z, z: dir.x },  // 90° izquierda
      { x: dir.z, z: -dir.x },  // 90° derecha
      { x: -dir.x, z: -dir.z }  // 180°
    ];

    for (const alt of alternatives) {
      const testPos = {
        x: pos.x + alt.x * 2,
        z: pos.z + alt.z * 2
      };

      if (!this.checkCollision(testPos.x, testPos.z, this.walls)) {
        return alt;
      }
    }

    return null;
  }

  /**
   * Ajusta la dirección para alejarse de enemigos
   */
  adjustDirectionAwayFromEnemies(pos, dir, enemyPositions) {
    if (enemyPositions.length === 0) return dir;

    let repulsionX = 0, repulsionZ = 0;

    for (const enemy of enemyPositions) {
      const dist = getDistance(pos, enemy);
      if (dist < 15) {
        const strength = (15 - dist) / 15;
        repulsionX += (pos.x - enemy.x) * strength;
        repulsionZ += (pos.z - enemy.z) * strength;
      }
    }

    // Combinar dirección actual con repulsión
    return normalizeDirection({
      x: dir.x * 0.6 + repulsionX * 0.4,
      z: dir.z * 0.6 + repulsionZ * 0.4
    });
  }

  /**
   * Evalúa qué tan segura es una ruta
   */
  evaluateRouteSafety(route, enemyPositions) {
    if (route.length === 0) return 0;

    let totalSafety = 0;

    for (const point of route) {
      let minEnemyDist = 999;
      for (const enemy of enemyPositions) {
        const dist = getDistance(point, enemy);
        if (dist < minEnemyDist) minEnemyDist = dist;
      }

      // Normalizar seguridad (más distancia = más seguro)
      totalSafety += Math.min(1, minEnemyDist / 15);
    }

    return totalSafety / route.length;
  }

  /**
   * Calcula la probabilidad de que el jugador tome esta ruta
   */
  calculateEscapeProbability(escapeDir, playerDir, playerPos) {
    // Probabilidad basada en:
    // 1. Alineación con dirección actual del jugador
    const alignment = (escapeDir.x * playerDir.x + escapeDir.z * playerDir.z + 1) / 2;

    // 2. Historial de escapes del jugador
    const historicalProbability = this.getHistoricalEscapeProbability(escapeDir);

    // 3. Si lleva a un área abierta
    const leadsToOpen = this.checkIfLeadsToOpenArea(playerPos, escapeDir);

    return alignment * 0.4 + historicalProbability * 0.3 + (leadsToOpen ? 0.3 : 0.1);
  }

  /**
   * Obtiene probabilidad histórica de escape en una dirección
   */
  getHistoricalEscapeProbability(dir) {
    if (this.playerEscapeHistory.length === 0) return 0.25;

    let matchCount = 0;
    for (const escape of this.playerEscapeHistory) {
      const dot = escape.dir.x * dir.x + escape.dir.z * dir.z;
      if (dot > 0.7) matchCount++;
    }

    return matchCount / this.playerEscapeHistory.length;
  }

  /**
   * Verifica si una dirección lleva a un área abierta
   */
  checkIfLeadsToOpenArea(pos, dir) {
    const testDist = 8;
    const testPos = {
      x: pos.x + dir.x * testDist,
      z: pos.z + dir.z * testDist
    };

    if (this.mapAnalyzer && this.mapAnalyzer.openAreas) {
      for (const area of this.mapAnalyzer.openAreas) {
        if (getDistance(testPos, area) < area.radius) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Registra una ruta de escape tomada por el jugador
   */
  recordPlayerEscape(escapeDir) {
    this.playerEscapeHistory.push({
      dir: { ...escapeDir },
      time: Date.now()
    });

    // Mantener historial limitado
    if (this.playerEscapeHistory.length > 30) {
      this.playerEscapeHistory.shift();
    }
  }

  /**
   * Obtiene el mejor punto para bloquear escape
   */
  getBestBlockingPoint(playerPos, predictedRoutes) {
    if (predictedRoutes.length === 0) return null;

    // Tomar la ruta más probable
    const topRoute = predictedRoutes[0];

    if (topRoute.path.length < 2) return null;

    // El mejor punto de bloqueo es adelante en la ruta predicha
    const blockIndex = Math.min(2, topRoute.path.length - 1);
    return topRoute.path[blockIndex];
  }
}

// ============================================================================
// SISTEMA DE MIND GAMES (ENGAÑOS Y FINTAS)
// ============================================================================

export class MindGameSystem {
  constructor() {
    this.activeFeint = null;
    this.feintTimer = 0;
    this.lastFeintTime = 0;
    this.feintCooldown = 3;
    this.successfulFeints = 0;
    this.failedFeints = 0;
  }

  /**
   * Decide si hacer una finta
   */
  shouldFeint(context) {
    const now = Date.now() / 1000;

    // Cooldown
    if (now - this.lastFeintTime < this.feintCooldown) return false;

    // Probabilidad base
    if (Math.random() > AdvancedAIConfig.MIND_GAME_PROBABILITY) return false;

    // Condiciones favorables para finta
    const goodDistance = context.distance > 8 && context.distance < 18;
    const playerIsMoving = context.playerDir.x !== 0 || context.playerDir.z !== 0;
    const hasLineOfSight = context.hasLineOfSight;

    return goodDistance && playerIsMoving && hasLineOfSight;
  }

  /**
   * Inicia una finta
   */
  startFeint(enemyPos, playerPos, playerDir) {
    this.lastFeintTime = Date.now() / 1000;

    // Tipos de finta
    const feintTypes = [
      'fake_retreat',    // Fingir retirarse
      'fake_flank',      // Fingir ir a un lado
      'hesitation',      // Pausar para confundir
      'misdirection'     // Ir en dirección opuesta brevemente
    ];

    const feintType = feintTypes[Math.floor(Math.random() * feintTypes.length)];

    let feintDirection;
    switch (feintType) {
      case 'fake_retreat':
        // Moverse brevemente lejos del jugador
        feintDirection = normalizeDirection({
          x: enemyPos.x - playerPos.x,
          z: enemyPos.z - playerPos.z
        });
        break;

      case 'fake_flank':
        // Moverse perpendicular
        const perpDir = playerDir;
        feintDirection = Math.random() > 0.5
          ? { x: -perpDir.z, z: perpDir.x }
          : { x: perpDir.z, z: -perpDir.x };
        break;

      case 'hesitation':
        // No moverse
        feintDirection = { x: 0, z: 0 };
        break;

      case 'misdirection':
        // Ir hacia donde el jugador NO va
        feintDirection = normalizeDirection({
          x: -playerDir.x + (Math.random() - 0.5),
          z: -playerDir.z + (Math.random() - 0.5)
        });
        break;

      default:
        feintDirection = { x: 0, z: 0 };
    }

    this.activeFeint = {
      type: feintType,
      direction: feintDirection,
      startTime: Date.now() / 1000,
      duration: AdvancedAIConfig.FEINT_DURATION * (0.8 + Math.random() * 0.4),
      originalTarget: { ...playerPos }
    };

    this.feintTimer = 0;

    return this.activeFeint;
  }

  /**
   * Actualiza la finta activa
   */
  update(delta) {
    if (!this.activeFeint) return null;

    this.feintTimer += delta;

    if (this.feintTimer >= this.activeFeint.duration) {
      // Finta completada
      const completedFeint = this.activeFeint;
      this.activeFeint = null;
      return { completed: true, feint: completedFeint };
    }

    return { active: true, feint: this.activeFeint };
  }

  /**
   * Obtiene la dirección de la finta actual
   */
  getFeintDirection() {
    if (!this.activeFeint) return null;
    return this.activeFeint.direction;
  }

  /**
   * Registra resultado de finta
   */
  recordFeintResult(success) {
    if (success) {
      this.successfulFeints++;
      // Reducir cooldown si funciona
      this.feintCooldown = Math.max(2, this.feintCooldown - 0.2);
    } else {
      this.failedFeints++;
      // Aumentar cooldown si falla
      this.feintCooldown = Math.min(5, this.feintCooldown + 0.3);
    }
  }

  /**
   * Verifica si hay finta activa
   */
  isFeinting() {
    return this.activeFeint !== null;
  }
}

// ============================================================================
// SISTEMA DE PRESIÓN PSICOLÓGICA
// ============================================================================

export class PressureManager {
  constructor() {
    this.pressureLevel = 0;
    this.optimalDistance = AdvancedAIConfig.PRESSURE_OPTIMAL_DISTANCE;
    this.pressureHistory = [];
    this.lastPressureAdjustment = 0;
  }

  /**
   * Calcula la presión óptima para aplicar al jugador
   */
  calculatePressure(context, nearbyEnemies) {
    const { distance, playerMemory, isPowerActive } = context;

    if (isPowerActive) {
      // Reducir presión cuando el jugador tiene poder
      return { level: 0.2, strategy: 'retreat' };
    }

    // Factores de presión
    const proximityPressure = Math.max(0, 1 - distance / 20);
    const numberPressure = Math.min(1, (nearbyEnemies?.length || 0) / 4);

    // Presión basada en comportamiento del jugador
    let behaviorPressure = 0.5;
    if (playerMemory) {
      const profile = playerMemory.behaviorProfile;
      // Presionar más a jugadores cautelosos
      behaviorPressure = profile.caution * 0.7 + (1 - profile.skillLevel) * 0.3;
    }

    this.pressureLevel = (proximityPressure * 0.4 + numberPressure * 0.3 + behaviorPressure * 0.3);

    // Determinar estrategia
    let strategy;
    if (this.pressureLevel > 0.7) {
      strategy = 'aggressive_close';
    } else if (this.pressureLevel > 0.4) {
      strategy = 'maintain_pressure';
    } else {
      strategy = 'build_pressure';
    }

    return {
      level: this.pressureLevel,
      strategy,
      optimalDistance: this.calculateOptimalDistance(context)
    };
  }

  /**
   * Calcula la distancia óptima para mantener presión
   */
  calculateOptimalDistance(context) {
    const baseDist = AdvancedAIConfig.PRESSURE_OPTIMAL_DISTANCE;

    // Ajustar según situación
    let adjustment = 0;

    if (context.isPowerActive) {
      adjustment = 8; // Mantener más distancia
    } else if (this.pressureLevel > 0.7) {
      adjustment = -2; // Acercarse más
    }

    return Math.max(3, baseDist + adjustment);
  }

  /**
   * Obtiene dirección para mantener presión óptima
   */
  getPressureDirection(enemyPos, playerPos, optimalDist) {
    const currentDist = getDistance(enemyPos, playerPos);
    const toPlayer = normalizeDirection({
      x: playerPos.x - enemyPos.x,
      z: playerPos.z - enemyPos.z
    });

    if (Math.abs(currentDist - optimalDist) < 1) {
      // En rango óptimo, orbitar alrededor del jugador
      return {
        x: -toPlayer.z * 0.7 + toPlayer.x * 0.3,
        z: toPlayer.x * 0.7 + toPlayer.z * 0.3
      };
    } else if (currentDist > optimalDist) {
      // Demasiado lejos, acercarse
      return toPlayer;
    } else {
      // Demasiado cerca, alejarse ligeramente mientras orbita
      return {
        x: -toPlayer.x * 0.3 - toPlayer.z * 0.7,
        z: -toPlayer.z * 0.3 + toPlayer.x * 0.7
      };
    }
  }
}

// ============================================================================
// SISTEMA DE PASTOREO (HERDING)
// ============================================================================

export class HerdingSystem {
  constructor(mapAnalyzer) {
    this.mapAnalyzer = mapAnalyzer;
    this.targetZone = null;
    this.herdingActive = false;
  }

  /**
   * Calcula la dirección para "pastorear" al jugador hacia una zona desfavorable
   */
  calculateHerdingDirection(enemyPos, playerPos, playerDir, otherEnemies) {
    // Encontrar la zona más peligrosa cercana
    const dangerZone = this.findBestHerdingTarget(playerPos);

    if (!dangerZone) {
      return null;
    }

    this.targetZone = dangerZone;
    this.herdingActive = true;

    // Calcular posición para empujar al jugador hacia la zona
    const playerToZone = normalizeDirection({
      x: dangerZone.x - playerPos.x,
      z: dangerZone.z - playerPos.z
    });

    // El enemigo debe posicionarse opuesto a la zona objetivo
    const herdingPosition = {
      x: playerPos.x - playerToZone.x * 5,
      z: playerPos.z - playerToZone.z * 5
    };

    // Dirección hacia la posición de pastoreo
    return normalizeDirection({
      x: herdingPosition.x - enemyPos.x,
      z: herdingPosition.z - enemyPos.z
    });
  }

  /**
   * Encuentra el mejor objetivo para pastorear
   */
  findBestHerdingTarget(playerPos) {
    if (!this.mapAnalyzer) return null;

    // Prioridad: callejones sin salida > chokepoints > esquinas
    const deadEnds = this.mapAnalyzer.deadEnds || [];
    const chokepoints = this.mapAnalyzer.chokepoints || [];

    // Buscar callejón sin salida cercano
    for (const de of deadEnds) {
      const dist = getDistance(playerPos, de);
      if (dist > 5 && dist < 20) {
        return { ...de, type: 'dead_end', priority: 1.0 };
      }
    }

    // Buscar chokepoint
    for (const cp of chokepoints) {
      const dist = getDistance(playerPos, cp);
      if (dist > 5 && dist < 25) {
        return { ...cp, type: 'chokepoint', priority: 0.7 };
      }
    }

    return null;
  }

  /**
   * Verifica si el pastoreo fue exitoso
   */
  checkHerdingSuccess(playerPos) {
    if (!this.targetZone) return false;

    const dist = getDistance(playerPos, this.targetZone);
    return dist < 3;
  }

  /**
   * Obtiene posiciones coordinadas para pastoreo múltiple
   */
  getCoordinatedHerdingPositions(playerPos, targetZone, numEnemies) {
    const positions = [];

    // Crear un semicírculo empujando hacia la zona objetivo
    const toZone = normalizeDirection({
      x: targetZone.x - playerPos.x,
      z: targetZone.z - playerPos.z
    });

    const perpendicular = { x: -toZone.z, z: toZone.x };

    for (let i = 0; i < numEnemies; i++) {
      const angle = (i / (numEnemies - 1) - 0.5) * Math.PI * 0.8;
      const radius = 6;

      positions.push({
        x: playerPos.x - toZone.x * radius + perpendicular.x * Math.sin(angle) * radius,
        z: playerPos.z - toZone.z * radius + perpendicular.z * Math.sin(angle) * radius
      });
    }

    return positions;
  }
}

// ============================================================================
// DETECTOR DE TRAMPAS DEL JUGADOR
// ============================================================================

export class TrapDetector {
  constructor() {
    this.suspiciousPatterns = [];
    this.trapHistory = [];
    this.alertLevel = 0;
  }

  /**
   * Analiza si el jugador está intentando una trampa
   */
  analyzeTrap(playerPos, playerDir, playerHistory, enemyPositions) {
    const traps = [];

    // Detectar trampa de "chase into wall"
    if (this.detectWallTrap(playerPos, playerDir)) {
      traps.push({ type: 'wall_trap', confidence: 0.8 });
    }

    // Detectar trampa de "splitting enemies"
    if (this.detectSplitTrap(playerPos, enemyPositions)) {
      traps.push({ type: 'split_trap', confidence: 0.7 });
    }

    // Detectar trampa de "U-turn"
    if (this.detectUTurnTrap(playerHistory)) {
      traps.push({ type: 'uturn_trap', confidence: 0.9 });
    }

    // Detectar trampa de "corner bait"
    if (this.detectCornerBait(playerPos, playerDir, playerHistory)) {
      traps.push({ type: 'corner_bait', confidence: 0.75 });
    }

    // Actualizar nivel de alerta
    if (traps.length > 0) {
      this.alertLevel = Math.min(1, this.alertLevel + 0.2);
    } else {
      this.alertLevel = Math.max(0, this.alertLevel - 0.05);
    }

    return {
      traps,
      alertLevel: this.alertLevel,
      shouldBeCareful: this.alertLevel > AdvancedAIConfig.TRAP_DETECTION_SENSITIVITY
    };
  }

  /**
   * Detecta si el jugador intenta hacer que los enemigos choquen con paredes
   */
  detectWallTrap(playerPos, playerDir) {
    // Si el jugador va directo hacia una pared con enemigos detrás
    // es probable que intente esquivar en el último momento
    return false; // Implementación simplificada
  }

  /**
   * Detecta si el jugador intenta separar a los enemigos
   */
  detectSplitTrap(playerPos, enemyPositions) {
    if (enemyPositions.length < 2) return false;

    // Calcular dispersión de enemigos
    let totalDist = 0;
    for (let i = 0; i < enemyPositions.length; i++) {
      for (let j = i + 1; j < enemyPositions.length; j++) {
        totalDist += getDistance(enemyPositions[i], enemyPositions[j]);
      }
    }

    const avgDist = totalDist / (enemyPositions.length * (enemyPositions.length - 1) / 2);

    // Si los enemigos están muy separados, podría ser una trampa
    return avgDist > 15;
  }

  /**
   * Detecta si el jugador está preparando un U-turn
   */
  detectUTurnTrap(playerHistory) {
    if (!playerHistory || playerHistory.length < 5) return false;

    const recent = playerHistory.slice(-5);

    // Verificar si el jugador ha mantenido dirección constante
    // (preparándose para girar súbitamente)
    let consistent = true;
    for (let i = 1; i < recent.length; i++) {
      const dot = recent[i].dir.x * recent[i-1].dir.x + recent[i].dir.z * recent[i-1].dir.z;
      if (dot < 0.9) {
        consistent = false;
        break;
      }
    }

    return consistent;
  }

  /**
   * Detecta si el jugador está usando una esquina como cebo
   */
  detectCornerBait(playerPos, playerDir, playerHistory) {
    // Simplificado
    return false;
  }

  /**
   * Obtiene acción evasiva recomendada
   */
  getEvasiveAction(trapType, enemyPos, playerPos) {
    switch (trapType) {
      case 'wall_trap':
        // No seguir directamente, anticipar el giro
        return { action: 'anticipate_turn', slowDown: true };

      case 'split_trap':
        // Reagruparse con otros enemigos
        return { action: 'regroup', priority: 'high' };

      case 'uturn_trap':
        // Mantener distancia, no comprometerse
        return { action: 'maintain_distance', distance: 8 };

      case 'corner_bait':
        // No entrar en la esquina, bloquear salida
        return { action: 'block_exit', cautious: true };

      default:
        return { action: 'proceed_carefully' };
    }
  }
}

// ============================================================================
// CONSEJERO TÁCTICO INTEGRADO
// ============================================================================

export class TacticalAdvisor {
  constructor(mapAnalyzer, escapePredictor, pressureManager, herdingSystem, trapDetector) {
    this.mapAnalyzer = mapAnalyzer;
    this.escapePredictor = escapePredictor;
    this.pressureManager = pressureManager;
    this.herdingSystem = herdingSystem;
    this.trapDetector = trapDetector;
    this.lastAdvice = null;
    this.adviceHistory = [];
  }

  /**
   * Genera consejo táctico integral
   */
  getAdvice(context, enemyId, allEnemyPositions) {
    const advice = {
      primaryAction: null,
      secondaryAction: null,
      targetPosition: null,
      speedModifier: 1.0,
      urgency: 0.5,
      reasoning: []
    };

    // Analizar trampas
    const trapAnalysis = this.trapDetector?.analyzeTrap(
      context.playerPos,
      context.playerDir,
      context.playerMemory?.positionHistory,
      allEnemyPositions
    );

    if (trapAnalysis?.shouldBeCareful) {
      advice.reasoning.push('Trap detected - being cautious');
      advice.speedModifier *= 0.8;
      advice.primaryAction = 'CAUTIOUS_APPROACH';
    }

    // Calcular presión
    const pressure = this.pressureManager?.calculatePressure(context, context.nearbyEnemies);

    if (pressure) {
      if (pressure.strategy === 'aggressive_close') {
        advice.primaryAction = advice.primaryAction || 'AGGRESSIVE_CHASE';
        advice.speedModifier *= 1.2;
        advice.reasoning.push('High pressure - closing in');
      } else if (pressure.strategy === 'build_pressure') {
        advice.primaryAction = advice.primaryAction || 'POSITION_FOR_PRESSURE';
        advice.targetPosition = this.pressureManager.getPressureDirection(
          context.enemyPos, context.playerPos, pressure.optimalDistance
        );
        advice.reasoning.push('Building pressure');
      }
    }

    // Predecir rutas de escape
    if (this.escapePredictor) {
      const escapeRoutes = this.escapePredictor.predictEscapeRoutes(
        context.playerPos,
        context.playerDir,
        allEnemyPositions
      );

      if (escapeRoutes.length > 0) {
        const blockingPoint = this.escapePredictor.getBestBlockingPoint(
          context.playerPos,
          escapeRoutes
        );

        if (blockingPoint && !advice.primaryAction) {
          advice.secondaryAction = 'BLOCK_ESCAPE';
          advice.targetPosition = blockingPoint;
          advice.reasoning.push(`Blocking probable escape route`);
        }
      }
    }

    // Considerar pastoreo
    if (this.herdingSystem && context.nearbyEnemies?.length >= 2) {
      const herdingDir = this.herdingSystem.calculateHerdingDirection(
        context.enemyPos,
        context.playerPos,
        context.playerDir,
        allEnemyPositions
      );

      if (herdingDir && !advice.primaryAction) {
        advice.secondaryAction = 'HERD';
        advice.targetPosition = {
          x: context.enemyPos.x + herdingDir.x * 5,
          z: context.enemyPos.z + herdingDir.z * 5
        };
        advice.reasoning.push('Herding player to danger zone');
      }
    }

    // Usar posiciones estratégicas del mapa
    if (this.mapAnalyzer && !advice.primaryAction) {
      const strategicPos = this.mapAnalyzer.getStrategicPositionsNear(context.playerPos, 15);

      if (strategicPos.length > 0) {
        // Elegir posición no ocupada por otros enemigos
        for (const pos of strategicPos) {
          let occupied = false;
          for (const enemy of allEnemyPositions) {
            if (getDistance(pos, enemy) < 2) {
              occupied = true;
              break;
            }
          }

          if (!occupied) {
            advice.secondaryAction = advice.secondaryAction || 'TAKE_STRATEGIC_POSITION';
            if (!advice.targetPosition) {
              advice.targetPosition = pos;
            }
            advice.reasoning.push('Moving to strategic position');
            break;
          }
        }
      }
    }

    // Establecer acción por defecto
    if (!advice.primaryAction) {
      advice.primaryAction = context.hasLineOfSight ? 'CHASE' : 'SEARCH';
    }

    // Calcular urgencia
    advice.urgency = this.calculateUrgency(context, trapAnalysis, pressure);

    this.lastAdvice = advice;
    this.adviceHistory.push({
      advice: { ...advice },
      time: Date.now(),
      context: { distance: context.distance, hasLOS: context.hasLineOfSight }
    });

    // Mantener historial limitado
    if (this.adviceHistory.length > 50) {
      this.adviceHistory.shift();
    }

    return advice;
  }

  /**
   * Calcula la urgencia de la situación
   */
  calculateUrgency(context, trapAnalysis, pressure) {
    let urgency = 0.5;

    // Distancia
    if (context.distance < 5) urgency += 0.3;
    else if (context.distance > 20) urgency -= 0.2;

    // Presión
    if (pressure?.level > 0.7) urgency += 0.2;

    // Trampa detectada
    if (trapAnalysis?.shouldBeCareful) urgency -= 0.1;

    // Power-up activo
    if (context.isPowerActive) urgency = 0.9; // Huir es urgente

    return Math.max(0, Math.min(1, urgency));
  }
}

// ============================================================================
// COORDINADOR DE ENEMIGOS ELITE
// ============================================================================

export class EnemyCoordinator {
  constructor() {
    this.enemies = new Map();
    this.formations = new Map();
    this.activeTactics = [];
    this.sharedMemory = {
      lastKnownPlayerPos: null,
      lastKnownPlayerDir: null,
      playerEscapeRoutes: [],
      currentThreatLevel: 0,
      huntingMode: false,
      ambushPoints: [],
      coverageMap: new Map()
    };
    this.formationUpdateTimer = 0;
    this.globalAggression = 0.5;
    this.coordinatedAttackActive = false;
  }

  registerEnemy(id, position, role, aiInstance) {
    this.enemies.set(id, {
      id,
      position,
      role,
      aiInstance,
      assignment: null,
      formationSlot: null,
      lastUpdate: Date.now(),
      isAlive: true,
      emotion: AIEmotions.CALM
    });

    this.recalculateFormations();
  }

  updateEnemy(id, position, state, emotion = null) {
    const enemy = this.enemies.get(id);
    if (enemy) {
      enemy.position = position;
      enemy.state = state;
      if (emotion) enemy.emotion = emotion;
      enemy.lastUpdate = Date.now();
    }
  }

  removeEnemy(id) {
    this.enemies.delete(id);
    this.recalculateFormations();
  }

  getNearbyEnemies(position, radius = AdvancedAIConfig.COORDINATION_RADIUS) {
    const nearby = [];

    for (const [id, enemy] of this.enemies.entries()) {
      if (!enemy.isAlive) continue;
      const dist = getDistance(position, enemy.position);
      if (dist < radius && dist > 0) {
        nearby.push({ ...enemy, distance: dist });
      }
    }

    return nearby.sort((a, b) => a.distance - b.distance);
  }

  getAllActiveEnemies() {
    return Array.from(this.enemies.values()).filter(e => e.isAlive);
  }

  broadcastAlert(senderPos, playerPos, urgency = 1) {
    const alertRadius = AdvancedAIConfig.TELEPATHY_RANGE * urgency;

    for (const [id, enemy] of this.enemies.entries()) {
      const dist = getDistance(senderPos, enemy.position);
      if (dist < alertRadius && enemy.aiInstance) {
        enemy.aiInstance.receiveAlert(playerPos, urgency);
      }
    }

    this.sharedMemory.lastKnownPlayerPos = { ...playerPos };
    this.sharedMemory.currentThreatLevel = Math.min(1, this.sharedMemory.currentThreatLevel + 0.2);
  }

  recalculateFormations() {
    const activeEnemies = this.getAllActiveEnemies();
    const count = activeEnemies.length;

    if (count < 2) {
      this.formations.clear();
      return;
    }

    // Determinar formación óptima basada en situación
    const formationType = this.determineOptimalFormation(count);
    this.createFormation(formationType, activeEnemies);
  }

  determineOptimalFormation(enemyCount) {
    const playerPos = this.sharedMemory.lastKnownPlayerPos;
    const threatLevel = this.sharedMemory.currentThreatLevel;

    if (!playerPos) return FormationTypes.SPREAD;

    if (enemyCount >= 4 && threatLevel < 0.3) {
      return FormationTypes.SURROUND;
    } else if (enemyCount >= 3 && threatLevel > 0.5) {
      return FormationTypes.PINCER;
    } else if (this.sharedMemory.huntingMode) {
      return FormationTypes.HUNTER_KILLER;
    } else if (enemyCount === 2) {
      return FormationTypes.PINCER;
    }

    return FormationTypes.WEDGE;
  }

  createFormation(type, enemies) {
    const playerPos = this.sharedMemory.lastKnownPlayerPos;
    if (!playerPos) return;

    const positions = [];
    const count = enemies.length;

    switch (type) {
      case FormationTypes.SURROUND:
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          positions.push({
            x: playerPos.x + Math.cos(angle) * AdvancedAIConfig.TACTICAL_POSITION_RADIUS,
            z: playerPos.z + Math.sin(angle) * AdvancedAIConfig.TACTICAL_POSITION_RADIUS,
            role: 'surround'
          });
        }
        break;

      case FormationTypes.PINCER:
        const pincerAngle = AdvancedAIConfig.PINCER_ANGLE;
        const playerDir = this.sharedMemory.lastKnownPlayerDir || { x: 0, z: 1 };
        const baseAngle = Math.atan2(playerDir.z, playerDir.x);

        for (let i = 0; i < count; i++) {
          const side = i % 2 === 0 ? 1 : -1;
          const distance = 8 + Math.floor(i / 2) * 3;
          const angle = baseAngle + Math.PI + side * pincerAngle;

          positions.push({
            x: playerPos.x + Math.cos(angle) * distance,
            z: playerPos.z + Math.sin(angle) * distance,
            role: 'flanker'
          });
        }
        break;

      case FormationTypes.HUNTER_KILLER:
        // Un perseguidor directo, el resto flanquea
        positions.push({
          x: playerPos.x,
          z: playerPos.z,
          role: 'hunter'
        });

        for (let i = 1; i < count; i++) {
          const angle = (Math.PI * 2 * i) / (count - 1);
          positions.push({
            x: playerPos.x + Math.cos(angle) * 12,
            z: playerPos.z + Math.sin(angle) * 12,
            role: 'killer'
          });
        }
        break;

      case FormationTypes.WEDGE:
        for (let i = 0; i < count; i++) {
          const row = Math.floor(i / 2);
          const col = i % 2 === 0 ? -1 : 1;

          positions.push({
            x: playerPos.x + col * (row + 1) * 3,
            z: playerPos.z + row * 4,
            role: 'wedge'
          });
        }
        break;

      default:
        // SPREAD
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
          const radius = 10 + Math.random() * 5;
          positions.push({
            x: playerPos.x + Math.cos(angle) * radius,
            z: playerPos.z + Math.sin(angle) * radius,
            role: 'spread'
          });
        }
    }

    // Asignar posiciones a enemigos de forma óptima (minimizar distancia total)
    this.assignFormationPositions(enemies, positions);
  }

  assignFormationPositions(enemies, positions) {
    const assignments = new Map();
    const availablePositions = [...positions];
    const sortedEnemies = [...enemies].sort((a, b) => {
      // Priorizar por rol
      const rolePriority = { [AIRoles.CHASER]: 0, [AIRoles.FLANKER]: 1, [AIRoles.CUTTER]: 2 };
      return (rolePriority[a.role] || 3) - (rolePriority[b.role] || 3);
    });

    for (const enemy of sortedEnemies) {
      if (availablePositions.length === 0) break;

      let bestPos = availablePositions[0];
      let bestDist = getDistance(enemy.position, bestPos);

      for (const pos of availablePositions) {
        const dist = getDistance(enemy.position, pos);
        if (dist < bestDist) {
          bestDist = dist;
          bestPos = pos;
        }
      }

      assignments.set(enemy.id, bestPos);
      availablePositions.splice(availablePositions.indexOf(bestPos), 1);
    }

    this.formations = assignments;
  }

  getFormationPosition(enemyId) {
    return this.formations.get(enemyId);
  }

  planCoordinatedAttack(playerPos, playerDir) {
    const enemies = this.getAllActiveEnemies();
    if (enemies.length < 2) return null;

    const plan = {
      type: 'coordinated_attack',
      timestamp: Date.now(),
      roles: new Map()
    };

    // Calcular posición de bloqueo
    const blockPos = {
      x: playerPos.x + playerDir.x * 10,
      z: playerPos.z + playerDir.z * 10
    };

    // Calcular posiciones de flanqueo
    const perpendicular = { x: -playerDir.z, z: playerDir.x };

    enemies.forEach((enemy, index) => {
      if (index === 0) {
        // Bloqueador
        plan.roles.set(enemy.id, {
          role: 'blocker',
          targetPos: blockPos,
          priority: 1
        });
      } else if (index % 2 === 1) {
        // Flanqueador izquierdo
        plan.roles.set(enemy.id, {
          role: 'left_flanker',
          targetPos: {
            x: playerPos.x + perpendicular.x * 6,
            z: playerPos.z + perpendicular.z * 6
          },
          priority: 2
        });
      } else {
        // Flanqueador derecho
        plan.roles.set(enemy.id, {
          role: 'right_flanker',
          targetPos: {
            x: playerPos.x - perpendicular.x * 6,
            z: playerPos.z - perpendicular.z * 6
          },
          priority: 2
        });
      }
    });

    this.coordinatedAttackActive = true;
    return plan;
  }

  updateSharedMemory(key, value) {
    this.sharedMemory[key] = value;

    if (key === 'lastKnownPlayerPos') {
      this.formationUpdateTimer = 0;
    }
  }

  getSharedMemory(key) {
    return this.sharedMemory[key];
  }

  update(delta, playerPos, playerDir) {
    this.formationUpdateTimer += delta;

    // Actualizar posición del jugador en memoria compartida
    if (playerPos) {
      this.sharedMemory.lastKnownPlayerPos = { ...playerPos };
      this.sharedMemory.lastKnownPlayerDir = { ...playerDir };
    }

    // Recalcular formaciones periódicamente
    if (this.formationUpdateTimer > AdvancedAIConfig.FORMATION_UPDATE_INTERVAL) {
      this.recalculateFormations();
      this.formationUpdateTimer = 0;
    }

    // Decaer nivel de amenaza
    this.sharedMemory.currentThreatLevel = Math.max(0,
      this.sharedMemory.currentThreatLevel - delta * 0.05);

    // Limpiar enemigos inactivos
    this.cleanupInactiveEnemies();
  }

  cleanupInactiveEnemies(maxAge = 5000) {
    const now = Date.now();
    for (const [id, enemy] of this.enemies.entries()) {
      if (now - enemy.lastUpdate > maxAge) {
        this.enemies.delete(id);
      }
    }
  }

  calculateCoverage(playerPos) {
    const coverage = { north: 0, south: 0, east: 0, west: 0 };

    for (const [, enemy] of this.enemies.entries()) {
      if (!enemy.isAlive) continue;

      const dx = enemy.position.x - playerPos.x;
      const dz = enemy.position.z - playerPos.z;

      if (Math.abs(dx) > Math.abs(dz)) {
        if (dx > 0) coverage.east++;
        else coverage.west++;
      } else {
        if (dz > 0) coverage.south++;
        else coverage.north++;
      }
    }

    return coverage;
  }

  getWeakestCoverageDirection(playerPos) {
    const coverage = this.calculateCoverage(playerPos);
    const min = Math.min(coverage.north, coverage.south, coverage.east, coverage.west);

    if (coverage.north === min) return { x: 0, z: -1 };
    if (coverage.south === min) return { x: 0, z: 1 };
    if (coverage.east === min) return { x: 1, z: 0 };
    return { x: -1, z: 0 };
  }
}

// ============================================================================
// SISTEMA DE UTILIDAD IA ELITE
// ============================================================================

export class UtilityAI {
  static evaluateActions(context) {
    const actions = [
      { name: 'CHASE_DIRECT', utility: this.utilityChase(context) },
      { name: 'CHASE_PREDICT', utility: this.utilityPredictiveChase(context) },
      { name: 'CHASE_NEURAL', utility: this.utilityNeuralChase(context) },
      { name: 'INTERCEPT', utility: this.utilityIntercept(context) },
      { name: 'AMBUSH', utility: this.utilityAmbush(context) },
      { name: 'PATROL', utility: this.utilityPatrol(context) },
      { name: 'COORDINATE', utility: this.utilityCoordinate(context) },
      { name: 'FORMATION', utility: this.utilityFormation(context) },
      { name: 'BLOCK_ESCAPE', utility: this.utilityBlockEscape(context) },
      { name: 'SEARCH', utility: this.utilitySearch(context) },
      { name: 'HUNT', utility: this.utilityHunt(context) },
      { name: 'FLEE', utility: this.utilityFlee(context) },
      { name: 'COUNTER_PATTERN', utility: this.utilityCounterPattern(context) },
      // Acciones ultra-avanzadas
      { name: 'TACTICAL_POSITION', utility: this.utilityTacticalPosition(context) },
      { name: 'HERD_PLAYER', utility: this.utilityHerdPlayer(context) },
      { name: 'PRESSURE_PLAYER', utility: this.utilityPressurePlayer(context) },
      { name: 'CAUTIOUS_APPROACH', utility: this.utilityCautiousApproach(context) },
      { name: 'BLOCK_PREDICTED_ESCAPE', utility: this.utilityBlockPredictedEscape(context) },
      { name: 'STRATEGIC_POSITION', utility: this.utilityStrategicPosition(context) }
    ];

    actions.sort((a, b) => b.utility - a.utility);

    // Exploración controlada basada en emociones
    const explorationChance = context.emotion === AIEmotions.FRUSTRATED ? 0.2 : 0.05;
    if (Math.random() < explorationChance && actions.length > 1) {
      const secondBest = actions[1];
      if (secondBest.utility > actions[0].utility * 0.7) {
        return secondBest.name;
      }
    }

    return actions[0].name;
  }

  static utilityChase(ctx) {
    if (!ctx.hasLineOfSight) return 0;
    if (ctx.isPowerActive) return 0;

    const distanceFactor = Math.max(0, 1 - ctx.distance / 25);
    const roleBonus = ctx.role === AIRoles.CHASER ? 0.4 : 0;
    const aggressionBonus = (ctx.emotion === AIEmotions.AGGRESSIVE ? 0.2 : 0);
    const confidenceBonus = (ctx.emotion === AIEmotions.CONFIDENT ? 0.15 : 0);

    return (0.5 * distanceFactor + roleBonus + aggressionBonus + confidenceBonus) * 100;
  }

  static utilityPredictiveChase(ctx) {
    if (!ctx.hasLineOfSight && !ctx.recentlySeenPlayer) return 0;
    if (ctx.isPowerActive) return 0;

    const prediction = ctx.playerMemory?.predictNextPosition(ctx.playerPos, ctx.playerDir);
    const confidence = prediction?.confidence || 0;
    const distanceFactor = Math.max(0, 1 - ctx.distance / 20);
    const roleBonus = [AIRoles.CUTTER, AIRoles.FLANKER].includes(ctx.role) ? 0.35 : 0;

    return (0.4 * confidence + 0.35 * distanceFactor + roleBonus) * 100;
  }

  static utilityNeuralChase(ctx) {
    if (!ctx.neuralPredictor) return 0;
    if (ctx.isPowerActive) return 0;

    const hasGoodHistory = ctx.playerMemory?.positionHistory?.length > 15;
    if (!hasGoodHistory) return 0;

    const predictionAccuracy = ctx.neuralPredictor.evaluateRecentPredictions();
    const distanceFactor = ctx.distance > 5 && ctx.distance < 20 ? 1 : 0.5;

    return (predictionAccuracy * 0.6 + distanceFactor * 0.4) * 100;
  }

  static utilityIntercept(ctx) {
    if (ctx.isPowerActive) return 0;
    if (!ctx.hasLineOfSight) return 0;

    const playerMoving = ctx.playerDir.x !== 0 || ctx.playerDir.z !== 0;
    if (!playerMoving) return 0;

    const isCutter = ctx.role === AIRoles.CUTTER || ctx.role === AIRoles.FLANKER;
    const goodAngle = ctx.distance > 6 && ctx.distance < 18;

    let utility = 0;
    if (isCutter) utility += 45;
    if (goodAngle) utility += 35;
    if (playerMoving) utility += 20;

    return utility;
  }

  static utilityAmbush(ctx) {
    if (ctx.isPowerActive) return 0;

    const isAmbusher = ctx.role === AIRoles.AMBUSHER;
    const playerMoving = ctx.playerDir.x !== 0 || ctx.playerDir.z !== 0;
    const goodPosition = ctx.distance > 12 && ctx.distance < 25;
    const playerPredictable = ctx.playerMemory?.behaviorProfile?.predictability > 0.6;

    let utility = 0;
    if (isAmbusher) utility += 45;
    if (playerMoving) utility += 25;
    if (goodPosition) utility += 20;
    if (playerPredictable) utility += 20;

    return utility;
  }

  static utilityPatrol(ctx) {
    const noThreat = ctx.distance > 25;
    const inZone = ctx.assignedZone && ctx.isInZone;
    const roleBonus = ctx.role === AIRoles.PATROL ? 0.5 : 0;
    const calmBonus = ctx.emotion === AIEmotions.CALM ? 0.2 : 0;

    if (!noThreat) return 15;

    return (0.3 + (inZone ? 0.3 : 0) + roleBonus + calmBonus) * 100;
  }

  static utilityCoordinate(ctx) {
    const nearbyCount = ctx.nearbyEnemies?.length || 0;
    if (nearbyCount < 1) return 0;

    const roleBonus = [AIRoles.SWARM, AIRoles.FLANKER].includes(ctx.role) ? 0.35 : 0;
    const distanceFactor = ctx.distance < 18 ? 0.4 : 0.2;
    const formationBonus = ctx.hasFormationPosition ? 0.3 : 0;

    return (nearbyCount * 0.12 + distanceFactor + roleBonus + formationBonus) * 100;
  }

  static utilityFormation(ctx) {
    if (!ctx.hasFormationPosition) return 0;
    if (ctx.isPowerActive) return 0;

    const formationDistance = ctx.formationPosition ?
      getDistance(ctx.enemyPos, ctx.formationPosition) : 999;

    const needsToMove = formationDistance > 2;
    const nearbyAllies = ctx.nearbyEnemies?.length || 0;

    let utility = 0;
    if (needsToMove) utility += 40;
    if (nearbyAllies >= 2) utility += 30;
    if (ctx.distance < 20) utility += 25;

    return utility;
  }

  static utilityBlockEscape(ctx) {
    if (ctx.isPowerActive) return 0;
    if (!ctx.playerMemory) return 0;

    const escapeRoutes = ctx.playerMemory.escapePatterns || [];
    const hasEscapePattern = escapeRoutes.length > 0;
    const isInPath = ctx.distance < 15;
    const isCutter = ctx.role === AIRoles.CUTTER;

    let utility = 0;
    if (hasEscapePattern) utility += 40;
    if (isInPath) utility += 30;
    if (isCutter) utility += 30;

    return utility;
  }

  static utilitySearch(ctx) {
    const lostPlayer = !ctx.hasLineOfSight && ctx.recentlySeenPlayer;
    const searchTime = ctx.timeSinceLastSeen || 0;

    if (!lostPlayer) return 0;
    if (searchTime > 8) return 0;

    const urgency = Math.max(0, 70 - searchTime * 8);
    const roleBonus = ctx.role === AIRoles.CHASER ? 15 : 0;

    return urgency + roleBonus;
  }

  static utilityHunt(ctx) {
    const lostPlayer = !ctx.hasLineOfSight && ctx.timeSinceLastSeen > 3;
    const hasMemory = ctx.playerMemory?.getFavoriteZones()?.length > 0;
    const huntingMode = ctx.coordinator?.sharedMemory?.huntingMode;

    if (!lostPlayer && !huntingMode) return 0;

    let utility = 0;
    if (huntingMode) utility += 50;
    if (hasMemory) utility += 30;
    if (ctx.role === AIRoles.PURSUER) utility += 20;

    return utility;
  }

  static utilityFlee(ctx) {
    if (!ctx.isPowerActive) return 0;

    const distanceFactor = Math.max(0, 1 - ctx.distance / 12);
    const fearBonus = ctx.emotion === AIEmotions.FEARFUL ? 0.3 : 0;

    return (distanceFactor + fearBonus) * 100;
  }

  static utilityCounterPattern(ctx) {
    if (ctx.isPowerActive) return 0;
    if (!ctx.playerMemory) return 0;

    const isEscaping = ctx.playerMemory.isInEscapePattern();
    const hasPredictablePattern = ctx.playerMemory.behaviorProfile?.predictability > 0.7;

    if (!isEscaping && !hasPredictablePattern) return 0;

    let utility = 0;
    if (isEscaping) utility += 45;
    if (hasPredictablePattern) utility += 35;
    if (ctx.emotion === AIEmotions.FRUSTRATED) utility += 20;

    return utility;
  }

  // ========================================================================
  // UTILIDADES ULTRA-AVANZADAS
  // ========================================================================

  static utilityTacticalPosition(ctx) {
    if (ctx.isPowerActive) return 0;
    if (!ctx.tacticalAdvice) return 0;

    const advice = ctx.tacticalAdvice;
    const hasTarget = !!advice.targetPosition;
    const highUrgency = advice.urgency > 0.6;

    let utility = 0;

    if (hasTarget) utility += 35;
    if (highUrgency) utility += 25;
    if (advice.primaryAction === 'AGGRESSIVE_CHASE') utility += 20;
    if (ctx.distance > 10 && ctx.distance < 20) utility += 15;

    // Bonus si el consejo tiene buena puntuación
    utility *= advice.speedModifier || 1.0;

    return utility;
  }

  static utilityHerdPlayer(ctx) {
    if (ctx.isPowerActive) return 0;
    if (!ctx.herdingSystem) return 0;

    const nearbyCount = ctx.nearbyEnemies?.length || 0;
    const goodPosition = ctx.distance > 5 && ctx.distance < 15;
    const hasMapAnalysis = ctx.mapAnalyzer?.deadEnds?.length > 0;

    // Necesita coordinación con otros enemigos
    if (nearbyCount < 1) return 0;

    let utility = 0;

    if (nearbyCount >= 2) utility += 40;
    if (goodPosition) utility += 30;
    if (hasMapAnalysis) utility += 20;
    if (ctx.playerMemory?.behaviorProfile?.caution > 0.6) utility += 15;

    return utility;
  }

  static utilityPressurePlayer(ctx) {
    if (ctx.isPowerActive) return 0;
    if (!ctx.pressureAnalysis) return 0;

    const pressure = ctx.pressureAnalysis;
    const isInOptimalRange = Math.abs(ctx.distance - pressure.optimalDistance) < 3;
    const buildingPressure = pressure.strategy === 'build_pressure';
    const maintainingPressure = pressure.strategy === 'maintain_pressure';

    let utility = 0;

    if (maintainingPressure && isInOptimalRange) utility += 45;
    if (buildingPressure && ctx.distance > pressure.optimalDistance) utility += 35;
    if (ctx.emotion === AIEmotions.CONFIDENT) utility += 15;
    if (ctx.nearbyEnemies?.length >= 1) utility += 20;

    // Escalar por nivel de presión
    utility *= (0.5 + pressure.level * 0.5);

    return utility;
  }

  static utilityCautiousApproach(ctx) {
    if (ctx.isPowerActive) return 0;

    const trapAnalysis = ctx.trapAnalysis;
    const shouldBeCareful = trapAnalysis?.shouldBeCareful;
    const hasTrap = trapAnalysis?.traps?.length > 0;

    if (!shouldBeCareful && !hasTrap) return 0;

    let utility = 0;

    if (hasTrap) utility += 60;
    if (shouldBeCareful) utility += 30;
    if (trapAnalysis?.alertLevel > 0.5) utility += 20;

    // Más útil si está cerca (donde las trampas son más peligrosas)
    if (ctx.distance < 10) utility += 15;

    return utility;
  }

  static utilityBlockPredictedEscape(ctx) {
    if (ctx.isPowerActive) return 0;
    if (!ctx.escapeRoutes || ctx.escapeRoutes.length === 0) return 0;

    const topRoute = ctx.escapeRoutes[0];
    const hasPrediction = topRoute && topRoute.probability > 0.4;
    const goodDistance = ctx.distance > 6 && ctx.distance < 20;

    // Más útil para cutters y flankers
    const isCutter = ctx.role === AIRoles.CUTTER || ctx.role === AIRoles.FLANKER;

    let utility = 0;

    if (hasPrediction) utility += topRoute.probability * 50;
    if (goodDistance) utility += 25;
    if (isCutter) utility += 25;
    if (ctx.playerMemory?.behaviorProfile?.predictability > 0.5) utility += 15;

    return utility;
  }

  static utilityStrategicPosition(ctx) {
    if (ctx.isPowerActive) return 0;
    if (!ctx.mapAnalyzer) return 0;

    const hasStrategicPositions = ctx.mapAnalyzer.strategicPositions?.length > 0;
    const notTooClose = ctx.distance > 8;
    const hasFormation = ctx.hasFormationPosition;

    if (!hasStrategicPositions) return 0;

    let utility = 0;

    if (notTooClose) utility += 25;
    if (!hasFormation) utility += 20; // Más útil si no tiene formación asignada
    if (ctx.nearbyEnemies?.length >= 2) utility += 20;
    if (ctx.alertLevel < 0.3) utility += 15; // Buen momento para posicionarse

    // Bonus para roles de emboscada
    if (ctx.role === AIRoles.AMBUSHER) utility += 25;

    return utility;
  }
}

// ============================================================================
// SISTEMA DE PERSONALIDAD Y EMOCIONES
// ============================================================================

export class PersonalitySystem {
  constructor() {
    this.traits = {
      aggression: 0.5 + (Math.random() - 0.5) * 0.4,
      persistence: 0.5 + (Math.random() - 0.5) * 0.4,
      caution: 0.5 + (Math.random() - 0.5) * 0.4,
      teamwork: 0.5 + (Math.random() - 0.5) * 0.4,
      patience: 0.5 + (Math.random() - 0.5) * 0.4
    };

    this.currentEmotion = AIEmotions.CALM;
    this.emotionIntensity = 0;
    this.frustrationLevel = 0;
    this.confidenceLevel = 0.5;
    this.recentSuccesses = 0;
    this.recentFailures = 0;
  }

  update(context, delta) {
    this.updateFrustration(context, delta);
    this.updateConfidence(context, delta);
    this.determineEmotion(context);
  }

  updateFrustration(context, delta) {
    // Aumentar frustración si el jugador escapa repetidamente
    if (context.playerEscaped) {
      this.frustrationLevel = Math.min(1, this.frustrationLevel + 0.15);
      this.recentFailures++;
    }

    // Disminuir frustración con el tiempo
    this.frustrationLevel = Math.max(0, this.frustrationLevel - delta * AdvancedAIConfig.AGGRESSION_DECAY);
  }

  updateConfidence(context, delta) {
    // Aumentar confianza si está cerca del jugador
    if (context.distance < 10 && context.hasLineOfSight) {
      this.confidenceLevel = Math.min(1, this.confidenceLevel + delta * AdvancedAIConfig.CONFIDENCE_BOOST);
    }

    // Disminuir confianza si pierde al jugador
    if (!context.hasLineOfSight && context.recentlySeenPlayer) {
      this.confidenceLevel = Math.max(0, this.confidenceLevel - delta * 0.05);
    }

    // Confianza por éxitos recientes
    if (this.recentSuccesses > this.recentFailures) {
      this.confidenceLevel = Math.min(1, this.confidenceLevel + 0.05);
    }
  }

  determineEmotion(context) {
    // Prioridad de emociones
    if (context.isPowerActive && context.distance < 10) {
      this.currentEmotion = AIEmotions.FEARFUL;
      this.emotionIntensity = Math.min(1, 1 - context.distance / 10);
      return;
    }

    if (this.frustrationLevel > 0.7) {
      this.currentEmotion = AIEmotions.FRUSTRATED;
      this.emotionIntensity = this.frustrationLevel;
      return;
    }

    if (this.frustrationLevel > 0.5 && this.traits.aggression > 0.6) {
      this.currentEmotion = AIEmotions.VENGEFUL;
      this.emotionIntensity = this.frustrationLevel * this.traits.aggression;
      return;
    }

    if (this.confidenceLevel > 0.7 && context.distance < 15) {
      this.currentEmotion = AIEmotions.CONFIDENT;
      this.emotionIntensity = this.confidenceLevel;
      return;
    }

    if (context.hasLineOfSight && context.distance < 20) {
      this.currentEmotion = AIEmotions.AGGRESSIVE;
      this.emotionIntensity = this.traits.aggression;
      return;
    }

    if (context.hasLineOfSight || context.recentlySeenPlayer) {
      this.currentEmotion = AIEmotions.ALERT;
      this.emotionIntensity = 0.5;
      return;
    }

    this.currentEmotion = AIEmotions.CALM;
    this.emotionIntensity = 0.3;
  }

  getSpeedModifier() {
    switch (this.currentEmotion) {
      case AIEmotions.AGGRESSIVE:
        return 1.0 + this.traits.aggression * 0.2;
      case AIEmotions.CONFIDENT:
        return 1.05 + this.confidenceLevel * 0.1;
      case AIEmotions.FRUSTRATED:
        return 1.1 + this.frustrationLevel * 0.15;
      case AIEmotions.VENGEFUL:
        return 1.15 + this.frustrationLevel * 0.2;
      case AIEmotions.FEARFUL:
        return 1.3;
      default:
        return 1.0;
    }
  }

  getDetectionModifier() {
    switch (this.currentEmotion) {
      case AIEmotions.ALERT:
        return 1.2;
      case AIEmotions.AGGRESSIVE:
        return 1.15;
      case AIEmotions.VENGEFUL:
        return 1.3;
      case AIEmotions.FRUSTRATED:
        return 1.1;
      default:
        return 1.0;
    }
  }

  recordSuccess() {
    this.recentSuccesses++;
    this.confidenceLevel = Math.min(1, this.confidenceLevel + 0.1);
    this.frustrationLevel = Math.max(0, this.frustrationLevel - 0.2);
  }

  recordFailure() {
    this.recentFailures++;
    this.frustrationLevel = Math.min(1, this.frustrationLevel + AdvancedAIConfig.FRUSTRATION_BUILDUP);
  }
}

// ============================================================================
// SISTEMA DE DIFICULTAD DINÁMICA
// ============================================================================

export class DifficultyManager {
  constructor() {
    this.currentDifficulty = 1.0;
    this.playerPerformance = {
      escapeStreak: 0,
      deathStreak: 0,
      averageEscapeTime: 5,
      collectiblesPerLife: 0
    };
  }

  update(playerStats) {
    const targetDifficulty = this.calculateTargetDifficulty(playerStats);

    // Ajustar gradualmente hacia el objetivo
    const diff = targetDifficulty - this.currentDifficulty;
    this.currentDifficulty += diff * AdvancedAIConfig.DIFFICULTY_ADAPTATION_RATE;

    // Mantener dentro de límites
    this.currentDifficulty = Math.max(
      AdvancedAIConfig.MIN_DIFFICULTY,
      Math.min(AdvancedAIConfig.MAX_DIFFICULTY, this.currentDifficulty)
    );
  }

  calculateTargetDifficulty(stats) {
    let target = 1.0;

    // Si el jugador escapa mucho, aumentar dificultad
    if (stats.escapeStreak > 5) {
      target += 0.3;
    } else if (stats.escapeStreak > 3) {
      target += 0.15;
    }

    // Si el jugador muere mucho, reducir dificultad
    if (stats.deathStreak > 3) {
      target -= 0.25;
    } else if (stats.deathStreak > 2) {
      target -= 0.1;
    }

    // Ajustar por rendimiento general
    if (stats.averageEscapeTime < 3) {
      target += 0.2;
    } else if (stats.averageEscapeTime > 8) {
      target -= 0.15;
    }

    return target;
  }

  getSpeedMultiplier() {
    return 0.85 + this.currentDifficulty * 0.25;
  }

  getDetectionMultiplier() {
    return 0.9 + this.currentDifficulty * 0.2;
  }

  getPredictionAccuracy() {
    return 0.5 + this.currentDifficulty * 0.3;
  }

  getCoordinationLevel() {
    return Math.min(1, this.currentDifficulty * 0.8);
  }
}

// ============================================================================
// CONTROLADOR PRINCIPAL DE IA ELITE
// ============================================================================

export class AdvancedEnemyAI {
  constructor(enemyId, role, walls, checkCollision) {
    this.enemyId = enemyId;
    this.role = role;
    this.walls = walls;
    this.checkCollision = checkCollision;

    // Sistemas principales
    this.pathfinder = new AStarPathfinder(walls, checkCollision);
    this.neuralPredictor = new NeuralPredictor();
    this.personality = new PersonalitySystem();
    this.playerMemory = new PlayerMemory();

    // Sistemas anti-atasco
    this.stuckDetector = new StuckDetector(checkCollision, walls);
    this.navigator = new SmartNavigator(checkCollision, walls);

    // Sistemas ultra-avanzados
    this.mapAnalyzer = new MapAnalyzer(walls, checkCollision);
    this.escapePredictor = null; // Se inicializa después del análisis de mapa
    this.mindGames = new MindGameSystem();
    this.pressureManager = new PressureManager();
    this.herdingSystem = null; // Se inicializa después del análisis de mapa
    this.trapDetector = new TrapDetector();
    this.tacticalAdvisor = null; // Se inicializa cuando todos los sistemas están listos

    // Estado
    this.state = AIStates.IDLE;
    this.lastAction = null;
    this.currentGoal = null;
    this.currentPath = null;
    this.pathRecalcTimer = 0;

    // Percepción
    this.lastSeenPlayerPos = null;
    this.timeSinceLastSeen = 999;
    this.alertLevel = 0;

    // Coordinación
    this.coordinator = null;
    this.formationPosition = null;
    this.receivedAlerts = [];

    // Tácticas
    this.currentTactic = null;
    this.tacticTimer = 0;
    this.ambushPosition = null;

    // Aprendizaje
    this.successfulActions = new Map();
    this.failedActions = new Map();

    // NUEVO: Estado de navegación
    this.lastPosition = null;
    this.lastValidDirection = { x: 1, z: 0 };
    this.forceNewPath = false;
    this.unstuckCooldown = 0;

    // Control de inicialización ultra-avanzada
    this.ultraSystemsInitialized = false;
    this.mapAnalysisTimer = 0;
    this.lastMapAnalysisTime = 0;
  }

  /**
   * Inicializa sistemas que dependen del análisis del mapa
   */
  initializeUltraSystems() {
    if (this.ultraSystemsInitialized) return;

    // Realizar análisis del mapa
    this.mapAnalyzer.analyze();

    // Inicializar sistemas que dependen del análisis
    this.escapePredictor = new EscapeRoutePredictor(
      this.mapAnalyzer,
      this.checkCollision,
      this.walls
    );

    this.herdingSystem = new HerdingSystem(this.mapAnalyzer);

    this.tacticalAdvisor = new TacticalAdvisor(
      this.mapAnalyzer,
      this.escapePredictor,
      this.pressureManager,
      this.herdingSystem,
      this.trapDetector
    );

    this.ultraSystemsInitialized = true;
  }

  setCoordinator(coordinator) {
    this.coordinator = coordinator;
    if (coordinator) {
      coordinator.registerEnemy(this.enemyId, { x: 0, z: 0 }, this.role, this);
    }
  }

  receiveAlert(playerPos, urgency) {
    this.receivedAlerts.push({
      pos: { ...playerPos },
      urgency,
      time: Date.now()
    });

    if (urgency > 0.7) {
      this.alertLevel = Math.min(1, this.alertLevel + 0.3);
      this.lastSeenPlayerPos = { ...playerPos };
      this.timeSinceLastSeen = 2;
    }
  }

  update(context, delta) {
    // Inicializar sistemas ultra-avanzados si no están listos
    if (!this.ultraSystemsInitialized) {
      this.mapAnalysisTimer += delta;
      if (this.mapAnalysisTimer > 0.5) {
        this.initializeUltraSystems();
      }
    }

    // Actualizar sistemas
    this.personality.update(context, delta);

    // Actualizar mind games
    const mindGameStatus = this.mindGames.update(delta);

    // Actualizar memoria del jugador
    const nearbyEnemies = this.coordinator?.getNearbyEnemies(context.enemyPos)?.length || 0;
    this.playerMemory.addPosition(
      context.playerPos,
      context.playerDir,
      context.playerDir.x !== 0 || context.playerDir.z !== 0,
      nearbyEnemies
    );

    // Verificar percepción
    const hasLineOfSight = VisionSystem.hasLineOfSight(
      context.enemyPos,
      context.enemyDir,
      context.playerPos,
      this.walls,
      this.checkCollision
    );

    const canHear = VisionSystem.canHearPlayer(
      context.enemyPos,
      context.playerPos,
      context.playerDir,
      context.playerDir.x !== 0 || context.playerDir.z !== 0
    );

    // Actualizar tiempo desde última vez visto
    if (hasLineOfSight) {
      this.lastSeenPlayerPos = { ...context.playerPos };
      this.timeSinceLastSeen = 0;
      this.alertLevel = Math.min(1, this.alertLevel + 0.2);

      // Alertar a aliados
      if (this.coordinator && this.alertLevel > 0.5) {
        this.coordinator.broadcastAlert(context.enemyPos, context.playerPos, this.alertLevel);
      }
    } else {
      this.timeSinceLastSeen += delta;
      this.alertLevel = Math.max(0, this.alertLevel - delta * 0.1);
    }

    // Procesar alertas recibidas
    this.processAlerts();

    // Obtener posición de formación
    if (this.coordinator) {
      this.formationPosition = this.coordinator.getFormationPosition(this.enemyId);
      this.coordinator.updateEnemy(
        this.enemyId,
        context.enemyPos,
        this.state,
        this.personality.currentEmotion
      );
    }

    // Obtener todas las posiciones de enemigos para sistemas coordinados
    const allEnemyPositions = this.coordinator?.getAllActiveEnemies()?.map(e => e.position) || [];

    // Análisis de trampas del jugador
    const trapAnalysis = this.trapDetector?.analyzeTrap(
      context.playerPos,
      context.playerDir,
      this.playerMemory.positionHistory,
      allEnemyPositions
    );

    // Calcular presión óptima
    const pressureAnalysis = this.pressureManager?.calculatePressure(
      {
        distance: getDistance(context.enemyPos, context.playerPos),
        playerMemory: this.playerMemory,
        isPowerActive: context.isPowerActive
      },
      this.coordinator?.getNearbyEnemies(context.enemyPos)
    );

    // Obtener consejo táctico si el sistema está inicializado
    const tacticalAdvice = this.tacticalAdvisor?.getAdvice(
      {
        enemyPos: context.enemyPos,
        playerPos: context.playerPos,
        playerDir: context.playerDir,
        playerMemory: this.playerMemory,
        distance: getDistance(context.enemyPos, context.playerPos),
        hasLineOfSight,
        isPowerActive: context.isPowerActive,
        nearbyEnemies: this.coordinator?.getNearbyEnemies(context.enemyPos)
      },
      this.enemyId,
      allEnemyPositions
    );

    // Predecir rutas de escape del jugador
    const escapeRoutes = this.escapePredictor?.predictEscapeRoutes(
      context.playerPos,
      context.playerDir,
      allEnemyPositions
    );

    // Verificar si debemos hacer mind games
    const mindGameContext = {
      distance: getDistance(context.enemyPos, context.playerPos),
      playerDir: context.playerDir,
      hasLineOfSight
    };

    let mindGameActive = mindGameStatus?.active;
    if (!mindGameActive && hasLineOfSight && this.mindGames.shouldFeint(mindGameContext)) {
      this.mindGames.startFeint(context.enemyPos, context.playerPos, context.playerDir);
      mindGameActive = true;
    }

    // Preparar contexto para decisiones
    const decisionContext = {
      ...context,
      hasLineOfSight,
      canHear,
      recentlySeenPlayer: this.timeSinceLastSeen < 5,
      timeSinceLastSeen: this.timeSinceLastSeen,
      playerMemory: this.playerMemory,
      neuralPredictor: this.neuralPredictor,
      nearbyEnemies: this.coordinator?.getNearbyEnemies(context.enemyPos),
      distance: getDistance(context.enemyPos, context.playerPos),
      role: this.role,
      assignedZone: context.assignedZone,
      isInZone: context.assignedZone && this.isInZone(context.enemyPos, context.assignedZone),
      emotion: this.personality.currentEmotion,
      hasFormationPosition: !!this.formationPosition,
      formationPosition: this.formationPosition,
      coordinator: this.coordinator,
      alertLevel: this.alertLevel,
      // Nuevos campos ultra-avanzados
      trapAnalysis,
      pressureAnalysis,
      tacticalAdvice,
      escapeRoutes,
      mindGameActive,
      mindGameDirection: this.mindGames.getFeintDirection(),
      mapAnalyzer: this.mapAnalyzer,
      herdingSystem: this.herdingSystem,
      allEnemyPositions
    };

    // Si hay mind game activo, usar la dirección de finta
    if (mindGameActive && this.mindGames.getFeintDirection()) {
      return this.executeMindGame(context, delta);
    }

    // Toma de decisiones
    const bestAction = UtilityAI.evaluateActions(decisionContext);

    // Ejecutar acción
    const result = this.executeAction(bestAction, decisionContext, delta);

    // Aplicar modificadores de personalidad
    if (result.speedMultiplier === undefined) {
      result.speedMultiplier = 1.0;
    }
    result.speedMultiplier *= this.personality.getSpeedModifier();

    return result;
  }

  processAlerts() {
    const now = Date.now();
    // Limpiar alertas antiguas
    this.receivedAlerts = this.receivedAlerts.filter(alert => now - alert.time < 5000);
  }

  executeAction(action, context, delta) {
    this.lastAction = action;

    switch (action) {
      case 'CHASE_DIRECT':
        return this.actionChaseDirect(context, delta);

      case 'CHASE_PREDICT':
        return this.actionChasePredictive(context, delta);

      case 'CHASE_NEURAL':
        return this.actionChaseNeural(context, delta);

      case 'INTERCEPT':
        return this.actionIntercept(context, delta);

      case 'AMBUSH':
        return this.actionAmbush(context, delta);

      case 'PATROL':
        return this.actionPatrol(context, delta);

      case 'COORDINATE':
        return this.actionCoordinate(context, delta);

      case 'FORMATION':
        return this.actionFormation(context, delta);

      case 'BLOCK_ESCAPE':
        return this.actionBlockEscape(context, delta);

      case 'SEARCH':
        return this.actionSearch(context, delta);

      case 'HUNT':
        return this.actionHunt(context, delta);

      case 'FLEE':
        return this.actionFlee(context, delta);

      case 'COUNTER_PATTERN':
        return this.actionCounterPattern(context, delta);

      case 'TACTICAL_POSITION':
        return this.actionTacticalPosition(context, delta);

      case 'HERD_PLAYER':
        return this.actionHerdPlayer(context, delta);

      case 'PRESSURE_PLAYER':
        return this.actionPressurePlayer(context, delta);

      case 'CAUTIOUS_APPROACH':
        return this.actionCautiousApproach(context, delta);

      case 'BLOCK_PREDICTED_ESCAPE':
        return this.actionBlockPredictedEscape(context, delta);

      case 'STRATEGIC_POSITION':
        return this.actionStrategicPosition(context, delta);

      default:
        return this.actionPatrol(context, delta);
    }
  }

  /**
   * Ejecuta un mind game (finta)
   */
  executeMindGame(context, delta) {
    const feintDir = this.mindGames.getFeintDirection();

    if (!feintDir || (feintDir.x === 0 && feintDir.z === 0)) {
      // Hesitation - quedarse quieto
      return {
        direction: context.enemyDir,
        shouldMove: false,
        speedMultiplier: 0,
        state: 'MIND_GAME_HESITATION',
        emotion: this.personality.currentEmotion,
        debugInfo: {
          action: 'MIND_GAME',
          feintType: 'hesitation'
        }
      };
    }

    // Moverse en la dirección de la finta
    const feintTarget = {
      x: context.enemyPos.x + feintDir.x * 3,
      z: context.enemyPos.z + feintDir.z * 3
    };

    return this.moveTowardsTarget(
      context.enemyPos,
      feintTarget,
      context,
      delta,
      false,
      0.7 // Más lento durante finta para que sea creíble
    );
  }

  /**
   * Acción: Posicionarse tácticamente según el consejo del TacticalAdvisor
   */
  actionTacticalPosition(context, delta) {
    const advice = context.tacticalAdvice;

    if (!advice || !advice.targetPosition) {
      return this.actionChasePredictive(context, delta);
    }

    const speedMod = advice.speedModifier || 1.0;

    return this.moveTowardsTarget(
      context.enemyPos,
      advice.targetPosition,
      context,
      delta,
      true,
      speedMod
    );
  }

  /**
   * Acción: Pastorear al jugador hacia una zona peligrosa
   */
  actionHerdPlayer(context, delta) {
    if (!this.herdingSystem) {
      return this.actionChaseDirect(context, delta);
    }

    const herdingDir = this.herdingSystem.calculateHerdingDirection(
      context.enemyPos,
      context.playerPos,
      context.playerDir,
      context.allEnemyPositions
    );

    if (!herdingDir) {
      return this.actionChaseDirect(context, delta);
    }

    const herdingTarget = {
      x: context.enemyPos.x + herdingDir.x * 6,
      z: context.enemyPos.z + herdingDir.z * 6
    };

    return this.moveTowardsTarget(
      context.enemyPos,
      herdingTarget,
      context,
      delta,
      true,
      1.0
    );
  }

  /**
   * Acción: Mantener presión óptima sobre el jugador
   */
  actionPressurePlayer(context, delta) {
    const pressure = context.pressureAnalysis;

    if (!pressure) {
      return this.actionChaseDirect(context, delta);
    }

    const pressureDir = this.pressureManager.getPressureDirection(
      context.enemyPos,
      context.playerPos,
      pressure.optimalDistance
    );

    const pressureTarget = {
      x: context.enemyPos.x + pressureDir.x * 4,
      z: context.enemyPos.z + pressureDir.z * 4
    };

    return this.moveTowardsTarget(
      context.enemyPos,
      pressureTarget,
      context,
      delta,
      false,
      0.9 // Ligeramente más lento para mantener presión
    );
  }

  /**
   * Acción: Aproximarse con cautela (cuando se detecta trampa)
   */
  actionCautiousApproach(context, delta) {
    const trapAnalysis = context.trapAnalysis;

    // Determinar acción evasiva según tipo de trampa
    if (trapAnalysis?.traps?.length > 0) {
      const trap = trapAnalysis.traps[0];
      const evasiveAction = this.trapDetector.getEvasiveAction(
        trap.type,
        context.enemyPos,
        context.playerPos
      );

      if (evasiveAction.action === 'maintain_distance') {
        // Mantener distancia mientras orbita
        const toPlayer = normalizeDirection({
          x: context.playerPos.x - context.enemyPos.x,
          z: context.playerPos.z - context.enemyPos.z
        });

        // Dirección perpendicular para orbitar
        const orbitDir = {
          x: -toPlayer.z,
          z: toPlayer.x
        };

        const orbitTarget = {
          x: context.enemyPos.x + orbitDir.x * 5,
          z: context.enemyPos.z + orbitDir.z * 5
        };

        return this.moveTowardsTarget(
          context.enemyPos,
          orbitTarget,
          context,
          delta,
          false,
          0.75
        );
      }

      if (evasiveAction.action === 'regroup') {
        // Reagruparse con aliados
        return this.actionCoordinate(context, delta);
      }
    }

    // Aproximación cautelosa por defecto
    const cautionFactor = 0.6;
    const cautiousTarget = {
      x: context.enemyPos.x + (context.playerPos.x - context.enemyPos.x) * cautionFactor,
      z: context.enemyPos.z + (context.playerPos.z - context.enemyPos.z) * cautionFactor
    };

    return this.moveTowardsTarget(
      context.enemyPos,
      cautiousTarget,
      context,
      delta,
      true,
      0.8
    );
  }

  /**
   * Acción: Bloquear la ruta de escape predicha
   */
  actionBlockPredictedEscape(context, delta) {
    const escapeRoutes = context.escapeRoutes;

    if (!escapeRoutes || escapeRoutes.length === 0) {
      return this.actionBlockEscape(context, delta);
    }

    // Obtener el mejor punto de bloqueo
    const blockingPoint = this.escapePredictor?.getBestBlockingPoint(
      context.playerPos,
      escapeRoutes
    );

    if (blockingPoint) {
      return this.moveTowardsTarget(
        context.enemyPos,
        blockingPoint,
        context,
        delta,
        true,
        1.15 // Más rápido para llegar antes
      );
    }

    return this.actionIntercept(context, delta);
  }

  /**
   * Acción: Tomar posición estratégica del mapa
   */
  actionStrategicPosition(context, delta) {
    if (!this.mapAnalyzer || !this.mapAnalyzer.strategicPositions) {
      return this.actionPatrol(context, delta);
    }

    const strategicPos = this.mapAnalyzer.getStrategicPositionsNear(
      context.playerPos,
      15
    );

    if (strategicPos.length > 0) {
      // Elegir posición no ocupada
      for (const pos of strategicPos) {
        let occupied = false;
        for (const enemy of context.allEnemyPositions || []) {
          if (getDistance(pos, enemy) < 2) {
            occupied = true;
            break;
          }
        }

        if (!occupied) {
          return this.moveTowardsTarget(
            context.enemyPos,
            pos,
            context,
            delta,
            true,
            1.0
          );
        }
      }
    }

    return this.actionCoordinate(context, delta);
  }

  actionChaseDirect(context, delta) {
    return this.moveTowardsTarget(
      context.enemyPos,
      context.playerPos,
      context,
      delta
    );
  }

  actionChasePredictive(context, delta) {
    const prediction = this.playerMemory.predictNextPosition(
      context.playerPos,
      context.playerDir,
      10
    );

    return this.moveTowardsTarget(
      context.enemyPos,
      prediction,
      context,
      delta
    );
  }

  actionChaseNeural(context, delta) {
    const prediction = this.neuralPredictor.predict(
      this.playerMemory.positionHistory,
      context.playerPos,
      context.playerDir,
      12
    );

    return this.moveTowardsTarget(
      context.enemyPos,
      prediction,
      context,
      delta,
      true
    );
  }

  actionIntercept(context, delta) {
    // Calcular punto de intercepción óptimo
    const playerSpeed = Math.sqrt(context.playerDir.x ** 2 + context.playerDir.z ** 2);
    const myDistance = context.distance;

    // Estimar tiempo de llegada
    const interceptTime = myDistance / 3;
    const interceptDistance = playerSpeed * interceptTime * 0.7;

    const interceptPoint = {
      x: context.playerPos.x + context.playerDir.x * interceptDistance,
      z: context.playerPos.z + context.playerDir.z * interceptDistance
    };

    return this.moveTowardsTarget(
      context.enemyPos,
      interceptPoint,
      context,
      delta,
      true,
      1.1
    );
  }

  actionAmbush(context, delta) {
    // Calcular posición de emboscada adelante del jugador
    const ambushDistance = 12;
    const ambushPos = {
      x: context.playerPos.x + context.playerDir.x * ambushDistance,
      z: context.playerPos.z + context.playerDir.z * ambushDistance
    };

    // Si ya está en posición, esperar
    const distToAmbush = getDistance(context.enemyPos, ambushPos);
    if (distToAmbush < 2) {
      return {
        direction: context.enemyDir,
        shouldMove: false,
        state: 'AMBUSH_WAIT'
      };
    }

    return this.moveTowardsTarget(
      context.enemyPos,
      ambushPos,
      context,
      delta,
      true
    );
  }

  actionPatrol(context, delta) {
    if (!context.assignedZone) {
      // Patrulla aleatoria
      if (!this.currentGoal || getDistance(context.enemyPos, this.currentGoal) < 2) {
        this.currentGoal = {
          x: context.enemyPos.x + (Math.random() - 0.5) * 10,
          z: context.enemyPos.z + (Math.random() - 0.5) * 10
        };
      }
      return this.moveTowardsTarget(context.enemyPos, this.currentGoal, context, delta);
    }

    const target = {
      x: context.assignedZone.centerX + (Math.random() - 0.5) * 5,
      z: context.assignedZone.centerZ + (Math.random() - 0.5) * 5
    };

    return this.moveTowardsTarget(context.enemyPos, target, context, delta);
  }

  actionCoordinate(context, delta) {
    const nearbyEnemies = context.nearbyEnemies || [];

    if (nearbyEnemies.length > 0 && this.coordinator) {
      const surroundPositions = this.coordinator.calculateCoverage(context.playerPos);
      const weakDir = this.coordinator.getWeakestCoverageDirection(context.playerPos);

      // Moverse para cubrir el punto débil
      const targetPos = {
        x: context.playerPos.x + weakDir.x * 8,
        z: context.playerPos.z + weakDir.z * 8
      };

      return this.moveTowardsTarget(
        context.enemyPos,
        targetPos,
        context,
        delta,
        true
      );
    }

    return this.actionChaseDirect(context, delta);
  }

  actionFormation(context, delta) {
    if (!this.formationPosition) {
      return this.actionCoordinate(context, delta);
    }

    return this.moveTowardsTarget(
      context.enemyPos,
      this.formationPosition,
      context,
      delta,
      true
    );
  }

  actionBlockEscape(context, delta) {
    // Analizar rutas de escape del jugador
    const favoriteZones = this.playerMemory.getFavoriteZones();

    if (favoriteZones.length > 0) {
      // Bloquear camino a zona favorita
      const targetZone = favoriteZones[0];
      const blockPoint = {
        x: (context.playerPos.x + targetZone.centerX) / 2,
        z: (context.playerPos.z + targetZone.centerZ) / 2
      };

      return this.moveTowardsTarget(
        context.enemyPos,
        blockPoint,
        context,
        delta,
        true
      );
    }

    // Bloquear dirección de movimiento
    const blockPoint = {
      x: context.playerPos.x + context.playerDir.x * 8,
      z: context.playerPos.z + context.playerDir.z * 8
    };

    return this.moveTowardsTarget(
      context.enemyPos,
      blockPoint,
      context,
      delta,
      true
    );
  }

  actionSearch(context, delta) {
    const lastSeen = this.lastSeenPlayerPos || context.playerPos;

    // Búsqueda en espiral
    const searchAngle = (Date.now() / 1000) % (Math.PI * 2);
    const searchRadius = 3 + (this.timeSinceLastSeen * 0.5);

    const searchTarget = {
      x: lastSeen.x + Math.cos(searchAngle) * searchRadius,
      z: lastSeen.z + Math.sin(searchAngle) * searchRadius
    };

    return this.moveTowardsTarget(
      context.enemyPos,
      searchTarget,
      context,
      delta
    );
  }

  actionHunt(context, delta) {
    // Ir a zonas favoritas del jugador
    const favoriteZones = this.playerMemory.getFavoriteZones();

    if (favoriteZones.length > 0) {
      // Elegir zona aleatoria ponderada por frecuencia
      const totalFreq = favoriteZones.reduce((sum, z) => sum + z.frequency, 0);
      let random = Math.random() * totalFreq;

      for (const zone of favoriteZones) {
        random -= zone.frequency;
        if (random <= 0) {
          return this.moveTowardsTarget(
            context.enemyPos,
            { x: zone.centerX, z: zone.centerZ },
            context,
            delta,
            true
          );
        }
      }
    }

    // Sin información, patrullar
    return this.actionPatrol(context, delta);
  }

  actionFlee(context, delta) {
    const awayDir = {
      x: context.enemyPos.x - context.playerPos.x,
      z: context.enemyPos.z - context.playerPos.z
    };

    const normalized = normalizeDirection(awayDir);
    const fleeTarget = {
      x: context.enemyPos.x + normalized.x * 15,
      z: context.enemyPos.z + normalized.z * 15
    };

    return this.moveTowardsTarget(
      context.enemyPos,
      fleeTarget,
      context,
      delta,
      false,
      1.5
    );
  }

  actionCounterPattern(context, delta) {
    const escapePatterns = this.playerMemory.escapePatterns;

    if (escapePatterns.length > 0) {
      // Predecir siguiente movimiento de escape y adelantarse
      const topPattern = escapePatterns[0];
      const nextInPattern = topPattern.sequence[0];

      const counterPoint = {
        x: context.playerPos.x + nextInPattern.dir.x * 6,
        z: context.playerPos.z + nextInPattern.dir.z * 6
      };

      return this.moveTowardsTarget(
        context.enemyPos,
        counterPoint,
        context,
        delta,
        true,
        1.15
      );
    }

    // Si el jugador hace zigzag, predecir el siguiente giro
    if (this.playerMemory.isInEscapePattern()) {
      const perpendicular = {
        x: -context.playerDir.z,
        z: context.playerDir.x
      };

      // Cubrir ambos lados
      const side = Math.random() > 0.5 ? 1 : -1;
      const counterPoint = {
        x: context.playerPos.x + perpendicular.x * side * 4,
        z: context.playerPos.z + perpendicular.z * side * 4
      };

      return this.moveTowardsTarget(
        context.enemyPos,
        counterPoint,
        context,
        delta,
        false,
        1.1
      );
    }

    return this.actionChasePredictive(context, delta);
  }

  moveTowardsTarget(from, to, context, delta, usePathfinding = false, speedMultiplier = 1.0) {
    this.pathRecalcTimer += delta;
    this.unstuckCooldown = Math.max(0, this.unstuckCooldown - delta);

    // NUEVO: Actualizar detector de atasco
    const stuckStatus = this.stuckDetector.update(from, delta);

    // Si está atascado, tomar medidas correctivas
    if (stuckStatus.isStuck && stuckStatus.suggestion) {
      // Forzar recálculo de ruta
      this.forceNewPath = true;
      this.currentPath = null;

      // Si el atasco es severo, usar la sugerencia del detector
      if (stuckStatus.severity > 0.5 && this.unstuckCooldown <= 0) {
        this.unstuckCooldown = 0.3; // Cooldown para no cambiar muy rápido

        const suggestion = stuckStatus.suggestion;
        const unstuckDir = suggestion.direction;

        // Verificar que la dirección sugerida es válida
        const testPos = {
          x: from.x + unstuckDir.x * 0.8,
          z: from.z + unstuckDir.z * 0.8
        };

        if (!this.checkCollision(testPos.x, testPos.z, this.walls)) {
          this.lastValidDirection = unstuckDir;

          return {
            direction: unstuckDir,
            shouldMove: true,
            speedMultiplier: suggestion.strength,
            state: 'UNSTUCK',
            emotion: this.personality.currentEmotion,
            debugInfo: {
              action: 'UNSTUCK',
              unstuckType: suggestion.type,
              severity: stuckStatus.severity,
              emotion: this.personality.currentEmotion
            }
          };
        }
      }
    }

    // Usar A* si está habilitado o si se forzó nuevo camino
    const shouldRecalcPath = usePathfinding && (
      !this.currentPath ||
      this.pathRecalcTimer > AdvancedAIConfig.PATH_RECALC_INTERVAL ||
      this.forceNewPath
    );

    if (shouldRecalcPath) {
      // Evitar posiciones de otros enemigos
      const avoidPositions = context.nearbyEnemies?.map(e => e.position) || [];
      this.currentPath = this.pathfinder.findPath(from, to, 500, avoidPositions);
      this.pathRecalcTimer = 0;
      this.forceNewPath = false;

      if (Math.random() < 0.05) {
        this.pathfinder.cleanCache();
      }
    }

    let target = to;
    if (this.currentPath && this.currentPath.length > 1) {
      target = this.currentPath[1];

      if (getDistance(from, target) < 0.5) {
        this.currentPath.shift();
      }
    }

    const dx = target.x - from.x;
    const dz = target.z - from.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.1) {
      return { direction: context.enemyDir, shouldMove: false };
    }

    let desiredDirection = normalizeDirection({ x: dx, z: dz });

    // NUEVO: Usar navegador inteligente para evitar colisiones
    const navResult = this.navigator.getSmartDirection(from, desiredDirection, context.enemyDir);
    let finalDirection = navResult.direction;

    // Verificar si la dirección final es válida
    const testPos = {
      x: from.x + finalDirection.x * 0.5,
      z: from.z + finalDirection.z * 0.5
    };

    if (this.checkCollision(testPos.x, testPos.z, this.walls)) {
      // La dirección tiene colisión, intentar alternativas
      this.stuckDetector.recordCollision();

      // Obtener repulsión de paredes
      const wallRepulsion = this.navigator.getWallRepulsion(from);
      if (wallRepulsion) {
        // Combinar dirección deseada con repulsión
        finalDirection = normalizeDirection({
          x: desiredDirection.x * 0.3 + wallRepulsion.x * 0.7,
          z: desiredDirection.z * 0.3 + wallRepulsion.z * 0.7
        });

        // Verificar nueva dirección
        const testPos2 = {
          x: from.x + finalDirection.x * 0.5,
          z: from.z + finalDirection.z * 0.5
        };

        if (this.checkCollision(testPos2.x, testPos2.z, this.walls)) {
          // Todavía hay colisión, usar perpendicular
          finalDirection = this.navigator.getPerpendicularDirection(from, desiredDirection);
        }
      } else {
        // Sin repulsión, usar última dirección válida
        finalDirection = this.lastValidDirection;
      }
    } else {
      // Movimiento exitoso
      this.stuckDetector.recordSuccessfulMove();
      this.lastValidDirection = finalDirection;
    }

    // NUEVO: Aplicar suavizado de dirección para evitar movimientos bruscos
    if (context.enemyDir) {
      const smoothing = 0.3;
      finalDirection = normalizeDirection({
        x: finalDirection.x * (1 - smoothing) + context.enemyDir.x * smoothing,
        z: finalDirection.z * (1 - smoothing) + context.enemyDir.z * smoothing
      });
    }

    // Guardar posición actual
    this.lastPosition = { ...from };

    return {
      direction: finalDirection,
      shouldMove: true,
      speedMultiplier,
      state: this.lastAction,
      emotion: this.personality.currentEmotion,
      navigationMode: navResult.type,
      debugInfo: {
        action: this.lastAction,
        emotion: this.personality.currentEmotion,
        hasPath: !!this.currentPath,
        pathLength: this.currentPath?.length || 0,
        alertLevel: this.alertLevel,
        frustration: this.personality.frustrationLevel,
        navigationMode: navResult.type,
        isStuck: stuckStatus.isStuck,
        stuckSeverity: stuckStatus.severity
      }
    };
  }

  isInZone(pos, zone) {
    return pos.x >= zone.minX &&
           pos.x <= zone.maxX &&
           pos.z >= zone.minZ &&
           pos.z <= zone.maxZ;
  }

  // Métodos de aprendizaje
  recordActionOutcome(action, success) {
    const map = success ? this.successfulActions : this.failedActions;
    map.set(action, (map.get(action) || 0) + 1);

    if (success) {
      this.personality.recordSuccess();
    } else {
      this.personality.recordFailure();
    }
  }

  getActionSuccessRate(action) {
    const successes = this.successfulActions.get(action) || 0;
    const failures = this.failedActions.get(action) || 0;
    const total = successes + failures;
    return total > 0 ? successes / total : 0.5;
  }
}

// ============================================================================
// FUNCIONES DE INTEGRACIÓN
// ============================================================================

export const createAdvancedEnemyAI = (enemyId, role, walls, checkCollision) => {
  return new AdvancedEnemyAI(enemyId, role, walls, checkCollision);
};

export const updateAdvancedEnemyAI = (aiInstance, context, delta) => {
  return aiInstance.update(context, delta);
};

export const createEnemyCoordinator = () => {
  return new EnemyCoordinator();
};

export const createDifficultyManager = () => {
  return new DifficultyManager();
};

export default {
  AdvancedEnemyAI,
  createAdvancedEnemyAI,
  updateAdvancedEnemyAI,
  PlayerMemory,
  NeuralPredictor,
  AStarPathfinder,
  VisionSystem,
  EnemyCoordinator,
  UtilityAI,
  PersonalitySystem,
  DifficultyManager,
  StuckDetector,
  SmartNavigator,
  // Sistemas Ultra-Avanzados
  MapAnalyzer,
  EscapeRoutePredictor,
  MindGameSystem,
  PressureManager,
  HerdingSystem,
  TrapDetector,
  TacticalAdvisor,
  // Configuración y constantes
  AdvancedAIConfig,
  AIEmotions,
  FormationTypes,
  createEnemyCoordinator,
  createDifficultyManager
};
