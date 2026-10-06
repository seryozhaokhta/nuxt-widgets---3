// Epochs and water bodies for tools/geo/build.mjs.
//
// Global sea level follows Lambeck et al. 2014, "Sea level and global ice
// volumes from the Last Glacial Maximum to the Holocene" (PNAS 111:15296).
// Values are rounded and local effects (isostasy, deltas, tectonics) are
// ignored, so coastlines are an approximation at 1/6 degree.
//
// Megachad: the giant lake of the "Green Sahara" (African Humid Period).
// Its highest shoreline sits at about 329 m (Drake & Bristow 2006); today's
// Lake Chad is at about 280 m. Intermediate levels are rough guesses.

export const OUT_DIR = 'apps/playground/public/geo'

/** Seeds are [lat, lon]. Without `level` the epoch's sea level applies. */
export const SEAS = [
  { id: 'pacific', seed: [0, -150] },
  { id: 'atlantic', seed: [0, -30] },
  { id: 'indian', seed: [-30, 80] },
  { id: 'arctic', seed: [85, 0] },
  { id: 'southern', seed: [-60, 0] },
  // Straits narrower than the grid would cut these off from the ocean.
  { id: 'mediterranean', seed: [35, 18] },
  { id: 'red', seed: [20, 38.5] },
  { id: 'marmara', seed: [40.8, 28] },
  // Simplification: the Black Sea follows the global level (it was a lower
  // lake before ~5600 BCE); the Baltic and the Caspian keep today's levels.
  { id: 'black', seed: [43.3, 34] },
  { id: 'baltic', seed: [57.5, 19.5], level: 0 },
  { id: 'caspian', seed: [42, 51], level: -28 },
]

/** Lakes whose level changes by epoch (altitude in metres). */
export const LAKES = [
  { id: 'chad', seed: [13, 14.5] },
]

export const EPOCHS = [
  { id: 'bce10000', year: -10000, seaLevel: -55, lakes: { chad: 300 } },
  { id: 'bce8000', year: -8000, seaLevel: -35, lakes: { chad: 320 } },
  { id: 'bce6000', year: -6000, seaLevel: -15, lakes: { chad: 329 } },
  { id: 'bce4000', year: -4000, seaLevel: -3, lakes: { chad: 310 } },
  { id: 'bce2000', year: -2000, seaLevel: -1, lakes: { chad: 285 } },
]
