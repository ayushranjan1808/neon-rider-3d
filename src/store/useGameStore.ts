import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LapRecord {
  alias: string;
  time: number;
  date: string;
}

export interface GhostFrame {
  pos: [number, number, number];
  rot: [number, number, number];
  speed: number;
  time: number;
}

export interface AICarProgress {
  id: number;
  t: number;
  lap: number;
  color: string;
}

export interface NitroCanister {
  id: number;
  t: number;
  collected: boolean;
  respawnTimer?: number;
}

export interface GameStore {
  // Persisted state
  alias: string;
  carColor: string;
  bestLapTime: number | null;
  ghostPositions: GhostFrame[] | null;
  highScores: LapRecord[];
  unlockedTracks: string[];
  currentTrack: string;
  enableTiltSteering: boolean;

  // Runtime state
  gameState: 'login' | 'menu' | 'garage' | 'countdown' | 'racing' | 'paused' | 'finished';
  currentLapTime: number;
  lapTimes: number[];
  currentLap: number;
  maxLaps: number;
  playerSpeed: number;
  playerRank: number;
  touchThrottle: boolean;
  touchBrake: boolean;
  isRefueling: boolean;
  refuelCountdown: number;
  nitroCount: number;
  isNitroActive: boolean;
  nitroTimer: number;
  playerT: number;
  aiProgress: AICarProgress[];
  nitroCanisters: NitroCanister[];

  // Actions
  setAlias: (alias: string) => void;
  setCarColor: (color: string) => void;
  setEnableTiltSteering: (enabled: boolean) => void;
  setGameState: (state: 'login' | 'menu' | 'garage' | 'countdown' | 'racing' | 'paused' | 'finished') => void;
  startRace: () => void;
  pauseRace: () => void;
  resumeRace: () => void;
  resetRace: () => void;
  completeLap: (lapTime: number, ghostData: GhostFrame[]) => void;
  finishRace: () => void;
  updatePlayerHUD: (speed: number, rank: number, lap: number) => void;
  updateLapTime: (dt: number) => void;
  setTouchThrottle: (active: boolean) => void;
  setTouchBrake: (active: boolean) => void;
  startRefueling: () => void;
  updateRefuelCountdown: (dt: number) => void;
  consumeNitro: () => void;
  tickNitro: (dt: number) => void;
  collectNitroCanister: (id: number) => void;
  tickNitroCanisters: (dt: number) => void;
  updatePlayerT: (t: number) => void;
  updateAIProgress: (progress: AICarProgress[]) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Default Persisted State
      alias: '',
      carColor: '#00f3ff', // Cyan
      bestLapTime: null,
      ghostPositions: null,
      highScores: [
        { alias: 'Synapse Bot', time: 39.5, date: '2026-06-19' },
        { alias: 'Phantom Bot', time: 42.2, date: '2026-06-19' },
        { alias: 'Zenith Bot', time: 46.8, date: '2026-06-19' }
      ],
      unlockedTracks: ['Neon Circuit'],
      currentTrack: 'Neon Circuit',
      enableTiltSteering: false,

      // Default Runtime State
      gameState: 'login',
      currentLapTime: 0,
      lapTimes: [],
      currentLap: 1,
      maxLaps: 3,
      playerSpeed: 0,
      playerRank: 4,
      touchThrottle: false,
      touchBrake: false,
      isRefueling: false,
      refuelCountdown: 0,
      nitroCount: 3,
      isNitroActive: false,
      nitroTimer: 0,
      playerT: 0,
      aiProgress: [],
      nitroCanisters: [
        { id: 0, t: 0.08, collected: false },
        { id: 1, t: 0.26, collected: false },
        { id: 2, t: 0.44, collected: false },
        { id: 3, t: 0.62, collected: false },
        { id: 4, t: 0.80, collected: false },
      ],

      setAlias: (alias) => set({ alias }),
      setCarColor: (carColor) => set({ carColor }),
      setEnableTiltSteering: (enableTiltSteering) => set({ enableTiltSteering }),
      setGameState: (gameState) => set({ gameState }),

      startRace: () => set({
        gameState: 'countdown',
        currentLapTime: 0,
        lapTimes: [],
        currentLap: 1,
        playerSpeed: 0,
        playerRank: 4,
        isRefueling: false,
        refuelCountdown: 0,
        nitroCount: 3,
        isNitroActive: false,
        nitroTimer: 0,
        playerT: 0,
        aiProgress: [],
        nitroCanisters: [
          { id: 0, t: 0.08, collected: false },
          { id: 1, t: 0.26, collected: false },
          { id: 2, t: 0.44, collected: false },
          { id: 3, t: 0.62, collected: false },
          { id: 4, t: 0.80, collected: false },
        ]
      }),

      pauseRace: () => set({ gameState: 'paused' }),
      resumeRace: () => set({ gameState: 'racing' }),

      resetRace: () => set({
        gameState: 'menu',
        currentLapTime: 0,
        lapTimes: [],
        currentLap: 1,
        playerSpeed: 0,
        playerRank: 4,
        isRefueling: false,
        refuelCountdown: 0,
        nitroCount: 3,
        isNitroActive: false,
        nitroTimer: 0,
        playerT: 0,
        aiProgress: [],
        nitroCanisters: [
          { id: 0, t: 0.08, collected: false },
          { id: 1, t: 0.26, collected: false },
          { id: 2, t: 0.44, collected: false },
          { id: 3, t: 0.62, collected: false },
          { id: 4, t: 0.80, collected: false },
        ]
      }),

      completeLap: (lapTime, ghostData) => {
        const { bestLapTime, alias } = get();
        
        // Is this lap time faster than our previous best?
        const isNewBest = bestLapTime === null || lapTime < bestLapTime;

        set((state) => {
          const updatedLapTimes = [...state.lapTimes, lapTime];
          const isFinalLap = state.currentLap >= state.maxLaps;
          
          let nextState: Partial<GameStore> = {
            lapTimes: updatedLapTimes
          };

          const newBestTime = isNewBest ? lapTime : state.bestLapTime;
          const newGhostPositions = isNewBest ? ghostData : state.ghostPositions;

          if (isNewBest) {
            nextState.bestLapTime = newBestTime;
            nextState.ghostPositions = newGhostPositions;
          }

          if (isFinalLap) {
            // Race finished
            
            // Add a high score record for the player's best single lap from this race
            const bestLapInThisRace = Math.min(...updatedLapTimes);
            const raceRecord: LapRecord = {
              alias: alias || 'Player',
              time: Number(bestLapInThisRace.toFixed(2)),
              date: new Date().toISOString().split('T')[0]
            };

            // Insert new score, sort ascending (faster times first), keep top 10
            const newHighScores = [...state.highScores, raceRecord]
              .sort((a, b) => a.time - b.time)
              .slice(0, 10);

            nextState.highScores = newHighScores;
            nextState.gameState = 'finished';
          } else {
            // Advance to next lap
            nextState.currentLap = state.currentLap + 1;
            nextState.currentLapTime = 0;
            nextState.nitroCanisters = state.nitroCanisters.map(c => ({
              ...c,
              collected: false,
              respawnTimer: undefined
            }));
          }

          return nextState;
        });
      },

      finishRace: () => set({ gameState: 'finished' }),

      updatePlayerHUD: (speed, rank, lap) => set({
        playerSpeed: speed,
        playerRank: rank,
        currentLap: lap
      }),

      updateLapTime: (dt) => set((state) => {
        if (state.gameState === 'racing') {
          return { currentLapTime: state.currentLapTime + dt };
        }
        return {};
      }),
      setTouchThrottle: (touchThrottle) => set({ touchThrottle }),
      setTouchBrake: (touchBrake) => set({ touchBrake }),
      startRefueling: () => set({ isRefueling: true, refuelCountdown: 3.0 }),
      updateRefuelCountdown: (dt) => set((state) => {
        if (!state.isRefueling) return {};
        const nextVal = state.refuelCountdown - dt;
        if (nextVal <= 0) {
          return { isRefueling: false, refuelCountdown: 0 };
        }
        return { refuelCountdown: nextVal };
      }),
      consumeNitro: () => set((state) => {
        if (state.nitroCount > 0 && !state.isNitroActive) {
          return {
            nitroCount: state.nitroCount - 1,
            isNitroActive: true,
            nitroTimer: 3.0
          };
        }
        return {};
      }),
      tickNitro: (dt) => set((state) => {
        if (!state.isNitroActive) return {};
        const nextTimer = state.nitroTimer - dt;
        if (nextTimer <= 0) {
          return { isNitroActive: false, nitroTimer: 0 };
        }
        return { nitroTimer: nextTimer };
      }),
      collectNitroCanister: (id) => set((state) => {
        const nextCount = Math.min(state.nitroCount + 1, 3);
        const updated = state.nitroCanisters.map(c => 
          c.id === id ? { ...c, collected: true, respawnTimer: 12.0 } : c
        );
        return {
          nitroCanisters: updated,
          nitroCount: nextCount
        };
      }),
      tickNitroCanisters: (dt) => set((state) => {
        const updated = state.nitroCanisters.map(c => {
          if (c.collected && c.respawnTimer !== undefined) {
            const nextTimer = c.respawnTimer - dt;
            if (nextTimer <= 0) {
              return { ...c, collected: false, respawnTimer: undefined };
            }
            return { ...c, respawnTimer: nextTimer };
          }
          return c;
        });
        return { nitroCanisters: updated };
      }),
      updatePlayerT: (playerT) => set((state) => {
        const playerProgress = (state.currentLap - 1) + playerT;
        let rank = 1;
        state.aiProgress.forEach((bot) => {
          const botProgress = bot.lap + bot.t;
          if (botProgress > playerProgress) {
            rank += 1;
          }
        });
        return { playerT, playerRank: rank };
      }),
      updateAIProgress: (aiProgress) => set((state) => {
        const playerProgress = (state.currentLap - 1) + state.playerT;
        let rank = 1;
        aiProgress.forEach((bot) => {
          const botProgress = bot.lap + bot.t;
          if (botProgress > playerProgress) {
            rank += 1;
          }
        });
        return { aiProgress, playerRank: rank };
      })
    }),
    {
      name: 'neon-rider-storage',
      // Store persistent values only, exclude runtime states
      partialize: (state) => ({
        alias: state.alias,
        carColor: state.carColor,
        bestLapTime: state.bestLapTime,
        ghostPositions: state.ghostPositions,
        highScores: state.highScores,
        unlockedTracks: state.unlockedTracks,
        currentTrack: state.currentTrack,
        enableTiltSteering: state.enableTiltSteering,
      })
    }
  )
);
