import { describe, it, expect } from 'vitest'
import { makeCells } from './gameLogic'

describe('makeCells', () => {
  it('returns an array of the requested length', () => {
    const counts = [0, 1, 10, 100]
    for (const count of counts) {
      expect(makeCells(count)).toHaveLength(count)
    }
  })

  it('returns cells with valid default properties', () => {
    const cells = makeCells(5)
    for (const cell of cells) {
      expect(cell).toEqual({
        isMine: false,
        adjacentMineCount: -1,
        isDisclosed: false,
        isFlagged: false,
        isFirstDisclosed: false,
      })
    }
  })

  it('returns distinct cell objects', () => {
    const cells = makeCells(3)
    expect(cells[0]).not.toBe(cells[1])
    expect(cells[1]).not.toBe(cells[2])
  })
})
