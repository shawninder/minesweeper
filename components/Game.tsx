'use client'

import { type GameSize } from '@/components/GameStateProvider'
import { type MouseEventHandler, useState } from 'react'

type GameState = 'ready' | 'playing' | 'lost' | 'won'
type Cell = { nbAdjacentMines: number; disclosed: boolean }

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
  const [gameState, setGameState] = useState<GameState>('ready')
  const [cells, setCells] = useState<Cell[]>(
    Array.from({ length: nbCells }).map(() => ({
      nbAdjacentMines: 0,
      disclosed: false
    }))
  )

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
      setGameState('playing')
      return setCells(discloseCell(withNumbers, rows, cols, cellIdx))
    }
    return setCells(discloseCell(cells, rows, cols, cellIdx))
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
        {cells.map(({ nbAdjacentMines, disclosed }, idx) => {
          const bg = disclosed
            ? nbAdjacentMines === -1
              ? 'bg-red-400'
              : 'bg-gray-100'
            : 'bg-gray-300'
          const color = disclosed
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
              {disclosed
                ? nbAdjacentMines === -1
                  ? '💣'
                  : nbAdjacentMines || ''
                : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function discloseCell(cells: Cell[], rows: number, cols: number, idx: number) {
  const newCells = cells.map((cell) => ({ ...cell }))
  const cell = newCells[idx]
  const { nbAdjacentMines } = cell
  cell.disclosed = true
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
      if (neighbor.disclosed) {
        continue
      }
      if (neighbor.nbAdjacentMines === -1) {
        continue
      }

      neighbor.disclosed = true

      if (neighbor.nbAdjacentMines === 0) {
        queue.push(neighborIdx)
      }
    }
  }

  return newCells
}

function numberCells(cells: Cell[], rows: number, cols: number) {
  const newCells = cells.map((cell, idx) => {
    const { nbAdjacentMines } = cell
    if (nbAdjacentMines === -1) {
      return cell
    }
    const neighbors = getNeighbors(cells, rows, cols, idx)
    const count = neighbors.reduce((nbMines, neighbor) => {
      if (cells[neighbor].nbAdjacentMines === -1) {
        nbMines += 1
      }
      return nbMines
    }, 0)
    return { nbAdjacentMines: count, disclosed: false }
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
      newCells[cellIdx].nbAdjacentMines = -1
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
