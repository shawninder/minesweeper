'use client'

import { type GameSize } from '@/components/GameStateProvider'
import { type MouseEventHandler, useState } from 'react'
import { toast } from 'sonner'

type GameState = 'ready' | 'playing' | 'lost' | 'won'
type Cell = undefined | number

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
  sizeKey,
  label,
  rows,
  cols,
  mines,
  shortcut,
  className = ''
}: GameSize & { className?: string }) {
  const nbCells = rows * cols
  const [gameState, setGameState] = useState<GameState>('ready')
  const [cells, setCells] = useState<Cell[]>(Array.from({ length: nbCells }))

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

    if (gameState === 'ready') {
      const withMines = generateMines(cells, cellIdx, mines)
      const withNumbers = numberCells(withMines, rows, cols)
      setCells(withNumbers)
      // disclose cell <cellIdx>
      setGameState('playing')
      return
    }

    // disclose cell <cellIdx>
  }

  return (
    <div className={className}>
      {gameState}
      <div
        className='grid'
        style={{
          gridTemplateColumns: `repeat(${cols}, 2em)`,
          gridTemplateRows: `repeat(${rows}, 2em)`
        }}
        onClick={clickBoard}
      >
        {cells.map((cell, idx) => (
          <button
            key={idx}
            className={`border border-gray-400 ${cell === -1 ? 'bg-red-400' : 'bg-gray-100'} ${cell ? COLORS[cell] : ''} w-full h-full aspect-square`}
            data-idx={idx}
          >
            {cell === -1 ? '💣' : cell || ''}
          </button>
        ))}
      </div>
    </div>
  )
}

function numberCells(cells: Cell[], rows: number, cols: number) {
  const newCells = cells.map((cell, idx) => {
    if (cell === -1) {
      return cell
    }
    const neighbors = getNeighbors(cells, rows, cols, idx)
    const nbAdjacentMines = neighbors.reduce((nbMines, neighbor) => {
      if (cells[neighbor] === -1) {
        nbMines += 1
      }
      return nbMines
    }, 0)
    return nbAdjacentMines
  })
  return newCells
}

function getNeighbors(cells: Cell[], rows: number, cols: number, idx: number) {
  const neighbors = []

  const notTopRow = idx > cols
  const notLeftCol = idx % rows !== 0
  const notRightCol = (idx - cols + 1) % rows !== 0
  const notBottomRow = idx - cols < cells.length - cols

  const upLeft = idx - cols - 1
  if (notTopRow && notLeftCol && cells[upLeft] === -1) {
    neighbors.push(upLeft)
  }

  const up = idx - cols
  if (notTopRow && cells[up] === -1) {
    neighbors.push(up)
  }

  const upRight = idx - cols + 1
  if (notTopRow && notRightCol && cells[upRight] === -1) {
    neighbors.push(upRight)
  }

  const right = idx + 1
  if (notRightCol && cells[right] === -1) {
    neighbors.push(right)
  }

  const downRight = idx + cols + 1
  if (notBottomRow && notRightCol && cells[downRight] === -1) {
    neighbors.push(downRight)
  }

  const down = idx + cols
  if (notBottomRow && cells[down] === -1) {
    neighbors.push(down)
  }

  const downLeft = idx + cols - 1
  if (notBottomRow && notLeftCol && cells[downLeft] === -1) {
    neighbors.push(downLeft)
  }

  const left = idx - 1
  if (notLeftCol && cells[left] === -1) {
    neighbors.push(left)
  }

  return neighbors
}

function generateMines(cells: Cell[], safeIdx: number, mines: number) {
  const newCells = [...cells]
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
      newCells[cellIdx] = -1
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
