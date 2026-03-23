export default function getMineCount(cellCount: number) {
  const MINE_CURVE_A = 0.000467
  const MINE_CURVE_B = -0.0576
  const MINE_CURVE_C = 11.61

  return Math.round(
    MINE_CURVE_A * cellCount * cellCount + MINE_CURVE_B * cellCount + MINE_CURVE_C
  )
}