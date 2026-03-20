'use client'

import { type GameSize } from '@/components/GameStateProvider'
import { type MouseEventHandler, useState } from 'react'
import { toast } from 'sonner'

export type GameState = 'ready' | 'playing' | 'lost' | 'won'
export type Cell = {
  isMine: boolean
  nbAdjacentMines: number
  isDisclosed: boolean
  isFlagged: boolean
}

const COLORS = [
  '',
  'text-blue-500 dark:text-blue-300',
  'text-emerald-500 dark:text-emerald-300',
  'text-red-500 dark:text-red-300',
  'text-indigo-500 dark:text-indigo-300',
  'text-amber-500 dark:text-amber-300',
  'text-teal-500 dark:text-teal-300',
  'text-fuchsia-500 dark:text-fuchsia-300',
  'text-slate-300 dark:text-slate-200'
]

const borderColors: Record<GameState, string> = {
  ready: '[&>button]:border-blue-400 dark:[&>button]:border-blue-600',
  playing: '[&>button]:border-gray-400 dark:[&>button]:border-gray-600',
  lost: '[&>button]:border-red-400 dark:[&>button]:border-red-600',
  won: '[&>button]:border-green-400 dark:[&>button]:border-green-600'
}

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
      return newGame(event)
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
    if (!isFlag && newCells[cellIdx].isMine && newCells[cellIdx].isDisclosed) {
      setGameState('lost')
      toast('You Lose')
    } else {
      let lost = false
      let unfinished = false
      newCells.forEach(({ isDisclosed, isMine, isFlagged }) => {
        if (!isFlagged && !isDisclosed) {
          unfinished = true
        }
        if (isDisclosed && isMine) {
          lost = true
        }
      })
      if (lost) {
        lose()
      } else if (!unfinished) {
        win()
      }
    }
  }

  function lose() {
    setGameState('lost')
  }
  function win() {
    setGameState('won')
  }

  const newGame: MouseEventHandler<HTMLDivElement> = function newGame() {
    setCells(initialCells)
    setGameState('ready')
  }

  const borderColor = borderColors[gameState]

  return (
    <div className={className}>
      <div
        className={`grid ${borderColor}`}
        style={{
          gridTemplateColumns: `repeat(${cols}, 2em)`,
          gridTemplateRows: `repeat(${rows}, 2em)`
        }}
        onClick={clickBoard}
        onDoubleClick={newGame}
      >
        {cells.map(cellMap)}
      </div>
    </div>
  )
}

export function cellMap(
  { isMine, nbAdjacentMines, isDisclosed, isFlagged }: Cell,
  idx: number
) {
  const bg = isDisclosed
    ? isMine
      ? 'bg-red-400 dark:bg-red-600'
      : 'bg-gray-100 dark:bg-gray-800'
    : 'bg-gray-300 dark:bg-gray-700'
  const color = isDisclosed
    ? nbAdjacentMines
      ? COLORS[nbAdjacentMines]
      : ''
    : ''
  return (
    <button
      key={idx}
      className={`border ${bg} ${color} w-full h-full aspect-square text-xs`}
      data-idx={idx}
    >
      {isDisclosed ? (isMine ? '💣' : nbAdjacentMines || '') : ''}
      {isFlagged ? '🚩' : ''}
    </button>
  )
}

function flagCell(cells: Cell[], rows: number, cols: number, idx: number) {
  const { isDisclosed, isFlagged } = cells[idx]
  if (isDisclosed) {
    return cells
  }

  const newCells = cells.map((cell) => ({ ...cell }))

  newCells[idx].isFlagged = !isFlagged
  return newCells
}

function discloseCell(cells: Cell[], rows: number, cols: number, idx: number) {
  let newCells = cells.map((cell) => ({ ...cell }))
  const cell = newCells[idx]
  const { nbAdjacentMines, isFlagged } = cell
  const wasDisclosed = cell.isDisclosed
  if (isFlagged) {
    cell.isFlagged = false
  } else {
    cell.isDisclosed = true
    if (nbAdjacentMines !== 0) {
      // "Chording" should only happen when the user clicks an already-disclosed
      // numbered cell. Otherwise, you can recursively re-trigger yourself.
      if (wasDisclosed) {
        const neighbors = getNeighbors(newCells, rows, cols, idx)
        const [nbAdjFlags, nbAdjMines, nbMistakes, toDisclose] =
          neighbors.reduce<[number, number, number, number[]]>(
            ([nbFlags, nbMines, nbMistakes, toDisclose], cellIdx) => {
              const { isFlagged, isMine, isDisclosed } = newCells[cellIdx]
              if (isFlagged) nbFlags += 1
              if (isMine) nbMines += 1
              if (isFlagged && !isMine) nbMistakes += 1

              if (!isFlagged && !isMine && !isDisclosed) {
                toDisclose.push(cellIdx)
              }

              return [nbFlags, nbMines, nbMistakes, toDisclose]
            },
            [0, 0, 0, []]
          )

        if (nbMistakes === 0) {
          if (nbAdjFlags === nbAdjMines) {
            toDisclose.forEach((cellIdx) => {
              newCells = discloseCell(newCells, rows, cols, cellIdx)
            })
          } else {
            console.log(
              JSON.stringify({
                nbAdjFlags,
                nbAdjMines,
                idx,
                nbAdjacentMines,
                isFlagged
              })
            )
          }
        }
      }
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
  const notLeftCol = idx % cols !== 0
  const notRightCol = idx % cols !== cols - 1
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
