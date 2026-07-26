import type {
  Anchor,
  Collectible,
  ExitZone,
  Platform,
  RescueTarget,
  Vec2,
} from './types.ts'

export const WORLD_WIDTH = 960
export const WORLD_HEIGHT = 540

export const PLAYER_SPAWN: Vec2 = { x: 120, y: 360 }

export function createLevel(): Platform[] {
  const floorColor = '#3a4a6b'
  const platformColor = '#4d628a'

  return [
    {
      x: 0,
      y: WORLD_HEIGHT - 48,
      width: WORLD_WIDTH,
      height: 48,
      color: floorColor,
    },
    { x: 180, y: 400, width: 160, height: 22, color: platformColor },
    { x: 400, y: 320, width: 150, height: 22, color: platformColor },
    { x: 620, y: 250, width: 140, height: 22, color: platformColor },
    { x: 780, y: 380, width: 120, height: 22, color: platformColor },
    { x: 40, y: 260, width: 110, height: 22, color: platformColor },
    { x: 300, y: 180, width: 180, height: 22, color: platformColor },
    // High perch for the rescue target
    { x: 820, y: 120, width: 100, height: 22, color: platformColor },
    // Exit ledge
    { x: 20, y: 120, width: 90, height: 22, color: platformColor },
  ]
}

export function createAnchors(): Anchor[] {
  return [
    { x: 260, y: 300 },
    { x: 470, y: 220 },
    { x: 680, y: 160 },
    { x: 860, y: 280 },
    { x: 120, y: 160 },
    { x: 390, y: 90 },
    { x: 760, y: 70 },
  ]
}

/** Supply kits to collect before escape. */
export function createCollectibles(): Collectible[] {
  return [
    { x: 250, y: 370, radius: 12, collected: false },
    { x: 470, y: 280, radius: 12, collected: false },
    { x: 840, y: 340, radius: 12, collected: false },
  ]
}

/** Stranded survivor — touch to rescue. */
export function createRescueTarget(): RescueTarget {
  return { x: 870, y: 90, radius: 16, rescued: false }
}

/** Exit door — opens after kits collected and survivor rescued. */
export function createExitZone(): ExitZone {
  return { x: 28, y: 56, width: 74, height: 64, open: false }
}
