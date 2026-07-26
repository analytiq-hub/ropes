import type { Vec2 } from './types.ts'

export class Input {
  private readonly canvas: HTMLCanvasElement
  private readonly pressed = new Set<string>()
  private readonly justPressed = new Set<string>()
  readonly mouse: Vec2 = { x: 0, y: 0 }
  private mouseClicked = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.clear)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerdown', this.onPointerDown)
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.clear)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
  }

  /** Consume one-frame edge triggers after each update. */
  endFrame(): void {
    this.justPressed.clear()
    this.mouseClicked = false
  }

  isDown(code: string): boolean {
    return this.pressed.has(code)
  }

  wasPressed(code: string): boolean {
    return this.justPressed.has(code)
  }

  left(): boolean {
    return this.isDown('ArrowLeft') || this.isDown('KeyA')
  }

  right(): boolean {
    return this.isDown('ArrowRight') || this.isDown('KeyD')
  }

  /** -1 shorten (W/Up), +1 lengthen (S/Down), 0 none. */
  reel(): number {
    let reel = 0
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) reel -= 1
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) reel += 1
    return reel
  }

  jump(): boolean {
    return this.isDown('Space')
  }

  jumpPressed(): boolean {
    return this.wasPressed('Space')
  }

  restart(): boolean {
    return this.isDown('KeyR')
  }

  releaseRope(): boolean {
    return this.wasPressed('KeyE')
  }

  didClick(): boolean {
    return this.mouseClicked
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (
      event.code === 'Space' ||
      event.code === 'ArrowLeft' ||
      event.code === 'ArrowRight' ||
      event.code === 'ArrowUp' ||
      event.code === 'ArrowDown'
    ) {
      event.preventDefault()
    }
    if (!this.pressed.has(event.code)) {
      this.justPressed.add(event.code)
    }
    this.pressed.add(event.code)
  }

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code)
  }

  private readonly clear = (): void => {
    this.pressed.clear()
    this.justPressed.clear()
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    this.updateMouse(event)
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return
    this.updateMouse(event)
    this.mouseClicked = true
  }

  private updateMouse(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    this.mouse.x =
      ((event.clientX - rect.left) / rect.width) * this.canvas.width
    this.mouse.y =
      ((event.clientY - rect.top) / rect.height) * this.canvas.height
  }
}
