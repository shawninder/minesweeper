import Header from "@/components/Header"
import Gameboard from "@/components/Gameboard"

export default function Home() {
  return (
    <div className='flex flex-col items-center justify-center'>
      <Header />
      <Gameboard />
    </div>
  )
}
