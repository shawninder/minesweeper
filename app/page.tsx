'use client'

import {
  type MouseEventHandler,
  type PointerEventHandler,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'

import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

import Controls from '@/components/Controls'
import getMineCount from '@/utils/getMineCount'

export type GameState = 'loading' | 'ready' | 'playing' | 'lost' | 'won'
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
  loading: '[&>button]:border-blue-500 dark:[&>button]:border-blue-500',
  ready: '[&>button]:border-blue-400 dark:[&>button]:border-blue-600',
  playing: '[&>button]:border-gray-400 dark:[&>button]:border-gray-600',
  lost: '[&>button]:border-red-400 dark:[&>button]:border-red-600',
  won: '[&>button]:border-green-400 dark:[&>button]:border-green-600'
}

const bgColors: Record<GameState, string> = {
  loading: 'bg-blue-500 dark:bg-blue-500',
  ready: 'bg-blue-400 dark:bg-blue-600',
  playing: 'bg-gray-400 dark:bg-gray-600',
  lost: 'bg-red-400 dark:bg-red-600',
  won: 'bg-green-400 dark:bg-green-600'
}

export default function page() {
  return <Game />
}

type AvailableSpace = {
  width: number
  height: number
}

const cellPx = 56 // Should match `--ms-cell-size`
const LONG_PRESS_MS = 300

const defaultAvailableSpace = {
  width: cellPx,
  height: cellPx
}

function makeCells(nbCells: number) {
  return Array.from({ length: nbCells }).map(() => ({
    isMine: false,
    nbAdjacentMines: -1,
    isDisclosed: false,
    isFlagged: false
  }))
}

function Game() {
  const gameRef = useRef<HTMLDivElement>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressCellIdxRef = useRef<number | null>(null)
  const suppressNextClickRef = useRef(false)
  // const chordPointerIdRef = useRef<number | null>(null)
  const suppressContextMenuRef = useRef(false)

  const [gameState, setGameState] = useState<GameState>('loading')
  const [availableSpace, setAvailableSpace] = useState<AvailableSpace>(
    defaultAvailableSpace
  )
  const rows = Math.floor(availableSpace.height / cellPx)
  const cols = Math.floor(availableSpace.width / cellPx)
  const mines = getMineCount(rows * cols)

  const nbCells = rows * cols
  const initialCells = makeCells(nbCells)
  const [cells, setCells] = useState<Cell[]>(initialCells)

  const cellsRef = useRef(cells)
  const gameStateRef = useRef(gameState)
  const rowsRef = useRef(rows)
  const colsRef = useRef(cols)

  useLayoutEffect(() => {
    cellsRef.current = cells
    gameStateRef.current = gameState
    rowsRef.current = rows
    colsRef.current = cols
  }, [cells, gameState, rows, cols])

  function clearLongPressTimer() {
    if (longPressTimerRef.current != null) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  function endChordGesture(event: React.PointerEvent<HTMLDivElement>) {
    clearLongPressTimer()
    longPressCellIdxRef.current = null
    // if (chordPointerIdRef.current !== event.pointerId) return
    // chordPointerIdRef.current = null
    suppressContextMenuRef.current = false
    // const t = event.currentTarget
    // if (t.hasPointerCapture(event.pointerId)) {
    //   t.releasePointerCapture(event.pointerId)
    // }
  }

  useEffect(() => {
    const el = gameRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      if (gameState === 'loading' || gameState === 'ready') {
        const { width, height } = entries[0].contentRect
        setAvailableSpace({ width, height })
        const rows = Math.floor(height / cellPx)
        const cols = Math.floor(width / cellPx)
        setCells(makeCells(rows * cols))
        if (gameState !== 'ready') {
          setGameState('ready')
        }
      }
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
    }
  }, [gameState])

  function cellIdxFromPointerEvent(event: {
    target: EventTarget | null
  }): number | null {
    const target = event.target
    if (!(target instanceof Element)) return null
    const el = target.closest('[data-idx]')
    if (!el) return null
    const idx = parseInt(el.getAttribute('data-idx') || '', 10)
    return Number.isFinite(idx) ? idx : null
  }

  const pointerDownBoard: PointerEventHandler<HTMLDivElement> = (event) => {
    if (event.button !== 0) return
    const cellIdx = cellIdxFromPointerEvent(event)
    if (cellIdx == null) return
    // chordPointerIdRef.current = event.pointerId
    suppressContextMenuRef.current = true
    // event.currentTarget.setPointerCapture(event.pointerId)
    longPressCellIdxRef.current = cellIdx
    clearLongPressTimer()
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      if (gameStateRef.current !== 'playing') return
      const idx = longPressCellIdxRef.current
      if (idx == null) return
      suppressNextClickRef.current = true
      const newCells = discloseCell(
        cellsRef.current,
        rowsRef.current,
        colsRef.current,
        idx
      )
      setCells(newCells)
      checkForEnd(newCells, idx)
    }, LONG_PRESS_MS)
  }

  const pointerUpBoard: PointerEventHandler<HTMLDivElement> = (event) => {
    endChordGesture(event)
  }

  const contextMenuBoard: MouseEventHandler<HTMLDivElement> = (event) => {
    if (suppressContextMenuRef.current) {
      event.preventDefault()
    }
  }

  const pointerMoveBoard: PointerEventHandler<HTMLDivElement> = (event) => {
    if (longPressCellIdxRef.current == null) return
    const cellIdx = cellIdxFromPointerEvent(event)
    if (cellIdx !== longPressCellIdxRef.current) {
      clearLongPressTimer()
      longPressCellIdxRef.current = null
    }
  }

  const clickBoard: MouseEventHandler<HTMLDivElement> = function clickBoard(
    event
  ) {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }
    if (gameState === 'won' || gameState === 'lost') {
      return newGame(event)
    }
    const target = getTarget(event)
    const cellIdx = parseInt(target.dataset.idx || '', 10)

    const isRightClick = event.type === 'contextmenu' || event.button === 2
    const isCtrlClick = event.ctrlKey
    const isShiftClick = event.shiftKey
    const isMetaClick = event.metaKey
    const isSpecialClick =
      isRightClick || isCtrlClick || isShiftClick || isMetaClick

    let newCells
    if (gameState === 'ready') {
      const withMines = generateMines(cells, cellIdx, mines)
      const withNumbers = numberCells(withMines, rows, cols)
      setGameState('playing')
      newCells = discloseCell(withNumbers, rows, cols, cellIdx)
    } else {
      const { isDisclosed } = cells[cellIdx]
      newCells = isSpecialClick
        ? discloseCell(cells, rows, cols, cellIdx)
        : isDisclosed
          ? discloseCell(cells, rows, cols, cellIdx)
          : flagCell(cells, rows, cols, cellIdx)
    }
    setCells(newCells)
    checkForEnd(newCells, cellIdx, isSpecialClick)
  }

  function checkForEnd(
    cells: Cell[],
    cellIdx: number,
    disclosing: boolean = true
  ) {
    if (disclosing && cells[cellIdx].isMine && cells[cellIdx].isDisclosed) {
      setGameState('lost')
      toast('You Lose')
    } else {
      let lost = false
      let unfinished = false
      cells.forEach(({ isDisclosed, isMine, isFlagged }) => {
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

  function getTarget(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const target = event.target as HTMLButtonElement
    if (!target) {
      throw Error("Can't find click target")
    }
    return target
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
  const bgColor = bgColors[gameState]

  return (
    <div className='w-full h-full' ref={gameRef}>
      <Controls
        rows={rows}
        cols={cols}
        mines={mines}
        flagged={cells.reduce<number>((nbFlagged, { isFlagged }) => {
          if (isFlagged) {
            nbFlagged += 1
          }
          return nbFlagged
        }, 0)}
      />
      <div
        className={`minesweeper-board grid ${borderColor} ${bgColor} w-full h-full justify-between content-between select-none`}
        style={{
          gridTemplateColumns: `repeat(${cols}, var(--ms-cell-size))`,
          gridTemplateRows: `repeat(${rows}, var(--ms-cell-size))`
        }}
        onClick={clickBoard}
        onContextMenu={contextMenuBoard}
        onPointerDown={pointerDownBoard}
        onPointerUp={pointerUpBoard}
        onPointerCancel={pointerUpBoard}
        onPointerLeave={pointerUpBoard}
        onPointerMove={pointerMoveBoard}
      >
        {cells.map(cellMap)}
      </div>
      <Toaster />
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
            console.warn(
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
