
import { useEffect, useRef, useState } from 'react'
import { chess, getLegalMoves, movePiece, undoMove, resetGame } from './game/chessState'
import type { Square } from 'chess.js'
import './App.css'
import PaperPiece from './components/PaperPiece'

type Screen = 'title' | 'mode' | 'game' | 'settings'

function App() {
  const [screen, setScreen] = useState<Screen>('title')

  const [gameMode, setGameMode] = useState<'two-player' | 'bot'>('two-player')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [botThinking, setBotThinking] = useState(false)
  const [botError, setBotError] = useState<string | null>(null)
  const [masterVolume, setMasterVolume] = useState(70)
  const [moveVolume, setMoveVolume] = useState(60)
  const [musicVolume, setMusicVolume] = useState(35)

  const bgMusicRef = useRef<HTMLAudioElement | null>(null)
  const [moveAnimations, setMoveAnimations] = useState(true)
  const [legalHints, setLegalHints] = useState(true)
  const [showCoordinates, setShowCoordinates] = useState(true)

  const [selected, setSelected] = useState<Square | null>(null)
  const [, setPositionVersion] = useState(0)

  const board = chess.board()

  useEffect(() => {
    const audio = new Audio('/audio/bg-music.mp3')

    audio.loop = true
    audio.volume = 0

    bgMusicRef.current = audio

    return () => {
      audio.pause()
      bgMusicRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = bgMusicRef.current

    if (!audio) return

    const targetVolume = screen === 'title' ? (masterVolume / 100) * (musicVolume / 100) : 0
    if (screen === 'title') {
      audio.play().catch((error) => {
        console.warn('Background music could not start:', error)
      })
    }

    const startVolume = audio.volume
    const startTime = performance.now()
    const duration = 2000

    const fadeInterval = window.setInterval(() => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      audio.volume = startVolume + (targetVolume - startVolume) * progress

      if (progress >= 1) {
        window.clearInterval(fadeInterval)

        if (targetVolume === 0) {
          audio.pause()
        }
      }
    }, 50)

    return () => {
      window.clearInterval(fadeInterval)
    }
  }, [screen, masterVolume, musicVolume])


  const history = chess.history()
  const legalMoves =
    selected && legalHints
      ? getLegalMoves(selected)
      : []

  function playSound(sound: 'move' | 'capture' | 'check' | 'game-end') {
    const audio = new Audio(`/audio/${sound}.wav`)

    audio.volume = (masterVolume / 100) * (moveVolume / 100)

    audio.play().catch((error) => {
      console.warn(`Could not play ${sound} sound:`, error)
    })
  }

  async function handleSquareClick(square: Square) {
    if (botThinking) return

    // Only allow White to move when playing against the bot.
    if (gameMode === 'bot' && chess.turn() !== 'w') return

    if (selected) {
      const move = movePiece(selected, square)

      if (move) {
        const sound = chess.isGameOver()
          ? 'game-end'
          : chess.isCheck()
            ? 'check'
            : move.captured
              ? 'capture'
              : 'move'

        playSound(sound)

        setSelected(null)
        setPositionVersion((version) => version + 1)

        // Ask the bot to respond after a successful White move.
        if (gameMode === 'bot' && !chess.isGameOver()) {
          setBotThinking(true)

          try {
            const response = await fetch(
              'http://127.0.0.1:8000/best-move',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  fen: chess.fen(),
                  difficulty,
                }),
              },
            )

            if (!response.ok) {
              throw new Error('The chess engine could not find a move.')
            }

            const data: { move: string } = await response.json()

            const botMove = chess.move({
              from: data.move.slice(0, 2),
              to: data.move.slice(2, 4),
              ...(data.move.length > 4
                ? { promotion: data.move[4] }
                : {}),
            })

            if (botMove) {
              const sound = chess.isGameOver()
                ? 'game-end'
                : chess.isCheck()
                  ? 'check'
                  : botMove.captured
                    ? 'capture'
                    : 'move'

              playSound(sound)
            }

            setPositionVersion((version) => version + 1)
          } catch (error) {
            console.error('Bot move failed:', error)
            setBotError(
              error instanceof Error ? error.message : 'The bot move failed.',
            )
          } finally {
            setBotThinking(false)
          }
        }

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

  if (screen === 'title') {
    return (
      <main className="title-screen">
        <div className="title-paper">
          <p className="title-eyebrow">A LITTLE GAME OF STRATEGY</p>

          <img
            className="title-logo"
            src="/paper-chess-logo.png"
            alt="Paper Chess"
          />

          <p className="title-subtitle">
            A handmade kingdom, one move at a time.
          </p>

          <div className="title-actions">
            <button
              className={
                gameMode === 'two-player'
                  ? 'title-button title-button-primary'
                  : 'title-button title-button-secondary'
              }
              onClick={() => setScreen('mode')}
            >
              Play
            </button>

            <button
              className={
                gameMode === 'bot'
                  ? 'title-button title-button-primary'
                  : 'title-button title-button-secondary'
              }
              onClick={() => setScreen('settings')}
            >
              Settings
            </button>
          </div>

          <p className="title-footer">
            CRAFTED ON PAPER · PLAYED IN STRATEGY
          </p>
        </div>
      </main>
    )
  }

  if (screen === 'mode') {
    return (
      <main className="title-screen">
        <div className="title-paper">
          <p className="title-eyebrow">CHOOSE YOUR OPPONENT</p>

          <h1 className="mode-heading">How will you play?</h1>

          <p className="title-subtitle">
            Every kingdom needs a worthy opponent.
          </p>

          {gameMode === 'bot' && (
            <div className="bot-difficulty">
              <p className="title-eyebrow">BOT DIFFICULTY</p>

              <div className="difficulty-options">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={
                      difficulty === level
                        ? 'title-button title-button-primary'
                        : 'title-button title-button-secondary'
                    }
                    onClick={() => setDifficulty(level)}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}


          <div className="mode-actions">
            {gameMode === 'two-player' && (
              <button
                className="title-button title-button-primary"
                onClick={() => {
                  resetGame()
                  setSelected(null)
                  setBotError(null)
                  setGameMode('two-player')
                  setScreen('game')
                }}
              >
                You vs You
                <span className="mode-description">
                  Two sides. Your strategy.
                </span>
              </button>
            )}

            {gameMode === 'bot' && (
              <button
                className="title-button title-button-secondary"
                onClick={() => setGameMode('two-player')}
              >
                You vs You
                <span className="mode-description">
                  Two sides. Your strategy.
                </span>
              </button>
            )}

            <button
              className={
                gameMode === 'bot'
                  ? 'title-button title-button-primary'
                  : 'title-button title-button-secondary'
              }
              onClick={() => setGameMode('bot')}
            >
              You vs Bot
              <span className="mode-description">
                Challenge the machine.
              </span>
            </button>
          </div>


          {gameMode === 'bot' && (
            <button
              className="title-button title-button-primary"
              onClick={() => {
                resetGame()
                setSelected(null)
                setBotError(null)
                setScreen('game')
              }}
            >
              Start Game
            </button>
          )}

          <button
            className="back-button"
            onClick={() => setScreen('title')}
          >
            ← Back to title
          </button>
        </div>
      </main>
    )
  }

  if (screen === 'settings') {
    return (
      <main className="title-screen">
        <div className="title-paper settings-paper">
          <p className="title-eyebrow">MAKE IT YOUR OWN</p>

          <h1 className="mode-heading">Settings</h1>

          <p className="title-subtitle">
            Settle in. Make yourself comfortable.
          </p>

          <div className="settings-list">
            <label className="setting-row">
              <span>
                <strong>Master volume</strong>
                <small>Overall game audio</small>
              </span>
              <span className="setting-control">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(event) =>
                    setMasterVolume(Number(event.target.value))
                  }
                />
                <span>{masterVolume}%</span>
              </span>
            </label>

            <label className="setting-row">
              <span>
                <strong>Move sound volume</strong>
                <small>Sound when a piece moves</small>
              </span>
              <span className="setting-control">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={moveVolume}
                  onChange={(event) =>
                    setMoveVolume(Number(event.target.value))
                  }
                />
                <span>{moveVolume}%</span>
              </span>
            </label>
            <label className="setting-row">
              <span>
                <strong>Background music</strong>
                <small>Music during gameplay</small>
              </span>

              <span className="setting-control">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={(event) =>
                    setMusicVolume(Number(event.target.value))
                  }
                />
                <span>{musicVolume}%</span>
              </span>
            </label>

            <label className="setting-row">
              <span>
                <strong>Move animations</strong>
                <small>Animate pieces between squares</small>
              </span>
              <input
                type="checkbox"
                checked={moveAnimations}
                onChange={(event) =>
                  setMoveAnimations(event.target.checked)
                }
              />
            </label>

            <label className="setting-row">
              <span>
                <strong>Legal move hints</strong>
                <small>Show available moves</small>
              </span>
              <input
                type="checkbox"
                checked={legalHints}
                onChange={(event) =>
                  setLegalHints(event.target.checked)
                }
              />
            </label>

            <label className="setting-row">
              <span>
                <strong>Board coordinates</strong>
                <small>Show ranks and files on the board</small>
              </span>
              <input
                type="checkbox"
                checked={showCoordinates}
                onChange={(event) =>
                  setShowCoordinates(event.target.checked)
                }
              />
            </label>
          </div>

          <button
            className="back-button"
            onClick={() => setScreen('title')}
          >
            ← Back to title
          </button>
        </div>
      </main>
    )
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

      <div className="game-layout">
        <div className="game-board-area">
          <div className="board-with-coordinates">
            {showCoordinates && (
              <div className="rank-coordinates" aria-hidden="true">
                {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
                  <span key={rank}>{rank}</span>
                ))}
              </div>
            )}

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
                      {piece ? (
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
          </div>

          {showCoordinates && (
            <div className="file-coordinates" aria-hidden="true">
              {'abcdefgh'.split('').map((file) => (
                <span key={file}>{file}</span>
              ))}
            </div>
          )}
        </div>

        <div className="game-sidebar">
          <aside className="move-history">
            <div className="history-header">
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
              {botThinking
                ? 'BOT THINKING…'
                : botError || getGameStatus()}
            </span>

            <button
              type="button"
              onClick={() => setScreen('title')}
            >
              ← Back to title
            </button>

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
        </div>
      </div>
    </main>
  )
}

export default App
