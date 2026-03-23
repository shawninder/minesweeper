'use client'

import {
  type MouseEventHandler,
  type PointerEventHandler,
  useEffect,
  useReducer,
  useRef
} from 'react'
import { toast } from 'sonner'
import Controls from '@/components/Controls'
import { Toaster } from '@/components/ui/sonner'
import {
  type ActionType,
  type Cell,
  type GameState,
  discloseCell,
  evaluateGameState,
  flagCell,
  generateMines,
  getNeighbors,
  makeCells,
  numberCells
} from '@/lib/gameLogic'
import getMineCount from '@/utils/getMineCount'

const CELL_NUMBER_CLASSES = [
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

const TEXT_SHADOW_MINE_CLASS = 'text-shadow-gray-100 dark:text-shadow-gray-900'
const TEXT_SHADOW_FLAG_CLASS = 'text-shadow-gray-100 dark:text-shadow-gray-900'
const TEXT_SHADOW_CLASSES = [
  '',
  'text-shadow-blue-500 dark:text-shadow-blue-300',
  'text-shadow-emerald-500 dark:text-shadow-emerald-300',
  'text-shadow-red-500 dark:text-shadow-red-300',
  'text-shadow-indigo-500 dark:text-shadow-indigo-300',
  'text-shadow-amber-500 dark:text-shadow-amber-300',
  'text-shadow-teal-500 dark:text-shadow-teal-300',
  'text-shadow-fuchsia-500 dark:text-shadow-fuchsia-300',
  'text-shadow-slate-300 dark:text-shadow-slate-200'
]

const BORDER_CLASS_BY_GAME_STATE: Record<GameState, string> = {
  loading: '[&>button]:border-blue-500 dark:[&>button]:border-blue-500',
  ready: '[&>button]:border-blue-400 dark:[&>button]:border-blue-600',
  playing: '[&>button]:border-gray-400 dark:[&>button]:border-gray-600',
  lost: '[&>button]:border-red-400 dark:[&>button]:border-red-600',
  won: '[&>button]:border-green-400 dark:[&>button]:border-green-600'
}

const BACKGROUND_CLASS_BY_GAME_STATE: Record<GameState, string> = {
  loading: 'bg-blue-500 dark:bg-blue-500',
  ready: 'bg-blue-400 dark:bg-blue-600',
  playing: 'bg-gray-400 dark:bg-gray-600',
  lost: 'bg-red-400 dark:bg-red-600',
  won: 'bg-green-400 dark:bg-green-600'
}

type AvailableSpace = {
  width: number
  height: number
}

type PointerGesture = {
  pointerId: number
  originCellIndex: number
  originWasDisclosed: boolean
  discloseArmed: boolean
}

type GameModel = {
  gameState: GameState
  availableSpace: AvailableSpace
  rows: number
  cols: number
  mines: number
  cells: Cell[]
}

type GameAction =
  | { type: 'BOARD_RESIZED'; width: number; height: number }
  | { type: 'RESOLVE_ACTION'; cellIndex: number; discloseArmed: boolean }
  | { type: 'RESET_GAME' }

const CELL_SIZE_PX = 56 // Should match `--ms-cell-size`

const defaultAvailableSpace: AvailableSpace = {
  width: CELL_SIZE_PX,
  height: CELL_SIZE_PX
}

const initialRows = Math.floor(defaultAvailableSpace.height / CELL_SIZE_PX)
const initialCols = Math.floor(defaultAvailableSpace.width / CELL_SIZE_PX)

const initialState: GameModel = {
  gameState: 'loading',
  availableSpace: defaultAvailableSpace,
  rows: initialRows,
  cols: initialCols,
  mines: getMineCount(initialRows * initialCols),
  cells: makeCells(initialRows * initialCols)
}

function gameReducer(state: GameModel, action: GameAction): GameModel {
  if (action.type === 'BOARD_RESIZED') {
    if (state.gameState !== 'loading' && state.gameState !== 'ready') {
      return state
    }

    const rows = Math.floor(action.height / CELL_SIZE_PX)
    const cols = Math.floor(action.width / CELL_SIZE_PX)
    const cellCount = rows * cols

    return {
      ...state,
      gameState: 'ready',
      availableSpace: { width: action.width, height: action.height },
      rows,
      cols,
      mines: getMineCount(cellCount),
      cells: makeCells(cellCount)
    }
  }

  if (action.type === 'RESET_GAME') {
    const cellCount = state.rows * state.cols
    return {
      ...state,
      gameState: 'ready',
      cells: makeCells(cellCount)
    }
  }

  if (state.gameState === 'won' || state.gameState === 'lost') {
    const cellCount = state.rows * state.cols
    return {
      ...state,
      gameState: 'ready',
      cells: makeCells(cellCount)
    }
  }

  const originCell = state.cells[action.cellIndex]
  const actionType: ActionType = originCell.isDisclosed
    ? 'chord'
    : action.discloseArmed
      ? 'disclose'
      : 'flag'

  if (actionType === 'flag') {
    const nextCells = flagCell(state.cells, action.cellIndex)
    const nextGameState = evaluateGameState(nextCells, action.cellIndex, false)

    return {
      ...state,
      gameState: nextGameState,
      cells: nextCells
    }
  }

  const cellsBeforeDisclose =
    state.gameState === 'ready'
      ? numberCells(
          generateMines(state.cells, action.cellIndex, state.mines),
          state.rows,
          state.cols
        )
      : state.cells

  const nextCells = discloseCell(
    cellsBeforeDisclose,
    state.rows,
    state.cols,
    action.cellIndex
  )
  const nextGameState = evaluateGameState(nextCells, action.cellIndex, true)

  return {
    ...state,
    gameState: nextGameState,
    cells: nextCells
  }
}

export default function Page() {
  return <Game />
}

function Game() {
  const gameRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const pointerGestureRef = useRef<PointerGesture | null>(null)
  const suppressContextMenuRef = useRef(false)
  const [state, dispatch] = useReducer(gameReducer, initialState)

  useEffect(() => {
    const element = gameRef.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      dispatch({ type: 'BOARD_RESIZED', width, height })
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (state.gameState === 'lost') {
      toast('You Lose')
    }
  }, [state.gameState])

  const flaggedCount = state.cells.reduce<number>((count, { isFlagged }) => {
    if (isFlagged) {
      count += 1
    }
    return count
  }, 0)

  function cellIndexFromPointerEvent(event: {
    target: EventTarget | null
  }): number | null {
    const target = event.target
    if (!(target instanceof Element)) return null
    const element = target.closest('[data-idx]')
    if (!element) return null
    const index = parseInt(element.getAttribute('data-idx') || '', 10)
    return Number.isFinite(index) ? index : null
  }

  function cellIndexFromPoint(
    x: number,
    y: number,
    boardElement: HTMLDivElement
  ): number | null {
    const element = document.elementFromPoint(x, y)
    if (!(element instanceof Element)) return null
    if (!boardElement.contains(element)) return null
    const cellElement = element.closest('[data-idx]')
    if (!cellElement || !boardElement.contains(cellElement)) return null
    const index = parseInt(cellElement.getAttribute('data-idx') || '', 10)
    return Number.isFinite(index) ? index : null
  }

  function resolveAndApplyAction(cellIndex: number, discloseArmed: boolean) {
    dispatch({ type: 'RESOLVE_ACTION', cellIndex, discloseArmed })
  }

  function endPointerGesture(
    event: React.PointerEvent<HTMLDivElement>,
    shouldResolve: boolean
  ) {
    const gesture = pointerGestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return
    }

    pointerGestureRef.current = null
    suppressContextMenuRef.current = false

    const target = event.currentTarget
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId)
    }

    if (shouldResolve) {
      resolveAndApplyAction(gesture.originCellIndex, gesture.discloseArmed)
    }
  }

  const onBoardPointerDown: PointerEventHandler<HTMLDivElement> = (event) => {
    if (event.button !== 0) return

    const cellIndex = cellIndexFromPointerEvent(event)
    if (cellIndex == null) return

    const cell = state.cells[cellIndex]
    pointerGestureRef.current = {
      pointerId: event.pointerId,
      originCellIndex: cellIndex,
      originWasDisclosed: cell.isDisclosed,
      discloseArmed: false
    }
    suppressContextMenuRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onBoardPointerUp: PointerEventHandler<HTMLDivElement> = (event) => {
    endPointerGesture(event, true)
  }

  const onBoardPointerCancel: PointerEventHandler<HTMLDivElement> = (event) => {
    endPointerGesture(event, false)
  }

  const onBoardContextMenu: MouseEventHandler<HTMLDivElement> = (event) => {
    if (suppressContextMenuRef.current) {
      event.preventDefault()
    }
  }

  const onBoardPointerMove: PointerEventHandler<HTMLDivElement> = (event) => {
    const gesture = pointerGestureRef.current
    if (
      !gesture ||
      gesture.pointerId !== event.pointerId ||
      gesture.discloseArmed
    ) {
      return
    }
    if (gesture.originWasDisclosed) {
      return
    }

    const boardElement = boardRef.current
    if (!boardElement) return

    const hoveredCellIndex = cellIndexFromPoint(
      event.clientX,
      event.clientY,
      boardElement
    )
    if (hoveredCellIndex == null) {
      gesture.discloseArmed = true
      return
    }

    const neighbors = getNeighbors(
      state.cells,
      state.rows,
      state.cols,
      gesture.originCellIndex
    )
    if (neighbors.includes(hoveredCellIndex)) {
      gesture.discloseArmed = true
    }
  }

  return (
    <div className='w-full h-full' ref={gameRef}>
      <Controls mines={state.mines} flagged={flaggedCount} />
      <div
        ref={boardRef}
        className={`minesweeper-board grid ${BORDER_CLASS_BY_GAME_STATE[state.gameState]} ${BACKGROUND_CLASS_BY_GAME_STATE[state.gameState]} w-full h-full justify-between content-between select-none font-bold`}
        style={{
          gridTemplateColumns: `repeat(${state.cols}, var(--ms-cell-size))`,
          gridTemplateRows: `repeat(${state.rows}, var(--ms-cell-size))`
        }}
        onContextMenu={onBoardContextMenu}
        onPointerDown={onBoardPointerDown}
        onPointerUp={onBoardPointerUp}
        onPointerCancel={onBoardPointerCancel}
        onPointerMove={onBoardPointerMove}
      >
        {state.cells.map(renderCell)}
      </div>
      <Toaster />
    </div>
  )
}

export function renderCell(
  { isMine, adjacentMineCount, isDisclosed, isFlagged }: Cell,
  index: number
) {
  const backgroundClass = isDisclosed
    ? isMine
      ? 'bg-red-400 dark:bg-red-600'
      : 'bg-gray-100 dark:bg-gray-800'
    : isFlagged
      ? 'bg-red-100 dark:bg-red-900'
      : 'bg-gray-300 dark:bg-gray-700'

  const textClass = isDisclosed
    ? adjacentMineCount
      ? CELL_NUMBER_CLASSES[adjacentMineCount]
      : ''
    : ''

  const textShadowColorClass = isDisclosed
    ? isMine
      ? TEXT_SHADOW_MINE_CLASS
      : TEXT_SHADOW_CLASSES[adjacentMineCount]
    : TEXT_SHADOW_FLAG_CLASS

  const textShadowSizeClass =
    isDisclosed && !isMine ? 'text-shadow-none' : 'text-shadow-lg'

  return (
    <button
      key={index}
      className={`border ${backgroundClass} ${textClass} w-full h-full aspect-square text-xs ${textShadowSizeClass} ${textShadowColorClass}`}
      data-idx={index}
    >
      {isDisclosed ? (isMine ? '💣' : adjacentMineCount || '') : ''}
      {isFlagged ? '🚩' : ''}
    </button>
  )
}
