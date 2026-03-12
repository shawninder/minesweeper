import Header from "@/components/Header"
import Gameboard from "@/components/Gameboard"
import { GameStateProvider } from "@/components/GameStateProvider"

export default function Home() {
  return (
    <div className='flex flex-col items-center justify-center'>
      <GameStateProvider>
        <Header />
        <Gameboard />
      </GameStateProvider>
    </div>
  )
}
