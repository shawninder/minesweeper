export type ControlProps = {
  mines: number
  flagged: number
}

const FLAG = '🚩'
const MINE = '💣'

export default function Controls({ mines, flagged }: ControlProps) {
  return (
    <div className='relative w-full h-full text-background bg-foreground'>
      <div className='absolute top-2 left-2'>
        {flagged} {FLAG}
      </div>
      <hr className='w-2/3 absolute top-1/2 left-1/2 transform -translate-x-7/12 -translate-y-7/12 -rotate-35 bg-background' />
      <div className='absolute bottom-2 right-2'>{mines} {MINE}</div>
    </div>
  )
}
