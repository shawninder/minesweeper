export type ControlProps = {
  rows: number
  cols: number
  mines: number
  flagged: number
}

export default function Controls({ rows, cols, mines, flagged }: ControlProps) {
  return (
    <div className='absolute flex flew-row w-full justify-between pointer-events-none'>
      <span>
        {rows}x{cols}
      </span>
      <span>
        {mines - flagged} / {mines} 💣
      </span>
    </div>
  )
}
