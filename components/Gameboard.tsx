"use client"

import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

export default function Gameboard() {
  function onClick() {
    toast.success("Ready")
  }

  return (
    <>
      <div className='grid grid-cols-9 grid-rows-9 w-96 h-96' onClick={onClick}>
        {Array.from({ length: 81 }).map((_, idx) => (
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
