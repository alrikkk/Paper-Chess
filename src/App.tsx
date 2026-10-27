import { useState } from 'react'
import { chess, getLegalMoves, movePiece, undoMove } from './game/chessState'
import type { Square } from 'chess.js'
import './App.css'
import PaperPiece from './components/PaperPiece'


function App() {
  const [selected, setSelected] = useState<Square | null>(null)
  const [, setPositionVersion] = useState(0)

  const board = chess.board()
  const history = chess.history()
  const legalMoves = selected
    ? getLegalMoves(selected)
    : []

  function handleSquareClick(square: Square) {
    if (selected) {
      const move = movePiece(selected, square)

      if (move) {
        setSelected(null)
        setPositionVersion((version) => version + 1)
        return
      }
    }

    const piece = chess.get(square)

    if (piece && piece.color === chess.turn()) {
      setSelected(square)
    } else {
      setSelected(null)
    }
  }
  function getGameStatus() {
    if (chess.isCheckmate()) {
      return chess.turn() === 'w'
        ? 'CHECKMATE — BLACK WINS'
        : 'CHECKMATE — WHITE WINS'
    }

    if (chess.isStalemate()) {
      return 'DRAW — STALEMATE'
    }

    if (chess.isDraw()) {
      return 'DRAW'
    }

    if (chess.isCheck()) {
      return chess.turn() === 'w'
        ? 'WHITE IS IN CHECK'
        : 'BLACK IS IN CHECK'
    }

    return chess.turn() === 'w'
      ? 'WHITE TO MOVE'
      : 'BLACK TO MOVE'
  }

  return (
    <main className="game">
      <header className="game-header">
        <p className="eyebrow">A LITTLE GAME OF STRATEGY</p>
        <h1>Paper Chess<span>.</span></h1>
        <p className="subtitle">
          A handmade kingdom, one move at a time.
        </p>
      </header>

      <section className="board" aria-label="Chessboard">
        {board.map((row, rowIndex) =>
          row.map((piece, columnIndex) => {
            const square = (
              `${String.fromCharCode(97 + columnIndex)}${8 - rowIndex}`
            ) as Square

            const isLight = (rowIndex + columnIndex) % 2 === 1
            const isSelected = selected === square
            const isLegal = legalMoves.some(
              (move) => move.to === square,
            )

            let symbol = ''

            if (piece) {
              const symbols = {
                wk: '♔', wq: '♕', wr: '♖',
                wb: '♗', wn: '♘', wp: '♙',
                bk: '♚', bq: '♛', br: '♜',
                bb: '♝', bn: '♞', bp: '♟',
              }

              symbol =
                symbols[`${piece.color}${piece.type}` as keyof typeof symbols]
            }

            return (
              <button
                key={square}
                type="button"
                aria-label={`${square}${piece ? ` ${piece.color} ${piece.type}` : ''}`}
                className={[
                  'square',
                  isLight ? 'light' : 'dark',
                  isSelected ? 'selected' : '',
                  isLegal ? 'legal-move' : '',
                ].join(' ')}
                onClick={() => handleSquareClick(square)}
              >
                {piece && ['k', 'q', 'r', 'b'].includes(piece.type) ? (
                  <PaperPiece type={piece.type} color={piece.color} />
                ) : (
                  symbol && (
                    <span
                      className={
                        piece?.color === 'w'
                          ? 'white-piece'
                          : 'black-piece'
                      }
                    >
                      {symbol}
                    </span>
                  )
                )}
              </button>
            )
          }),
        )}
      </section>

      <aside className='move-history'>
        <div className='history-header'>
          <h2>Move History</h2>
          <span>{history.length} moves</span>
        </div>
        {history.length === 0 ? (
          <p className="history-empty">Your Game Begins here.</p>
        ) : (
          <ol>
            {Array.from(
              { length: Math.ceil(history.length / 2) },
              (_, index) => (
                <li key={index}>
                  <span>{index + 1}.</span>
                  <span>{history[index * 2]}</span>
                  <span>{history[index * 2 + 1] ?? '-'}</span>
                </li>
              ),
            )}
          </ol>
        )}
      </aside>

      <footer className="game-footer">
        <span>
          {getGameStatus()}
        </span>
        <button
          type="button"
          onClick={() => {
            const move = undoMove()

            if (move) {
              setSelected(null)
              setPositionVersion((version) => version + 1)
            }
          }}
          disabled={history.length === 0}
        >
          Undo move
        </button>

        <button
          type="button"
          onClick={() => {
            chess.reset()
            setSelected(null)
            setPositionVersion((version) => version + 1)
          }}
        >
          Restart game
        </button>
      </footer>
    </main>
  )
}

export default App
