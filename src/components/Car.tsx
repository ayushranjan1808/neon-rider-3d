import { useEffect, useRef, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, type GhostFrame } from '../store/useGameStore';
import { getClosestSplinePoint, TRACK_WIDTH, BOOST_PADS, TRACK_CURVE } from './Track';
import { SERVICE_ZONES } from '../config/worldConfig';
import { ParticleSystem, type ParticleSystemRef } from './ParticleSystem';

// Define a GLTF model URL to load a custom car model. Leave empty to use the programmatic fallback.
const GLTF_MODEL_URL = '';

interface BoxCarMeshProps {
  color: string;
  frontLeftWheel: React.RefObject<THREE.Group | null>;
  frontRightWheel: React.RefObject<THREE.Group | null>;
  rearLeftWheel: React.RefObject<THREE.Group | null>;
  rearRightWheel: React.RefObject<THREE.Group | null>;
}

function BoxCarMesh({ color, frontLeftWheel, frontRightWheel, rearLeftWheel, rearRightWheel }: BoxCarMeshProps) {
  return (
    <group position={[0, 0, 0]}>
      {/* Main Low-Profile Wedge Chassis */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.35, 4.0]} />
        <meshStandardMaterial color={color} roughness={0.18} metalness={0.85} />
      </mesh>

      {/* Front nose wedge splitter */}
      <mesh position={[0, -0.05, 2.15]} rotation={[-0.14, 0, 0]} castShadow>
        <boxGeometry args={[2.0, 0.25, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.18} metalness={0.85} />
      </mesh>

      {/* Glowing Side Neon Decals (Emissive) */}
      <mesh position={[1.02, 0, 0]}>
        <boxGeometry args={[0.02, 0.12, 3.6]} />
        <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={3.5} />
      </mesh>
      <mesh position={[-1.02, 0, 0]}>
        <boxGeometry args={[0.02, 0.12, 3.6]} />
        <meshStandardMaterial color="#ff007f" emissive="#ff007f" emissiveIntensity={3.5} />
      </mesh>

      {/* Sleek cabin cockpit windshield (Transparent Cyan) */}
      <mesh position={[0, 0.42, -0.2]} castShadow>
        <boxGeometry args={[1.4, 0.46, 2.0]} />
        <meshStandardMaterial color="#00ffff" roughness={0.02} metalness={0.95} transparent opacity={0.4} />
      </mesh>

      {/* ================= Blocky Driver & Steering Wheel (Cockpit) ================= */}
      <group position={[0, 0.3, -0.1]}>
        {/* Torso */}
        <mesh position={[0, -0.05, 0]} castShadow>
          <boxGeometry args={[0.55, 0.45, 0.35]} />
          <meshStandardMaterial color="#ef4444" roughness={0.7} /> {/* Red racing suit */}
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.26, 0]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color="#ffcc99" roughness={0.6} /> {/* Driver head */}
        </mesh>
        {/* Racing Helmet Visor */}
        <mesh position={[0, 0.3, 0.16]}>
          <boxGeometry args={[0.26, 0.1, 0.05]} />
          <meshStandardMaterial color="#111111" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Left Arm */}
        <mesh position={[0.28, -0.05, 0.2]} rotation={[Math.PI / 4, 0, -Math.PI / 12]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
          <meshStandardMaterial color="#ef4444" roughness={0.7} />
        </mesh>
        {/* Right Arm */}
        <mesh position={[-0.28, -0.05, 0.2]} rotation={[Math.PI / 4, 0, Math.PI / 12]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
          <meshStandardMaterial color="#ef4444" roughness={0.7} />
        </mesh>
        {/* Steering Wheel */}
        <group position={[0, 0.08, 0.38]} rotation={[Math.PI / 6, 0, 0]}>
          {/* Wheel Ring */}
          <mesh castShadow>
            <torusGeometry args={[0.22, 0.04, 8, 24]} />
            <meshStandardMaterial color="#1f2937" roughness={0.8} />
          </mesh>
          {/* Steering Column */}
          <mesh position={[0, -0.1, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
            <meshStandardMaterial color="#4b5563" metalness={0.7} />
          </mesh>
        </group>
      </group>

      {/* Elevated Double Strut Spoiler */}
      <group position={[0, 0.65, -1.8]}>
        {/* Struts */}
        <mesh position={[0.75, -0.3, 0]}>
          <boxGeometry args={[0.08, 0.6, 0.2]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
        </mesh>
        <mesh position={[-0.75, -0.3, 0]}>
          <boxGeometry args={[0.08, 0.6, 0.2]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
        </mesh>
        {/* Wing Blade */}
        <mesh castShadow>
          <boxGeometry args={[2.3, 0.08, 0.55]} />
          <meshStandardMaterial color={color} roughness={0.18} metalness={0.85} />
        </mesh>
        {/* Glowing red spoiler light strip */}
        <mesh position={[0, 0, -0.29]}>
          <boxGeometry args={[2.1, 0.03, 0.02]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3.5} />
        </mesh>
      </group>

      {/* Headlights (Glowing Yellow/Amber) */}
      <mesh position={[0.68, -0.05, 2.58]}>
        <boxGeometry args={[0.32, 0.1, 0.05]} />
        <meshStandardMaterial color="#ffe600" emissive="#ffe600" emissiveIntensity={3.0} />
      </mesh>
      <mesh position={[-0.68, -0.05, 2.58]}>
        <boxGeometry args={[0.32, 0.1, 0.05]} />
        <meshStandardMaterial color="#ffe600" emissive="#ffe600" emissiveIntensity={3.0} />
      </mesh>

      {/* Taillights (Glowing Hot Pink) */}
      <mesh position={[0, 0.05, -2.02]}>
        <boxGeometry args={[1.7, 0.08, 0.02]} />
        <meshStandardMaterial color="#ff007f" emissive="#ff007f" emissiveIntensity={4.0} />
      </mesh>

      {/* Front Left Wheel */}
      <group ref={frontLeftWheel} position={[1.15, -0.2, 1.3]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.42, 12]} />
          <meshStandardMaterial color="#111111" roughness={0.8} />
        </mesh>
        {/* Glowing rims */}
        <mesh position={[0.22, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.3, 8]} />
          <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={3.5} />
        </mesh>
      </group>

      {/* Front Right Wheel */}
      <group ref={frontRightWheel} position={[-1.15, -0.2, 1.3]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.42, 12]} />
          <meshStandardMaterial color="#111111" roughness={0.8} />
        </mesh>
        {/* Glowing rims */}
        <mesh position={[-0.22, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <circleGeometry args={[0.3, 8]} />
          <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={3.5} />
        </mesh>
      </group>

      {/* Rear Left Wheel */}
      <group ref={rearLeftWheel} position={[1.15, -0.2, -1.2]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.5, 12]} />
          <meshStandardMaterial color="#111111" roughness={0.8} />
        </mesh>
        {/* Glowing rims */}
        <mesh position={[0.26, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.3, 8]} />
          <meshStandardMaterial color="#ff007f" emissive="#ff007f" emissiveIntensity={3.5} />
        </mesh>
      </group>

      {/* Rear Right Wheel */}
      <group ref={rearRightWheel} position={[-1.15, -0.2, -1.2]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.5, 12]} />
          <meshStandardMaterial color="#111111" roughness={0.8} />
        </mesh>
        {/* Glowing rims */}
        <mesh position={[-0.26, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <circleGeometry args={[0.3, 8]} />
          <meshStandardMaterial color="#ff007f" emissive="#ff007f" emissiveIntensity={3.5} />
        </mesh>
      </group>
    </group>
  );
}

function GLTFCarModel({ url, color }: { url: string; color: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.name.toLowerCase().includes('body') || child.name.toLowerCase().includes('paint')) {
          if (child.material) {
            const mat = child.material.clone() as THREE.MeshStandardMaterial;
            mat.color.set(color);
            child.material = mat;
          }
        }
      }
    });
  }, [scene, color]);

  return <primitive object={scene} />;
}

export function Car() {
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls();

  // Zustand state selectors
  const carColor = useGameStore((state) => state.carColor);
  const gameState = useGameStore((state) => state.gameState);
  const completeLap = useGameStore((state) => state.completeLap);
  const updatePlayerHUD = useGameStore((state) => state.updatePlayerHUD);
  const touchThrottle = useGameStore((state) => state.touchThrottle);
  const touchBrake = useGameStore((state) => state.touchBrake);
  const isRefueling = useGameStore((state) => state.isRefueling);
  const startRefueling = useGameStore((state) => state.startRefueling);
  const updateRefuelCountdown = useGameStore((state) => state.updateRefuelCountdown);
  const isNitroActive = useGameStore((state) => state.isNitroActive);
  const nitroCount = useGameStore((state) => state.nitroCount);
  const consumeNitro = useGameStore((state) => state.consumeNitro);
  const tickNitro = useGameStore((state) => state.tickNitro);
  const collectNitroCanister = useGameStore((state) => state.collectNitroCanister);
  const tickNitroCanisters = useGameStore((state) => state.tickNitroCanisters);
  const updatePlayerT = useGameStore((state) => state.updatePlayerT);
  const nitroCanisters = useGameStore((state) => state.nitroCanisters);
  const enableTiltSteering = useGameStore((state) => state.enableTiltSteering);

  // References
  const carGroup = useRef<THREE.Group>(null);
  const particleRef = useRef<ParticleSystemRef>(null);
  const refuelCooldown = useRef(0);
  const lastRefueling = useRef(false);

  // Wheel meshes for turning/spin visual animation
  const frontLeftWheel = useRef<THREE.Group>(null);
  const frontRightWheel = useRef<THREE.Group>(null);
  const rearLeftWheel = useRef<THREE.Group>(null);
  const rearRightWheel = useRef<THREE.Group>(null);

  // Camera Chase tracking target look vector
  const cameraTargetLook = useRef(new THREE.Vector3());

  // --- Advanced Arcade Physics Variables ---
  const physics = useRef({
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    speed: 0,
    heading: Math.PI,      // Heading rotation around Y-axis
    yawRate: 0,            // Angular velocity for steering
    airborne: false,
    velocityY: 0,
    boostTimer: 0,
    collisionCooldown: 0,
  });

  // Track checkpoints to prevent shortcuts
  const checkpoints = useRef({
    cp1: false, // t = 0.25
    cp2: false, // t = 0.50
    cp3: false, // t = 0.75
  });

  // Ghost recording buffer
  const ghostRecord = useRef<GhostFrame[]>([]);
  const lapTimerRef = useRef(0);

  // DeviceOrientation Tilt Steering Ref
  const tiltRef = useRef(0);

  useEffect(() => {
    if (!enableTiltSteering) {
      tiltRef.current = 0;
      return;
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) {
        const gamma = e.gamma || 0;
        // Map tilt of -30 to +30 degrees to steer value of -1 to +1
        let steerInput = gamma / 30;
        steerInput = Math.max(-1, Math.min(1, steerInput));
        tiltRef.current = steerInput;
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [enableTiltSteering]);

  // Reset car position on mount or when game restarts
  useEffect(() => {
    // Start grid coordinates at t=0
    const startPos = new THREE.Vector3(0, 0, 0);
    const startTangent = new THREE.Vector3(1, 0, 0); // initial track direction
    physics.current.position.copy(startPos);
    physics.current.velocity.set(0, 0, 0);
    physics.current.speed = 0;
    physics.current.heading = Math.atan2(startTangent.x, startTangent.z) + Math.PI;
    physics.current.yawRate = 0;
    physics.current.airborne = false;
    physics.current.velocityY = 0;
    physics.current.boostTimer = 0;

    checkpoints.current = { cp1: false, cp2: false, cp3: false };
    ghostRecord.current = [];
    lapTimerRef.current = 0;

    if (carGroup.current) {
      carGroup.current.position.copy(startPos);
      carGroup.current.rotation.set(0, physics.current.heading, 0);
      cameraTargetLook.current.copy(startPos).add(new THREE.Vector3(0, 0, 5));
    }
  }, [gameState]);

  useFrame((state, delta) => {
    if (delta > 0.1) return; // ignore large lag frames

    const car = carGroup.current;
    if (!car) return;

    const p = physics.current;

    // 1. Process timing and pause state
    if (gameState === 'paused' || gameState === 'menu' || gameState === 'garage') return;

    // Track transition out of refueling to apply a cooldown
    if (lastRefueling.current && !isRefueling) {
      refuelCooldown.current = 5.0;
    }
    lastRefueling.current = isRefueling;

    if (refuelCooldown.current > 0) {
      refuelCooldown.current -= delta;
    }

    // Interactive refueling physics lockout
    if (isRefueling) {
      p.velocity.set(0, 0, 0);
      p.speed = 0;
      p.yawRate = 0;
      updateRefuelCountdown(delta);

      if (gameState === 'racing') {
        lapTimerRef.current += delta;
      }

      car.position.copy(p.position);
      car.rotation.y = p.heading;

      const refuelEl = document.getElementById('hud-refuel-countdown');
      if (refuelEl) {
        refuelEl.innerText = String(Math.ceil(useGameStore.getState().refuelCountdown));
      }

      updateHUDCamera(delta, state);
      return;
    }

    if (gameState === 'countdown') {
      p.velocity.set(0, 0, 0);
      p.speed = 0;
      p.yawRate = 0;
      updateHUDCamera(delta, state);
      return;
    }

    if (gameState === 'racing') {
      lapTimerRef.current += delta;
      tickNitro(delta);
      tickNitroCanisters(delta);
    }

    // 2. Read Keyboard and Touch Controls
    const { forward, backward, left, right, drift, nitro } = getKeys();
    const isAccelerating = forward || touchThrottle;
    const isBraking = backward || touchBrake;

    // Consume Nitro canister if Shift is pressed
    if (nitro && nitroCount > 0 && !isNitroActive && refuelCooldown.current <= 0) {
      consumeNitro();
    }

    // 3. Newtonian Propulsion & Aerodynamic Drag Physics
    // We compute velocities parallel (forward) and perpendicular (lateral) to heading
    const forwardVec = new THREE.Vector3(Math.sin(p.heading), 0, Math.cos(p.heading)).normalize();
    const rightVec = new THREE.Vector3(Math.cos(p.heading), 0, -Math.sin(p.heading)).normalize();

    const currentForwardSpeed = p.velocity.dot(forwardVec);
    const currentLateralSpeed = p.velocity.dot(rightVec);

    // Forward forces
    let forwardForce = 0;
    const mass = 1200; // kg
    
    if (isAccelerating) {
      // Temporary power boost if on boost pad, massive supersonic boost if nitro is active
      let engineForce = 35000; // Increased base speed
      if (p.boostTimer > 0) {
        engineForce = 60000;
      }
      if (isNitroActive) {
        engineForce = 150000; // Supersonic Nitro rocket propulsion force
      }
      forwardForce = engineForce;
    } else if (isBraking) {
      // Brake hard when moving forward, reverse gently when stationary/moving reverse
      if (currentForwardSpeed > 0.5) {
        forwardForce = -65000; // Stronger braking force
      } else {
        forwardForce = -15000; // Reversing
      }
    }

    // Drag force: drag_force = -drag_coefficient * v^2
    // Supersonic aerodynamics: drastically reduce drag during nitro
    const dragCoeff = isNitroActive ? 0.0018 : 0.008; 
    const dragForce = -dragCoeff * currentForwardSpeed * Math.abs(currentForwardSpeed) * mass;

    // Rolling resistance friction
    const rollCoeff = 0.5;
    const rollResistance = -rollCoeff * currentForwardSpeed * mass;

    // Calculate net acceleration along forward vector
    const netForwardForce = forwardForce + dragForce + rollResistance;
    const forwardAccel = netForwardForce / mass;

    let nextForwardSpeed = currentForwardSpeed + forwardAccel * delta;
    
    // Reverse speed limits
    const maxReverseSpeed = -15;
    nextForwardSpeed = Math.max(nextForwardSpeed, maxReverseSpeed);

    // 4. Lateral Friction & Grip (Snappy handling vs controlled drift)
    // Lateral drift slip angle calculations:
    // Under normal grip, lateral speed is damped heavily to lock direction.
    // Pressing Space/Drift lowers damping, allowing sideways sliding.
    const isDrifting = drift && Math.abs(currentForwardSpeed) > 10;
    const lateralDamping = isDrifting ? 2.8 : 13.0; // low damping = sliding drift
    const nextLateralSpeed = THREE.MathUtils.lerp(currentLateralSpeed, 0, lateralDamping * delta);

    // 5. Steering and Angular Damping
    // Yaw rate changes dynamically based on forward speed (no steer at zero speed)
    const speedFactor = Math.min(1.0, Math.abs(currentForwardSpeed) / 7.0) * (currentForwardSpeed > 0 ? 1.0 : -1.0);
    const baseSteerRate = isDrifting ? 2.8 : 2.1; // Drift allows tighter rotation angle
    let targetYawRate = 0;

    if (enableTiltSteering) {
      targetYawRate = -tiltRef.current * baseSteerRate;
    } else {
      if (left) {
        targetYawRate = baseSteerRate;
      } else if (right) {
        targetYawRate = -baseSteerRate;
      }
    }

    // Snappy steering response & auto-centering (tight angular drag)
    p.yawRate = THREE.MathUtils.lerp(p.yawRate, targetYawRate * speedFactor, 12 * delta);
    p.heading += p.yawRate * delta;
    p.heading = p.heading % (Math.PI * 2);

    // Reconstruct 2D velocity vector
    p.velocity.copy(forwardVec).multiplyScalar(nextForwardSpeed).addScaledVector(rightVec, nextLateralSpeed);

    // Translate coordinates
    p.position.x += p.velocity.x * delta;
    p.position.z += p.velocity.z * delta;

    // 6. Vertical Heights, Gravity, Spline Tracking
    const spline = getClosestSplinePoint(p.position);
    const groundY = spline.point.y;

    // Update player spline parameter t in the game store
    updatePlayerT(spline.t);

    if (p.boostTimer > 0) {
      p.boostTimer -= delta;
    }

    // Jump / airborne physics checking
    const heightDiff = p.position.y - groundY;
    if (heightDiff > 0.15 || p.airborne) {
      p.airborne = true;
      p.velocityY -= 14.5 * delta; // Gravity force
      p.position.y += p.velocityY * delta;

      // Landing detection
      if (p.position.y <= groundY) {
        p.position.y = groundY;
        p.velocityY = 0;
        p.airborne = false;
        // Minor bounce on landing
        p.velocityY = Math.max(0, -p.velocityY * 0.15);
      }
    } else {
      p.position.y = THREE.MathUtils.lerp(p.position.y, groundY, 15 * delta);
      p.velocityY = 0;
      p.airborne = false;
    }

    // 7. Strict Track Boundary & Reflection Bounce
    const carOffsetVec = p.position.clone().sub(spline.point);
    const dot = carOffsetVec.dot(spline.normal);
    const side = Math.sign(dot); // +1 left side, -1 right side

    let boundaryLimit = TRACK_WIDTH / 2 - 1.6; // Account for vehicle width

    // Dynamically extend boundary if entering a service zone pocket
    const inServiceZone = SERVICE_ZONES.find(zone => {
      const tDiff = Math.abs(spline.t - zone.t);
      return tDiff < 0.025 && side === zone.side;
    });

    if (inServiceZone) {
      boundaryLimit += 8.5; // Open the pocket so player can park
    }

    if (spline.distance > boundaryLimit) {
      // Calculate pushback direction vector
      const pushDirection = spline.normal.clone();
      const wallNormal = pushDirection.clone().multiplyScalar(side); // pointing away from wall

      // Immediately clamp position coordinate to edge of boundary
      p.position.copy(spline.point).addScaledVector(wallNormal, boundaryLimit);

      // Decompose velocity to reflect perpendicular vector and apply 30% speed penalty
      if (p.collisionCooldown <= 0) {
        p.collisionCooldown = 0.22; // Prevent collision loops

        const velPerp = wallNormal.clone().multiplyScalar(p.velocity.dot(wallNormal));
        const velPara = p.velocity.clone().sub(velPerp);

        // Reverse perpendicular component (restitution bounce)
        const bouncedPerp = velPerp.clone().multiplyScalar(-0.45);
        
        // Parallel velocity gets 30% penalty (retains 70%)
        const slowedPara = velPara.clone().multiplyScalar(0.70);

        // Recombine velocity
        p.velocity.copy(bouncedPerp).add(slowedPara);
        
        // Sync speed variable
        p.speed = p.velocity.dot(forwardVec);

        // Spawn sparks at impact point
        const sparkPos = p.position.clone().addScaledVector(wallNormal, 1.2);
        particleRef.current?.emitSparks(sparkPos, wallNormal);
      }
    }

    if (p.collisionCooldown > 0) {
      p.collisionCooldown -= delta;
    }

    // 8. Speed Boost Pad Collision Checks
    BOOST_PADS.forEach((pad) => {
      const distToPadT = Math.abs(spline.t - pad.t);
      if (distToPadT < 0.012 && spline.distance < 4.5) {
        p.boostTimer = 1.6; // Boost durations
        p.velocity.copy(forwardVec).multiplyScalar(62.0); // Immediately propel forward
        p.speed = 62.0;
      }
    });

    // Nitro Canister Proximity Check
    nitroCanisters.forEach((canister) => {
      if (canister.collected) return;
      const pt = TRACK_CURVE.getPointAt(canister.t);
      const canisterPos = pt.clone().add(new THREE.Vector3(0, 1.2, 0));
      if (p.position.distanceTo(canisterPos) < 2.5) {
        collectNitroCanister(canister.id);
        particleRef.current?.emitSparks(p.position, new THREE.Vector3(0, 1, 0));
      }
    });

    // 8.5 Service Zone Proximity and Speed check to trigger Refuel Sequence
    if (inServiceZone && refuelCooldown.current <= 0) {
      const padPos = TRACK_CURVE.getPointAt(inServiceZone.t).clone()
        .addScaledVector(spline.normal, inServiceZone.side * (TRACK_WIDTH / 2 + 3.5));
      const distToPad = p.position.distanceTo(padPos);

      // Trigger if speed is extremely slow and close to pad center
      if (distToPad < 6.0 && Math.abs(p.speed) < 0.5) {
        startRefueling();
      }
    }

    // 9. Checkpoint Lap Triggers
    if (spline.t > 0.23 && spline.t < 0.32) checkpoints.current.cp1 = true;
    if (spline.t > 0.48 && spline.t < 0.57 && checkpoints.current.cp1) checkpoints.current.cp2 = true;
    if (spline.t > 0.73 && spline.t < 0.82 && checkpoints.current.cp2) checkpoints.current.cp3 = true;

    // Finish crossing
    const crossedFinish = (spline.t > 0.96 || spline.t < 0.04) && checkpoints.current.cp3;
    if (crossedFinish) {
      completeLap(lapTimerRef.current, [...ghostRecord.current]);
      lapTimerRef.current = 0;
      ghostRecord.current = [];
      checkpoints.current = { cp1: false, cp2: false, cp3: false };
    }

    // 10. Ghost Lap Record Frames
    if (gameState === 'racing') {
      ghostRecord.current.push({
        pos: [p.position.x, p.position.y, p.position.z],
        rot: [car.rotation.x, car.rotation.y, car.rotation.z],
        speed: p.speed,
        time: lapTimerRef.current,
      });
    }

    // 11. Update physical transform values
    car.position.copy(p.position);
    car.rotation.y = p.heading;

    // banking/pitch slope orientations
    const pitch = Math.asin(spline.tangent.y);
    car.rotation.x = THREE.MathUtils.lerp(car.rotation.x, -pitch, 8 * delta);

    // Roll side-tilt under yaw forces
    let rollForce = 0;
    if (enableTiltSteering) {
      rollForce = -tiltRef.current * 0.12;
    } else {
      rollForce = left ? -0.12 : right ? 0.12 : 0;
    }
    car.rotation.z = THREE.MathUtils.lerp(car.rotation.z, rollForce, 5 * delta);

    // 12. Spin wheel animations
    const wheelSpin = p.speed * 2.8 * delta;
    let wheelSteerAngle = 0;
    if (enableTiltSteering) {
      wheelSteerAngle = -tiltRef.current * 0.35;
    } else {
      wheelSteerAngle = left ? 0.35 : right ? -0.35 : 0;
    }

    if (frontLeftWheel.current) {
      frontLeftWheel.current.rotation.x += wheelSpin;
      frontLeftWheel.current.rotation.y = wheelSteerAngle;
    }
    if (frontRightWheel.current) {
      frontRightWheel.current.rotation.x += wheelSpin;
      frontRightWheel.current.rotation.y = wheelSteerAngle;
    }
    if (rearLeftWheel.current) rearLeftWheel.current.rotation.x += wheelSpin;
    if (rearRightWheel.current) rearRightWheel.current.rotation.x += wheelSpin;

    // 13. Telemetry HUD values & direct DOM mapping (60 FPS)
    const displaySpeed = Math.round(Math.abs(p.speed) * 3.6);
    const currentRank = useGameStore.getState().playerRank;

    const speedValEl = document.getElementById('hud-speed-value');
    if (speedValEl) speedValEl.innerText = String(displaySpeed);

    const speedRingEl = document.getElementById('hud-speed-ring');
    if (speedRingEl) {
      const circumference = 339.3; // 2 * Math.PI * 54
      const speedRatio = Math.min(displaySpeed / 240, 1.0);
      const strokeDashoffset = circumference - (speedRatio * circumference);
      speedRingEl.setAttribute('stroke-dashoffset', String(strokeDashoffset));
    }

    const timeValEl = document.getElementById('hud-time-value');
    if (timeValEl) {
      const secs = lapTimerRef.current;
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      const c = Math.floor((secs % 1) * 100);
      timeValEl.innerText = `${m}:${s.toString().padStart(2, '0')}.${c.toString().padStart(2, '0')}`;
    }

    const rankValEl = document.getElementById('hud-rank-value');
    if (rankValEl) rankValEl.innerText = String(currentRank);

    const lapValEl = document.getElementById('hud-lap-value');
    if (lapValEl) lapValEl.innerText = String(useGameStore.getState().currentLap);
    
    // Sync store states (HUD overlays)
    updatePlayerHUD(displaySpeed, currentRank, useGameStore.getState().currentLap);

    // 14. Dynamic Camera Chase
    updateHUDCamera(delta, state);
  });

  // Chase Camera Controller (Smooth lerps, Speed shakes, and Dynamic FOVs)
  const updateHUDCamera = (delta: number, _state: any) => {
    const car = carGroup.current;
    if (!car) return;

    const p = physics.current;
    const dir = new THREE.Vector3(Math.sin(p.heading), 0, Math.cos(p.heading)).normalize();

    // Calculate dynamic offsets behind the car
    const baseDistance = 7.6;
    const baseHeight = 2.7;
    const dynamicDistance = baseDistance + Math.min(Math.abs(p.speed), 60) * 0.08;
    const dynamicHeight = baseHeight + Math.min(Math.abs(p.speed), 60) * 0.02;

    const targetCameraPos = car.position.clone()
      .addScaledVector(dir, -dynamicDistance)
      .add(new THREE.Vector3(0, dynamicHeight, 0));

    // Smooth position interpolation
    camera.position.lerp(targetCameraPos, 8.5 * delta);

    // Camera rumble shake at high speed limits (> 30 m/s) or during active nitro
    if (isNitroActive || Math.abs(p.speed) > 30) {
      const baseShake = isNitroActive ? 0.18 : 0.0;
      const speedExcess = Math.max(0, Math.abs(p.speed) - 30);
      const shakeIntensity = baseShake + speedExcess * 0.005;
      const shakeOffset = new THREE.Vector3(
        (Math.random() - 0.5) * shakeIntensity,
        (Math.random() - 0.5) * shakeIntensity,
        (Math.random() - 0.5) * shakeIntensity
      );
      camera.position.add(shakeOffset);
    }

    // Look slightly ahead of the car center to track speed curves
    const targetLookAt = car.position.clone().addScaledVector(dir, 3.2);
    cameraTargetLook.current.lerp(targetLookAt, 11 * delta);
    camera.lookAt(cameraTargetLook.current);

    // FOV Tunnel Vision Stretch
    if ('fov' in camera) {
      const persCamera = camera as THREE.PerspectiveCamera;
      let targetFov = 55 + Math.min(Math.abs(p.speed), 60) * 0.45;
      if (isNitroActive) targetFov += 25;
      persCamera.fov = THREE.MathUtils.lerp(persCamera.fov, targetFov, 5 * delta);
      persCamera.updateProjectionMatrix();
    }
  };

  return (
    <group>
      {/* Visual Car Group */}
      <group ref={carGroup} name="player-car" castShadow receiveShadow>
        {GLTF_MODEL_URL ? (
          <Suspense fallback={
            <BoxCarMesh
              color={carColor}
              frontLeftWheel={frontLeftWheel}
              frontRightWheel={frontRightWheel}
              rearLeftWheel={rearLeftWheel}
              rearRightWheel={rearRightWheel}
            />
          }>
            <GLTFCarModel url={GLTF_MODEL_URL} color={carColor} />
          </Suspense>
        ) : (
          <BoxCarMesh
            color={carColor}
            frontLeftWheel={frontLeftWheel}
            frontRightWheel={frontRightWheel}
            rearLeftWheel={rearLeftWheel}
            rearRightWheel={rearRightWheel}
          />
        )}
      </group>

      {/* Attach Particle system trailing in world coordinates */}
      <ParticleSystem type="player" carRef={carGroup} ref={particleRef} />
    </group>
  );
}
