import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { EffectComposer, BrightnessContrast, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useGameStore } from './store/useGameStore';
import { Environment } from './components/Environment';
import { Track } from './components/Track';
import { Car } from './components/Car';
import { AICar } from './components/AICar';
import { GhostCar } from './components/GhostCar';
import { MainMenu } from './components/MainMenu';
import { Garage } from './components/Garage';
import { Leaderboard } from './components/Leaderboard';
import { HUD } from './components/HUD';
import { Login } from './components/Login';

const controlMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'drift', keys: ['Space'] },
  { name: 'nitro', keys: ['ShiftLeft', 'ShiftRight', 'Shift'] },
];

export default function App() {
  const gameState = useGameStore((state) => state.gameState);
  const pauseRace = useGameStore((state) => state.pauseRace);
  const resumeRace = useGameStore((state) => state.resumeRace);

  // Global event listener to toggle pause using ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const state = useGameStore.getState().gameState;
        if (state === 'racing') {
          pauseRace();
        } else if (state === 'paused') {
          resumeRace();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pauseRace, resumeRace]);

  // Screen Routing based on Game State
  const renderUI = () => {
    switch (gameState) {
      case 'login':
        return <Login />;
      case 'menu':
        return <MainMenu />;
      case 'garage':
        return <Garage />;
      case 'finished':
        return <Leaderboard />;
      default:
        return <HUD />;
    }
  };

  const isPlaying = gameState === 'countdown' || gameState === 'racing' || gameState === 'paused';

  return (
    <KeyboardControls map={controlMap}>
      <div className="relative w-screen h-screen overflow-hidden bg-cyber-darker">
        
        {/* Render overlay pages */}
        {renderUI()}

        {/* 3D Racing World Canvas */}
        {isPlaying && (
          <Canvas
            shadows
            camera={{ position: [0, 5, 10], fov: 60 }}
            gl={{ 
              antialias: true, 
              logarithmicDepthBuffer: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.05
            }}
          >
            {/* Ambient cyber lights and skybox */}
            <Environment />

            {/* Visual track, borders, and boost pads */}
            <Track />

            {/* AI Opponent Bots */}
            <AICar />

            {/* Ghost playback vehicle */}
            <GhostCar />

            {/* Player-controlled vehicle */}
            <Car />

            {/* Photorealistic Post Processing */}
            <EffectComposer>
              <BrightnessContrast brightness={0.02} contrast={0.08} />
              <Vignette eskil={false} offset={0.15} darkness={0.9} />
            </EffectComposer>
          </Canvas>
        )}

      </div>
    </KeyboardControls>
  );
}
