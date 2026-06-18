import { useGameStore } from '../store/useGameStore';
import { Trophy, Home, Award, Calendar, Timer } from 'lucide-react';

export function Leaderboard() {
  const highScores = useGameStore((state) => state.highScores);
  const bestLapTime = useGameStore((state) => state.bestLapTime);
  const resetRace = useGameStore((state) => state.resetRace);

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-8 bg-cyber-darker/95 text-white font-sans overflow-hidden scanlines">
      
      {/* Scroll Grid background */}
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="mt-6 z-10 flex flex-col items-center text-center">
        <div className="bg-cyber-cyan/10 border border-cyber-cyan/30 p-3 rounded-full border-glow-cyan mb-2">
          <Trophy className="text-cyber-cyan animate-bounce" size={28} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-widest text-white uppercase text-glow-cyan">
          NEON REGISTRY
        </h1>
        <p className="text-xs text-cyber-cyan tracking-widest uppercase font-mono mt-2">
          Sector 4 local best lap times
        </p>
      </div>

      {/* Leaderboard Table Card */}
      <div className="z-10 w-full max-w-2xl bg-cyber-dark/80 border border-cyber-cyan/30 rounded-lg p-6 flex-1 my-6 overflow-y-auto border-glow-cyan max-h-[60vh]">
        
        {/* Personal Best Summary */}
        <div className="flex justify-between items-center bg-cyber-cyan/5 border border-cyber-cyan/20 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <Timer className="text-cyber-cyan" size={20} />
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Personal Record</p>
              <p className="text-xl font-bold font-mono text-white">
                {bestLapTime ? `${bestLapTime.toFixed(2)}s` : 'NO RECORD YET'}
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-cyber-cyan/20 border border-cyber-cyan/40 text-cyber-cyan py-1 px-3.5 rounded-full uppercase tracking-wider font-bold">
            Verified
          </span>
        </div>

        {/* Board table */}
        <table className="w-full text-left font-mono text-sm">
          <thead>
            <tr className="text-gray-400 text-xs border-b border-white/5 pb-2">
              <th className="py-2 w-16">RANK</th>
              <th className="py-2">DRIVER CALLSIGN</th>
              <th className="py-2 text-right">LAP TIME</th>
              <th className="py-2 text-right hidden sm:table-cell">RECORD DATE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {highScores.map((score, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;
              const rowColor = 
                rank === 1 ? 'text-cyber-yellow' : 
                rank === 2 ? 'text-gray-300' : 
                rank === 3 ? 'text-orange-400' : 'text-gray-400';

              return (
                <tr 
                  key={index} 
                  className={`hover:bg-white/5 transition duration-150 ${isTop3 ? 'font-bold' : ''}`}
                >
                  <td className="py-3.5 flex items-center gap-1.5">
                    {rank === 1 && <Award size={14} className="text-cyber-yellow" />}
                    {rank === 2 && <Award size={14} className="text-gray-300" />}
                    {rank === 3 && <Award size={14} className="text-orange-400" />}
                    <span className={rowColor}>#{rank.toString().padStart(2, '0')}</span>
                  </td>
                  <td className="py-3.5 text-white uppercase tracking-wider">{score.alias}</td>
                  <td className="py-3.5 text-right font-bold text-cyber-cyan text-glow-cyan">
                    {score.time.toFixed(2)}s
                  </td>
                  <td className="py-3.5 text-right text-gray-500 text-xs hidden sm:table-cell">
                    <span className="flex items-center justify-end gap-1">
                      <Calendar size={12} /> {score.date}
                    </span>
                  </td>
                </tr>
              );
            })}

            {highScores.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500 uppercase tracking-wider">
                  No records stored yet. Drive a race to set a time!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Exit Button */}
      <div className="z-10 w-full max-w-xs mb-4">
        <button
          onClick={resetRace}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyber-cyan to-cyber-blue text-cyber-darker font-black uppercase py-4 rounded-lg tracking-widest hover:scale-105 transition border-glow-cyan"
        >
          <Home size={18} /> Main Menu
        </button>
      </div>

      <div className="text-[10px] text-gray-600 font-mono tracking-widest uppercase mb-2">
        DATA NETWORK SECURE &bull; LOCAL STORAGE ENCRYPTED
      </div>
    </div>
  );
}
