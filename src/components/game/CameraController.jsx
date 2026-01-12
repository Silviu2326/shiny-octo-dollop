import { useFrame } from '@react-three/fiber';

/**
 * CameraController Component
 * Controls camera position and follows the player
 *
 * @param {Object} props
 * @param {number} props.targetX - X coordinate of the target (player)
 * @param {number} props.targetZ - Z coordinate of the target (player)
 * @param {number} props.rotation - Camera rotation angle
 * @param {number} props.distance - Distance from target
 * @param {number} props.height - Camera height (Y position)
 * @param {number} props.smoothness - Camera smoothness factor (default: 0.1)
 */
function CameraController({
  targetX,
  targetZ,
  rotation,
  distance,
  height,
  smoothness = 0.1
}) {
  useFrame(({ camera }) => {
    // Calculate camera offset based on rotation and distance
    const offsetX = Math.sin(rotation) * distance;
    const offsetZ = Math.cos(rotation) * distance;

    // Smoothly interpolate camera position
    camera.position.x += (targetX + offsetX - camera.position.x) * smoothness;
    camera.position.y = height;
    camera.position.z += (targetZ + offsetZ - camera.position.z) * smoothness;

    // Always look at the target
    camera.lookAt(targetX, 0, targetZ);
  });

  return null;
}

export default CameraController;
