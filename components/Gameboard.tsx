export default function Gameboard() {
  return (
    <div>
      <div className='grid grid-cols-9 grid-rows-9 w-96 h-96'>
        {Array.from({ length: 81 }).map((_, idx) => (
          <button
            key={idx}
            className='border border-gray-400 bg-gray-100 w-full h-full aspect-square'
          ></button>
        ))}
      </div>
    </div>
  )
}
