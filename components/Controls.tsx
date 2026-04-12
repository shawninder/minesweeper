import { type GameState } from '@/lib/gameLogic'

export type ControlProps = {
  mines: number
  flagged: number
  state: GameState
}

export default function Controls({ mines, flagged, state }: ControlProps) {
  return (
    <div className='absolute flex flex-row w-full justify-end pointer-events-none'>
      <span>
        [{state}] {mines - flagged} / {mines} 💣
      </span>
    </div>
  )
}
