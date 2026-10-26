import { Chess, type Square } from 'chess.js'

export const chess = new Chess()

export function getLegalMoves(square: Square) {
    return chess.moves({
        square,
        verbose: true,
    })
}

export function movePiece(from: Square, to: Square) {
    try {
        return chess.move({ from, to })
    } catch {
        return null
    }
}

export function undoMove() {
    return chess.undo()
}