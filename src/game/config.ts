/** Tunable movement / rope values — edit here to feel out controls. */
export const CONFIG = {
  // World / player body
  playerRadius: 18,

  // Ground & jump
  moveSpeed: 300,
  jumpVelocity: -680,
  gravity: 1650,
  maxFallSpeed: 950,

  // Air (not attached)
  airControl: 420,
  airMaxSpeed: 320,

  // Global stability
  maxSpeed: 980,

  // Rope attach
  maxAttachDistance: 280,
  minRopeLength: 48,
  maxRopeLength: 260,
  anchorHitRadius: 24,
  reattachCooldown: 0.28,

  // Rope while attached
  ropeReelSpeed: 200,
  swingForce: 720,
  releaseBoost: 260,
} as const

export type Config = typeof CONFIG
