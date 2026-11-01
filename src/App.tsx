
import { useEffect, useRef, useState } from 'react'
import { chess, getLegalMoves, movePiece, undoMove, resetGame } from './game/chessState'
import type { Square } from 'chess.js'
import './App.css'
import PaperPiece from './components/PaperPiece'

function pickRandomMessage(messages: string[]) {
  return messages[Math.floor(Math.random() * messages.length)]
}

function getRandomThinkingDelay() {
  return 1000 + Math.random() * 2000
}

const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'http://127.0.0.1:8000'
).replace(/\/+$/, '')

type Screen = 'title' | 'mode' | 'game' | 'settings'

function App() {
  const [screen, setScreen] = useState<Screen>('title')

  const [gameMode, setGameMode] = useState<'two-player' | 'bot'>('two-player')
  const [theme, setTheme] = useState<'default' | 'brainrot'>('default')
  const [showPieceGuide, setShowPieceGuide] = useState(false)
  /* Characters */

  const brainrotCharacters = [
    { name: 'Triple T', piece: 'KING', color: 'WHITE', image: 'white-king.webp' },
    { name: 'Quandale Dingle', piece: 'KING', color: 'BLACK', image: 'black-king.webp' },
    { name: 'Bellarina Cappucinno', piece: 'QUEEN', color: 'WHITE', image: 'white-queen.webp' },
    { name: 'Giga Chad', piece: 'QUEEN', color: 'BLACK', image: 'black-queen.webp' },
    { name: 'Brr Brr Patapim', piece: 'ROOK', color: 'WHITE', image: 'white-rook.webp' },
    { name: 'John Pork', piece: 'ROOK', color: 'BLACK', image: 'black-rook.webp' },
    { name: 'Trallalero Tralala', piece: 'BISHOP', color: 'WHITE', image: 'white-bishop.webp' },
    { name: 'Jamaican LeBron James', piece: 'BISHOP', color: 'BLACK', image: 'black-bishop.webp' },
    { name: 'Chimpanzini Bananini', piece: 'KNIGHT', color: 'WHITE', image: 'white-knight.webp' },
    { name: 'Freaky Apple', piece: 'KNIGHT', color: 'BLACK', image: 'black-knight.webp' },
    { name: 'Cappuccino Assassino', piece: 'PAWN', color: 'WHITE', image: 'white-pawn.webp' },
    { name: 'Among Us', piece: 'PAWN', color: 'BLACK', image: 'black-pawn.webp' },
  ]
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [botThinking, setBotThinking] = useState(false)
  const [botError, setBotError] = useState<string | null>(null)

  type HampterMood = 'idle' | 'thinking' | 'wins' | 'loses'

  const [hampterMood, setHampterMood] = useState<HampterMood>('idle')
  const [hampterMessage, setHampterMessage] = useState('')
  const [masterVolume, setMasterVolume] = useState(70)
  const [moveVolume, setMoveVolume] = useState(60)
  const [musicVolume, setMusicVolume] = useState(35)

  const bgMusicRef = useRef<HTMLAudioElement | null>(null)
  const teamAudioRef = useRef<HTMLAudioElement | null>(null)
  const teamHoverSoundPLayedRef = useRef(false)
  const [moveAnimations, setMoveAnimations] = useState(true)
  const [legalHints, setLegalHints] = useState(true)
  const [showCoordinates, setShowCoordinates] = useState(true)
  const moaiPlayedRef = useRef(false)
  const [showMoaiIntro, setShowMoaiIntro] = useState(false)

  const [selected, setSelected] = useState<Square | null>(null)

  type PromotionPiece = 'q' | 'r' | 'b' | 'n'
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square
    to: Square
    color: 'w' | 'b'
  } | null>(null)
  const [draggingFrom, setDraggingFrom] = useState<Square | null>(null)
  const [dragPosition, setDragPosition] = useState<{
    x: number
    y: number
    size: number
  } | null>(null)

  const boardRef = useRef<HTMLElement | null>(null)
  const suppressClickRef = useRef(false)
  const [, setPositionVersion] = useState(0)

  const board = chess.board()
  const boardFlipped = playerColor === 'b'

  useEffect(() => {
    const audio = new Audio(
      theme === 'brainrot' ? '/audio/brainrot/title-music.mp3' : '/audio/bg-music.mp3'
    )

    audio.loop = true
    audio.volume = 0

    bgMusicRef.current = audio

    return () => {
      audio.pause()
      bgMusicRef.current = null
    }
  }, [theme])

  useEffect(() => {
    const audio = bgMusicRef.current

    if (!audio) return

    const shouldPlayMusic = screen !== 'game'
    const targetVolume = shouldPlayMusic ? (masterVolume / 100) * (musicVolume / 100) : 0

    if (shouldPlayMusic) {
      audio.play().catch((error) => {
        console.warn('Background Music Could Not Start', error)
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
  }, [screen, masterVolume, musicVolume, theme])

  useEffect(() => {
    if (!showMoaiIntro) return

    const audio = new Audio(`/audio/brainrot/moai-entrance.mp3`)
    audio.volume = (masterVolume / 100) * (moveVolume / 100)

    audio.play().catch((error) => {
      console.warn('Could not play moai entrance sound:', error)
    })

    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [showMoaiIntro, masterVolume, moveVolume])

  const history = chess.history()
  const verboseHistory = chess.history({ verbose: true })

  const capturedByWhite = verboseHistory.filter(
    (move) => move.color === 'w' && Boolean(move.captured),
  )

  const capturedByBlack = verboseHistory.filter(
    (move) => move.color === 'b' && Boolean(move.captured),
  )

  function groupCapturedPieces(moves: typeof verboseHistory) {
    const groups = new Map<
      NonNullable<(typeof moves)[number]['captured']>,
      number
    >()

    moves.forEach((move) => {
      if (!move.captured) return

      groups.set(move.captured, (groups.get(move.captured) ?? 0) + 1)
    })

    return Array.from(groups, ([type, count]) => ({ type, count }))
  }

  const groupedCapturesByWhite = groupCapturedPieces(capturedByWhite)
  const groupedCapturesByBlack = groupCapturedPieces(capturedByBlack)
  const legalMoves =
    selected && legalHints
      ? getLegalMoves(selected)
      : []


  function playSound(sound: 'move' | 'capture' | 'check' | 'game-end') {
    if (theme === 'brainrot' && sound === 'game-end') return
    const audioPath =
      theme === 'brainrot' && sound !== 'game-end'
        ? `/audio/brainrot/${sound}.wav`
        : `/audio/${sound}.wav`

    const audio = new Audio(audioPath)
    audio.volume = (masterVolume / 100) * (moveVolume / 100)

    audio.play().catch((error) => {
      console.warn(`Could not play ${sound} sound:`, error)
    })
  }

  function playBrainrotEndSound(result: 'win' | 'loss') {
    if (theme !== 'brainrot' || gameMode !== 'bot') return

    const audio = new Audio(
      result === 'win'
        ? '/audio/brainrot/player-win.wav'
        : '/audio/brainrot/bot-loss.wav'
    )

    audio.volume = (masterVolume / 100) * (moveVolume / 100)

    audio.play().catch((error) => {
      console.warn(`Could not play Brainrot ${result} sound:`, error)
    })
  }


  function playTeamSound(team: 'tungtung' | 'quandale') {
    if (theme !== 'brainrot') return

    //to prevent replaying of audio 
    if (teamAudioRef.current && !teamAudioRef.current.ended) {
      return
    }

    const audio = new Audio(
      `/audio/brainrot/team-${team}.mp3`
    )

    audio.volume = (masterVolume / 100) * (moveVolume / 100)

    teamAudioRef.current = audio

    audio.play().catch((error) => {
      console.warn(`Could not play ${team} team sound:`, error)
    })
  }


  function handleSquarePointerDown(
    square: Square,
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    if (botThinking) return
    if (gameMode === 'bot' && chess.turn() !== playerColor) return

    const piece = chess.get(square)

    if (piece && piece.color === chess.turn()) {
      const boardElement = boardRef.current
      if (!boardElement) return

      const rect = boardElement.getBoundingClientRect()

      setDraggingFrom(square)
      setSelected(square)

      setDragPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        size: rect.width / 8,
      })

      boardElement.setPointerCapture(event.pointerId)
    }
  }

  function handleBoardPointerMove(
    event: React.PointerEvent<HTMLElement>,
  ) {
    if (!draggingFrom || !boardRef.current) return

    const rect = boardRef.current.getBoundingClientRect()

    setDragPosition((current) => {
      if (!current) return null

      return {
        ...current,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
    })
  }

  function handleBoardPointerUp(
    event: React.PointerEvent<HTMLElement>,
  ) {
    if (!draggingFrom) return

    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest('[data-square]')

    const destination = target?.getAttribute('data-square') as Square | null

    if (destination && destination !== draggingFrom) {
      suppressClickRef.current = true
      void handleSquareClick(destination)
    }

    setDraggingFrom(null)
    setDragPosition(null)
  }

  function updateHampterAfterMove(
    lastMoveBy: 'player' | 'bot', wasCapture = false,
  ) {
    if (theme !== 'brainrot' || gameMode !== 'bot') return

    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        const winner = chess.turn() === 'w' ? 'b' : 'w'

        if (winner === playerColor) {
          playBrainrotEndSound('win')
          setHampterMood('loses')
          setHampterMessage('This is rigged. I demand a rematch!'

          )
        } else {
          playBrainrotEndSound('loss')
          setHampterMood('wins')
          setHampterMessage('EZ , GET REKT.'

          )
        }
      } else {
        setHampterMood('idle')
        setHampterMessage(
          "We'll call it a tie."
        )
      }
      return
    }

    if (chess.isCheck()) {
      const hampterColor = playerColor === 'w' ? 'b' : 'w'

      if (chess.turn() === hampterColor) {
        setHampterMessage('WAIT WHAT??!!')
      } else {
        setHampterMessage('Careful... your king is in trouble.')
      }

      setHampterMood('idle')
      return
    }

    if (lastMoveBy === 'bot' && wasCapture) {
      setHampterMessage('Mine Now.')
    }
    else if (lastMoveBy === 'player' && wasCapture) {
      setHampterMessage('Hey! THAT WAS MINE.')
    }
    else if (lastMoveBy === 'bot') {
      const messages = [
        'Intresting Move.',
        'Calculated Obviously.',
        'You Saw that coming?',
        'My master plan continues.',
      ]

      setHampterMessage(pickRandomMessage(messages))
    }
    else {
      const messages = [
        'Your Move...',
        'Hmmm. Intresting.',
        'I am watching you',
        'Bold Strategy.',
      ]

      setHampterMessage(pickRandomMessage(messages))
    }

    setHampterMood('idle')
  }

  async function requestBotMove() {
    if (chess.isGameOver()) return

    setBotThinking(true)
    setBotError(null)

    if (theme === 'brainrot') {
      setHampterMood('thinking')
      setHampterMessage('Hmm... let me think.')

      const thinkingDelay = getRandomThinkingDelay()

      await new Promise((resolve) => window.setTimeout(resolve, thinkingDelay),
      )
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/best-move`,
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

      if (!botMove) {
        throw new Error('The bot returned an invalid move.')
      }

      const sound = chess.isGameOver()
        ? 'game-end'
        : chess.isCheck()
          ? 'check'
          : botMove.captured
            ? 'capture'
            : 'move'

      playSound(sound)
      setPositionVersion((version) => version + 1)
      updateHampterAfterMove('bot', Boolean(botMove.captured))
    } catch (error) {
      console.error('Bot move failed:', error)
      setBotError(
        error instanceof Error ? error.message : 'The bot move failed.',
      )
    } finally {
      setBotThinking(false)

      if (theme === 'brainrot' && !chess.isGameOver()) {
        setHampterMood('idle')
      }
    }
  }

  async function handleSquareClick(square: Square) {
    if (botThinking || pendingPromotion) return
    if (gameMode === 'bot' && chess.turn() !== playerColor) return

    if (selected) {
      const promotionMove = getLegalMoves(selected).some(
        (move) => move.to === square && move.promotion,
      )

      if (promotionMove) {
        setPendingPromotion({
          from: selected,
          to: square,
          color: chess.turn(),
        })

        setSelected(null)
        return
      }

      const move = movePiece(selected, square)

      if (move) {
        await finishPlayerMove(move)
        return
      }
    }

    const piece = chess.get(square)
    if (piece && piece.color === chess.turn()) {
      setSelected(square)
    }
    else {
      setSelected(null)
    }
  }

  async function choosePromotion(piece: PromotionPiece) {
    if (!pendingPromotion) return
    const move = movePiece(
      pendingPromotion.from,
      pendingPromotion.to,
      piece,
    )

    if (move) {
      await finishPlayerMove(move)
    }
    else {
      setPendingPromotion(null)
    }
  }


  async function finishPlayerMove(move: NonNullable<ReturnType<typeof movePiece>>) {
    const sound = chess.isGameOver()
      ? 'game-end'
      : chess.isCheck()
        ? 'check'
        : move.captured
          ? 'capture'
          : 'move'
    playSound(sound)

    setSelected(null)
    setPendingPromotion(null)
    setPositionVersion((version) => version + 1)

    if (gameMode === 'bot') {
      updateHampterAfterMove('player', Boolean(move.captured))

      if (!chess.isGameOver()) {
        await requestBotMove()
      }
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

  function getHampterStatus() {
    if (botError) return 'ERROR'
    if (botThinking) return 'THINKING'

    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'b' : 'w'
      return winner === playerColor ? 'DEFEATED' : 'VICTOR'
    }

    if (chess.isGameOver()) return 'DRAW'

    if (chess.isCheck() && chess.turn() !== playerColor) {
      return 'IN CHECK'
    }

    return 'ALIVE'
  }

  /* leon kennedy is hot , fix ui bug for paper chess title in game screen -- */

  if (screen === 'title') {
    return (
      <main className="title-screen">
        <div className="title-paper">
          <img
            className="title-logo"
            src="/paper-chess-logo.webp"
            alt="Paper Chess"
          />
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

          <div className="theme-selector">
            <label htmlFor="theme-select">THEME</label>

            <select
              id="theme-select"
              value={theme}
              onChange={(event) => {
                const nextTheme = event.target.value as 'default' | 'brainrot'

                if (nextTheme === 'brainrot') {
                  let hasPlayed = moaiPlayedRef.current

                  try {
                    hasPlayed =
                      sessionStorage.getItem('paper-chess-moai-played') === 'true'
                  } catch {
                    // Use the component-level ref if sessionStorage is unavailable.
                  }

                  if (!hasPlayed) {
                    moaiPlayedRef.current = true

                    try {
                      sessionStorage.setItem('paper-chess-moai-played', 'true')
                    } catch {
                      // The ref still prevents replay during this app session.
                    }

                    setShowMoaiIntro(true)
                  }
                }
                else {
                  setShowMoaiIntro(false)
                }

                setTheme(nextTheme)
              }}
            >
              <option value="default">Default</option>
              <option value="brainrot">Brainrot</option>
            </select>
          </div>
        </div>

        {showMoaiIntro && theme === 'brainrot' && (
          <div
            className="moai-intro-overlay"
            aria-hidden="true"
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget) {
                setShowMoaiIntro(false)
              }
            }}
          >
            <div className="moai-intro-moai">🗿</div>
            <div className="moai-impact-dust">
              <span className="particle-1" />
              <span className="particle-2" />
              <span className="particle-3" />
              <span className="particle-4" />
              <span className="particle-5" />
              <span className="particle-6" />
            </div>
            <p className="moai-intro-caption">
              THE BRAINROT HAS ARRIVED.
            </p>
          </div>
        )}
      </main>
    )
  }

  if (screen === 'mode') {
    return (
      <main className="title-screen">
        <div className="title-paper">
          <h1 className="mode-heading">How will you play?</h1>


          <div className="side-selection">
            <p className="title-eyebrow">
              {theme === 'brainrot' ? 'CHOOSE YOUR TEAM' : 'CHOOSE YOUR SIDE'}
            </p>

            <div
              className="side-options"
              onMouseLeave={() => {
                teamHoverSoundPLayedRef.current = false
              }}
            >
              <button
                type="button"
                className={`title-button ${playerColor === 'w'
                  ? 'title-button-primary'
                  : 'title-button-secondary'}`}
                onClick={() => setPlayerColor('w')}
                onMouseEnter={() => playTeamSound('tungtung')}
              >
                {theme === 'brainrot' ? 'Team Tung Tung' : 'White'}
              </button>

              {/* yo gng dont slack */}

              <button
                type="button"
                className={`title-button ${playerColor === 'b'
                  ? 'title-button-primary'
                  : 'title-button-secondary'}`}
                onClick={() => setPlayerColor('b')}
                onMouseEnter={() => playTeamSound('quandale')}
              >
                {theme === 'brainrot' ? 'Team Quandale' : 'Black'}
              </button>
            </div>
          </div>

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
                  setHampterMood('idle')
                  setHampterMessage('')
                  setGameMode('two-player')
                  setScreen('game')
                }}
              >
                You vs You
              </button>
            )}

            {gameMode === 'bot' && (
              <button
                className="title-button title-button-secondary"
                onClick={() => setGameMode('two-player')}
              >
                You vs You
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
            </button>
          </div>


          {gameMode === 'bot' && (
            <button
              className="title-button title-button-primary"
              onClick={() => {
                resetGame()
                setSelected(null)
                setBotError(null)
                setHampterMood('idle')
                setHampterMessage('')
                setPositionVersion((version) => version + 1)
                setScreen('game')

                if (playerColor === 'b') {
                  void requestBotMove()
                }
              }}
            >
              Start Game
            </button>
          )}

          <button
            className="back-button"
            onClick={() => {
              setShowMoaiIntro(false)
              setScreen('title')
            }}
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
          <h1 className="mode-heading">Settings</h1>


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

  /* Continue here tmmr */

  return (
    <main className="game">
      <header className="game-header">
        <h1>Paper Chess<span>.</span></h1>
      </header>

      <div className={`game-layout ${gameMode === 'bot' && playerColor === 'b' ? 'player-black' : ''
        }`}>
        <div className="game-board-area">
          <div className="board-with-coordinates">
            {showCoordinates && (
              <div className="rank-coordinates" aria-hidden="true">
                {(boardFlipped
                  ? [1, 2, 3, 4, 5, 6, 7, 8]
                  : [8, 7, 6, 5, 4, 3, 2, 1]
                ).map((rank) => (
                  <span key={rank}>{rank}</span>
                ))}
              </div>
            )}

            <section
              ref={boardRef}
              className="board"
              aria-label="Chessboard"
              data-dragging={draggingFrom !== null}
              onPointerMove={handleBoardPointerMove}
              onPointerUp={handleBoardPointerUp}
              onPointerCancel={() => {
                setDraggingFrom(null)
                setDragPosition(null)
              }}
            >
              {Array.from({ length: 8 }, (_, displayRow) =>
                Array.from({ length: 8 }, (_, displayColumn) => {
                  const rowIndex = boardFlipped ? 7 - displayRow : displayRow
                  const columnIndex = boardFlipped ? 7 - displayColumn : displayColumn
                  const piece = board[rowIndex][columnIndex]
                  const square = (
                    `${String.fromCharCode(97 + columnIndex)}${8 - rowIndex}`
                  ) as Square

                  const isLight = (rowIndex + columnIndex) % 2 === 1
                  const isSelected = selected === square
                  const isLegal = legalMoves.some(
                    (move) => move.to === square,
                  )

                  return (
                    <button
                      key={square}
                      type="button"
                      data-square={square}
                      aria-label={`${square}${piece ? ` ${piece.color} ${piece.type}` : ''}`}
                      className={[
                        'square',
                        isLight ? 'light' : 'dark',
                        isSelected ? 'selected' : '',
                        isLegal ? 'legal-move' : '',
                      ].join(' ')}
                      onPointerDown={(event) => handleSquarePointerDown(square, event)}
                      onClick={() => {
                        if (suppressClickRef.current) {
                          suppressClickRef.current = false
                          return
                        }

                        handleSquareClick(square)
                      }}
                    >
                      {piece ? (
                        draggingFrom !== square && (
                          <PaperPiece type={piece.type} color={piece.color} theme={theme} />
                        )
                      ) : null}
                    </button>
                  )
                }),
              )}
              {draggingFrom && dragPosition && (() => {
                const draggedPiece = chess.get(draggingFrom)

                if (!draggedPiece) return null

                return (
                  <div
                    className="dragged-piece"
                    style={{
                      left: dragPosition.x,
                      top: dragPosition.y,
                      width: dragPosition.size,
                      height: dragPosition.size,
                    }}
                  >
                    <PaperPiece
                      type={draggedPiece.type}
                      color={draggedPiece.color}
                      theme={theme}
                    />
                  </div>
                )
              })()}
            </section>
          </div>

          {showCoordinates && (
            <div className="file-coordinates" aria-hidden="true">
              {(boardFlipped ? 'hgfedcba' : 'abcdefgh')
                .split('')
                .map((file) => (
                  <span key={file}>{file}</span>
                ))}
            </div>
          )}
        </div>

        <div className="game-sidebar">
          {theme === 'brainrot' && gameMode === 'bot' && (
            <section className="hampter-card">
              <div className="hampter-heading">
                <div>
                  <p className="hampter-label">OPPONENT</p>
                  <h2>Hampter</h2>
                </div>
                <span className="hampter-status">
                  {getHampterStatus()}
                </span>
              </div>

              <div className="hampter-portrait">
                <img
                  src={`/bot/${hampterMood}.` +
                    (hampterMood === 'thinking' ? 'png' : 'jpeg')}
                  alt={`Hampter is ${hampterMood}`}
                />
              </div>

              <div className="hampter-chat">
                <span className="hampter-chat-name">Hampter</span>
                <p>{hampterMessage}</p>
              </div>
            </section>
          )}

          <section className="captured-pieces">
            <div className="captured-header">
              <h2>Captured Pieces</h2>
              <span>
                {capturedByWhite.length + capturedByBlack.length} taken
              </span>
            </div>

            <div className="captured-row">
              <span className="captured-label">WHITE</span>

              <div className="captured-piece-list">
                {groupedCapturesByWhite.length > 0 ? (
                  groupedCapturesByWhite.map(({ type, count }) => (
                    <span
                      className="captured-piece-group"
                      key={`white-${type}`}
                      title={`White captured ${count} black ${type}${count > 1 ? ' pieces' : ' piece'}`}
                    >
                      <span className="captured-piece-icon">
                        <PaperPiece type={type} color="b" theme={theme} />
                      </span>

                      {count > 1 && (
                        <span className="captured-piece-count">×{count}</span>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="captured-empty">No captures</span>
                )}
              </div>
            </div>

            <div className="captured-row">
              <span className="captured-label">BLACK</span>

              <div className="captured-piece-list">
                {groupedCapturesByBlack.length > 0 ? (
                  groupedCapturesByBlack.map(({ type, count }) => (
                    <span
                      className="captured-piece-group"
                      key={`black-${type}`}
                      title={`Black captured ${count} white ${type}${count > 1 ? ' pieces' : ' piece'}`}
                    >
                      <span className="captured-piece-icon">
                        <PaperPiece type={type} color="w" theme={theme} />
                      </span>

                      {count > 1 && (
                        <span className="captured-piece-count">×{count}</span>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="captured-empty">No captures</span>
                )}
              </div>
            </div>
          </section>
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

          {theme === 'brainrot' && (
            <button
              type="button"
              className="piece-guide-button"
              onClick={() => setShowPieceGuide(true)}
            >
              ♟  VIEW PIECE GUIDE
            </button>
          )}

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
                setHampterMood('idle')
                setHampterMessage('')
                setPositionVersion((version) => version + 1)
              }}
            >
              Restart game
            </button>
          </footer>
        </div>
      </div>

      {pendingPromotion && (
        <div className="promotion-overlay">
          <section
            className="promotion-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="promotion-title"
          >
            <p className="eyebrow"> A NEW CHAPTER</p>
            <h2 id="promotion-title">Choose your promotion</h2>

            <div className="promotion-options">
              {([
                { type: 'q', label: 'Queen' },
                { type: 'r', label: 'Rook' },
                { type: 'b', label: 'Bishop' },
                { type: 'n', label: 'Knight' },
              ] as const).map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  className="promotion-option"
                  onClick={() => void choosePromotion(type)}
                >
                  <PaperPiece
                    type={type}
                    color={pendingPromotion.color}
                    theme={theme}
                  />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
      {showPieceGuide && theme === 'brainrot' && (
        <div
          className="piece-guide-overlay"
          onClick={() => setShowPieceGuide(false)}
        >
          <section
            className="piece-guide-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="piece-guide-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className='piece-guide-header'>
              <div>
                <p className="eyebrow">~CHARACTER ENCYCLOPEDIA~</p>
                <h2 id="piece-guide-title"> Brainrot Codex</h2>
              </div>

              <button
                type="button"
                className="piece-guide-close"
                onClick={() => setShowPieceGuide(false)}
                aria-label="Close Piece Guide"
              >
                x
              </button>
            </header>

            <div className="piece-guide-grid">
              {brainrotCharacters.map((character) => (
                <article
                  className="piece-guide-card"
                  key={character.image}
                >
                  <div className="piece-guide-image">
                    <img
                      src={`/pieces/brainrot/${character.image}`}
                      alt={character.name}
                    />
                  </div>

                  <div className="piece-guide-info">
                    <span>{character.color} {character.piece}</span>
                    <h3>{character.name}</h3>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
