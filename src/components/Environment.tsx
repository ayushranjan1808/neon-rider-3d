import { useMemo } from 'react';
import { Sky, Environment as DreiEnvironment } from '@react-three/drei';
import * as THREE from 'three';
import { TRACK_CURVE, TRACK_WIDTH } from './Track';

function getDeterministicBuildingType(index: number, sideStr: string) {
  const seed = (index * 17 + (sideStr === 'left' ? 11 : 5)) % 100;
  const hash = seed / 100;

  if (hash < 0.5) {
    // Skyscraper
    const baseH = 22 + (seed % 18);
    const midH = 14 + (seed % 12);
    const topH = 8 + (seed % 10);
    const baseW = 8 + (seed % 6);
    const midW = baseW - 2;
    const color = (seed % 3 === 0) ? '#5c6475' : (seed % 3 === 1) ? '#404959' : '#313a4a'; // slate/blue-grey
    const windowColor = (seed % 2 === 0) ? '#1f2937' : '#111827';
    return {
      category: 'skyscraper',
      baseH,
      midH,
      topH,
      baseW,
      midW,
      color,
      windowColor
    };
  } else if (hash < 0.78) {
    // Service Station
    return {
      category: 'station',
      canopyColor: '#282b35',
      pumpColor: (seed % 2 === 0) ? '#ef4444' : '#f59e0b'
    };
  } else {
    // Shop
    const color = '#1a1c23';
    const signColor = (seed % 2 === 0) ? '#ff007f' : '#00f3ff';
    const shopW = 7 + (seed % 5);
    const shopH = 4.5 + (seed % 3);
    return {
      category: 'shop',
      color,
      signColor,
      shopW,
      shopH
    };
  }
}

function ProceduralBuilding({ data }: { data: any }) {
  const { pos, rotationY, type } = data;

  if (type.category === 'skyscraper') {
    const totalH = type.baseH + type.midH + type.topH;
    return (
      <group position={[pos.x, pos.y, pos.z]} rotation={[0, rotationY, 0]}>
        {/* Base Section */}
        <mesh position={[0, type.baseH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[type.baseW, type.baseH, type.baseW]} />
          <meshStandardMaterial color={type.color} roughness={0.4} metalness={0.5} />
        </mesh>
        
        {/* Mid Section */}
        <mesh position={[0, type.baseH + type.midH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[type.midW, type.midH, type.midW]} />
          <meshStandardMaterial color={type.windowColor} roughness={0.3} metalness={0.7} />
        </mesh>
        
        {/* Spire Section */}
        <mesh position={[0, type.baseH + type.midH + type.topH / 2, 0]} castShadow>
          <boxGeometry args={[0.4, type.topH, 0.4]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.2} metalness={0.8} />
        </mesh>
        
        {/* Emissive top beacon */}
        <mesh position={[0, totalH + 0.25, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color="#ff2a2a" emissive="#ff2a2a" emissiveIntensity={4.0} />
        </mesh>
      </group>
    );
  }

  if (type.category === 'station') {
    return (
      <group position={[pos.x, pos.y, pos.z]} rotation={[0, rotationY, 0]}>
        {/* Canopy */}
        <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[11, 0.5, 7]} />
          <meshStandardMaterial color={type.canopyColor} roughness={0.5} metalness={0.5} />
        </mesh>
        {/* Pillars */}
        <mesh position={[5.0, 2.25, 3.0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 4.5, 8]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.5} metalness={0.7} />
        </mesh>
        <mesh position={[-5.0, 2.25, 3.0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 4.5, 8]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.5} metalness={0.7} />
        </mesh>
        <mesh position={[5.0, 2.25, -3.0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 4.5, 8]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.5} metalness={0.7} />
        </mesh>
        <mesh position={[-5.0, 2.25, -3.0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 4.5, 8]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.5} metalness={0.7} />
        </mesh>
        {/* Pumps */}
        <mesh position={[2.2, 0.8, 0]} castShadow>
          <boxGeometry args={[1.1, 1.6, 0.8]} />
          <meshStandardMaterial color={type.pumpColor} roughness={0.5} />
        </mesh>
        <mesh position={[-2.2, 0.8, 0]} castShadow>
          <boxGeometry args={[1.1, 1.6, 0.8]} />
          <meshStandardMaterial color={type.pumpColor} roughness={0.5} />
        </mesh>
      </group>
    );
  }

  if (type.category === 'shop') {
    return (
      <group position={[pos.x, pos.y, pos.z]} rotation={[0, rotationY, 0]}>
        {/* Base */}
        <mesh position={[0, type.shopH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[type.shopW, type.shopH, type.shopW]} />
          <meshStandardMaterial color={type.color} roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Glowing Sign */}
        <group position={[0, type.shopH + 0.8, 0]}>
          <mesh castShadow>
            <boxGeometry args={[type.shopW - 1.2, 1.4, 0.35]} />
            <meshStandardMaterial
              color={type.signColor}
              emissive={type.signColor}
              emissiveIntensity={2.8}
            />
          </mesh>
          {/* Sign support */}
          <mesh position={[0, -0.6, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 1.2, 8]} />
            <meshStandardMaterial color="#4b5563" />
          </mesh>
        </group>
      </group>
    );
  }

  return null;
}

export function Environment() {
  // Generate procedural buildings once on mount using useMemo
  const buildings = useMemo(() => {
    const list: any[] = [];
    const count = 48; // sampling density along the spline

    for (let i = 0; i < count; i++) {
      const t = i / count;

      // Skip start line (t=0) and service zones (t=0.15, t=0.82) to avoid overlapping
      if (t < 0.05 || (t > 0.11 && t < 0.19) || (t > 0.78 && t < 0.86)) continue;

      const point = TRACK_CURVE.getPointAt(t);
      const tangent = TRACK_CURVE.getTangentAt(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const rotationY = Math.atan2(tangent.x, tangent.z);

      // Left side building
      const leftDist = TRACK_WIDTH / 2 + 7 + (i % 3) * 3; // safe offset from track edge
      const posLeft = point.clone().addScaledVector(binormal, leftDist);
      const leftType = getDeterministicBuildingType(i, 'left');

      // Right side building
      const rightDist = -(TRACK_WIDTH / 2 + 7 + ((i + 1) % 3) * 3); // safe offset from track edge
      const posRight = point.clone().addScaledVector(binormal, rightDist);
      const rightType = getDeterministicBuildingType(i, 'right');

      list.push({ id: `left-${i}`, pos: posLeft, rotationY, type: leftType });
      list.push({ id: `right-${i}`, pos: posRight, rotationY, type: rightType });
    }

    return list;
  }, []);

  return (
    <>
      {/* Daylight background color and atmospheric fog */}
      <color attach="background" args={['#a0c4ff']} />
      <fog attach="fog" args={['#a0c4ff', 150, 600]} />

      {/* Realistic HDRI reflections */}
      <DreiEnvironment preset="city" />

      {/* Realistic blue sky dome with bright midday sun */}
      <Sky 
        distance={450000} 
        sunPosition={[100, 150, 100]} // High angle sun
        mieCoefficient={0.005} 
        mieDirectionalG={0.8}
        rayleigh={1.2} // Cinematic Rayleigh scattering
        turbidity={4}  // Clean clear day turbidity
      />

      {/* Global Hemisphere Light (sky blue color dome down to dark ground reflection) */}
      <hemisphereLight 
        args={['#e0f0ff', '#444433', 0.85]} 
      />

      {/* Strong white directional sunlight to cast sharp shadows */}
      <directionalLight
        castShadow
        position={[100, 150, 80]}
        intensity={1.8}
        color="#ffffff"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={600}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
        shadow-bias={-0.0003}
      />

      {/* Subtle secondary bounce light from sky */}
      <directionalLight 
        position={[-100, 50, -80]} 
        intensity={0.4} 
        color="#b0d0ff" 
      />

      {/* Sleek Infinite Tarmac Asphalt Ground Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[1500, 1500]} />
        <meshStandardMaterial
          color="#202024" // Dark grey asphalt
          roughness={0.92} // Rough tarmac finish
          metalness={0.05} // Negligible metallic values
        />
      </mesh>

      {/* Procedurally generated buildings along the track */}
      {buildings.map((b) => (
        <ProceduralBuilding key={b.id} data={b} />
      ))}
    </>
  );
}
