
import random

import chess
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Paper Chess Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PIECE_VALUES = {
    chess.PAWN: 100,
    chess.KNIGHT: 320,
    chess.BISHOP: 330,
    chess.ROOK: 500,
    chess.QUEEN: 900,
    chess.KING: 0,
}

DIFFICULTY_DEPTH = {
    "easy": 1,
    "medium": 2,
    "hard": 3,
}


class MoveRequest(BaseModel):
    fen: str
    difficulty: str = Field(default="easy")


def evaluate(board: chess.Board) -> int:
    if board.is_checkmate():
        return -100000 if board.turn == chess.WHITE else 100000

    if board.is_game_over():
        return 0

    score = 0

    for piece_type, value in PIECE_VALUES.items():
        score += len(board.pieces(piece_type, chess.WHITE)) * value
        score -= len(board.pieces(piece_type, chess.BLACK)) * value

    return score if board.turn == chess.WHITE else -score


def minimax(
    board: chess.Board,
    depth: int,
    alpha: float,
    beta: float,
) -> int:
    if depth == 0 or board.is_game_over():
        return evaluate(board)

    best_score = -float("inf")

    for move in board.legal_moves:
        board.push(move)
        score = -minimax(board, depth - 1, -beta, -alpha)
        board.pop()

        best_score = max(best_score, score)
        alpha = max(alpha, score)

        if alpha >= beta:
            break

    return int(best_score)


def choose_move(board: chess.Board, depth: int) -> chess.Move:
    moves = list(board.legal_moves)

    if not moves:
        raise ValueError("No legal moves available.")

    random.shuffle(moves)
    best_move = moves[0]
    best_score = -float("inf")

    for move in moves:
        board.push(move)
        score = -minimax(board, depth - 1, -float("inf"), float("inf"))
        board.pop()

        if score > best_score:
            best_score = score
            best_move = move

    return best_move


@app.get("/")
def health_check():
    return {"status": "Paper Chess engine is running"}


@app.post("/best-move")
def best_move(request: MoveRequest):
    try:
        board = chess.Board(request.fen)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid chess position.")

    if not board.is_valid():
        raise HTTPException(status_code=400, detail="Invalid chess position.")

    if board.is_game_over():
        raise HTTPException(status_code=400, detail="The game has ended.")

    difficulty = request.difficulty.lower()

    if difficulty not in DIFFICULTY_DEPTH:
        raise HTTPException(
            status_code=400,
            detail="Difficulty must be easy, medium, or hard.",
        )

    move = choose_move(board, DIFFICULTY_DEPTH[difficulty])

    return {
        "move": move.uci(),
        "difficulty": difficulty,
    }
