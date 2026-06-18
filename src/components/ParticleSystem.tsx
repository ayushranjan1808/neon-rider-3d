import { useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';

interface Particle {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: string;
  size: number;
  opacity: number;
  maxLife: number;
  life: number;
}

export interface ParticleSystemRef {
  emitSparks: (position: THREE.Vector3, normal: THREE.Vector3) => void;
}

interface ParticleSystemProps {
  type: 'player' | 'ai' | 'ghost';
  carRef: React.RefObject<THREE.Group | null>;
}

export const ParticleSystem = forwardRef<ParticleSystemRef, ParticleSystemProps>(
  ({ type, carRef }, ref) => {
    const particles = useRef<Particle[]>([]);
    const nextId = useRef(0);
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
    const [, getKeys] = useKeyboardControls();

    // Store previous position to calculate speed/sliding velocity vectors
    const prevPosition = useRef(new THREE.Vector3());
    const isFirstFrame = useRef(true);

    // Temp variables to avoid garbage collection allocation overhead
    const _position = new THREE.Vector3();
    const _matrix = new THREE.Object3D();
    const _color = new THREE.Color();
    const _carVel = new THREE.Vector3();

    // Trigger a burst of orange sparks on wall impacts
    useImperativeHandle(ref, () => ({
      emitSparks: (position: THREE.Vector3, normal: THREE.Vector3) => {
        // Glowing orange/yellow cyberpunk spark color
        const sparkColor = '#ff6a00';
        for (let i = 0; i < 20; i++) {
          const velocity = normal.clone()
            .multiplyScalar(4 + Math.random() * 8)
            .add(new THREE.Vector3(
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5
            ));

          particles.current.push({
            id: nextId.current++,
            position: position.clone(),
            velocity,
            color: sparkColor,
            size: 0.12 + Math.random() * 0.22,
            opacity: 1.0,
            maxLife: 0.3 + Math.random() * 0.3,
            life: 0,
          });
        }
      },
    }));

    useFrame((_state, delta) => {
      if (delta > 0.1 || !carRef.current) return;

      const car = carRef.current;
      const gameState = useGameStore.getState().gameState;

      if (gameState === 'paused' || gameState === 'menu' || gameState === 'garage') return;

      // 1. Calculate world-space velocity and lateral sliding vector
      const currentPos = car.position;
      if (isFirstFrame.current) {
        prevPosition.current.copy(currentPos);
        isFirstFrame.current = false;
        return;
      }

      // Compute velocity vector (change in position / dt)
      _carVel.copy(currentPos).sub(prevPosition.current).multiplyScalar(1 / delta);
      prevPosition.current.copy(currentPos);

      const forwardVec = new THREE.Vector3(0, 0, 1).applyQuaternion(car.quaternion).normalize();
      const rightVec = new THREE.Vector3().crossVectors(forwardVec, new THREE.Vector3(0, 1, 0)).normalize();
      
      const lateralSpeed = _carVel.dot(rightVec);
      const forwardSpeed = _carVel.dot(forwardVec);
      const isSliding = Math.abs(lateralSpeed) > 4.5 && Math.abs(forwardSpeed) > 5.0;

      // 2. Continuous Exhaust Flame Emission (Cyan / Supersonic Blue-White during Nitro)
      // Only emit exhaust flames if throttle is actively pressed
      let isThrottling = false;
      if (type === 'player') {
        const { forward } = getKeys();
        const touchThrottle = useGameStore.getState().touchThrottle;
        isThrottling = (forward || touchThrottle) && gameState === 'racing';
      } else {
        // AI and Ghost cars are assumed to throttle if moving
        isThrottling = _carVel.lengthSq() > 16.0;
      }

      const isNitroActive = type === 'player' && useGameStore.getState().isNitroActive;

      if (isThrottling && Math.random() < (isNitroActive ? 0.85 : 0.6)) {
        const exhaustOffset = new THREE.Vector3(0, 0.15, -1.8).applyMatrix4(car.matrixWorld);
        const jetSpeed = isNitroActive ? -25 : -12;
        const backingVector = forwardVec.clone().multiplyScalar(jetSpeed);
        
        particles.current.push({
          id: nextId.current++,
          position: exhaustOffset,
          velocity: backingVector.add(new THREE.Vector3(
            (Math.random() - 0.5) * (isNitroActive ? 3.0 : 1.5),
            (Math.random() - 0.2) * (isNitroActive ? 3.0 : 1.5),
            (Math.random() - 0.5) * (isNitroActive ? 3.0 : 1.5)
          )),
          color: isNitroActive 
            ? (Math.random() > 0.45 ? '#ffffff' : '#00a8ff') 
            : (type === 'player' ? '#00f3ff' : type === 'ghost' ? '#1f51ff' : '#ff007f'),
          size: isNitroActive 
            ? 0.28 + Math.random() * 0.14 
            : (type === 'ghost' ? 0.08 : 0.14 + Math.random() * 0.08),
          opacity: type === 'ghost' ? 0.3 : 0.85,
          maxLife: isNitroActive ? 0.5 + Math.random() * 0.3 : 0.35 + Math.random() * 0.25,
          life: 0,
        });
      }

      // 3. Drift Smoke Particle Emission (Pink & White)
      // Only emit smoke from rear wheels when lateral sliding velocity exceeds threshold
      if (isSliding && Math.random() < 0.4) {
        // Local tire offsets for rear wheels
        const leftTireOffset = new THREE.Vector3(0.85, -0.2, -1.2).applyMatrix4(car.matrixWorld);
        const rightTireOffset = new THREE.Vector3(-0.85, -0.2, -1.2).applyMatrix4(car.matrixWorld);

        const smokeColor = Math.random() > 0.4 ? '#ff007f' : '#ffffff'; // Cyber pink & white smoke mix

        [leftTireOffset, rightTireOffset].forEach((tirePos) => {
          particles.current.push({
            id: nextId.current++,
            position: tirePos,
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * 2,
              1.5 + Math.random() * 2.5, // smoke floats up
              (Math.random() - 0.5) * 2
            ),
            color: type === 'ghost' ? '#00f3ff' : smokeColor,
            size: 0.3 + Math.random() * 0.3,
            opacity: type === 'ghost' ? 0.2 : 0.6,
            maxLife: 0.6 + Math.random() * 0.4,
            life: 0,
          });
        });
      }

      // 4. Update Particle positions and physical properties
      particles.current = particles.current.filter((p) => {
        p.life += delta;
        if (p.life >= p.maxLife) return false;

        // Apply velocity vector
        p.position.addScaledVector(p.velocity, delta);
        p.velocity.multiplyScalar(1 - 1.5 * delta); // air friction/drag

        // Gravity effect on sparks, float up on drift smoke
        if (p.color === '#ff6a00') {
          p.velocity.y -= 9.81 * delta; // falling sparks
        } else {
          p.velocity.y += 1.0 * delta; // rising smoke
        }

        // Fading opacity
        const lifeRatio = p.life / p.maxLife;
        p.opacity = (1 - lifeRatio) * (type === 'ghost' ? 0.3 : 0.8);

        return true;
      });

      // Limit concurrent particles to preserve rendering resources
      if (particles.current.length > 300) {
        particles.current.shift();
      }

      // 5. Apply transforms to InstancedMesh instances
      if (instancedMeshRef.current) {
        const mesh = instancedMeshRef.current;
        const count = particles.current.length;
        
        mesh.count = count;

        particles.current.forEach((p, idx) => {
          _position.copy(p.position);
          
          const lifeRatio = p.life / p.maxLife;
          // Scale down as they age
          const currentSize = p.size * (1 - lifeRatio * 0.7);

          _matrix.position.copy(_position);
          _matrix.scale.set(currentSize, currentSize, currentSize);
          _matrix.updateMatrix();

          mesh.setMatrixAt(idx, _matrix.matrix);
          
          _color.set(p.color);
          mesh.setColorAt(idx, _color);
        });

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) {
          mesh.instanceColor.needsUpdate = true;
        }
      }
    });

    return (
      <instancedMesh
        ref={instancedMeshRef}
        args={[null as any, null as any, 300]}
        castShadow={false}
        receiveShadow={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    );
  }
);

ParticleSystem.displayName = 'ParticleSystem';
