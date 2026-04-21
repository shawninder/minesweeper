'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
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
  type GameModel,
  type AvailableSpace,
  type CellDimensions,
  discloseCell as discloseOrChordCell,
  evaluateGameState,
  flagCell,
  makeCells,
  getMineCount,
  startGame
} from '@/lib/gameLogic'

const FLAG = '🚩'
const MINE = '💣'

type GameAction =
  | { type: 'BOARD_RESIZED'; width: number; height: number }
  | { type: 'RESOLVE_ACTION'; cellIndex: number; discloseArmed: boolean }
  | { type: 'CELL_LONG_PRESS'; cellIndex: number }
  | { type: 'CELL_PRESS'; cellIndex: number }

const MIN_CELL_SIZE_PX = 56
const LONG_PRESS_DURATION_MS = 500

const defaultAvailableSpace: AvailableSpace = {
  width: MIN_CELL_SIZE_PX,
  height: MIN_CELL_SIZE_PX
}

const initialRows = Math.floor(defaultAvailableSpace.height / MIN_CELL_SIZE_PX)
const initialCols = Math.floor(defaultAvailableSpace.width / MIN_CELL_SIZE_PX)

const initialState: GameModel = {
  gameState: 'loading',
  availableSpace: defaultAvailableSpace,
  rows: initialRows,
  cols: initialCols,
  mines: getMineCount(initialRows * initialCols),
  cells: makeCells(initialRows * initialCols),
  cellDimensions: getCellDimensions(defaultAvailableSpace, {
    rows: initialRows,
    cols: initialCols
  })
}

type GridSize = {
  rows: number
  cols: number
}
function getCellDimensions(
  { width, height }: CellDimensions,
  { rows, cols }: GridSize
): CellDimensions {
  return {
    width: width / cols,
    height: height / rows
  }
}

function gameReducer(state: GameModel, action: GameAction): GameModel {
  switch (action.type) {
    case 'BOARD_RESIZED': {
      if (state.gameState !== 'loading' && state.gameState !== 'ready') {
        return state
      }

      const { width, height } = action

      const rows = Math.floor(height / MIN_CELL_SIZE_PX)
      const cols = Math.floor(width / MIN_CELL_SIZE_PX)
      const cellCount = rows * cols

      const cellDimensions = getCellDimensions(
        { width, height },
        { rows, cols }
      )

      return {
        ...state,
        gameState: 'ready',
        availableSpace: { width: action.width, height: action.height },
        rows,
        cols,
        mines: getMineCount(cellCount),
        cells: makeCells(cellCount),
        cellDimensions
      }
    }

    case 'CELL_LONG_PRESS': {
      if (state.gameState !== 'playing') {
        return state
      }
      const nextCells = discloseOrChordCell(
        state.cells,
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

    case 'CELL_PRESS': {
      const { rows, cols } = state
      if (state.gameState === 'won' || state.gameState === 'lost') {
        // RESET
        return {
          ...state,
          gameState: 'ready',
          cells: makeCells(rows * cols)
        }
      }

      if (state.gameState !== 'ready' && state.gameState !== 'playing') {
        return state
      }
      const cellsBeforeDisclose =
        state.gameState === 'ready'
          ? startGame(state, action.cellIndex)
          : state.cells

      const cell = cellsBeforeDisclose[action.cellIndex]
      if (!cell.isDisclosed && state.gameState === 'playing') {
        // Flag
        const nextCells = flagCell(cellsBeforeDisclose, action.cellIndex)
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
  const [longPressTarget, setLongPressTarget] = useState<number | null>(null)
  const longPressTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
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

  const flaggedCount = state.cells.reduce<number>((count, { isFlagged }) => {
    if (isFlagged) {
      count += 1
    }
    return count
  }, 0)

  function clickCell(cellIndex: number) {
    return () => {
      if (longPressTarget !== null) {
        return
      }
      dispatch({ type: 'CELL_PRESS', cellIndex })
    }
  }

  function pointerDown(cellIndex: number) {
    return () => {
      setLongPressTarget(null)

      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
      }
      longPressTimeoutRef.current = setTimeout(() => {
        setLongPressTarget(cellIndex)
        dispatch({ type: 'CELL_LONG_PRESS', cellIndex })
      }, LONG_PRESS_DURATION_MS)
    }
  }

  function pointerUp() {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
      }
    }
  }

  function renderCell(
    { isMine, adjacentMineCount, isDisclosed, isFlagged, isFirstDisclosed }: Cell,
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

    const nbMinesLeft = state.mines - flaggedCount

    return (
      <button
        key={index}
        className={`border ${backgroundClass} ${textClass} w-full h-full aspect-square text-xs ${textShadowSizeClass} ${textShadowColorClass}`}
        data-idx={index}
        onClick={clickCell(index)}
        onPointerDown={pointerDown(index)}
        onPointerUp={pointerUp()}
      >
        {isFirstDisclosed && (
          <div className='w-full h-full flex justify-center items-center bg-secondary'>
            <div className='[word-spacing:0.6em]'>
              {nbMinesLeft}{' '}
              {/* <span className='inline-block translate-y-0.5 [text-shadow:-2px_0px_4px_#ffffff]'>{MINE}</span> */}
              <span className='[text-shadow:0_0_5px_var(--foreground),0_0_10px_var(--foreground),0_0_15px_var(--foreground),0_0_20px_var(--muted-foreground),0_0_35px_var(--muted-foreground),0_0_40px_var(--muted-foreground),0_0_50px_var(--muted-foreground)]'>{MINE}</span>
              {/* <span className='inline-block translate-y-0.5 [text-shadow:-2px_0px_4px_#ffffff]'>{MINE}</span> */}
            </div>
          </div>
        )}
        {isDisclosed ? (isMine ? MINE : adjacentMineCount || '') : ''}
        {isFlagged ? FLAG : ''}
      </button>
    )
  }

  return (
    <div className='w-full h-full' ref={gameRef}>
      <div
        ref={boardRef}
        className={`minesweeper-board grid ${BORDER_CLASS_BY_GAME_STATE[state.gameState]} ${BACKGROUND_CLASS_BY_GAME_STATE[state.gameState]} w-full h-full justify-center content-center select-none font-bold`}
        style={{
          gridTemplateColumns: `repeat(${state.cols}, ${state.cellDimensions.width}px)`,
          gridTemplateRows: `repeat(${state.rows}, ${state.cellDimensions.height}px)`
        }}
      >
        {state.cells.map(renderCell)}
      </div>
    </div>
  )
}
