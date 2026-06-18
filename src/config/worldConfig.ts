// 3D coordinates representing the control nodes of the track spline curve.
// You can edit these points (X, Y, Z) to redesign the track path.
export const TRACK_COORDINATES: [number, number, number][] = [
  [0, 0, 0],         // Start/Finish Line
  [50, 0, -15],      // Straightaway 1
  [100, 1.5, -45],   // Soft rise
  [145, 5, -95],     // Banked corner (apex hill climb)
  [120, 8.5, -145],  // Downhill entry
  [60, 12, -165],    // Launch Ramp Start (takeoff ledge)
  [20, 15, -170],    // Launch Ramp Apex (jump gap)
  [-25, 7.5, -170],  // Landing Zone
  [-75, 4, -145],    // Slow banking left corner
  [-115, 0, -95],    // Sharp hairpin entry
  [-135, -0.5, -45], // Hairpin corner apex
  [-105, 0, 15],     // Out of hairpin, leading into chicanes
  [-65, 2.5, 45],    // Chicane S-curve entry
  [-25, 2.5, 25],    // Chicane S-curve exit
  [-10, 0, 15],      // Final straight transition
];

// Track specifications
export const TRACK_WIDTH = 22;

// Location of speed boost pads along the track spline (parameter t from 0.0 to 1.0)
export const BOOST_PADS_CONFIG = [
  { t: 0.05, name: 'Grid Launch Boost' },
  { t: 0.22, name: 'Climb Thrust Boost' },
  { t: 0.45, name: 'Ramp Acceleration Boost' },
  { t: 0.65, name: 'Hairpin Recovery Boost' },
  { t: 0.85, name: 'Chicane Entry Boost' },
];

// Positions of neon arches spanning across the track path (parameter t from 0.0 to 1.0)
export const NEON_ARCHES_CONFIG = [
  { t: 0.12, color: '#00f3ff' },
  { t: 0.28, color: '#ff007f' },
  { t: 0.38, color: '#39ff14' },
  { t: 0.52, color: '#00f3ff' }, // Arch right before the launch ramp
  { t: 0.58, color: '#ffe600' }, // Arch at takeoff
  { t: 0.72, color: '#ff007f' }, // Arch right after landing
  { t: 0.90, color: '#39ff14' },
];

// Location of pit stop service zones along the track (parameter t from 0.0 to 1.0)
// side: 1 = left, -1 = right
export const SERVICE_ZONES = [
  { t: 0.15, side: 1, name: 'Redline Pit Stop' },
  { t: 0.82, side: 1, name: 'Overdrive Refuel' }
];
