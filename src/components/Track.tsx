import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { TRACK_COORDINATES, TRACK_WIDTH, BOOST_PADS_CONFIG, NEON_ARCHES_CONFIG, SERVICE_ZONES } from '../config/worldConfig';

// 1. Load track coordinates and construct the 3D Spline Curve
export const TRACK_POINTS = TRACK_COORDINATES.map((c) => new THREE.Vector3(c[0], c[1], c[2]));
export const TRACK_CURVE = new THREE.CatmullRomCurve3(TRACK_POINTS, true);
export { TRACK_WIDTH };
export const BOOST_PADS = BOOST_PADS_CONFIG;

// 2. Pre-cache track points for hyper-fast search lookup
const SAMPLE_COUNT = 300;
const cachedPoints = Array.from({ length: SAMPLE_COUNT }, (_, i) => {
  const t = i / SAMPLE_COUNT;
  return {
    point: TRACK_CURVE.getPointAt(t),
    t,
  };
});

/**
 * Finds the closest point on the track spline to a given 3D position.
 */
export function getClosestSplinePoint(position: THREE.Vector3) {
  let minDistanceSq = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const distSq = position.distanceToSquared(cachedPoints[i].point);
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closestIndex = i;
    }
  }

  let bestT = cachedPoints[closestIndex].t;
  let bestPoint = cachedPoints[closestIndex].point;
  
  const searchSteps = 6;
  const stepSize = 1 / (SAMPLE_COUNT * 2);

  for (let step = -searchSteps; step <= searchSteps; step++) {
    let t = bestT + step * stepSize;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    const pt = TRACK_CURVE.getPointAt(t);
    const distSq = position.distanceToSquared(pt);
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      bestT = t;
      bestPoint = pt;
    }
  }

  const tangent = TRACK_CURVE.getTangentAt(bestT).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
  const distance = position.distanceTo(bestPoint);

  return {
    point: bestPoint,
    tangent,
    normal,
    t: bestT,
    distance,
  };
}

function NitroCanister({ pos }: { pos: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 2.5;
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 1.2;
      meshRef.current.position.y = pos.y + Math.sin(state.clock.getElapsedTime() * 3.5) * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} position={[pos.x, pos.y, pos.z]} castShadow>
      <octahedronGeometry args={[0.6]} />
      <meshStandardMaterial
        color="#00a8ff"
        emissive="#00a8ff"
        emissiveIntensity={2.5}
        roughness={0.1}
        metalness={0.9}
      />
    </mesh>
  );
}

export function Track() {
  const nitroCanisters = useGameStore((state) => state.nitroCanisters);
  // 1. Generate Asphalt Road Geometry
  const roadGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const segments = 400;
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pt = TRACK_CURVE.getPointAt(t);
      const tangent = TRACK_CURVE.getTangentAt(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const leftPt = pt.clone().addScaledVector(normal, TRACK_WIDTH / 2);
      const rightPt = pt.clone().addScaledVector(normal, -TRACK_WIDTH / 2);

      vertices.push(leftPt.x, leftPt.y, leftPt.z);
      vertices.push(rightPt.x, rightPt.y, rightPt.z);

      uvs.push(0, t);
      uvs.push(1, t);
    }

    for (let i = 0; i < segments; i++) {
      const next = i + 1;
      const a = i * 2;
      const b = i * 2 + 1;
      const c = next * 2;
      const d = next * 2 + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    return geom;
  }, []);

  // 2. Generate Road Yellow Centerline Strip Geometry
  const centerlineGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const segments = 400;
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pt = TRACK_CURVE.getPointAt(t);
      const tangent = TRACK_CURVE.getTangentAt(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      // Slightly offset in Y to prevent Z-fighting on road geometry
      const surfaceOffset = new THREE.Vector3(0, 0.02, 0);
      const leftPt = pt.clone().addScaledVector(normal, 0.08).add(surfaceOffset);
      const rightPt = pt.clone().addScaledVector(normal, -0.08).add(surfaceOffset);

      vertices.push(leftPt.x, leftPt.y, leftPt.z);
      vertices.push(rightPt.x, rightPt.y, rightPt.z);

      uvs.push(0, t);
      uvs.push(1, t);
    }

    for (let i = 0; i < segments; i++) {
      const next = i + 1;
      const a = i * 2;
      const b = i * 2 + 1;
      const c = next * 2;
      const d = next * 2 + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    return geom;
  }, []);

  // 3. Generate Left & Right Guardrail curves
  const [leftCurve, rightCurve] = useMemo(() => {
    const leftPoints: THREE.Vector3[] = [];
    const rightPoints: THREE.Vector3[] = [];
    const railSamples = 200;

    for (let i = 0; i <= railSamples; i++) {
      const t = i / railSamples;
      const point = TRACK_CURVE.getPointAt(t);
      const tangent = TRACK_CURVE.getTangentAt(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      leftPoints.push(point.clone().addScaledVector(normal, TRACK_WIDTH / 2));
      rightPoints.push(point.clone().addScaledVector(normal, -TRACK_WIDTH / 2));
    }

    return [
      new THREE.CatmullRomCurve3(leftPoints, true),
      new THREE.CatmullRomCurve3(rightPoints, true),
    ];
  }, []);

  const guardrailGeometry = useMemo(() => {
    return new THREE.TubeGeometry(leftCurve, 200, 0.22, 6, true);
  }, [leftCurve]);

  const rightGuardrailGeometry = useMemo(() => {
    return new THREE.TubeGeometry(rightCurve, 200, 0.22, 6, true);
  }, [rightCurve]);

  // Start Gate Coordinates
  const startGate = useMemo(() => {
    const point = TRACK_CURVE.getPointAt(0);
    const tangent = TRACK_CURVE.getTangentAt(0).normalize();
    const rotationY = Math.atan2(tangent.x, tangent.z);
    return { point, rotationY };
  }, []);

  // Boost Pad coordinates
  const padsData = useMemo(() => {
    return BOOST_PADS.map((pad) => {
      const point = TRACK_CURVE.getPointAt(pad.t);
      const tangent = TRACK_CURVE.getTangentAt(pad.t).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);
      
      const padPos = point.clone().add(new THREE.Vector3(0, 0.04, 0));
      return { pos: padPos, rotationY: angle, id: pad.t };
    });
  }, []);

  // Industrial Gantries coordinates
  const gantriesData = useMemo(() => {
    return NEON_ARCHES_CONFIG.map((arch, idx) => {
      const point = TRACK_CURVE.getPointAt(arch.t);
      const tangent = TRACK_CURVE.getTangentAt(arch.t).normalize();
      const rotationY = Math.atan2(tangent.x, tangent.z);
      return { point, rotationY, id: idx };
    });
  }, []);

  return (
    <group>
      {/* 1. Asphalt Road Tarmac */}
      <mesh geometry={roadGeometry} receiveShadow>
        <meshStandardMaterial
          color="#35363c" // Tarmac asphalt grey
          roughness={0.9} // Extremely rough road surface
          metalness={0.05} // Non-reflective asphalt
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Double-Yellow Highway Centerline Markings */}
      <mesh geometry={centerlineGeometry}>
        <meshStandardMaterial
          color="#ffc000" // Highway yellow paint
          roughness={0.8}
          metalness={0.0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Physical Steel Left Guardrail */}
      <mesh geometry={guardrailGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#8c8d96" // Galvanized steel grey
          roughness={0.35}
          metalness={0.85} // Metallic reflection
        />
      </mesh>

      {/* 4. Physical Steel Right Guardrail */}
      <mesh geometry={rightGuardrailGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#8c8d96"
          roughness={0.35}
          metalness={0.85}
        />
      </mesh>

      {/* 5. Speed Boost Pads - Emissive yellow indicators */}
      {padsData.map((pad) => (
        <group key={pad.id} position={[pad.pos.x, pad.pos.y, pad.pos.z]} rotation={[0, pad.rotationY, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[7.5, 2.5]} />
            <meshStandardMaterial
              color="#ffb700"
              emissive="#ffb700"
              emissiveIntensity={2.2}
              transparent
              opacity={0.8}
            />
          </mesh>
          <mesh position={[0, 0.01, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[1.2, 2.2, 4]} />
            <meshStandardMaterial 
              color="#ffb700"
              emissive="#ffb700"
              emissiveIntensity={2.5}
            />
          </mesh>
        </group>
      ))}

      {/* 6. Industrial Steel Gantries bridging the track */}
      {gantriesData.map((gantry) => (
        <group key={gantry.id} position={[gantry.point.x, gantry.point.y, gantry.point.z]} rotation={[0, gantry.rotationY, 0]}>
          {/* Left Pillar */}
          <mesh position={[TRACK_WIDTH / 2 + 0.8, 5, 0]} castShadow>
            <cylinderGeometry args={[0.35, 0.35, 10, 8]} />
            <meshStandardMaterial color="#404149" roughness={0.5} metalness={0.7} />
          </mesh>
          {/* Safety warning tags (black/yellow rings on gantry base) */}
          <mesh position={[TRACK_WIDTH / 2 + 0.8, 1.2, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 2, 8]} />
            <meshStandardMaterial color="#ffe600" roughness={0.7} />
          </mesh>

          {/* Right Pillar */}
          <mesh position={[-(TRACK_WIDTH / 2 + 0.8), 5, 0]} castShadow>
            <cylinderGeometry args={[0.35, 0.35, 10, 8]} />
            <meshStandardMaterial color="#404149" roughness={0.5} metalness={0.7} />
          </mesh>
          <mesh position={[-(TRACK_WIDTH / 2 + 0.8), 1.2, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 2, 8]} />
            <meshStandardMaterial color="#ffe600" roughness={0.7} />
          </mesh>

          {/* Crossbar Truss */}
          <mesh position={[0, 10, 0]} castShadow>
            <boxGeometry args={[TRACK_WIDTH + 2.2, 0.8, 0.8]} />
            <meshStandardMaterial color="#404149" roughness={0.5} metalness={0.7} />
          </mesh>
          {/* Decorative overhead road sign banner */}
          <mesh position={[0, 10, 0.45]}>
            <boxGeometry args={[6, 2.5, 0.1]} />
            <meshStandardMaterial color="#1f402b" roughness={0.6} /> {/* Green highway sign */}
          </mesh>
        </group>
      ))}

      {/* 7. Start/Finish Overhead Steel Truss Gate */}
      <group position={[startGate.point.x, startGate.point.y, startGate.point.z]} rotation={[0, startGate.rotationY, 0]}>
        {/* Left Truss Support */}
        <mesh position={[TRACK_WIDTH / 2 + 1, 5, 0]} castShadow>
          <boxGeometry args={[1, 10, 1]} />
          <meshStandardMaterial color="#35363f" roughness={0.4} metalness={0.8} />
        </mesh>
        {/* Right Truss Support */}
        <mesh position={[-(TRACK_WIDTH / 2 + 1), 5, 0]} castShadow>
          <boxGeometry args={[1, 10, 1]} />
          <meshStandardMaterial color="#35363f" roughness={0.4} metalness={0.8} />
        </mesh>
        {/* Main Gantry Crossbar */}
        <mesh position={[0, 10, 0]} castShadow>
          <boxGeometry args={[TRACK_WIDTH + 3, 1.4, 1.4]} />
          <meshStandardMaterial color="#35363f" roughness={0.4} metalness={0.8} />
        </mesh>
        {/* Bill Board Backing */}
        <mesh position={[0, 12, 0]}>
          <boxGeometry args={[TRACK_WIDTH - 6, 2.5, 0.2]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
        </mesh>
        {/* START / FINISH white backlit board */}
        <mesh position={[0, 12, 0.12]}>
          <planeGeometry args={[TRACK_WIDTH - 8, 2.0]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1.3} // Backlit white glow
          />
        </mesh>
      </group>

      {/* 8. Service Zone Pit Stop Parking Pads */}
      {SERVICE_ZONES.map((zone, idx) => {
        const point = TRACK_CURVE.getPointAt(zone.t);
        const tangent = TRACK_CURVE.getTangentAt(zone.t).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
        const rotationY = Math.atan2(tangent.x, tangent.z);

        // Offset the parking pad to the left or right of the track edge
        const padPos = point.clone().addScaledVector(normal, zone.side * (TRACK_WIDTH / 2 + 3.5));
        padPos.y += 0.03; // slightly above tarmac to prevent z-fighting

        return (
          <group key={`service-${idx}`} position={[padPos.x, padPos.y, padPos.z]} rotation={[0, rotationY, 0]}>
            {/* Main Pad Area */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[8, 12]} />
              <meshStandardMaterial
                color="#00f3ff"
                roughness={0.7}
                metalness={0.2}
                emissive="#00f3ff"
                emissiveIntensity={0.15}
              />
            </mesh>
            {/* Border stripes (yellow warning lines) */}
            <mesh position={[4.1, 0.01, 0]} rotation={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.2, 0.05, 12]} />
              <meshStandardMaterial color="#ffe600" roughness={0.8} />
            </mesh>
            <mesh position={[-4.1, 0.01, 0]} rotation={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.2, 0.05, 12]} />
              <meshStandardMaterial color="#ffe600" roughness={0.8} />
            </mesh>
            {/* Pit Stop Overhead Canopy Arch */}
            <mesh position={[0, 4, 0]} castShadow>
              <boxGeometry args={[8.4, 0.4, 4]} />
              <meshStandardMaterial color="#3a3a44" roughness={0.5} metalness={0.6} />
            </mesh>
            {/* Canopy Pillars */}
            <mesh position={[4, 2, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
              <meshStandardMaterial color="#555660" roughness={0.5} metalness={0.7} />
            </mesh>
            <mesh position={[-4, 2, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
              <meshStandardMaterial color="#555660" roughness={0.5} metalness={0.7} />
            </mesh>
            {/* Bright Neon Canopy Border (Red/Yellow) */}
            <mesh position={[0, 4.25, 2.01]}>
              <boxGeometry args={[8.4, 0.2, 0.05]} />
              <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={3.5} />
            </mesh>
            {/* Blocky fuel pumps underneath canopy */}
            <group position={[3, 0.8, 0]}>
              <mesh castShadow>
                <boxGeometry args={[1.0, 1.6, 0.8]} />
                <meshStandardMaterial color="#e63946" roughness={0.4} />
              </mesh>
              {/* Display screen */}
              <mesh position={[0, 0.4, 0.41]}>
                <planeGeometry args={[0.7, 0.4]} />
                <meshStandardMaterial color="#a8dadc" emissive="#a8dadc" emissiveIntensity={1.0} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* 9. Procedural Nitro Canister Items */}
      {nitroCanisters.map((canister) => {
        if (canister.collected) return null;
        const point = TRACK_CURVE.getPointAt(canister.t);
        const pos = point.clone().add(new THREE.Vector3(0, 1.2, 0));
        return (
          <NitroCanister key={canister.id} pos={pos} />
        );
      })}
    </group>
  );
}
