import './style.css'
import { Game } from './game/game.ts'

const canvas = document.querySelector<HTMLCanvasElement>('#game')
const restartButton = document.querySelector<HTMLButtonElement>('#restart')

if (!canvas || !restartButton) {
  throw new Error('Missing required #game canvas or #restart button')
}

const game = new Game(canvas, restartButton)
game.start()
