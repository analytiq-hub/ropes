import type { PlayerState } from './player.ts'
import type { Collectible, ExitZone, RescueTarget } from './types.ts'

export interface ObjectiveState {
  collectibles: Collectible[]
  rescue: RescueTarget
  exit: ExitZone
  won: boolean
}

export function createObjectives(
  collectibles: Collectible[],
  rescue: RescueTarget,
  exit: ExitZone,
): ObjectiveState {
  return {
    collectibles,
    rescue,
    exit,
    won: false,
  }
}

export function collectedCount(objectives: ObjectiveState): number {
  return objectives.collectibles.filter((c) => c.collected).length
}

export function allCollected(objectives: ObjectiveState): boolean {
  return objectives.collectibles.every((c) => c.collected)
}

export function objectivesReadyForExit(objectives: ObjectiveState): boolean {
  return allCollected(objectives) && objectives.rescue.rescued
}

function circleOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx
  const dy = ay - by
  const r = ar + br
  return dx * dx + dy * dy <= r * r
}

function circleRectOverlap(
  cx: number,
  cy: number,
  radius: number,
  rect: ExitZone,
): boolean {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width))
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height))
  const dx = cx - nearestX
  const dy = cy - nearestY
  return dx * dx + dy * dy <= radius * radius
}

/** Update collect / rescue / exit; returns true if the player just won. */
export function updateObjectives(
  objectives: ObjectiveState,
  player: PlayerState,
): boolean {
  if (objectives.won) return false

  for (const item of objectives.collectibles) {
    if (item.collected) continue
    if (
      circleOverlap(
        player.position.x,
        player.position.y,
        player.radius,
        item.x,
        item.y,
        item.radius,
      )
    ) {
      item.collected = true
    }
  }

  if (
    !objectives.rescue.rescued &&
    circleOverlap(
      player.position.x,
      player.position.y,
      player.radius,
      objectives.rescue.x,
      objectives.rescue.y,
      objectives.rescue.radius,
    )
  ) {
    objectives.rescue.rescued = true
  }

  objectives.exit.open = objectivesReadyForExit(objectives)

  if (
    objectives.exit.open &&
    circleRectOverlap(
      player.position.x,
      player.position.y,
      player.radius,
      objectives.exit,
    )
  ) {
    objectives.won = true
    return true
  }

  return false
}

export function drawObjectives(
  ctx: CanvasRenderingContext2D,
  objectives: ObjectiveState,
  timeSeconds: number,
): void {
  // Collectibles
  for (const item of objectives.collectibles) {
    if (item.collected) continue
    const pulse = 1 + Math.sin(timeSeconds * 4 + item.x * 0.01) * 0.08
    ctx.beginPath()
    ctx.arc(item.x, item.y, item.radius * pulse, 0, Math.PI * 2)
    ctx.fillStyle = '#7dffb3'
    ctx.fill()
    ctx.strokeStyle = '#c8ffe0'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // Rescue target
  const rescue = objectives.rescue
  if (!rescue.rescued) {
    const bob = Math.sin(timeSeconds * 3) * 3
    ctx.beginPath()
    ctx.arc(rescue.x, rescue.y + bob, rescue.radius, 0, Math.PI * 2)
    ctx.fillStyle = '#ff8fab'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(rescue.x - 4, rescue.y + bob - 3, 2.5, 0, Math.PI * 2)
    ctx.arc(rescue.x + 4, rescue.y + bob - 3, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = '#2a1020'
    ctx.fill()

    ctx.font = '11px ui-monospace, Consolas, monospace'
    ctx.fillStyle = '#ffd0dc'
    ctx.textAlign = 'center'
    ctx.fillText('HELP!', rescue.x, rescue.y + bob - rescue.radius - 8)
    ctx.textAlign = 'left'
  } else {
    // Faint marker where they were rescued
    ctx.beginPath()
    ctx.arc(rescue.x, rescue.y, 6, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 143, 171, 0.35)'
    ctx.fill()
  }

  // Exit
  const exit = objectives.exit
  ctx.fillStyle = exit.open ? 'rgba(94, 200, 255, 0.35)' : 'rgba(60, 70, 100, 0.55)'
  ctx.fillRect(exit.x, exit.y, exit.width, exit.height)
  ctx.strokeStyle = exit.open ? '#5ec8ff' : '#6a7390'
  ctx.lineWidth = 2
  ctx.strokeRect(exit.x + 1, exit.y + 1, exit.width - 2, exit.height - 2)

  ctx.font = '12px ui-monospace, Consolas, monospace'
  ctx.fillStyle = exit.open ? '#d7f0ff' : '#9aa8c7'
  ctx.textAlign = 'center'
  ctx.fillText(
    exit.open ? 'EXIT' : 'LOCKED',
    exit.x + exit.width / 2,
    exit.y + exit.height / 2 + 4,
  )
  ctx.textAlign = 'left'
}

export function drawObjectiveHud(
  ctx: CanvasRenderingContext2D,
  objectives: ObjectiveState,
  worldWidth: number,
): void {
  const total = objectives.collectibles.length
  const got = collectedCount(objectives)
  const lines = [
    `Kits: ${got}/${total}`,
    `Rescue: ${objectives.rescue.rescued ? 'Done' : 'Pending'}`,
    `Exit: ${objectives.exit.open ? 'Open' : 'Locked'}`,
  ]

  const width = 168
  const height = 64
  const x = worldWidth - width - 10
  const y = 10

  ctx.save()
  ctx.fillStyle = 'rgba(10, 18, 36, 0.72)'
  ctx.fillRect(x, y, width, height)
  ctx.font = '13px ui-monospace, Consolas, monospace'
  ctx.fillStyle = '#d7e6ff'
  lines.forEach((line, i) => {
    ctx.fillText(line, x + 12, y + 22 + i * 16)
  })
  ctx.restore()
}

export function drawWinOverlay(
  ctx: CanvasRenderingContext2D,
  worldWidth: number,
  worldHeight: number,
): void {
  ctx.save()
  ctx.fillStyle = 'rgba(6, 10, 22, 0.62)'
  ctx.fillRect(0, 0, worldWidth, worldHeight)

  ctx.fillStyle = '#e8eefc'
  ctx.font = 'bold 36px Segoe UI, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Rescued!', worldWidth / 2, worldHeight / 2 - 12)

  ctx.fillStyle = '#9aa8c7'
  ctx.font = '16px Segoe UI, system-ui, sans-serif'
  ctx.fillText(
    'Kits collected · Survivor saved · Exit reached',
    worldWidth / 2,
    worldHeight / 2 + 22,
  )
  ctx.fillText('Press R or Restart to play again', worldWidth / 2, worldHeight / 2 + 48)
  ctx.textAlign = 'left'
  ctx.restore()
}
