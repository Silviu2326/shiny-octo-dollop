import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Collectible Component
 * Renders collectible items (beers) with texture
 *
 * @param {Object} props
 * @param {Object} props.position - Position object with x and z coordinates
 * @param {string} props.texture - Texture path (default: '/assets/collectible_bottle.png')
 * @param {number} props.size - Size of the collectible plane (default: 0.6)
 * @param {number} props.height - Y position/height of the collectible (default: 0.4)
 */
function Collectible({
  position,
  texture = '/assets/collectible_bottle.png',
  size = 0.6,
  height = 0.4
}) {
  const loadedTexture = useLoader(THREE.TextureLoader, texture);

  useMemo(() => {
    loadedTexture.magFilter = THREE.NearestFilter;
    loadedTexture.minFilter = THREE.NearestFilter;
  }, [loadedTexture]);

  return (
    <mesh
      position={[position.x, height, position.z]}
      rotation={[-Math.PI / 4, Math.PI / 4.8, 0]}
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        map={loadedTexture}
        transparent={true}
        side={THREE.DoubleSide}
        alphaTest={0.5}
        depthWrite={false}
      />
    </mesh>
  );
}

export default Collectible;
