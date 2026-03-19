'use client'

import { type GameSize } from '@/components/GameStateProvider'
import { type MouseEventHandler, useState } from 'react'
import { toast } from 'sonner'

type GameState = 'ready' | 'playing' | 'lost' | 'won'
type Cell = {
  isMine: boolean
  nbAdjacentMines: number
  isDisclosed: boolean
  isFlagged: boolean
}

const COLORS = [
  'text-white-400',
  'text-blue-400',
  'text-green-400',
  'text-red-400',
  'text-navy-400',
  'text-brown-400',
  'text-teal-400',
  'text-black-400',
  'text-gray-400'
]

export default function Game({
  rows,
  cols,
  mines,
  className = ''
}: GameSize & { className?: string }) {
  const nbCells = rows * cols
  const initialCells = Array.from({ length: nbCells }).map(() => ({
    isMine: false,
    nbAdjacentMines: -1,
    isDisclosed: false,
    isFlagged: false
  }))

  const [gameState, setGameState] = useState<GameState>('ready')
  const [cells, setCells] = useState<Cell[]>(initialCells)

  const clickBoard: MouseEventHandler<HTMLDivElement> = function clickBoard(
    event
  ) {
    if (gameState === 'won' || gameState === 'lost') {
      return
    }
    const target = event.target as HTMLButtonElement
    if (!target) {
      throw Error("Can't find click target")
    }
    const cellIdx = parseInt(target.dataset.idx || '', 10)

    const isRightClick = event.type === 'contextmenu' || event.button === 2
    const isCtrlClick = event.ctrlKey
    const isShiftClick = event.shiftKey
    const isMetaClick = event.metaKey
    const isFlag = isRightClick || isCtrlClick || isShiftClick || isMetaClick

    let newCells
    if (gameState === 'ready') {
      const withMines = generateMines(cells, cellIdx, mines)
      const withNumbers = numberCells(withMines, rows, cols)
      setGameState('playing')
      newCells = isFlag
        ? flagCell(withNumbers, rows, cols, cellIdx)
        : discloseCell(withNumbers, rows, cols, cellIdx)
      setCells(newCells)
    } else {
      newCells = isFlag
        ? flagCell(cells, rows, cols, cellIdx)
        : discloseCell(cells, rows, cols, cellIdx)
      setCells(newCells)
    }
    if (!isFlag && newCells[cellIdx].isMine) {
      setGameState('lost')
      toast('You Lose')
    } else {
      let lost = false
      let unfinished = false
      newCells.forEach(({ isDisclosed, isMine }) => {
        if (!isMine && !isDisclosed) {
          unfinished = true
        }
        if (isDisclosed && isMine) {
          lost = true
          setGameState('lost')
          toast('You Lose')
        }
      })
      if (!lost && !unfinished) {
        setGameState('won')
        toast('You Won!')
      }
    }
  }

  const newGame: MouseEventHandler<HTMLButtonElement> = function newGame() {
    setCells(initialCells)
    setGameState('ready')
  }

  return (
    <div className={className}>
      {gameState} – <button onClick={newGame}>new</button>
      <div
        className='grid'
        style={{
          gridTemplateColumns: `repeat(${cols}, 2em)`,
          gridTemplateRows: `repeat(${rows}, 2em)`
        }}
        onClick={clickBoard}
      >
        {cells.map(
          ({ isMine, nbAdjacentMines, isDisclosed, isFlagged }, idx) => {
            const bg = isDisclosed
              ? isMine
                ? 'bg-red-400'
                : 'bg-gray-100'
              : 'bg-gray-300'
            const color = isDisclosed
              ? nbAdjacentMines
                ? COLORS[nbAdjacentMines]
                : ''
              : ''
            return (
              <button
                key={idx}
                className={`border border-gray-400 ${bg} ${color} w-full h-full aspect-square text-xs`}
                data-idx={idx}
              >
                {isDisclosed ? (isMine ? '💣' : nbAdjacentMines || '') : ''}
                {isFlagged ? '🚩' : ''}
              </button>
            )
          }
        )}
      </div>
    </div>
  )
}

function flagCell(cells: Cell[], rows: number, cols: number, idx: number) {
  const newCells = cells.map((cell) => ({ ...cell }))
  newCells[idx].isFlagged = true
  return newCells
}

function discloseCell(cells: Cell[], rows: number, cols: number, idx: number) {
  const newCells = cells.map((cell) => ({ ...cell }))
  const cell = newCells[idx]
  const { nbAdjacentMines } = cell
  cell.isDisclosed = true
  if (nbAdjacentMines !== 0) {
    return newCells
  }
  const queue: number[] = [idx]
  let q = 0

  while (q < queue.length) {
    const current = queue[q++]
    if (newCells[current].nbAdjacentMines !== 0) {
      continue
    }
    for (const neighborIdx of getNeighbors(newCells, rows, cols, current)) {
      const neighbor = newCells[neighborIdx]
      if (neighbor.isDisclosed) {
        continue
      }
      if (neighbor.isMine) {
        continue
      }

      neighbor.isDisclosed = true

      if (neighbor.nbAdjacentMines === 0) {
        queue.push(neighborIdx)
      }
    }
  }

  return newCells
}

function numberCells(cells: Cell[], rows: number, cols: number) {
  const newCells = cells.map((cell, idx) => {
    const { isMine } = cell
    if (isMine) {
      return cell
    }
    const neighbors = getNeighbors(cells, rows, cols, idx)
    const count = neighbors.reduce((nbMines, neighbor) => {
      if (cells[neighbor].isMine) {
        nbMines += 1
      }
      return nbMines
    }, 0)
    return {
      nbAdjacentMines: count,
      isMine: false,
      isDisclosed: false,
      isFlagged: false
    }
  })
  return newCells
}

function getNeighbors(cells: Cell[], rows: number, cols: number, idx: number) {
  const neighbors = []

  const notTopRow = idx > cols - 1
  const notLeftCol = idx % rows !== 0
  const notRightCol = (idx - cols + 1) % rows !== 0
  const notBottomRow = idx < cells.length - cols

  const upLeft = idx - cols - 1
  if (notTopRow && notLeftCol) {
    neighbors.push(upLeft)
  }

  const up = idx - cols
  if (notTopRow) {
    neighbors.push(up)
  }

  const upRight = idx - cols + 1
  if (notTopRow && notRightCol) {
    neighbors.push(upRight)
  }

  const right = idx + 1
  if (notRightCol) {
    neighbors.push(right)
  }

  const downRight = idx + cols + 1
  if (notBottomRow && notRightCol) {
    neighbors.push(downRight)
  }

  const down = idx + cols
  if (notBottomRow) {
    neighbors.push(down)
  }

  const downLeft = idx + cols - 1
  if (notBottomRow && notLeftCol) {
    neighbors.push(downLeft)
  }

  const left = idx - 1
  if (notLeftCol) {
    neighbors.push(left)
  }

  return neighbors
}

function generateMines(cells: Cell[], safeIdx: number, mines: number) {
  const newCells = cells.map((cell) => ({ ...cell }))
  shuffleArray([
    ...Array.from(cells).reduce<number[]>((arr, item, idx) => {
      if (idx !== safeIdx) {
        arr.push(idx)
      }
      return arr
    }, [])
  ])
    .slice(0, mines)
    .forEach((cellIdx) => {
      newCells[cellIdx].isMine = true
    })
  return newCells
}

function shuffleArray(arr: number[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
