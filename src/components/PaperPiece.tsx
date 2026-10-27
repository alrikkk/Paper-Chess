type PaperPieceProps = {
    type: string
    color: 'w' | 'b'
}

const pieceImages: Record<string, string> = {
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

export default function PaperPiece({
    type,
    color,
}: PaperPieceProps) {
    const imageKey = `${color}-${type.toLowerCase()}`
    const imageSrc = pieceImages[imageKey]

    if (!imageSrc) return null

    return (
        <img

            src={imageSrc}
            alt={`${color == 'w' ? 'White' : 'Black'} ${type}`}
            className="paper-piece"
            draggable={false}
        />
    )
}