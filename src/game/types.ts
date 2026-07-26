export interface Vec2 {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Platform extends Rect {
  color: string
}

export interface Anchor {
  x: number
  y: number
}

export interface Collectible {
  x: number
  y: number
  radius: number
  collected: boolean
}

export interface RescueTarget {
  x: number
  y: number
  radius: number
  rescued: boolean
}

export interface ExitZone extends Rect {
  open: boolean
}
