import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Terminal, Shield, Zap } from 'lucide-react';

export function Login() {
  const currentAlias = useGameStore((state) => state.alias);
  const setAlias = useGameStore((state) => state.setAlias);
  const setGameState = useGameStore((state) => state.setGameState);
  const [inputValue, setInputValue] = useState(currentAlias);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError('CALLSIGN BLANK. ENTRY REQUIRED.');
      return;
    }
    setAlias(trimmed);
    setGameState('menu');
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-8 bg-cyber-darker/95 text-white font-sans overflow-hidden scanlines">
      {/* Moving Cyber Grid Background */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* Top spacing */}
      <div />

      {/* Main Title Section - Stagger 1 */}
      <div className="z-10 flex flex-col items-center text-center reveal-zoom-1">
        <div className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-cyber-cyan bg-cyber-cyan/5 border-glow-cyan mb-6">
          <Zap className="text-cyber-cyan animate-pulse" size={32} />
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-white to-cyber-magenta select-none">
          NEON RIDER 3D
        </h1>
        <p className="text-cyber-cyan text-xs tracking-[0.25em] uppercase mt-3 text-glow-cyan">
          ESTABLISHING CYBER CIRCUIT UPLINK
        </p>
      </div>

      {/* Input Credentials Card - Stagger 2 */}
      <form
        onSubmit={handleSubmit}
        className="z-10 w-full max-w-md bg-cyber-dark/85 border border-cyber-cyan/35 p-8 rounded-2xl border-glow-cyan backdrop-blur-xl flex flex-col gap-6 reveal-zoom-2"
      >
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Terminal className="text-cyber-cyan" size={20} />
          <h2 className="text-lg font-bold tracking-widest text-cyber-cyan uppercase">
            PILOT IDENTITY GATEWAY
          </h2>
        </div>

        <p className="text-xs text-gray-400 font-mono leading-relaxed">
          UPLINK CODE: SECURE_COMMS_v4.2. ENTER YOUR PILOT CALLSIGN TO SYNCHRONIZE YOUR RACE RECORDS, LAP TIMES, AND CUSTOMIZATIONS TO LOCAL CACHE.
        </p>

        <div className="relative mt-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value.toUpperCase());
              if (error) setError('');
            }}
            className={`w-full bg-cyber-darker/60 border border-white/10 border-b-2 ${
              error ? 'border-b-red-500' : 'border-b-cyber-cyan'
            } py-4 px-4 rounded-lg text-xl font-black text-white focus:outline-none focus:border-b-cyber-magenta focus:bg-cyber-darker/90 transition-all uppercase tracking-widest placeholder-white/20`}
            placeholder="PILOT CALLSIGN"
            maxLength={16}
            autoFocus
          />
          <span className="absolute right-4 top-4.5 text-[10px] text-cyber-cyan/45 font-mono">
            SECURE LOG
          </span>
        </div>

        {error && (
          <div className="text-red-500 text-xs font-mono tracking-wider animate-bounce">
            ⚠️ {error}
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] text-white/55 font-mono mt-1">
          <Shield size={12} className="text-cyber-magenta" />
          <span>ENCRYPTION ACTIVE &bull; LOCAL PERSISTENCE LAYER READY</span>
        </div>
      </form>

      {/* Submit Button & Interactive Area - Stagger 3 */}
      <div className="z-10 w-full max-w-sm mb-12 flex flex-col items-center gap-4 reveal-zoom-3">
        <button
          onClick={handleSubmit}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyber-cyan to-cyber-blue text-cyber-darker font-black text-lg uppercase py-4 px-8 rounded-xl tracking-widest hover:scale-105 active:scale-95 transition-all duration-300 border-glow-cyan shadow-[0_0_15px_rgba(0,243,255,0.4)]"
        >
          INITIALIZE COMMS
        </button>

        <div className="text-[9px] text-gray-500 font-mono tracking-[0.2em] uppercase">
          ANTIGRAVITY PROPULSION SYSTEMS &bull; OFFLINE CAPABLE
        </div>
      </div>
    </div>
  );
}
