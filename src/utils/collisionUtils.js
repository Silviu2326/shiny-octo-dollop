/**
 * collisionUtils.js
 * Utilidades para detección de colisiones en el juego Beer Run
 */

import { getWallBounds } from './wallUtils';

/**
 * Verifica colisión entre el jugador y las paredes usando spatial partitioning
 * Este método es más eficiente para grandes cantidades de paredes
 * @param {number} x - Posición X del jugador
 * @param {number} z - Posición Z del jugador
 * @param {Object} spatialGrid - Grid espacial generado por buildSpatialGrid
 * @param {number} cellSize - Tamaño de celda del grid (debe coincidir con el usado en buildSpatialGrid)
 * @param {number} playerRadius - Radio del jugador para detección de colisiones (default: 0.3)
 * @returns {boolean} - true si hay colisión, false si no hay colisión
 */
export function checkCollision(x, z, spatialGrid, cellSize = 5, playerRadius = 0.3) {
  const minCellX = Math.floor((x - playerRadius) / cellSize);
  const maxCellX = Math.floor((x + playerRadius) / cellSize);
  const minCellZ = Math.floor((z - playerRadius) / cellSize);
  const maxCellZ = Math.floor((z + playerRadius) / cellSize);

  for (let cx = minCellX; cx <= maxCellX; cx++) {
    for (let cz = minCellZ; cz <= maxCellZ; cz++) {
      const cellWalls = spatialGrid[`${cx},${cz}`];

      if (cellWalls) {
        for (const wallItem of cellWalls) {
          const { minX, maxX, minZ, maxZ } = wallItem.bounds;

          if (
            x + playerRadius > minX &&
            x - playerRadius < maxX &&
            z + playerRadius > minZ &&
            z - playerRadius < maxZ
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Verifica colisión entre el jugador y las paredes sin usar spatial partitioning
 * Este método es más simple pero menos eficiente para grandes cantidades de paredes
 * @param {number} x - Posición X del jugador
 * @param {number} z - Posición Z del jugador
 * @param {Array} walls - Array de objetos pared
 * @param {number} playerRadius - Radio del jugador para detección de colisiones (default: 0.3)
 * @returns {boolean} - true si hay colisión, false si no hay colisión
 */
export function checkCollisionSimple(x, z, walls, playerRadius = 0.3) {
  for (const wall of walls) {
    const bounds = getWallBounds(wall);
    const { minX, maxX, minZ, maxZ } = bounds;

    if (
      x + playerRadius > minX &&
      x - playerRadius < maxX &&
      z + playerRadius > minZ &&
      z - playerRadius < maxZ
    ) {
      return true;
    }
  }

  return false;
}
