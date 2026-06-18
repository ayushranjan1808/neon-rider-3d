import { useGameStore } from '../store/useGameStore';
import { Play, Sliders, Trophy, Keyboard, User, Smartphone, LogOut } from 'lucide-react';

export function MainMenu() {
  const alias = useGameStore((state) => state.alias);
  const setAlias = useGameStore((state) => state.setAlias);
  const setGameState = useGameStore((state) => state.setGameState);
  const startRace = useGameStore((state) => state.startRace);
  const enableTiltSteering = useGameStore((state) => state.enableTiltSteering);
  const setEnableTiltSteering = useGameStore((state) => state.setEnableTiltSteering);

  const handleToggleTilt = async () => {
    if (!enableTiltSteering) {
      const DeviceOrientation = (window as any).DeviceOrientationEvent;
      if (DeviceOrientation && typeof DeviceOrientation.requestPermission === 'function') {
        try {
          const response = await DeviceOrientation.requestPermission();
          if (response === 'granted') {
            setEnableTiltSteering(true);
          } else {
            alert('PERMISSION DENIED. TILT CONTROL STAYS DISABLED.');
          }
        } catch (err) {
          console.error(err);
          alert('MOTION PERMISSION REQUEST FAILED. CHECK SYSTEM SETTINGS.');
        }
      } else {
        setEnableTiltSteering(true);
      }
    } else {
      setEnableTiltSteering(false);
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-4 md:p-8 bg-cyber-darker/90 text-white font-sans overflow-y-auto md:overflow-hidden scanlines">
      {/* Moving Cyber Grid Background */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Header - Stagger 1 */}
      <div className="mt-4 md:mt-8 z-10 flex flex-col items-center text-center reveal-zoom-1">
        <h1 className="text-4xl md:text-7xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-white to-cyber-magenta select-none animate-pulse-slow">
          NEON RIDER 3D
        </h1>
        <p className="text-cyber-cyan text-xs tracking-widest uppercase mt-2 text-glow-cyan">
          Browser-Based 3D Cyberpunk Racing
        </p>
      </div>

      {/* Center Setup & Controls - Stagger 2 */}
      <div className="z-10 flex flex-col md:flex-row gap-6 w-full max-w-4xl px-2 md:px-4 items-stretch justify-center my-6 reveal-zoom-2">
        {/* Alias Configuration Card & Hardware settings */}
        <div className="flex-1 bg-cyber-dark/80 border border-cyber-cyan/30 p-5 md:p-6 rounded-xl border-glow-cyan flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2 text-cyber-cyan">
                <User size={18} /> PILOT IDENTITY
              </h2>
              {/* Logout / Switch Pilot Callsign */}
              <button
                onClick={() => setGameState('login')}
                title="Change Callsign"
                className="text-white/40 hover:text-cyber-cyan transition-colors p-1"
              >
                <LogOut size={16} />
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value.toUpperCase().slice(0, 16))}
                className="w-full bg-cyber-darker border-b-2 border-cyber-cyan py-2 px-3 text-base font-bold text-white focus:outline-none focus:border-cyber-magenta uppercase tracking-widest"
                placeholder="NO CALLSIGN"
                maxLength={16}
              />
              <span className="absolute right-2 top-2 text-[10px] text-cyber-cyan/50 font-mono">SECURE ID</span>
            </div>
          </div>

          {/* Tilt settings inside Pilot card */}
          <div className="border-t border-white/5 pt-4">
            <h3 className="text-xs font-bold text-cyber-cyan/80 tracking-wider uppercase flex items-center gap-2 mb-2">
              <Smartphone size={14} /> MOTION SETTINGS
            </h3>
            <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
              Enable gyroscope control for mobile. Tilting your device left or right will steer the vehicle.
            </p>
            
            <button
              onClick={handleToggleTilt}
              className={`w-full py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-widest border transition-all duration-300 flex items-center justify-between ${
                enableTiltSteering
                  ? 'bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan shadow-[0_0_10px_rgba(0,243,255,0.2)]'
                  : 'bg-transparent border-white/10 text-white/50 hover:border-white/20'
              }`}
            >
              <span>GYRO TILT STEERING</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                enableTiltSteering ? 'bg-cyber-cyan text-cyber-darker' : 'bg-white/10 text-white/40'
              }`}>
                {enableTiltSteering ? 'ACTIVE' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Control Cheatsheet */}
        <div className="flex-1 bg-cyber-dark/80 border border-cyber-magenta/30 p-5 md:p-6 rounded-xl border-glow-magenta flex flex-col justify-between">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyber-magenta">
            <Keyboard size={18} /> PILOT MANUAL
          </h2>
          <ul className="text-xs space-y-2.5 font-mono text-gray-300">
            <li className="flex justify-between border-b border-white/5 pb-1">
              <span>STEER LEFT / RIGHT</span>
              <span className="text-cyber-magenta font-bold">A / D or ← / →</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-1">
              <span>ACCELERATE</span>
              <span className="text-cyber-cyan font-bold">W or ↑</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-1">
              <span>BRAKE / REVERSE</span>
              <span className="text-cyber-magenta font-bold">S or ↓</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-1">
              <span>HANDBRAKE / DRIFT</span>
              <span className="text-cyber-cyan font-bold">SPACE</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-1">
              <span>PAUSE RACE</span>
              <span className="text-cyber-magenta font-bold">ESC</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Buttons - Stagger 3 */}
      <div className="z-10 flex flex-col md:flex-row gap-4 w-full max-w-2xl mb-4 md:mb-8 reveal-zoom-3">
        {/* Garage customization */}
        <button
          onClick={() => setGameState('garage')}
          className="flex-1 flex items-center justify-center gap-2 bg-transparent border-2 border-cyber-magenta text-cyber-magenta font-extrabold uppercase py-3.5 px-6 rounded-xl text-sm tracking-widest hover:bg-cyber-magenta hover:text-white transition duration-300 border-glow-magenta"
        >
          <Sliders size={18} /> Garage
        </button>

        {/* Play Quick Race */}
        <button
          onClick={startRace}
          className="flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r from-cyber-cyan to-cyber-blue text-cyber-darker font-black uppercase py-3.5 px-6 rounded-xl text-sm tracking-widest hover:scale-[1.03] hover:from-cyber-cyan hover:to-cyber-cyan transition duration-300 border-glow-cyan shadow-[0_0_15px_rgba(0,243,255,0.3)]"
        >
          <Play fill="currentColor" size={18} /> START RACE
        </button>

        {/* Local leaderboard */}
        <button
          onClick={() => setGameState('finished')}
          className="flex-1 flex items-center justify-center gap-2 bg-transparent border-2 border-cyber-cyan text-cyber-cyan font-extrabold uppercase py-3.5 px-6 rounded-xl text-sm tracking-widest hover:bg-cyber-cyan hover:text-cyber-darker transition duration-300 border-glow-cyan"
        >
          <Trophy size={18} /> Records
        </button>
      </div>

      {/* Footer watermark */}
      <div className="text-[9px] text-gray-600 font-mono tracking-widest uppercase mb-1">
        ANTIGRAVITY SYSTEMS v1.1.0 &bull; LOCAL PERSIST ACTIVE
      </div>
    </div>
  );
}
