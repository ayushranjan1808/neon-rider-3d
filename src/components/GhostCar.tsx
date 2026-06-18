import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { ParticleSystem } from './ParticleSystem';

export function GhostCar() {
  const ghostPositions = useGameStore((state) => state.ghostPositions);
  const currentLapTime = useGameStore((state) => state.currentLapTime);
  const gameState = useGameStore((state) => state.gameState);

  const meshRef = useRef<THREE.Group>(null);

  // Setup temporary math constructs to avoid frame allocations
  const _pos1 = new THREE.Vector3();
  const _pos2 = new THREE.Vector3();
  const _interpolatedPos = new THREE.Vector3();
  const _q1 = new THREE.Quaternion();
  const _q2 = new THREE.Quaternion();
  const _interpolatedRot = new THREE.Quaternion();

  // Sort and index ghost data for fast search lookups
  const ghostTimeline = useMemo(() => {
    if (!ghostPositions || ghostPositions.length === 0) return null;
    return [...ghostPositions].sort((a, b) => a.time - b.time);
  }, [ghostPositions]);

  useFrame((_, _delta) => {
    if (!ghostTimeline || !meshRef.current) return;
    if (gameState === 'paused' || gameState === 'menu' || gameState === 'garage') return;

    const ghost = meshRef.current;
    const time = currentLapTime;

    // Find the current frames bounding the timer
    let frameIndex = -1;
    for (let i = 0; i < ghostTimeline.length - 1; i++) {
      if (time >= ghostTimeline[i].time && time <= ghostTimeline[i + 1].time) {
        frameIndex = i;
        break;
      }
    }

    if (frameIndex !== -1) {
      // 1. Interpolate position and rotation between frame i and i + 1
      const f1 = ghostTimeline[frameIndex];
      const f2 = ghostTimeline[frameIndex + 1];

      // Interpolation ratio
      const timeDiff = f2.time - f1.time;
      const ratio = timeDiff > 0 ? (time - f1.time) / timeDiff : 0;

      // Positions
      _pos1.set(f1.pos[0], f1.pos[1], f1.pos[2]);
      _pos2.set(f2.pos[0], f2.pos[1], f2.pos[2]);
      _interpolatedPos.lerpVectors(_pos1, _pos2, ratio);

      // Rotations using quaternions
      _q1.setFromEuler(new THREE.Euler(f1.rot[0], f1.rot[1], f1.rot[2]));
      _q2.setFromEuler(new THREE.Euler(f2.rot[0], f2.rot[1], f2.rot[2]));
      _interpolatedRot.slerpQuaternions(_q1, _q2, ratio);

      // Apply transforms
      ghost.position.copy(_interpolatedPos);
      ghost.quaternion.copy(_interpolatedRot);
      ghost.visible = true;
    } else {
      // If time is beyond the best lap duration, freeze the ghost at the final point or hide it
      if (time > ghostTimeline[ghostTimeline.length - 1].time) {
        const lastFrame = ghostTimeline[ghostTimeline.length - 1];
        ghost.position.set(lastFrame.pos[0], lastFrame.pos[1], lastFrame.pos[2]);
        ghost.quaternion.setFromEuler(new THREE.Euler(lastFrame.rot[0], lastFrame.rot[1], lastFrame.rot[2]));
      } else {
        // Hide if before timeline
        ghost.visible = false;
      }
    }
  });

  // If no ghost coordinates recorded yet, do not render the object
  if (!ghostTimeline) return null;

  return (
    <group>
      {/* Ghost vehicle Group */}
      <group ref={meshRef} visible={false}>
        {/* Holographic glowing wireframe sports car */}
        <group>
          {/* Chassis */}
          <mesh>
            <boxGeometry args={[2.0, 0.4, 4.0]} />
            <meshStandardMaterial
              color="#00f3ff"
              emissive="#00f3ff"
              emissiveIntensity={1.5}
              transparent
              opacity={0.3}
              wireframe={false}
            />
          </mesh>

          {/* Hologram wireframe overlay */}
          <mesh>
            <boxGeometry args={[2.02, 0.42, 4.02]} />
            <meshBasicMaterial
              color="#00f3ff"
              wireframe
              transparent
              opacity={0.25}
            />
          </mesh>

          {/* Cabin */}
          <mesh position={[0, 0.45, -0.2]}>
            <boxGeometry args={[1.5, 0.5, 2.0]} />
            <meshStandardMaterial
              color="#1f51ff"
              emissive="#1f51ff"
              emissiveIntensity={1.0}
              transparent
              opacity={0.2}
              wireframe
            />
          </mesh>

          {/* Spoiler */}
          <mesh position={[0, 0.5, -1.8]}>
            <boxGeometry args={[2.2, 0.08, 0.5]} />
            <meshBasicMaterial
              color="#00f3ff"
              transparent
              opacity={0.3}
            />
          </mesh>

          {/* Holographic wheels */}
          <mesh position={[1.15, -0.2, 1.3]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.45, 0.45, 0.4, 6]} />
            <meshBasicMaterial color="#00f3ff" wireframe transparent opacity={0.2} />
          </mesh>
          <mesh position={[-1.15, -0.2, 1.3]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.45, 0.45, 0.4, 6]} />
            <meshBasicMaterial color="#00f3ff" wireframe transparent opacity={0.2} />
          </mesh>
          <mesh position={[1.15, -0.2, -1.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.45, 0.45, 0.5, 6]} />
            <meshBasicMaterial color="#00f3ff" wireframe transparent opacity={0.2} />
          </mesh>
          <mesh position={[-1.15, -0.2, -1.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.45, 0.45, 0.5, 6]} />
            <meshBasicMaterial color="#00f3ff" wireframe transparent opacity={0.2} />
          </mesh>
        </group>
      </group>

      {/* Ghost Exhaust Trail Particles */}
      <ParticleSystem type="ghost" carRef={meshRef} />
    </group>
  );
}
