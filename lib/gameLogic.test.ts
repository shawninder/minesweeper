import { describe, it, expect } from 'vitest'
import { makeCells, discloseCell, type Cell } from './gameLogic'

function makeCell(overrides: Partial<Cell> = {}): Cell {
  return {
    isMine: false,
    adjacentMineCount: 0,
    isDisclosed: false,
    isFlagged: false,
    isFirstDisclosed: false,
    ...overrides,
  }
}

// 3x3 grid layout:
//  0 | 1 | 2
//  3 | 4 | 5
//  6 | 7 | 8
function make3x3(overrides: Record<number, Partial<Cell>> = {}): Cell[] {
  return Array.from({ length: 9 }, (_, i) => makeCell(overrides[i]))
}

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

describe('discloseCell', () => {
  describe('unflagging a flagged cell', () => {
    it('unflags the cell without disclosing it', () => {
      const cells = make3x3({ 4: { isFlagged: true } })
      const result = discloseCell(cells, 3, 3, 4)

      expect(result[4].isFlagged).toBe(false)
      expect(result[4].isDisclosed).toBe(false)
    })
  })

  describe('disclosing an unflagged, undisclosed cell', () => {
    it('discloses a single cell when adjacentMineCount > 0', () => {
      const cells = make3x3({ 3: { isMine: true }, 4: { adjacentMineCount: 1 } })
      const result = discloseCell(cells, 3, 3, 4)

      expect(result[4].isDisclosed).toBe(true)
      for (let i = 0; i < 9; i++) {
        if (i !== 4) {
          expect(result[i].isDisclosed).toBe(false)
        }
      }
    })

    it('flood-fills neighbors when adjacentMineCount is 0', () => {
      // Mine at index 2, so adjacentMineCount for indices 1 and 5 is 1
      // All other cells have adjacentMineCount 0 except neighbors of mine
      const cells = make3x3({
        0: { adjacentMineCount: 0 },
        1: { adjacentMineCount: 1 },
        2: { isMine: true, adjacentMineCount: 0 },
        3: { adjacentMineCount: 0 },
        4: { adjacentMineCount: 1 },
        5: { adjacentMineCount: 1 },
        6: { adjacentMineCount: 0 },
        7: { adjacentMineCount: 0 },
        8: { adjacentMineCount: 0 },
      })

      const result = discloseCell(cells, 3, 3, 6)

      expect(result[6].isDisclosed).toBe(true)
      expect(result[3].isDisclosed).toBe(true)
      expect(result[0].isDisclosed).toBe(true)
      expect(result[7].isDisclosed).toBe(true)
      expect(result[1].isDisclosed).toBe(true)
      expect(result[4].isDisclosed).toBe(true)
      expect(result[8].isDisclosed).toBe(true)
      expect(result[5].isDisclosed).toBe(true)
      expect(result[2].isDisclosed).toBe(false)
    })
  })

  describe('chording (clicking an already-disclosed cell)', () => {
    it('cancels chord when a non-mine neighbor is flagged (wrong flag)', () => {
      // Center cell (4) is disclosed with adjacentMineCount 1
      // Mine at index 0, but flag is on index 1 (wrong flag)
      const cells = make3x3({
        0: { isMine: true, adjacentMineCount: 0 },
        1: { isFlagged: true, adjacentMineCount: 1 },
        3: { adjacentMineCount: 1 },
        4: { isDisclosed: true, adjacentMineCount: 1 }
      })

      const result = discloseCell(cells, 3, 3, 4)

      expect(result).toEqual(cells)
    })

    it('cancels chord when a mine neighbor is not flagged (underflag)', () => {
      // Center cell (4) is disclosed with adjacentMineCount 1
      // Mine at index 0, not flagged — this is an underflag mistake
      const cells = make3x3({
        0: { isMine: true, adjacentMineCount: 0 },
        1: { adjacentMineCount: 1 },
        3: { adjacentMineCount: 1 },
        4: { isDisclosed: true, adjacentMineCount: 1 },
      })

      const result = discloseCell(cells, 3, 3, 4)

      expect(result).toEqual(cells)
    })

    it('successfully chords when all flags are correct, disclosing non-flagged neighbors', () => {
      // Center cell (4) is disclosed with adjacentMineCount 1
      // Mine at index 0, correctly flagged
      const cells = make3x3({
        0: { isMine: true, isFlagged: true, adjacentMineCount: 0 },
        1: { adjacentMineCount: 1 },
        2: { adjacentMineCount: 0 },
        3: { adjacentMineCount: 1 },
        4: { isDisclosed: true, adjacentMineCount: 1 },
        5: { adjacentMineCount: 0 },
        6: { adjacentMineCount: 0 },
        7: { adjacentMineCount: 0 },
        8: { adjacentMineCount: 0 },
      })

      const result = discloseCell(cells, 3, 3, 4)

      expect(result[0].isFlagged).toBe(true)
      expect(result[0].isDisclosed).toBe(false)
      expect(result[0].isMine).toBe(true)

      expect(result[1]).toEqual(expect.objectContaining({
        isDisclosed: true, isFlagged: false, isMine: false, adjacentMineCount: 1,
      }))
      expect(result[2]).toEqual(expect.objectContaining({
        isDisclosed: true, isFlagged: false, isMine: false, adjacentMineCount: 0,
      }))
      expect(result[3]).toEqual(expect.objectContaining({
        isDisclosed: true, isFlagged: false, isMine: false, adjacentMineCount: 1,
      }))
      expect(result[5]).toEqual(expect.objectContaining({
        isDisclosed: true, isFlagged: false, isMine: false, adjacentMineCount: 0,
      }))
      expect(result[6]).toEqual(expect.objectContaining({
        isDisclosed: true, isFlagged: false, isMine: false, adjacentMineCount: 0,
      }))
      expect(result[7]).toEqual(expect.objectContaining({
        isDisclosed: true, isFlagged: false, isMine: false, adjacentMineCount: 0,
      }))
      expect(result[8]).toEqual(expect.objectContaining({
        isDisclosed: true, isFlagged: false, isMine: false, adjacentMineCount: 0,
      }))
    })
  })
})
