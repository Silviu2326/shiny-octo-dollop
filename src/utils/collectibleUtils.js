/**
 * collectibleUtils.js
 * Utilidades para el manejo de coleccionables en el juego Beer Run
 */

/**
 * Genera posiciones aleatorias de coleccionables sin colisiones con paredes
 * y manteniendo una distancia mínima entre ellos
 * @param {number} count - Número de coleccionables a generar
 * @param {Function} checkCollisionFn - Función de colisión (ej: checkCollision o checkCollisionSimple)
 * @param {Object} options - Opciones de generación
 * @param {number} options.minX - Límite mínimo en X (default: 1)
 * @param {number} options.maxX - Límite máximo en X (default: 22)
 * @param {number} options.minZ - Límite mínimo en Z (default: 1)
 * @param {number} options.maxZ - Límite máximo en Z (default: 26)
 * @param {number} options.minDistance - Distancia mínima entre coleccionables (default: 1)
 * @returns {Array} - Array de objetos coleccionables con { id, x, z }
 */
export function generateCollectibles(count, checkCollisionFn, options = {}) {
  const {
    minX = 1,
    maxX = 22,
    minZ = 1,
    maxZ = 26,
    minDistance = 1
  } = options;

  const collectibles = [];
  let id = 1;
  const maxAttempts = count * 100; // Límite de intentos para evitar loops infinitos
  let attempts = 0;

  while (collectibles.length < count && attempts < maxAttempts) {
    attempts++;
    const x = Math.random() * (maxX - minX) + minX;
    const z = Math.random() * (maxZ - minZ) + minZ;

    // Verificar que no colisiona con paredes
    if (!checkCollisionFn(x, z)) {
      // Verificar que no está muy cerca de otros coleccionables
      const tooClose = collectibles.some(c => {
        const distance = Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(z - c.z, 2));
        return distance < minDistance;
      });

      if (!tooClose) {
        collectibles.push({ id: id++, x, z });
      }
    }
  }

  // Advertencia si no se pudo generar la cantidad deseada
  if (collectibles.length < count) {
    console.warn(`Solo se pudieron generar ${collectibles.length} de ${count} coleccionables solicitados.`);
  }

  return collectibles;
}

/**
 * Verifica si el jugador puede recoger un coleccionable
 * @param {number} playerX - Posición X del jugador
 * @param {number} playerZ - Posición Z del jugador
 * @param {Object} collectible - Objeto coleccionable con propiedades { x, z }
 * @param {number} radius - Radio de recolección (default: 0.5)
 * @returns {boolean} - true si puede recoger el coleccionable, false si no
 */
export function canCollect(playerX, playerZ, collectible, radius = 0.5) {
  const dist = Math.sqrt(
    Math.pow(playerX - collectible.x, 2) +
    Math.pow(playerZ - collectible.z, 2)
  );
  return dist < radius;
}

/**
 * Filtra coleccionables que fueron recogidos por el jugador
 * @param {Array} collectibles - Array de coleccionables actuales
 * @param {number} playerX - Posición X del jugador
 * @param {number} playerZ - Posición Z del jugador
 * @param {number} radius - Radio de recolección (default: 0.5)
 * @returns {Object} - { remaining: Array, collected: Array }
 */
export function filterCollected(collectibles, playerX, playerZ, radius = 0.5) {
  const remaining = [];
  const collected = [];

  collectibles.forEach(c => {
    if (canCollect(playerX, playerZ, c, radius)) {
      collected.push(c);
    } else {
      remaining.push(c);
    }
  });

  return { remaining, collected };
}
