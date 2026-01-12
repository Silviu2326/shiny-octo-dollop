import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';

/**
 * MazeWalls - Componente reutilizable para renderizar paredes del laberinto
 *
 * @param {Object} props
 * @param {Array} props.walls - Array de objetos de pared con estructura:
 *   { x, z, length, height, thickness, orientation: 'horizontal' | 'vertical' }
 * @param {Object} [props.textures] - Rutas personalizadas de texturas
 * @param {string} [props.textures.brick] - Textura de ladrillo (parte inferior)
 * @param {string} [props.textures.gold] - Textura dorada (parte superior)
 * @param {string} [props.textures.background] - Textura de fondo (paredes altas)
 * @param {number} [props.backgroundHeightThreshold=2] - Altura mínima para considerar pared como background
 * @param {number} [props.topSectionRatio=0.2] - Proporción de la sección dorada superior (0-1)
 */
export default function MazeWalls({
  walls,
  textures = {
    brick: '/assets/paredes/wall_brick.jpg',
    gold: '/assets/paredes/wall_gold.png',
    background: '/assets/paredes/wall_background.png'
  },
  backgroundHeightThreshold = 2,
  topSectionRatio = 0.2
}) {
  // Cargar texturas
  const textureUrls = {
    brick: textures.brick,
    gold: textures.gold,
    background: textures.background
  };

  const brickTexture = useLoader(THREE.TextureLoader, textureUrls.brick);
  const goldTexture = useLoader(THREE.TextureLoader, textureUrls.gold);
  const backgroundTexture = useLoader(THREE.TextureLoader, textureUrls.background);

  // Configurar texturas para estilo pixel art
  useMemo(() => {
    [brickTexture, goldTexture, backgroundTexture].forEach(texture => {
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    });
  }, [brickTexture, goldTexture, backgroundTexture]);

  // Generar geometrías optimizadas (merged)
  const { brickGeometry, goldGeometry, backgroundGeometry } = useMemo(() => {
    const brickGeometries = [];
    const goldGeometries = [];
    const backgroundGeometries = [];

    walls.forEach(wall => {
      const isHorizontal = wall.orientation === 'horizontal';
      const isBackgroundWall = wall.height > backgroundHeightThreshold;

      // Calcular centro de la pared
      const centerX = isHorizontal ? wall.x + wall.length / 2 : wall.x;
      const centerZ = isHorizontal ? wall.z : wall.z + wall.length / 2;
      const width = isHorizontal ? wall.length : wall.thickness;
      const depth = isHorizontal ? wall.thickness : wall.length;

      if (isBackgroundWall) {
        // Pared de fondo (alta, una sola pieza)
        const geometry = new THREE.BoxGeometry(width, wall.height, depth);
        geometry.translate(centerX, wall.height / 2, centerZ);

        // Configurar UVs
        const uvs = geometry.attributes.uv;
        for (let i = 0; i < uvs.count; i++) {
          uvs.setXY(i, uvs.getX(i), uvs.getY(i));
        }

        backgroundGeometries.push(geometry);
      } else {
        // Pared normal (dividida en parte de ladrillo y parte dorada)
        const bottomHeight = wall.height * (1 - topSectionRatio);
        const topHeight = wall.height * topSectionRatio;
        const bottomY = bottomHeight / 2;
        const topY = bottomHeight + topHeight / 2;

        // Geometría de ladrillo (parte inferior)
        const bottomGeo = new THREE.BoxGeometry(width, bottomHeight, depth);
        bottomGeo.translate(centerX, bottomY, centerZ);

        const bottomUVs = bottomGeo.attributes.uv;
        for (let i = 0; i < bottomUVs.count; i++) {
          bottomUVs.setXY(i, bottomUVs.getX(i) * wall.length, bottomUVs.getY(i));
        }
        brickGeometries.push(bottomGeo);

        // Geometría dorada (parte superior)
        const topGeo = new THREE.BoxGeometry(width, topHeight, depth);
        topGeo.translate(centerX, topY, centerZ);

        const topUVs = topGeo.attributes.uv;
        for (let i = 0; i < topUVs.count; i++) {
          topUVs.setXY(i, topUVs.getX(i) * wall.length, topUVs.getY(i));
        }
        goldGeometries.push(topGeo);
      }
    });

    // Combinar geometrías para optimización
    return {
      brickGeometry: brickGeometries.length > 0 ? mergeBufferGeometries(brickGeometries) : null,
      goldGeometry: goldGeometries.length > 0 ? mergeBufferGeometries(goldGeometries) : null,
      backgroundGeometry: backgroundGeometries.length > 0 ? mergeBufferGeometries(backgroundGeometries) : null
    };
  }, [walls, backgroundHeightThreshold, topSectionRatio]);

  return (
    <group>
      {/* Paredes de fondo */}
      {backgroundGeometry && (
        <mesh geometry={backgroundGeometry}>
          <meshBasicMaterial map={backgroundTexture} color="#ffffff" />
        </mesh>
      )}

      {/* Paredes de ladrillo (sección inferior) */}
      {brickGeometry && (
        <mesh geometry={brickGeometry}>
          <meshBasicMaterial map={brickTexture} />
        </mesh>
      )}

      {/* Paredes doradas (sección superior) */}
      {goldGeometry && (
        <mesh geometry={goldGeometry}>
          <meshBasicMaterial map={goldTexture} />
        </mesh>
      )}
    </group>
  );
}
