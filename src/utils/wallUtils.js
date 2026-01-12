/**
 * wallUtils.js
 * Utilidades para el manejo de paredes en el juego Beer Run
 */

/**
 * Calcula los límites (bounds) de una pared
 * @param {Object} wall - Objeto pared con propiedades { x, z, length, height, thickness, orientation }
 * @returns {Object} - Objeto con { minX, maxX, minZ, maxZ }
 */
export function getWallBounds(wall) {
  const isHorizontal = wall.orientation === 'horizontal';
  let minX, maxX, minZ, maxZ;

  if (isHorizontal) {
    minX = wall.x;
    maxX = wall.x + wall.length;
    minZ = wall.z - wall.thickness / 2;
    maxZ = wall.z + wall.thickness / 2;
  } else {
    minX = wall.x - wall.thickness / 2;
    maxX = wall.x + wall.thickness / 2;
    minZ = wall.z;
    maxZ = wall.z + wall.length;
  }
  return { minX, maxX, minZ, maxZ };
}

/**
 * Construye un grid espacial para optimización de detección de colisiones
 * Divide el espacio en celdas y asigna paredes a cada celda que ocupan
 * @param {Array} walls - Array de objetos pared
 * @param {number} cellSize - Tamaño de cada celda del grid (default: 5)
 * @returns {Object} - Grid espacial con estructura { "x,z": [walls...] }
 */
export function buildSpatialGrid(walls, cellSize = 5) {
  const grid = {};

  walls.forEach(wall => {
    const bounds = getWallBounds(wall);

    const startX = Math.floor(bounds.minX / cellSize);
    const endX = Math.floor(bounds.maxX / cellSize);
    const startZ = Math.floor(bounds.minZ / cellSize);
    const endZ = Math.floor(bounds.maxZ / cellSize);

    for (let x = startX; x <= endX; x++) {
      for (let z = startZ; z <= endZ; z++) {
        const key = `${x},${z}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push({ ...wall, bounds });
      }
    }
  });

  return grid;
}
