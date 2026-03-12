"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import {
  type GameSizeKey,
  useGameState,
  GAME_SIZES
} from "@/components/GameStateProvider"

export default function Header() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className='my-4'>
        <Button variant='secondary'>
          <h1 className='text-center text-2xl font-bold'>
            Minesweeper <ChevronDown className='inline-block' />
          </h1>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Size</DropdownMenuLabel>
          {Object.keys(GAME_SIZES).map((sizeKey) => {
            const { key, label, rows, cols, mines, shortcut } =
              GAME_SIZES[sizeKey as GameSizeKey]
            return (
              <Size
                key={sizeKey}
                label={label}
                details={`${rows}x${cols} (${mines} mines)`}
                shortcut={shortcut}
                value={key}
              />
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type SizeProps = {
  label: string
  details: string
  shortcut: string
  value: GameSizeKey
}
function Size({ label, details, shortcut, value }: SizeProps) {
  const { setSizeKey } = useGameState()

  return (
    <DropdownMenuItem onSelect={() => setSizeKey(value)} inset>
      <div>
        {label}
        <span className='block text-xs'>{details}</span>
      </div>
      <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>
    </DropdownMenuItem>
  )
}
