"use client"

import { GAME_SIZES, type GameSizeKey } from "@/components/GameStateProvider"
import { Toaster } from "@/components/ui/sonner"
import Game from "@/components/Game"

export default function Gameboard() {
  return (
    <div className='flex flex-col items-center justify-center'>
      {Object.keys(GAME_SIZES).map((sizeKey) => {
        const { key, ...props } = GAME_SIZES[sizeKey as GameSizeKey]
        return <Game key={key} {...props} />
      })}
      <Toaster />
    </div>
  )
}
