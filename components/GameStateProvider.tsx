'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type GameSizeKey = 'small' | 'medium' | 'large'

export type GameSize = {
  sizeKey: GameSizeKey
  label: string
  rows: number
  cols: number
  mines: number
  shortcut: string
}

const GAME_SIZES: Record<GameSizeKey, GameSize> = {
  small: {
    sizeKey: 'small',
    label: 'Small',
    rows: 9,
    cols: 9,
    mines: 10,
    shortcut: 's'
  },
  medium: {
    sizeKey: 'medium',
    label: 'Medium',
    rows: 16,
    cols: 16,
    mines: 40,
    shortcut: 'm'
  },
  large: {
    sizeKey: 'large',
    label: 'Large',
    rows: 16,
    cols: 30,
    mines: 99,
    shortcut: 'l'
  }
}

type GameStateContextValue = {
  sizeKey: GameSizeKey
  size: GameSize
  setSizeKey: (sizeKey: GameSizeKey) => void
}

const GameStateContext = createContext<GameStateContextValue | undefined>(
  undefined
)

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [sizeKey, setSizeKey] = useState<GameSizeKey>('small')

  const value: GameStateContextValue = {
    sizeKey,
    size: GAME_SIZES[sizeKey],
    setSizeKey
  }

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  )
}

export function useGameState() {
  const ctx = useContext(GameStateContext)
  if (!ctx) {
    throw new Error('useGameState must be used within a GameStateProvider')
  }
  return ctx
}

export { GAME_SIZES }
