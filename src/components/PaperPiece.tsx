
type PaperPieceProps = {
    type: string
    color: 'w' | 'b'
    theme?: 'default' | 'brainrot'
}

const defaultPieceImages: Record<string, string> = {
    'w-k': '/pieces/white-king.png',
    'b-k': '/pieces/black-king.png',
    'w-q': '/pieces/white-queen.png',
    'b-q': '/pieces/black-queen.png',
    'w-r': '/pieces/white-rook.png',
    'b-r': '/pieces/black-rook.png',
    'w-b': '/pieces/white-bishop.png',
    'b-b': '/pieces/black-bishop.png',
    'w-n': '/pieces/white-knight.png',
    'b-n': '/pieces/black-knight.png',
    'w-p': '/pieces/white-pawn.png',
    'b-p': '/pieces/black-pawn.png',
}

const brainrotPieceImages: Record<string, string> = {
    'w-k': '/pieces/brainrot/white-king.png',
    'b-k': '/pieces/brainrot/black-king.png',
    'w-q': '/pieces/brainrot/white-queen.png',
    'b-q': '/pieces/brainrot/black-queen.png',
    'w-r': '/pieces/brainrot/white-rook.png',
    'b-r': '/pieces/brainrot/black-rook.png',
    'w-b': '/pieces/brainrot/white-bishop.png',
    'b-b': '/pieces/brainrot/black-bishop.png',
    'w-n': '/pieces/brainrot/white-knight.png',
    'b-n': '/pieces/brainrot/black-knight.png',
    'w-p': '/pieces/brainrot/white-pawn.png',
    'b-p': '/pieces/brainrot/black-pawn.png',
}

export default function PaperPiece({
    type,
    color,
    theme = 'default',
}: PaperPieceProps) {
    const imageKey = `${color}-${type.toLowerCase()}`

    const pieceImages =
        theme === 'brainrot' ? brainrotPieceImages : defaultPieceImages

    const imageSrc = pieceImages[imageKey]

    if (!imageSrc) return null

    return (
        <img
            src={imageSrc}
            alt={`${color === 'w' ? 'White' : 'Black'} ${type}`}
            className="paper-piece"
            draggable={false}
        />
    )
}
