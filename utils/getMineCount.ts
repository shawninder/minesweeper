// export default function getMineCount(cellCount: number) {
//   const a = 0.000467
//   const b = -0.0576
//   const c = 11.61

//   return Math.round(a * cellCount * cellCount + b * cellCount + c)
// }

export default function getMineCount (n: number) {
	const a = 0.0615
	const b = 0.00102

	return Math.round(n * (a + b * Math.log(n)))
}