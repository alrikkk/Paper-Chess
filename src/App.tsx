
import './App.css'

const pieces = [
  '♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜',
  '♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟',
  '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', '', '',
  '♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙',
  '♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖',
]

function App() {
  return (
    <main className="game">
      <header className="game-header">
        <p className="eyebrow">A LITTLE GAME OF STRATEGY</p>
        <h1>Paper Chess<span>.</span></h1>
        <p className="subtitle">A handmade kingdom, one move at a time.</p>
      </header>

      <section className="board" aria-label="Chessboard">
        {pieces.map((piece, index) => {
          const row = Math.floor(index / 8)
          const column = index % 8
          const isLight = (row + column) % 2 === 1

          return (
            <div
              key={index}
              className={`square ${isLight ? 'light' : 'dark'}`}
            >
              {piece && (
                <span className={row < 2 ? 'black-piece' : 'white-piece'}>
                  {piece}
                </span>
              )}
            </div>
          )
        })}
      </section>

      <footer className="game-footer">
        <span>✂ CUT FROM PAPER, MADE FOR PLAY</span>
        <span>EST. 2026</span>
      </footer>
    </main>
  )
}

export default App
