
type PaperPieceProps = {
    type: string
    color: 'w' | 'b'
    theme?: 'default' | 'brainrot'
}

const defaultPieceImages: Record<string, string> = {
    'w-k': '/pieces/white-king.webp',
    'b-k': '/pieces/black-king.webp',
    'w-q': '/pieces/white-queen.webp',
    'b-q': '/pieces/black-queen.webp',
    'w-r': '/pieces/white-rook.webp',
    'b-r': '/pieces/black-rook.webp',
    'w-b': '/pieces/white-bishop.webp',
    'b-b': '/pieces/black-bishop.webp',
    'w-n': '/pieces/white-knight.webp',
    'b-n': '/pieces/black-knight.webp',
    'w-p': '/pieces/white-pawn.webp',
    'b-p': '/pieces/black-pawn.webp',
}

const brainrotPieceImages: Record<string, string> = {
    'w-k': '/pieces/brainrot/white-king.webp',
    'b-k': '/pieces/brainrot/black-king.webp',
    'w-q': '/pieces/brainrot/white-queen.webp',
    'b-q': '/pieces/brainrot/black-queen.webp',
    'w-r': '/pieces/brainrot/white-rook.webp',
    'b-r': '/pieces/brainrot/black-rook.webp',
    'w-b': '/pieces/brainrot/white-bishop.webp',
    'b-b': '/pieces/brainrot/black-bishop.webp',
    'w-n': '/pieces/brainrot/white-knight.webp',
    'b-n': '/pieces/brainrot/black-knight.webp',
    'w-p': '/pieces/brainrot/white-pawn.webp',
    'b-p': '/pieces/brainrot/black-pawn.webp',
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
