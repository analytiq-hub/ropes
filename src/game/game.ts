import { drawPlatforms, resolvePlayerCollisions } from './collision.ts'
import { CONFIG } from './config.ts'
import { Input } from './input.ts'
import {
  PLAYER_SPAWN,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  createAnchors,
  createCollectibles,
  createExitZone,
  createLevel,
  createRescueTarget,
} from './level.ts'
import {
  createObjectives,
  drawObjectiveHud,
  drawObjectives,
  drawWinOverlay,
  updateObjectives,
  type ObjectiveState,
} from './objectives.ts'
import {
  applyReleaseBoost,
  createPlayer,
  drawPlayer,
  resetPlayer,
  sanitizePlayer,
  updatePlayerMovement,
  type PlayerState,
} from './player.ts'
import {
  adjustRopeLength,
  applyRopeConstraint,
  createRope,
  drawAnchors,
  drawDebugHud,
  drawRope,
  drawRopePreview,
  findHoveredAnchor,
  releaseRope,
  tryAttachRope,
  type RopeState,
} from './rope.ts'
import type { Anchor, Platform } from './types.ts'

const FIXED_DT = 1 / 60
const MAX_FRAME_DT = 0.05

export class Game {
  private readonly ctx: CanvasRenderingContext2D
  private readonly input: Input
  private platforms: Platform[] = createLevel()
  private anchors: Anchor[] = createAnchors()
  private player: PlayerState = createPlayer(PLAYER_SPAWN)
  private rope: RopeState = createRope()
  private objectives: ObjectiveState = createObjectives(
    createCollectibles(),
    createRescueTarget(),
    createExitZone(),
  )
  private hoveredAnchor: Anchor | null = null
  private reattachCooldown = 0
  private elapsed = 0
  private accumulator = 0
  private lastTime = 0
  private running = false
  private restartHeld = false
  private rafId = 0

  constructor(canvas: HTMLCanvasElement, restartButton: HTMLButtonElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get 2D canvas context')
    }
    this.ctx = ctx
    this.input = new Input(canvas)
    canvas.width = WORLD_WIDTH
    canvas.height = WORLD_HEIGHT

    restartButton.addEventListener('click', () => this.restart())
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.rafId = requestAnimationFrame(this.frame)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.rafId)
    this.input.dispose()
  }

  restart(): void {
    this.platforms = createLevel()
    this.anchors = createAnchors()
    resetPlayer(this.player, PLAYER_SPAWN)
    releaseRope(this.rope)
    this.objectives = createObjectives(
      createCollectibles(),
      createRescueTarget(),
      createExitZone(),
    )
    this.hoveredAnchor = null
    this.reattachCooldown = 0
    this.elapsed = 0
    this.accumulator = 0
  }

  private readonly frame = (now: number): void => {
    if (!this.running) return

    let frameDt = (now - this.lastTime) / 1000
    this.lastTime = now
    if (frameDt > MAX_FRAME_DT) frameDt = MAX_FRAME_DT

    this.accumulator += frameDt
    while (this.accumulator >= FIXED_DT) {
      this.update(FIXED_DT)
      this.accumulator -= FIXED_DT
    }

    this.draw()
    this.rafId = requestAnimationFrame(this.frame)
  }

  private update(dt: number): void {
    const restartPressed = this.input.restart()
    if (restartPressed && !this.restartHeld) {
      this.restart()
    }
    this.restartHeld = restartPressed

    // Freeze play after win; still allow restart.
    if (this.objectives.won) {
      this.input.endFrame()
      return
    }

    this.elapsed += dt

    if (this.reattachCooldown > 0) {
      this.reattachCooldown = Math.max(0, this.reattachCooldown - dt)
    }

    this.hoveredAnchor = findHoveredAnchor(this.input.mouse, this.anchors)
    this.handleRopeInput()

    const swinging = this.rope.attached
    updatePlayerMovement(
      this.player,
      {
        left: this.input.left(),
        right: this.input.right(),
        jump: this.input.jump(),
      },
      dt,
      swinging,
    )

    if (swinging) {
      adjustRopeLength(this.rope, this.player, this.input.reel(), dt)
    }

    this.player.position.x = Math.max(
      this.player.radius,
      Math.min(WORLD_WIDTH - this.player.radius, this.player.position.x),
    )

    applyRopeConstraint(this.player, this.rope)
    resolvePlayerCollisions(this.player, this.platforms)
    applyRopeConstraint(this.player, this.rope)
    sanitizePlayer(this.player, PLAYER_SPAWN)
    updateObjectives(this.objectives, this.player)

    if (this.player.position.y - this.player.radius > WORLD_HEIGHT + 80) {
      this.restart()
    }

    this.input.endFrame()
  }

  private detachRope(withBoost: boolean): void {
    if (!this.rope.attached) return
    if (withBoost) {
      applyReleaseBoost(this.player)
    }
    releaseRope(this.rope)
    this.reattachCooldown = CONFIG.reattachCooldown
  }

  private handleRopeInput(): void {
    if (this.rope.attached && this.input.jumpPressed()) {
      this.detachRope(true)
      return
    }

    if (this.input.releaseRope()) {
      this.detachRope(false)
      return
    }

    if (!this.input.didClick()) return

    if (this.rope.attached) {
      this.detachRope(false)
      return
    }

    if (this.reattachCooldown > 0) return

    if (this.hoveredAnchor) {
      tryAttachRope(this.rope, this.player, this.hoveredAnchor)
    }
  }

  private draw(): void {
    const { ctx } = this

    ctx.fillStyle = '#0a1224'
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    ctx.strokeStyle = 'rgba(94, 200, 255, 0.05)'
    ctx.lineWidth = 1
    for (let x = 0; x <= WORLD_WIDTH; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, WORLD_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(WORLD_WIDTH, y)
      ctx.stroke()
    }

    drawPlatforms(ctx, this.platforms)
    drawObjectives(ctx, this.objectives, this.elapsed)
    drawAnchors(ctx, this.anchors, this.hoveredAnchor, this.player)

    if (!this.rope.attached && this.hoveredAnchor) {
      drawRopePreview(
        ctx,
        this.player,
        this.hoveredAnchor,
        this.reattachCooldown <= 0,
      )
    }

    drawRope(ctx, this.player, this.rope)
    drawPlayer(ctx, this.player)
    drawDebugHud(ctx, this.player, this.rope)
    drawObjectiveHud(ctx, this.objectives, WORLD_WIDTH, this.elapsed)

    if (this.objectives.won) {
      drawWinOverlay(ctx, WORLD_WIDTH, WORLD_HEIGHT, this.elapsed)
    }
  }
}
