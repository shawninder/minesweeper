export type ControlProps = {
  rows: number
  cols: number
  mines: number
  flagged: number
}

export default function Controls({ mines, flagged }: ControlProps) {
  return (
    <div className='absolute flex flew-row w-full justify-end pointer-events-none'>
      <span>
        {mines - flagged} / {mines} 💣
      </span>
    </div>
  )
}
