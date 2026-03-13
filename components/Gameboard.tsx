'use client'

import {
  GAME_SIZES,
  useGameState,
  type GameSizeKey
} from '@/components/GameStateProvider'
import { Toaster } from '@/components/ui/sonner'
import Game from '@/components/Game'

export default function Gameboard() {
  const { size: selectedSize } = useGameState()
  const { shortcut, label, rows, cols, mines } = selectedSize

  return (
    <div className='flex flex-col items-center justify-center'>
      [{shortcut}] {label} ({rows}x{cols}) / {mines} mines
      {Object.keys(GAME_SIZES).map((key) => {
        const props = GAME_SIZES[key as GameSizeKey]
        const { sizeKey } = props
        return (
          <Game
            key={sizeKey}
            {...props}
            className={sizeKey === selectedSize.sizeKey ? 'block' : 'hidden'}
          />
        )
      })}
      <Toaster />
    </div>
  )
}
