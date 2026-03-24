import { type GameState } from '@/lib/gameLogic'

export const CELL_NUMBER_CLASSES = [
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

export const TEXT_SHADOW_MINE_CLASS =
  'text-shadow-gray-100 dark:text-shadow-gray-900'
export const TEXT_SHADOW_FLAG_CLASS =
  'text-shadow-gray-100 dark:text-shadow-gray-900'
export const TEXT_SHADOW_CLASSES = [
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

export const BORDER_CLASS_BY_GAME_STATE: Record<GameState, string> = {
  loading: '[&>button]:border-blue-500 dark:[&>button]:border-blue-500',
  ready: '[&>button]:border-blue-400 dark:[&>button]:border-blue-600',
  playing: '[&>button]:border-gray-400 dark:[&>button]:border-gray-600',
  lost: '[&>button]:border-red-400 dark:[&>button]:border-red-600',
  won: '[&>button]:border-green-400 dark:[&>button]:border-green-600'
}

export const BACKGROUND_CLASS_BY_GAME_STATE: Record<GameState, string> = {
  loading: 'bg-blue-500 dark:bg-blue-500',
  ready: 'bg-blue-400 dark:bg-blue-600',
  playing: 'bg-gray-400 dark:bg-gray-600',
  lost: 'bg-red-400 dark:bg-red-600',
  won: 'bg-green-400 dark:bg-green-600'
}

export const CELL_BACKGROUND_CLASS_BY_STATE = {
  mine: 'bg-red-400 dark:bg-red-600',
  number: 'bg-gray-100 dark:bg-gray-800',
  flag: 'bg-red-100 dark:bg-red-900',
  undisclosed: 'bg-gray-300 dark:bg-gray-700'
} as const
