"use client"

import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

export default function Header() {
  function onClick() {
    toast.success("Ready")
  }
  return (
    <>
      <h1 className='text-center text-2xl font-bold' onClick={onClick}>
        Minesweeper
      </h1>
      <Toaster />
    </>
  )
}
