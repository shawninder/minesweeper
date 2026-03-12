"use client"

import { useGameState } from "@/components/GameStateProvider"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

export default function Gameboard() {
  const { size } = useGameState()

  const cellCount = size.rows * size.cols

  function onClick() {
    toast.success("Ready")
  }

  return (
    <>
      <div
        className='grid w-96 h-96'
        style={{
          gridTemplateColumns: `repeat(${size.cols}, 2em)`,
          gridTemplateRows: `repeat(${size.rows}, 2em)`
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
      <Toaster />
    </>
  )
}
