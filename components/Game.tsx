import { type GameSize } from "@/components/GameStateProvider"
import { toast } from "sonner"

export default function Game({
  key,
  label,
  rows,
  cols,
  mines,
  shortcut,
  className = ""
}: GameSize & { className?: string }) {
  const cellCount = rows * cols
  function onClick() {
    toast.success("Ready")
  }

  return (
    <div
      key={key}
      className={`grid ${className}`}
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
}
