import { useEffect, useState, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Play, RotateCcw, Home, Pause, Flame } from 'lucide-react';
import { TRACK_CURVE } from './Track';

export function HUD() {
  const gameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);
  const currentLapTime = useGameStore((state) => state.currentLapTime);
  const bestLapTime = useGameStore((state) => state.bestLapTime);
  const currentLap = useGameStore((state) => state.currentLap);
  const maxLaps = useGameStore((state) => state.maxLaps);
  const playerSpeed = useGameStore((state) => state.playerSpeed);
  const playerRank = useGameStore((state) => state.playerRank);
  const isRefueling = useGameStore((state) => state.isRefueling);
  const refuelCountdown = useGameStore((state) => state.refuelCountdown);
  const playerT = useGameStore((state) => state.playerT);
  const aiProgress = useGameStore((state) => state.aiProgress);
  const carColor = useGameStore((state) => state.carColor);
  const nitroCount = useGameStore((state) => state.nitroCount);

  // Minimap pathing calculations auto-scaled to 120x120 SVG box
  const minimapConfig = useMemo(() => {
    const points: { x: number; z: number }[] = [];
    const steps = 80;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    for (let i = 0; i <= steps; i++) {
      const pt = TRACK_CURVE.getPointAt(i / steps);
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.z < minZ) minZ = pt.z;
      if (pt.z > maxZ) maxZ = pt.z;
      points.push({ x: pt.x, z: pt.z });
    }

    const pad = 10;
    const svgW = 120;
    const svgH = 120;
    
    const scaleX = (svgW - 2 * pad) / (maxX - minX);
    const scaleZ = (svgH - 2 * pad) / (maxZ - minZ);
    const scale = Math.min(scaleX, scaleZ);

    const offsetX = pad - minX * scale + (svgW - 2 * pad - (maxX - minX) * scale) / 2;
    const offsetZ = pad - minZ * scale + (svgH - 2 * pad - (maxZ - minZ) * scale) / 2;

    const pathData = `M ${points[0].x * scale + offsetX} ${points[0].z * scale + offsetZ} ` +
      points.slice(1).map(p => `L ${p.x * scale + offsetX} ${p.z * scale + offsetZ}`).join(' ') + ' Z';

    return {
      scale,
      offsetX,
      offsetZ,
      pathData
    };
  }, []);

  const get2DCoords = (t: number) => {
    const pt = TRACK_CURVE.getPointAt(t % 1.0);
    return {
      x: pt.x * minimapConfig.scale + minimapConfig.offsetX,
      y: pt.z * minimapConfig.scale + minimapConfig.offsetZ
    };
  };

  const playerPos = get2DCoords(playerT);
  
  const startRace = useGameStore((state) => state.startRace);
  const resetRace = useGameStore((state) => state.resetRace);
  const updateLapTime = useGameStore((state) => state.updateLapTime);

  // Touch triggers
  const setTouchThrottle = useGameStore((state) => state.setTouchThrottle);
  const setTouchBrake = useGameStore((state) => state.setTouchBrake);

  // Countdown timer local state
  const [countdownText, setCountdownText] = useState('3');

  // Trigger countdown timer sequence
  useEffect(() => {
    if (gameState !== 'countdown') return;

    setCountdownText('3');
    
    const t1 = setTimeout(() => setCountdownText('2'), 1000);
    const t2 = setTimeout(() => setCountdownText('1'), 2000);
    const t3 = setTimeout(() => setCountdownText('GO!'), 3000);
    const t4 = setTimeout(() => {
      setGameState('racing');
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [gameState, setGameState]);

  // Update elapsed lap time in Zustand store on frame ticks
  useEffect(() => {
    let lastTime = performance.now();
    let frameId: number;

    const tick = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (gameState === 'racing') {
        updateLapTime(dt);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [gameState, updateLapTime]);

  // Helper: Format elapsed seconds to M:SS.CC
  const formatTime = (secs: number) => {
    if (secs === Infinity || secs === null || isNaN(secs)) return '--:--.--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const c = Math.floor((secs % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${c.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none text-white font-sans select-none">
      
      {/* ================= 1. Pre-Race Countdown Overlay ================= */}
      {gameState === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md pointer-events-auto">
          <h1 className="text-9xl md:text-[12rem] font-black text-white animate-ping tracking-wider select-none">
            {countdownText}
          </h1>
        </div>
      )}

      {/* ================= Refueling/Repair Overlay ================= */}
      {isRefueling && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-auto z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin mb-4 flex items-center justify-center">
              <Flame className="text-yellow-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-wider text-yellow-400 uppercase mb-2">PIT STOP SERVICE</h2>
            <p className="text-sm text-white/70 mb-6 font-medium">REPAIRING & REFUELING VEHICLE</p>
            <div className="text-5xl font-black font-mono text-white">
              <span id="hud-refuel-countdown">{Math.ceil(refuelCountdown)}</span>s
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. Main Racing HUD elements ================= */}
      {(gameState === 'racing' || gameState === 'paused') && (
        <>
          {/* Top Panel: Times and Laps */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
            
            {/* Laps and Records (Top Left Panel - Sleek Modern White/Grey) */}
            <div className="flex flex-col gap-1.5 bg-black/25 backdrop-blur-lg border border-white/10 p-4 rounded-xl shadow-lg">
              <div className="text-xs text-white/50 tracking-widest uppercase font-bold">
                LAP <span id="hud-lap-value" className="text-lg font-bold text-white ml-1.5">{currentLap}</span> / {maxLaps}
              </div>
              <div className="h-px bg-white/5 w-full my-0.5" />
              <div className="text-sm font-medium tracking-wide space-y-1">
                <p className="flex justify-between gap-4">
                  <span className="text-white/40">TIME:</span>
                  <span id="hud-time-value" className="font-bold text-white font-mono">{formatTime(currentLapTime)}</span>
                </p>
                <p className="flex justify-between gap-4">
                  <span className="text-white/40">BEST:</span>
                  <span id="hud-best-time" className="font-bold text-white font-mono">
                    {bestLapTime ? formatTime(bestLapTime) : '--:--.--'}
                  </span>
                </p>
              </div>

              {/* Nitro Canister HUD Indicator Slots */}
              <div className="h-px bg-white/5 w-full my-1.5" />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] text-white/40 font-bold tracking-widest uppercase flex items-center gap-1">
                  <Flame size={11} className="text-cyan-400 animate-pulse" /> NITRO
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-3.5 h-4.5 rounded-sm border border-white/10 transition-all duration-300 ${
                        idx < nitroCount
                          ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                          : 'bg-white/5'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Top Right Panel: Pause Button & SVG Minimap */}
            <div className="flex flex-col items-end gap-3">
              <button
                onClick={() => setGameState('paused')}
                className="pointer-events-auto bg-black/25 backdrop-blur-lg border border-white/10 hover:bg-white/10 p-3.5 rounded-xl shadow-lg transition duration-200"
              >
                <Pause size={18} className="text-white" />
              </button>

              {/* SVG Minimap System */}
              <div className="bg-black/25 backdrop-blur-lg border border-white/10 p-3 rounded-xl shadow-lg w-36 h-36 flex items-center justify-center pointer-events-auto">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  {/* Track Outline Path */}
                  <path
                    d={minimapConfig.pathData}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Checkered flag start/finish line */}
                  {(() => {
                    const startCoords = get2DCoords(0.0);
                    return (
                      <g transform={`translate(${startCoords.x - 6}, ${startCoords.y - 6})`}>
                        <rect width="12" height="12" fill="white" stroke="black" strokeWidth="0.5" />
                        <rect width="4" height="4" fill="black" />
                        <rect x="8" width="4" height="4" fill="black" />
                        <rect x="4" y="4" width="4" height="4" fill="black" />
                        <rect y="8" width="4" height="4" fill="black" />
                        <rect x="8" y="8" width="4" height="4" fill="black" />
                      </g>
                    );
                  })()}

                  {/* Dots representing AI cars */}
                  {aiProgress.map((bot) => {
                    const coords = get2DCoords(bot.t);
                    return (
                      <circle
                        key={bot.id}
                        cx={coords.x}
                        cy={coords.y}
                        r="4"
                        fill={bot.color}
                        stroke="white"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Dot representing Player */}
                  <circle
                    cx={playerPos.x}
                    cy={playerPos.y}
                    r="5"
                    fill={carColor}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom Left Panel: Race Ranking Position */}
          <div className="absolute bottom-6 left-6 bg-black/25 backdrop-blur-lg border border-white/10 p-4 rounded-xl shadow-lg flex items-center gap-3">
            <div className="text-xs text-white/40 font-bold uppercase tracking-widest">
              POSITION
            </div>
            <div className="text-2xl font-bold">
              <span id="hud-rank-value">{playerRank}</span> <span className="text-sm text-white/40 font-medium">/ 4</span>
            </div>
          </div>

          {/* Bottom Right Panel: Circular Digital Speedometer Dial */}
          <div className="absolute bottom-6 right-6 flex items-center justify-center pointer-events-auto">
            <div className="relative w-32 h-32 flex items-center justify-center bg-black/25 backdrop-blur-lg border border-white/10 rounded-full shadow-2xl">
              
              {/* SVG Gauge Ring */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="5"
                  fill="transparent"
                />
                {/* Filled Speed Ring */}
                <circle
                  id="hud-speed-ring"
                  cx="64"
                  cy="64"
                  r="54"
                  stroke="rgba(255, 255, 255, 0.85)"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray="339" /* 2 * PI * 54 = ~339.29 */
                  strokeDashoffset="339"
                  className="transition-all duration-75 ease-out"
                />
              </svg>
              
              {/* Center digital speed metrics */}
              <div className="text-center z-10 flex flex-col">
                <span id="hud-speed-value" className="text-3xl font-black leading-none font-sans tracking-tight">
                  {playerSpeed}
                </span>
                <span className="text-[9px] text-white/40 font-bold tracking-widest uppercase mt-1">
                  KM/H
                </span>
              </div>
            </div>
          </div>

          {/* Speed Boost Notification (Sleek Modern bar) */}
          {playerSpeed > 150 && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-lg border border-white/20 text-white py-2 px-5 rounded-full font-bold tracking-wider text-xs uppercase animate-pulse shadow-md">
              <Flame size={14} className="text-orange-400" /> Nitro Boost Active
            </div>
          )}

          {/* ================= 2.1 Controls & Instructions Overlays ================= */}
          {gameState === 'racing' && (
            <>
              {/* Desktop driving text guide */}
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-center select-none animate-pulse pointer-events-none text-xs text-white/40 font-medium tracking-wider hidden md:block uppercase">
                W / Arrow Up to accelerate &bull; S / Arrow Down to brake &bull; Space to drift
              </div>

              {/* Touch Control Overlay for Mobile Screens */}
              <div className="absolute inset-0 pointer-events-none md:hidden z-10">
                {/* Left corner: Brake/Reverse pedal zone */}
                <div className="absolute bottom-6 left-6 pointer-events-auto">
                  <button
                    onTouchStart={(e) => { e.preventDefault(); setTouchBrake(true); }}
                    onTouchEnd={(e) => { e.preventDefault(); setTouchBrake(false); }}
                    onMouseDown={() => setTouchBrake(true)}
                    onMouseUp={() => setTouchBrake(false)}
                    onMouseLeave={() => setTouchBrake(false)}
                    className="w-24 h-24 rounded-2xl border-2 border-cyber-magenta/40 bg-cyber-dark/40 active:bg-cyber-magenta/25 border-glow-magenta select-none touch-none active:scale-95 flex flex-col items-center justify-center font-black text-xs text-cyber-magenta uppercase tracking-widest focus:outline-none shadow-2xl backdrop-blur-sm transition-all duration-150"
                  >
                    <span className="text-[8px] text-white/30 font-medium">REVERSE</span>
                    <span>BRAKE</span>
                  </button>
                </div>

                {/* Right corner: Drive/Accelerate pedal zone */}
                <div className="absolute bottom-6 right-6 pointer-events-auto">
                  <button
                    onTouchStart={(e) => { e.preventDefault(); setTouchThrottle(true); }}
                    onTouchEnd={(e) => { e.preventDefault(); setTouchThrottle(false); }}
                    onMouseDown={() => setTouchThrottle(true)}
                    onMouseUp={() => setTouchThrottle(false)}
                    onMouseLeave={() => setTouchThrottle(false)}
                    className="w-24 h-24 rounded-2xl border-2 border-cyber-cyan/40 bg-cyber-dark/40 active:bg-cyber-cyan/25 border-glow-cyan select-none touch-none active:scale-95 flex flex-col items-center justify-center font-black text-xs text-cyber-cyan uppercase tracking-widest focus:outline-none shadow-2xl backdrop-blur-sm transition-all duration-150"
                  >
                    <span className="text-[8px] text-white/30 font-medium">NITRO FLAME</span>
                    <span>ACCEL</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ================= 3. Pause Menu Overlay ================= */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-auto">
          <div className="bg-black/35 backdrop-blur-xl border border-white/10 p-8 rounded-2xl max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center">
            
            <div className="border border-white/10 bg-white/5 p-3 rounded-full mb-4 shadow-inner">
              <Pause className="text-white" size={24} />
            </div>
            
            <h2 className="text-2xl font-bold tracking-wider uppercase mb-1">Game Paused</h2>
            <p className="text-[9px] text-white/35 font-mono tracking-widest uppercase mb-8">
              Sector 4 Circuit Node
            </p>

            <div className="flex flex-col gap-3.5 w-full">
              {/* Resume */}
              <button
                onClick={() => setGameState('racing')}
                className="flex items-center justify-center gap-2 bg-white text-black font-bold uppercase py-3 rounded-xl hover:scale-[1.02] transition duration-150 shadow-md"
              >
                <Play fill="currentColor" size={14} /> Resume Race
              </button>

              {/* Restart */}
              <button
                onClick={startRace}
                className="flex items-center justify-center gap-2 bg-transparent border border-white/15 hover:border-white/40 font-bold uppercase py-3 rounded-xl hover:bg-white/5 transition"
              >
                <RotateCcw size={14} /> Restart
              </button>

              {/* Exit */}
              <button
                onClick={resetRace}
                className="flex items-center justify-center gap-2 bg-transparent border border-white/10 text-white/60 font-bold uppercase py-3 rounded-xl hover:bg-white/5 transition"
              >
                <Home size={14} /> Quit Race
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
