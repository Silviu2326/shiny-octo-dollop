import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * GameFloor Component
 * Renders the floor of the level with a repeating texture
 *
 * @param {Object} props
 * @param {number} props.width - Width of the floor (default: 40)
 * @param {number} props.depth - Depth of the floor (default: 45)
 * @param {string} props.texture - Texture path (default: '/assets/suelos/floor_texture.jpg')
 * @param {Array} props.position - Position array [x, y, z] (default: [12, -0.1, 14])
 * @param {Array} props.textureRepeat - Texture repeat values [x, y] (default: calculated from width/depth)
 */
function GameFloor({
  width = 40,
  depth = 45,
  texture = '/assets/suelos/floor_texture.jpg',
  position = [12, -0.1, 14],
  textureRepeat = null
}) {
  const loadedTexture = useLoader(THREE.TextureLoader, texture);

  useMemo(() => {
    loadedTexture.magFilter = THREE.NearestFilter;
    loadedTexture.minFilter = THREE.NearestFilter;
    loadedTexture.wrapS = THREE.RepeatWrapping;
    loadedTexture.wrapT = THREE.RepeatWrapping;

    // Use provided textureRepeat or calculate from dimensions
    const repeatX = textureRepeat ? textureRepeat[0] : width / 5;
    const repeatY = textureRepeat ? textureRepeat[1] : depth / 5;
    loadedTexture.repeat.set(repeatX, repeatY);
  }, [loadedTexture, width, depth, textureRepeat]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={position}
    >
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial map={loadedTexture} />
    </mesh>
  );
}

export default GameFloor;
