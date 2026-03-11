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
          <Size label='Small' details='9x9 (10 mines)' shortcut='s' />
          <Size label='Medium' details='16x16 (40 mines)' shortcut='m' />
          <Size label='Large' details='30x16 (99 mines)' shortcut='l' />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type SizeProps = {
  label: string
  details: string
  shortcut: string
}
function Size({ label, details, shortcut }: SizeProps) {
  return (
    <DropdownMenuItem>
      <div>
        {label}
        <span className='block text-xs'>{details}</span>
      </div>
      <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>
    </DropdownMenuItem>
  )
}
