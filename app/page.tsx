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
  BACKGROUND_CLASS_BY_GAME_STATE,
  BORDER_CLASS_BY_GAME_STATE,
  CELL_BACKGROUND_CLASS_BY_STATE,
  CELL_NUMBER_CLASSES,
  TEXT_SHADOW_CLASSES,
  TEXT_SHADOW_FLAG_CLASS,
  TEXT_SHADOW_MINE_CLASS
} from '@/lib/colors'
import {
  type Cell,
  type GameState,
  discloseCell as discloseOrChordCell,
  evaluateGameState,
  flagCell,
  generateMines,
  getNeighbors,
  makeCells,
  numberCells,
  getMineCount
} from '@/lib/gameLogic'

type AvailableSpace = {
  width: number
  height: number
}

type PointerGesture = {
  pointerId: number
  originCellIndex: number
  originNeighbors: number[]
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
  switch (action.type) {
    case 'BOARD_RESIZED': {
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

    case 'RESOLVE_ACTION': {
      const originCell = state.cells[action.cellIndex]

      if (state.gameState === 'won' || state.gameState === 'lost') {
        // RESET
        const { rows, cols } = state
        return {
          ...state,
          gameState: 'ready',
          cells: makeCells(rows * cols)
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
      if (
        !originCell.isDisclosed &&
        !action.discloseArmed &&
        state.gameState !== 'ready'
      ) {
        // Flag
        const nextCells = flagCell(state.cells, action.cellIndex)
        const nextGameState = evaluateGameState(
          nextCells,
          action.cellIndex,
          false
        )

        return {
          ...state,
          gameState: nextGameState,
          cells: nextCells
        }
      }

      const nextCells = discloseOrChordCell(
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

    default: {
      throw new Error('Unexpected action type')
    }
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
    switch (state.gameState) {
      case 'lost':
        toast('You Lost')
        break
      case 'won':
        toast('You Won!')
        break
      default:
        break
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
      dispatch({
        type: 'RESOLVE_ACTION',
        cellIndex: gesture.originCellIndex,
        discloseArmed: gesture.discloseArmed
      })
    }
  }

  const onBoardPointerDown: PointerEventHandler<HTMLDivElement> = (event) => {
    if (event.button !== 0) return

    const cellIndex = cellIndexFromPointerEvent(event)
    if (cellIndex == null) return

    const { isDisclosed } = state.cells[cellIndex]
    pointerGestureRef.current = {
      pointerId: event.pointerId,
      originCellIndex: cellIndex,
      originNeighbors: getNeighbors(
        state.cells,
        state.rows,
        state.cols,
        cellIndex
      ),
      originWasDisclosed: isDisclosed,
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

    if (gesture.originNeighbors.includes(hoveredCellIndex)) {
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
  const { mine, number, flag, undisclosed } = CELL_BACKGROUND_CLASS_BY_STATE
  const backgroundClass = isDisclosed
    ? isMine
      ? mine
      : number
    : isFlagged
      ? flag
      : undisclosed

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
