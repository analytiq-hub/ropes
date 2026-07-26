import type { Vec2 } from './types.ts'
import { CONFIG } from './config.ts'

export interface PlayerState {
  position: Vec2
  velocity: Vec2
  radius: number
  grounded: boolean
  color: string
}

export function createPlayer(spawn: Vec2): PlayerState {
  return {
    position: { x: spawn.x, y: spawn.y },
    velocity: { x: 0, y: 0 },
    radius: CONFIG.playerRadius,
    grounded: false,
    color: '#5ec8ff',
  }
}

export function resetPlayer(player: PlayerState, spawn: Vec2): void {
  player.position.x = spawn.x
  player.position.y = spawn.y
  player.velocity.x = 0
  player.velocity.y = 0
  player.grounded = false
  player.radius = CONFIG.playerRadius
}

export function playerSpeed(player: PlayerState): number {
  return Math.hypot(player.velocity.x, player.velocity.y)
}

export function clampPlayerSpeed(player: PlayerState): void {
  const speed = playerSpeed(player)
  if (speed > CONFIG.maxSpeed && speed > 0) {
    const scale = CONFIG.maxSpeed / speed
    player.velocity.x *= scale
    player.velocity.y *= scale
  }
}

export function sanitizePlayer(player: PlayerState, fallback: Vec2): void {
  if (!Number.isFinite(player.position.x) || !Number.isFinite(player.position.y)) {
    player.position.x = fallback.x
    player.position.y = fallback.y
  }
  if (!Number.isFinite(player.velocity.x) || !Number.isFinite(player.velocity.y)) {
    player.velocity.x = 0
    player.velocity.y = 0
  }
  clampPlayerSpeed(player)
}

export function applyReleaseBoost(player: PlayerState): void {
  const speed = playerSpeed(player)
  if (speed < 8) {
    // Nearly still: give a small upward kick so the boost is still useful.
    player.velocity.y -= CONFIG.releaseBoost * 0.55
    return
  }
  const nx = player.velocity.x / speed
  const ny = player.velocity.y / speed
  player.velocity.x += nx * CONFIG.releaseBoost
  player.velocity.y += ny * CONFIG.releaseBoost
  clampPlayerSpeed(player)
}

export function updatePlayerMovement(
  player: PlayerState,
  input: { left: boolean; right: boolean; jump: boolean },
  dt: number,
  swinging: boolean,
): void {
  let move = 0
  if (input.left) move -= 1
  if (input.right) move += 1

  if (swinging) {
    // Tangential-ish swing force: push horizontally; rope constraint shapes the arc.
    player.velocity.x += move * CONFIG.swingForce * dt
  } else if (player.grounded) {
    player.velocity.x = move * CONFIG.moveSpeed
  } else {
    // Slight air control when free-falling / jumping.
    player.velocity.x += move * CONFIG.airControl * dt
    const maxAir = CONFIG.airMaxSpeed
    if (player.velocity.x > maxAir) player.velocity.x = maxAir
    if (player.velocity.x < -maxAir) player.velocity.x = -maxAir
  }

  if (input.jump && player.grounded && !swinging) {
    player.velocity.y = CONFIG.jumpVelocity
    player.grounded = false
  }

  player.velocity.y = Math.min(
    player.velocity.y + CONFIG.gravity * dt,
    CONFIG.maxFallSpeed,
  )

  clampPlayerSpeed(player)

  player.position.x += player.velocity.x * dt
  player.position.y += player.velocity.y * dt
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
): void {
  ctx.beginPath()
  ctx.arc(player.position.x, player.position.y, player.radius, 0, Math.PI * 2)
  ctx.fillStyle = player.color
  ctx.fill()

  ctx.beginPath()
  ctx.arc(
    player.position.x - player.radius * 0.25,
    player.position.y - player.radius * 0.2,
    player.radius * 0.18,
    0,
    Math.PI * 2,
  )
  ctx.fillStyle = '#0a1224'
  ctx.fill()
}
