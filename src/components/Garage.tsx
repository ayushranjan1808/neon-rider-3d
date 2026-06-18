import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { ArrowLeft, Save, Sliders, Palette } from 'lucide-react';

// Simplified rotating car preview specifically for the garage scene
function GarageCar({ color }: { color: string }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4; // Slowly rotate the car
    }
  });

  return (
    <group ref={meshRef} position={[0, 0.4, 0]}>
      {/* Chassis Body */}
      <mesh castShadow>
        <boxGeometry args={[2.0, 0.4, 4.0]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Cyber glows */}
      <mesh position={[1.01, 0, 0]}>
        <boxGeometry args={[0.02, 0.1, 3.6]} />
        <meshBasicMaterial color="#00f3ff" />
      </mesh>
      <mesh position={[-1.01, 0, 0]}>
        <boxGeometry args={[0.02, 0.1, 3.6]} />
        <meshBasicMaterial color="#ff007f" />
      </mesh>

      {/* Canopy */}
      <mesh position={[0, 0.45, -0.2]}>
        <boxGeometry args={[1.5, 0.5, 2.0]} />
        <meshStandardMaterial color="#001a33" roughness={0.05} metalness={0.9} transparent opacity={0.7} />
      </mesh>

      {/* Spoiler */}
      <mesh position={[0, 0.6, -1.8]}>
        <boxGeometry args={[2.2, 0.08, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Nose Wedge */}
      <mesh position={[0, -0.05, 2.1]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[2.0, 0.3, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Headlights */}
      <mesh position={[0.7, -0.05, 2.45]}>
        <boxGeometry args={[0.3, 0.15, 0.1]} />
        <meshBasicMaterial color="#ffe600" />
      </mesh>
      <mesh position={[-0.7, -0.05, 2.45]}>
        <boxGeometry args={[0.3, 0.15, 0.1]} />
        <meshBasicMaterial color="#ffe600" />
      </mesh>

      {/* Wheels */}
      <mesh position={[1.15, -0.2, 1.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 0.4, 12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[-1.15, -0.2, 1.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 0.4, 12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[1.15, -0.2, -1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 0.5, 12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[-1.15, -0.2, -1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 0.5, 12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

export function Garage() {
  const storeColor = useGameStore((state) => state.carColor);
  const setCarColor = useGameStore((state) => state.setCarColor);
  const setGameState = useGameStore((state) => state.setGameState);

  const [activeColor, setActiveColor] = useState(storeColor);

  // Synced local input sliders
  const [rgb, setRgb] = useState({ r: 0, g: 243, b: 255 });

  // Convert hex color to rgb on mount
  useEffect(() => {
    const hex = storeColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    setRgb({ r, g, b });
    setActiveColor(storeColor);
  }, [storeColor]);

  // Update hex when sliders change
  const handleSliderChange = (channel: 'r' | 'g' | 'b', val: number) => {
    const nextRgb = { ...rgb, [channel]: val };
    setRgb(nextRgb);

    // Convert to hex
    const rHex = nextRgb.r.toString(16).padStart(2, '0');
    const gHex = nextRgb.g.toString(16).padStart(2, '0');
    const bHex = nextRgb.b.toString(16).padStart(2, '0');
    const hex = `#${rHex}${gHex}${bHex}`;
    setActiveColor(hex);
  };

  // Cyber presets
  const presets = [
    { name: 'Laser Cyan', hex: '#00f3ff' },
    { name: 'Neon Pink', hex: '#ff007f' },
    { name: 'Acid Green', hex: '#39ff14' },
    { name: 'Vapor Purple', hex: '#8b00ff' },
    { name: 'Amber Glow', hex: '#ffe600' },
    { name: 'Deep Crimson', hex: '#ff0033' },
  ];

  const selectPreset = (hex: string) => {
    setActiveColor(hex);
    
    // sync sliders
    const raw = hex.replace('#', '');
    const r = parseInt(raw.substring(0, 2), 16);
    const g = parseInt(raw.substring(2, 4), 16);
    const b = parseInt(raw.substring(4, 6), 16);
    setRgb({ r, g, b });
  };

  const saveConfiguration = () => {
    setCarColor(activeColor);
    setGameState('menu');
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col md:flex-row bg-cyber-darker text-white scanlines font-sans">
      
      {/* 3D Canvas Preview Window */}
      <div className="flex-[3] relative h-[50vh] md:h-full bg-gradient-to-b from-cyber-dark to-cyber-darker">
        
        {/* Title Badge */}
        <div className="absolute top-6 left-6 z-10">
          <span className="text-[10px] text-cyber-cyan border border-cyber-cyan/30 bg-cyber-cyan/5 px-2 py-1 tracking-widest rounded uppercase">
            Visual Customization
          </span>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest mt-2">
            Vehicle Bay
          </h1>
        </div>

        <Canvas camera={{ position: [5, 3, 5], fov: 45 }} shadows>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
          <pointLight position={[-5, 5, -5]} intensity={0.5} color="#ff007f" />
          
          <GarageCar color={activeColor} />

          {/* Neon Floor Grid */}
          <Grid
            position={[0, -0.2, 0]}
            args={[100, 100]}
            cellSize={2}
            cellThickness={0.5}
            cellColor="#00f3ff"
            sectionSize={10}
            sectionThickness={1.0}
            sectionColor="#ff007f"
            fadeDistance={25}
          />
          
          <OrbitControls 
            enablePan={false} 
            maxPolarAngle={Math.PI / 2 - 0.05} 
            minDistance={4} 
            maxDistance={8} 
          />
        </Canvas>

        {/* Orbit instruction overlay */}
        <div className="absolute bottom-6 left-6 text-xs text-gray-500 font-mono">
          DRAG TO ROTATE VEHICLE &bull; SCROLL TO ZOOM
        </div>
      </div>

      {/* Control Configuration Panel */}
      <div className="flex-1 bg-cyber-dark border-t-2 md:border-t-0 md:border-l-2 border-cyber-magenta/40 p-8 flex flex-col justify-between overflow-y-auto">
        
        <div>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Palette className="text-cyber-magenta" />
            <h2 className="text-xl font-bold tracking-wider uppercase">Car Paint Shop</h2>
          </div>

          {/* Cyber Presets */}
          <div className="mb-8">
            <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-3">Neon Presets</h3>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  key={p.name}
                  onClick={() => selectPreset(p.hex)}
                  style={{ borderColor: activeColor === p.hex ? p.hex : 'transparent' }}
                  className="bg-cyber-darker border-2 py-2 px-1 text-[10px] font-bold uppercase rounded hover:border-white transition flex flex-col items-center gap-2"
                >
                  <span style={{ backgroundColor: p.hex }} className="w-5 h-5 rounded-full block border border-white/10" />
                  <span className="truncate w-full text-center">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual RGB Sliders */}
          <div className="space-y-6">
            <h3 className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Sliders size={12} /> Fine Tuning (RGB)
            </h3>

            {/* RED */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>CHANNEL RED</span>
                <span className="text-red-500 font-bold">{rgb.r}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.r}
                onChange={(e) => handleSliderChange('r', parseInt(e.target.value))}
                className="w-full accent-red-500 bg-cyber-darker rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* GREEN */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>CHANNEL GREEN</span>
                <span className="text-green-500 font-bold">{rgb.g}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.g}
                onChange={(e) => handleSliderChange('g', parseInt(e.target.value))}
                className="w-full accent-green-500 bg-cyber-darker rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* BLUE */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>CHANNEL BLUE</span>
                <span className="text-cyber-cyan font-bold">{rgb.b}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.b}
                onChange={(e) => handleSliderChange('b', parseInt(e.target.value))}
                className="w-full accent-cyber-cyan bg-cyber-darker rounded-lg h-2 cursor-pointer"
              />
            </div>
          </div>

          {/* Preview Swatch */}
          <div className="mt-8 bg-cyber-darker border border-white/5 p-4 rounded-lg flex items-center gap-4">
            <span style={{ backgroundColor: activeColor }} className="w-10 h-10 rounded-lg block border border-white/20 border-glow-cyan" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-mono">Chassis Hex Code</p>
              <p className="text-lg font-bold font-mono tracking-wider uppercase text-cyber-cyan">{activeColor}</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => setGameState('menu')}
            className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-white/20 text-gray-300 font-bold uppercase py-3 rounded hover:bg-white/5 transition"
          >
            <ArrowLeft size={16} /> Cancel
          </button>
          <button
            onClick={saveConfiguration}
            className="flex-1 flex items-center justify-center gap-2 bg-cyber-cyan text-cyber-darker font-bold uppercase py-3 rounded hover:bg-white transition border-glow-cyan"
          >
            <Save size={16} /> Save Paint
          </button>
        </div>

      </div>

    </div>
  );
}
