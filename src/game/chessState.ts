import { Chess, type Square } from 'chess.js'

export const chess = new Chess()
export function resetGame() {
    chess.reset()
}

export function getLegalMoves(square: Square) {
    return chess.moves({
        square,
        verbose: true,
    })
}

export function movePiece(
    from: Square,
    to: Square,
    promotion?: 'q' | 'r' | 'b' | 'n',
) {
    try {
        return chess.move({
            from,
            to,
            ...(promotion ? { promotion } : {}),
        })
    } catch {
        return null
    }
}

export function undoMove() {
    return chess.undo()
}