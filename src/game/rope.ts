import { CONFIG } from './config.ts'
import {
  clampPlayerSpeed,
  type PlayerState,
} from './player.ts'
import type { Anchor, Vec2 } from './types.ts'

export interface RopeState {
  attached: boolean
  anchor: Anchor | null
  /** Current max length for the distance constraint. */
  length: number
}

export function createRope(): RopeState {
  return {
    attached: false,
    anchor: null,
    length: 0,
  }
}

export function releaseRope(rope: RopeState): void {
  rope.attached = false
  rope.anchor = null
  rope.length = 0
}

export function tryAttachRope(
  rope: RopeState,
  player: PlayerState,
  anchor: Anchor,
): boolean {
  const dx = player.position.x - anchor.x
  const dy = player.position.y - anchor.y
  const dist = Math.hypot(dx, dy)

  if (
    !Number.isFinite(dist) ||
    dist <= 0 ||
    dist > CONFIG.maxAttachDistance
  ) {
    return false
  }

  rope.attached = true
  rope.anchor = anchor
  // Preserve momentum: only set the length constraint.
  rope.length = clampRopeLength(Math.min(dist, CONFIG.maxRopeLength))
  return true
}

export function clampRopeLength(length: number): number {
  return Math.min(
    CONFIG.maxRopeLength,
    Math.max(CONFIG.minRopeLength, length),
  )
}

/** Reel rope in/out with W/S or Up/Down. */
export function adjustRopeLength(
  rope: RopeState,
  player: PlayerState,
  reel: number,
  dt: number,
): void {
  if (!rope.attached || !rope.anchor || reel === 0) return

  rope.length = clampRopeLength(
    rope.length + reel * CONFIG.ropeReelSpeed * dt,
  )

  // If shortened past the current distance, pull the player in immediately.
  applyRopeConstraint(player, rope)
}

/**
 * Hard distance constraint: if the player drifts beyond rope length,
 * project them back onto the circle and remove outward radial velocity.
 */
export function applyRopeConstraint(player: PlayerState, rope: RopeState): void {
  if (!rope.attached || !rope.anchor) return

  const anchor = rope.anchor
  const dx = player.position.x - anchor.x
  const dy = player.position.y - anchor.y
  const dist = Math.hypot(dx, dy)

  if (!Number.isFinite(dist) || !Number.isFinite(dx) || !Number.isFinite(dy)) {
    releaseRope(rope)
    return
  }

  if (dist < 1e-4) {
    player.position.x = anchor.x + rope.length
    player.position.y = anchor.y
    return
  }

  if (dist > rope.length) {
    const nx = dx / dist
    const ny = dy / dist

    player.position.x = anchor.x + nx * rope.length
    player.position.y = anchor.y + ny * rope.length

    const radial = player.velocity.x * nx + player.velocity.y * ny
    if (radial > 0) {
      player.velocity.x -= radial * nx
      player.velocity.y -= radial * ny
    }
  }

  clampPlayerSpeed(player)
}

export function findHoveredAnchor(
  mouse: Vec2,
  anchors: readonly Anchor[],
): Anchor | null {
  let best: Anchor | null = null
  let bestDist: number = CONFIG.anchorHitRadius

  for (const anchor of anchors) {
    const dist = Math.hypot(mouse.x - anchor.x, mouse.y - anchor.y)
    if (dist <= bestDist) {
      bestDist = dist
      best = anchor
    }
  }

  return best
}

export function distanceToAnchor(player: PlayerState, anchor: Anchor): number {
  return Math.hypot(player.position.x - anchor.x, player.position.y - anchor.y)
}

export function drawAnchors(
  ctx: CanvasRenderingContext2D,
  anchors: readonly Anchor[],
  hovered: Anchor | null,
  player: PlayerState,
): void {
  for (const anchor of anchors) {
    const isHovered = hovered === anchor
    const inRange = distanceToAnchor(player, anchor) <= CONFIG.maxAttachDistance

    ctx.beginPath()
    ctx.arc(anchor.x, anchor.y, 8, 0, Math.PI * 2)
    ctx.fillStyle = isHovered
      ? inRange
        ? '#ffe066'
        : '#ff8a8a'
      : inRange
        ? '#f0c14a'
        : '#7a6a3a'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(anchor.x, anchor.y, isHovered ? 16 : 12, 0, Math.PI * 2)
    ctx.strokeStyle = isHovered
      ? inRange
        ? '#fff3a0'
        : '#ffb0b0'
      : 'rgba(240, 193, 74, 0.55)'
    ctx.lineWidth = isHovered ? 3 : 2
    ctx.stroke()
  }
}

export function drawRopePreview(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  anchor: Anchor | null,
  canAttach: boolean,
): void {
  if (!anchor) return

  const inRange = distanceToAnchor(player, anchor) <= CONFIG.maxAttachDistance
  ctx.save()
  ctx.beginPath()
  ctx.setLineDash([6, 6])
  ctx.moveTo(player.position.x, player.position.y)
  ctx.lineTo(anchor.x, anchor.y)
  ctx.strokeStyle = inRange && canAttach
    ? 'rgba(94, 200, 255, 0.75)'
    : 'rgba(255, 120, 120, 0.55)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()
}

export function drawRope(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  rope: RopeState,
): void {
  if (!rope.attached || !rope.anchor) return

  const { anchor } = rope
  ctx.beginPath()
  ctx.moveTo(anchor.x, anchor.y)
  ctx.lineTo(player.position.x, player.position.y)
  ctx.strokeStyle = '#e8dcc0'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(anchor.x, anchor.y)
  ctx.lineTo(player.position.x, player.position.y)
  ctx.strokeStyle = 'rgba(94, 200, 255, 0.45)'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

export function drawDebugHud(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  rope: RopeState,
): void {
  const speed = Math.hypot(player.velocity.x, player.velocity.y)
  const ropeText = rope.attached
    ? `Rope: ${rope.length.toFixed(0)} / ${CONFIG.minRopeLength}–${CONFIG.maxRopeLength}`
    : 'Rope: —'

  ctx.save()
  ctx.font = '13px ui-monospace, Consolas, monospace'
  ctx.fillStyle = 'rgba(10, 18, 36, 0.72)'
  ctx.fillRect(10, 10, 220, 48)
  ctx.fillStyle = '#d7e6ff'
  ctx.fillText(ropeText, 18, 30)
  ctx.fillText(`Speed: ${speed.toFixed(0)}`, 18, 48)
  ctx.restore()
}
