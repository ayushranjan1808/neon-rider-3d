import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRACK_CURVE } from './Track';
import { useGameStore } from '../store/useGameStore';
import { ParticleSystem } from './ParticleSystem';

interface AIVehicleState {
  id: number;
  name: string;
  color: string;
  t: number;             // Progress along track curve (0.0 to 1.0)
  lap: number;           // Current lap count
  speed: number;         // Current movement speed (m/s)
  baseSpeed: number;     // Configured baseline speed
  lateralOffset: number; // Offset from centerline to simulate racing lanes
  offsetPhase: number;   // Sine phase for weaving animation
  meshRef: React.RefObject<THREE.Group | null>;
}

export function AICar() {
  const gameState = useGameStore((state) => state.gameState);
  const currentLap = useGameStore((state) => state.currentLap);
  const updatePlayerHUD = useGameStore((state) => state.updatePlayerHUD);
  const playerSpeed = useGameStore((state) => state.playerSpeed);

  // 1. Initialize 3 distinct AI Bot vehicles with different racing characteristics
  const bots = useRef<AIVehicleState[]>([
    {
      id: 1,
      name: 'Cyber Blade',
      color: '#ff8c00', // Neon Orange
      t: 0.98,          // Slightly behind start
      lap: 0,
      speed: 0,
      baseSpeed: 34.5,
      lateralOffset: -3.5, // Outer left lane
      offsetPhase: 0,
      meshRef: { current: null },
    },
    {
      id: 2,
      name: 'Giga Drift',
      color: '#39ff14', // Acid Green
      t: 0.96,          // Medium grid spot
      lap: 0,
      speed: 0,
      baseSpeed: 31.8,
      lateralOffset: 3.2, // Inner right lane
      offsetPhase: Math.PI / 2,
      meshRef: { current: null },
    },
    {
      id: 3,
      name: 'Vector Void',
      color: '#ff00ff', // Vivid Purple
      t: 0.94,          // Back grid spot
      lap: 0,
      speed: 0,
      baseSpeed: 36.2,   // High top speed, slows down on corners
      lateralOffset: 1.0,
      offsetPhase: Math.PI,
      meshRef: { current: null },
    },
  ]);

  // Reset bots on race starts
  useEffect(() => {
    bots.current[0].t = 0.98; bots.current[0].lap = 0; bots.current[0].speed = 0;
    bots.current[1].t = 0.96; bots.current[1].lap = 0; bots.current[1].speed = 0;
    bots.current[2].t = 0.94; bots.current[2].lap = 0; bots.current[2].speed = 0;
  }, [gameState]);

  useFrame((_, delta) => {
    if (delta > 0.1) return;
    if (gameState === 'paused' || gameState === 'menu' || gameState === 'garage') return;

    // 1. If in countdown state, keep cars stationary
    if (gameState === 'countdown') {
      bots.current.forEach((bot) => {
        bot.speed = 0;
        const mesh = bot.meshRef.current;
        if (mesh) {
          const pt = TRACK_CURVE.getPointAt(bot.t);
          const tangent = TRACK_CURVE.getTangentAt(bot.t);
          const up = new THREE.Vector3(0, 1, 0);
          const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
          
          const pos = pt.clone().addScaledVector(normal, bot.lateralOffset);
          mesh.position.copy(pos);
          mesh.rotation.y = Math.atan2(tangent.x, tangent.z);
        }
      });
      return;
    }

    // --- AI Simulation Loop ---
    // 2. Sample player position from the camera's target or use ref
    // We can infer player track progress directly from the Zustand store HUD values,
    // but a cleaner approach is comparing position parameters in the store.
    // To calculate the Player's spline coordinates, let's find the player car position.
    // In our player Car component, we write physics positions. We can fetch that coordinate.
    // A simple way to compute player rank is tracing the active camera parent or querying the canvas.


    // 3. Move each AI Bot
    const curveLength = TRACK_CURVE.getLength();

    bots.current.forEach((bot) => {
      const mesh = bot.meshRef.current;
      if (!mesh) return;

      // Accelerate or slow down AI based on corners to simulate human driving
      // Curves like hairpin are around t = 0.65 to 0.78
      let targetSpeed = bot.baseSpeed;
      if (bot.t > 0.62 && bot.t < 0.8) {
        targetSpeed = bot.baseSpeed * 0.55; // Slow down for hairpin curve
      } else if (bot.t > 0.1 && bot.t < 0.28) {
        targetSpeed = bot.baseSpeed * 0.78; // Soft corner deceleration
      }

      // Smooth speed interpolation
      bot.speed = THREE.MathUtils.lerp(bot.speed, targetSpeed, 3 * delta);

      // Increment t progress
      // t_increment = speed * dt / total_curve_length
      const dtProgress = (bot.speed * delta) / curveLength;
      bot.t += dtProgress;

      // Handle lap count crossing boundaries (wraps at 1.0)
      if (bot.t >= 1.0) {
        bot.t = bot.t % 1.0;
        bot.lap += 1;
      }

      // Compute coordinate path
      const centerPos = TRACK_CURVE.getPointAt(bot.t);
      const tangent = TRACK_CURVE.getTangentAt(bot.t);
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      // Weave offsets to simulate overtaking / drafting lines
      bot.offsetPhase += delta * 0.5;
      const laneShift = Math.sin(bot.offsetPhase + bot.id) * 2.0;
      const finalOffset = bot.lateralOffset + laneShift;

      const botPos = centerPos.clone().addScaledVector(normal, finalOffset);

      // Update AI mesh transforms
      mesh.position.copy(botPos);
      mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

      // Align pitch/roll to track contours
      const pitch = Math.asin(tangent.y);
      mesh.rotation.x = -pitch;
      mesh.rotation.z = Math.sin(bot.offsetPhase) * 0.05; // tiny sway
    });

    // 4. Sync AI progress to Zustand for the minimap and derived rank
    const progress = bots.current.map(bot => ({
      id: bot.id,
      t: bot.t,
      lap: bot.lap,
      color: bot.color
    }));
    useGameStore.getState().updateAIProgress(progress);

    // Send speed, derived rank, and lap back to Zustand HUD
    updatePlayerHUD(playerSpeed, useGameStore.getState().playerRank, currentLap);
  });

  return (
    <group>
      {bots.current.map((bot) => (
        <group key={bot.id}>
          {/* Bot Visual Model */}
          <group ref={bot.meshRef as any} name={`ai-car-${bot.id}`}>
            {/* Chassis */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[2.0, 0.4, 4.0]} />
              <meshStandardMaterial color={bot.color} roughness={0.4} metalness={0.7} />
            </mesh>

            {/* Glowing lines */}
            <mesh position={[1.01, 0, 0]}>
              <boxGeometry args={[0.02, 0.1, 3.6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-1.01, 0, 0]}>
              <boxGeometry args={[0.02, 0.1, 3.6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Cabin cockpit */}
            <mesh position={[0, 0.45, -0.2]} castShadow>
              <boxGeometry args={[1.5, 0.5, 2.0]} />
              <meshStandardMaterial color="#202020" roughness={0.1} transparent opacity={0.8} />
            </mesh>

            {/* Spoiler */}
            <mesh position={[0, 0.5, -1.8]} castShadow>
              <boxGeometry args={[2.2, 0.08, 0.5]} />
              <meshStandardMaterial color={bot.color} />
            </mesh>

            {/* Headlights */}
            <mesh position={[0.7, -0.05, 2.01]}>
              <boxGeometry args={[0.3, 0.15, 0.02]} />
              <meshBasicMaterial color="#ffe600" />
            </mesh>
            <mesh position={[-0.7, -0.05, 2.01]}>
              <boxGeometry args={[0.3, 0.15, 0.02]} />
              <meshBasicMaterial color="#ffe600" />
            </mesh>

            {/* Wheels */}
            <mesh position={[1.15, -0.2, 1.3]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.45, 0.45, 0.4, 8]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[-1.15, -0.2, 1.3]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.45, 0.45, 0.4, 8]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[1.15, -0.2, -1.2]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.45, 0.45, 0.5, 8]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[-1.15, -0.2, -1.2]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.45, 0.45, 0.5, 8]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>

          {/* AI Exhaust Smoke Particles */}
          <ParticleSystem type="ai" carRef={bot.meshRef as any} />
        </group>
      ))}
    </group>
  );
}
