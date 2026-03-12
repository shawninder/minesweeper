"use client"

import {
  GAME_SIZES,
  type GameSizeKey,
  useGameState
} from "@/components/GameStateProvider"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

export default function Gameboard() {
  const { size } = useGameState()
  const { key: selectedKey, rows, cols } = size

  const cellCount = rows * cols

  function onClick() {
    toast.success("Ready")
  }

  return (
    <div className='flex flex-col items-center justify-center'>
      {Object.keys(GAME_SIZES).map((sizeKey) => {
        const { key, label, rows, cols, mines } =
          GAME_SIZES[sizeKey as GameSizeKey]
        return (
          <div
            key={sizeKey}
            className={`grid ${selectedKey === key ? "block" : "hidden"}`}
            style={{
              gridTemplateColumns: `repeat(${cols}, 2em)`,
              gridTemplateRows: `repeat(${rows}, 2em)`
            }}
            onClick={onClick}
          >
            {Array.from({ length: cellCount }).map((_, idx) => (
              <button
                key={idx}
                className='border border-gray-400 bg-gray-100 w-full h-full aspect-square'
              ></button>
            ))}
          </div>
        )
      })}
      <Toaster />
    </div>
  )
}
