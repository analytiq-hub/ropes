import type { PlayerState } from './player.ts'
import type { Platform, Rect } from './types.ts'

function overlapsCircleRect(
  cx: number,
  cy: number,
  radius: number,
  rect: Rect,
): boolean {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width))
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height))
  const dx = cx - nearestX
  const dy = cy - nearestY
  return dx * dx + dy * dy <= radius * radius
}

/** Resolve circle-vs-AABB collisions and update grounded state. */
export function resolvePlayerCollisions(
  player: PlayerState,
  platforms: readonly Platform[],
): void {
  player.grounded = false

  for (const platform of platforms) {
    if (
      !overlapsCircleRect(
        player.position.x,
        player.position.y,
        player.radius,
        platform,
      )
    ) {
      continue
    }

    const nearestX = Math.max(
      platform.x,
      Math.min(player.position.x, platform.x + platform.width),
    )
    const nearestY = Math.max(
      platform.y,
      Math.min(player.position.y, platform.y + platform.height),
    )

    let dx = player.position.x - nearestX
    let dy = player.position.y - nearestY

    // Center inside the rect: push out along the shallowest axis.
    if (dx === 0 && dy === 0) {
      const left = player.position.x - platform.x
      const right = platform.x + platform.width - player.position.x
      const top = player.position.y - platform.y
      const bottom = platform.y + platform.height - player.position.y
      const min = Math.min(left, right, top, bottom)

      if (min === top) {
        player.position.y = platform.y - player.radius
        player.velocity.y = 0
        player.grounded = true
      } else if (min === bottom) {
        player.position.y = platform.y + platform.height + player.radius
        player.velocity.y = Math.max(0, player.velocity.y)
      } else if (min === left) {
        player.position.x = platform.x - player.radius
        player.velocity.x = 0
      } else {
        player.position.x = platform.x + platform.width + player.radius
        player.velocity.x = 0
      }
      continue
    }

    const distance = Math.hypot(dx, dy)
    const overlap = player.radius - distance
    if (overlap <= 0) continue

    dx /= distance
    dy /= distance
    player.position.x += dx * overlap
    player.position.y += dy * overlap

    // Landing on top of a platform.
    if (dy < -0.5 && player.velocity.y >= 0) {
      player.velocity.y = 0
      player.grounded = true
    } else if (dy > 0.5 && player.velocity.y < 0) {
      player.velocity.y = 0
    } else if (Math.abs(dx) > 0.5) {
      player.velocity.x = 0
    }
  }
}

export function drawPlatforms(
  ctx: CanvasRenderingContext2D,
  platforms: readonly Platform[],
): void {
  for (const platform of platforms) {
    ctx.fillStyle = platform.color
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.fillRect(platform.x, platform.y, platform.width, 4)
  }
}
