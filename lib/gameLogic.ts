export type GameState = 'loading' | 'ready' | 'playing' | 'lost' | 'won'

export type Cell = {
  isMine: boolean
  adjacentMineCount: number
  isDisclosed: boolean
  isFlagged: boolean
}

export type ActionType = 'flag' | 'disclose' | 'chord'

export function makeCells(cellCount: number): Cell[] {
  return Array.from({ length: cellCount }).map(() => ({
    isMine: false,
    adjacentMineCount: -1,
    isDisclosed: false,
    isFlagged: false
  }))
}

export function flagCell(cells: Cell[], index: number): Cell[] {
  const { isDisclosed, isFlagged } = cells[index]
  if (isDisclosed) {
    return cells
  }

  const nextCells = cells.map((cell) => ({ ...cell }))
  nextCells[index].isFlagged = !isFlagged
  return nextCells
}

export function discloseCell(
  cells: Cell[],
  rows: number,
  cols: number,
  index: number
): Cell[] {
  let nextCells = cells.map((cell) => ({ ...cell }))
  const cell = nextCells[index]
  const { adjacentMineCount, isFlagged } = cell
  const wasDisclosed = cell.isDisclosed

  if (isFlagged) {
    cell.isFlagged = false
    return nextCells
  }

  cell.isDisclosed = true
  if (adjacentMineCount !== 0) {
    if (wasDisclosed) {
      const neighbors = getNeighbors(nextCells, rows, cols, index)
      const [adjacentFlags, adjacentMines, mistakes, toDisclose] =
        neighbors.reduce<[number, number, number, number[]]>(
          ([flagCount, mineCount, mistakeCount, pending], neighborIndex) => {
            const neighbor = nextCells[neighborIndex]
            if (neighbor.isFlagged) flagCount += 1
            if (neighbor.isMine) mineCount += 1
            if (neighbor.isFlagged && !neighbor.isMine) mistakeCount += 1
            if (!neighbor.isFlagged && !neighbor.isMine && !neighbor.isDisclosed) {
              pending.push(neighborIndex)
            }

            return [flagCount, mineCount, mistakeCount, pending]
          },
          [0, 0, 0, []]
        )

      if (mistakes === 0 && adjacentFlags === adjacentMines) {
        toDisclose.forEach((neighborIndex) => {
          nextCells = discloseCell(nextCells, rows, cols, neighborIndex)
        })
      }
    }

    return nextCells
  }

  const queue: number[] = [index]
  let queueIndex = 0

  while (queueIndex < queue.length) {
    const current = queue[queueIndex++]
    if (nextCells[current].adjacentMineCount !== 0) {
      continue
    }

    for (const neighborIndex of getNeighbors(nextCells, rows, cols, current)) {
      const neighbor = nextCells[neighborIndex]
      if (neighbor.isDisclosed || neighbor.isMine) {
        continue
      }

      neighbor.isDisclosed = true
      if (neighbor.adjacentMineCount === 0) {
        queue.push(neighborIndex)
      }
    }
  }

  return nextCells
}

export function numberCells(cells: Cell[], rows: number, cols: number): Cell[] {
  return cells.map((cell, index) => {
    if (cell.isMine) {
      return cell
    }

    const neighbors = getNeighbors(cells, rows, cols, index)
    const adjacentMineCount = neighbors.reduce((mineCount, neighborIndex) => {
      if (cells[neighborIndex].isMine) {
        mineCount += 1
      }
      return mineCount
    }, 0)

    return {
      isMine: false,
      adjacentMineCount,
      isDisclosed: false,
      isFlagged: false
    }
  })
}

export function getNeighbors(
  cells: Cell[],
  rows: number,
  cols: number,
  index: number
): number[] {
  const neighbors: number[] = []

  const notTopRow = index > cols - 1
  const notLeftColumn = index % cols !== 0
  const notRightColumn = index % cols !== cols - 1
  const notBottomRow = index < cells.length - cols

  const upLeft = index - cols - 1
  if (notTopRow && notLeftColumn) neighbors.push(upLeft)

  const up = index - cols
  if (notTopRow) neighbors.push(up)

  const upRight = index - cols + 1
  if (notTopRow && notRightColumn) neighbors.push(upRight)

  const right = index + 1
  if (notRightColumn) neighbors.push(right)

  const downRight = index + cols + 1
  if (notBottomRow && notRightColumn) neighbors.push(downRight)

  const down = index + cols
  if (notBottomRow) neighbors.push(down)

  const downLeft = index + cols - 1
  if (notBottomRow && notLeftColumn) neighbors.push(downLeft)

  const left = index - 1
  if (notLeftColumn) neighbors.push(left)

  return neighbors
}

export function generateMines(
  cells: Cell[],
  safeCellIndex: number,
  mineCount: number
): Cell[] {
  const nextCells = cells.map((cell) => ({ ...cell }))

  shuffleArray(
    Array.from(cells).reduce<number[]>((indices, _, index) => {
      if (index !== safeCellIndex) {
        indices.push(index)
      }
      return indices
    }, [])
  )
    .slice(0, mineCount)
    .forEach((cellIndex) => {
      nextCells[cellIndex].isMine = true
    })

  return nextCells
}

function shuffleArray(numbers: number[]): number[] {
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
  }
  return numbers
}

export function evaluateGameState(
  cells: Cell[],
  cellIndex: number,
  wasDiscloseAction: boolean
): Extract<GameState, 'lost' | 'won' | 'playing' | 'ready'> {
  if (wasDiscloseAction && cells[cellIndex].isMine && cells[cellIndex].isDisclosed) {
    return 'lost'
  }

  let hasUntouchedCells = false
  let revealedMine = false

  cells.forEach(({ isDisclosed, isMine, isFlagged }) => {
    if (!isFlagged && !isDisclosed) {
      hasUntouchedCells = true
    }
    if (isDisclosed && isMine) {
      revealedMine = true
    }
  })

  if (revealedMine) return 'lost'
  if (!hasUntouchedCells) return 'won'
  return 'playing'
}

export function getMineCount(cellCount: number) {
  const MINE_CURVE_A = 0.000467
  const MINE_CURVE_B = -0.0576
  const MINE_CURVE_C = 11.61

  return Math.round(
    MINE_CURVE_A * cellCount * cellCount + MINE_CURVE_B * cellCount + MINE_CURVE_C
  )
}
