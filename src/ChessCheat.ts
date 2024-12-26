import StockFish, { StockFishResponse } from "./StockFish";

export default class ChessCheat {
    public static lastChessBoard: string[][] | null;
    public static currChessBoard: string[][] | null;

    public static allyPlayerColor: string;

    public static canWhiteCastleK: boolean;
    public static canWhiteCastleQ: boolean;
    public static canBlackCastleK: boolean;
    public static canBlackCastleQ: boolean;

    public static canEnPassantCoords: string;

    public static currTurnCount: number;

    public static readonly chessBoardId = "board-single";
    public static chessBoard: HTMLElement;
    public static allyClock: HTMLElement;

    public static InitChessCheat(): void {
        ChessCheat.lastChessBoard = null;
        ChessCheat.currChessBoard = null;

        ChessCheat.canWhiteCastleK = true;
        ChessCheat.canWhiteCastleQ = true;
        ChessCheat.canBlackCastleK = true;
        ChessCheat.canBlackCastleQ = true;

        ChessCheat.canEnPassantCoords = "-";

        ChessCheat.WaitForBoard();
    }

    public static WaitForBoard(): void {
        const docObserver = new MutationObserver(() => {
            const chessBoard = document.getElementById(ChessCheat.chessBoardId);
            if (chessBoard) {
                docObserver.disconnect();

                ChessCheat.chessBoard = chessBoard;

                const allyClock = document.querySelector<HTMLElement>(".clock-bottom");
                if (!allyClock) {
                    return;
                }
                ChessCheat.allyClock = allyClock;

                for (const className of ChessCheat.allyClock.classList) {
                    if (className.includes("white")) {
                        ChessCheat.allyPlayerColor = "w";
                        ChessCheat.currTurnCount = -2;
                        break;
                    }

                    if (className.includes("black")) {
                        ChessCheat.allyPlayerColor = "b";
                        ChessCheat.currTurnCount = -1;
                        break;
                    }
                }

                ChessCheat.WaitForTurn();
            }
        });

        docObserver.observe(document.body, { childList: true, subtree: true });
    }

    public static WaitForTurn(): void {
        const clockObserver = new MutationObserver(() => {
            if (!ChessCheat.allyClock.classList.contains("clock-player-turn")) {
                return;
            }

            setTimeout(ChessCheat.SuggestMove, 60);
        });

        clockObserver.observe(ChessCheat.allyClock, { attributes: true });
    }

    public static SuggestMove(): void {
        ChessCheat.UpdateChessBoard();
        ChessCheat.UpdateChessBoardSettings();
    }

    public static UpdateChessBoard() {
        ChessCheat.lastChessBoard = ChessCheat.currChessBoard;

        ChessCheat.currChessBoard = [
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""]
        ];

        const allPieces = ChessCheat.chessBoard.querySelectorAll(".piece");
        for (const currPiece of allPieces) {
            let pName = "";
            let pX = 0;
            let pY = 0;

            for (const currPieceClass of currPiece.classList) {
                if (currPieceClass.startsWith("square")) {
                    pX = parseInt(currPieceClass[currPieceClass.length - 2]) - 1;
                    pY = parseInt(currPieceClass[currPieceClass.length - 1]) - 1;
                }

                if (currPieceClass.startsWith("w")) {
                    pName = currPieceClass[1].toUpperCase();
                }

                if (currPieceClass.startsWith("b")) {
                    pName = currPieceClass[1].toLowerCase();
                }
            }

            ChessCheat.currChessBoard[7 - pY][pX] = pName;
        }
    }

    public static UpdateChessBoardSettings() {
        if (ChessCheat.lastChessBoard === null || ChessCheat.currChessBoard === null) {
            return;
        }

        const oppPlayerColor = ChessCheat.allyPlayerColor !== "w"
            ? "w"
            : "b";

        ChessCheat.canEnPassantCoords = "-";

        for (let sqX = 0; sqX < 8; sqX++) {
            for (let sqY = 0; sqY < 8; sqY++) {
                const lastPiece = ChessCheat.lastChessBoard[sqY][sqX];
                const currPiece = ChessCheat.currChessBoard[sqY][sqX];
                if (lastPiece === currPiece) {
                    continue;
                }

                if (lastPiece === 'K') {
                    ChessCheat.canWhiteCastleK = false;
                    ChessCheat.canWhiteCastleQ = false;
                } else if (lastPiece === 'R') {
                    if (sqY === 7) {
                        if (sqX === 7) {
                            ChessCheat.canWhiteCastleK = false;
                        } else if (sqX === 0) {
                            ChessCheat.canWhiteCastleQ = false;
                        }
                    }
                } else if (lastPiece === 'k') {
                    ChessCheat.canBlackCastleK = false;
                    ChessCheat.canBlackCastleQ = false;
                } else if (lastPiece === 'r') {
                    if (sqY === 7) {
                        if (sqX === 7) {
                            ChessCheat.canBlackCastleK = false;
                        } else if (sqX === 0) {
                            ChessCheat.canBlackCastleQ = false;
                        }
                    }
                }

                if (lastPiece === 'P' && oppPlayerColor === 'w') {
                    if (sqY === 6) {
                        const lastTargetSq = ChessCheat.lastChessBoard[sqY - 2][sqX];
                        const currTargetSq = ChessCheat.currChessBoard[sqY - 2][sqX];
                        if (lastTargetSq !== 'P' && currTargetSq === 'P') {
                            ChessCheat.canEnPassantCoords = ChessCheat.NumCoordsToChessCoords(sqX, sqY - 1);
                        }
                    }
                } else if (lastPiece === 'p' && oppPlayerColor === 'b') {
                    if (sqY === 1) {
                        const lastTargetSq = ChessCheat.lastChessBoard[sqY + 2][sqX];
                        const currTargetSq = ChessCheat.currChessBoard[sqY + 2][sqX];
                        if (lastTargetSq !== 'p' && currTargetSq === 'p') {
                            ChessCheat.canEnPassantCoords = ChessCheat.NumCoordsToChessCoords(sqX, sqY + 1);
                        }
                    }
                }
            }
        }

        ChessCheat.currTurnCount += 2;
    }

    public static ComputeFen(): string {
        let fen = "";

        if (ChessCheat.currChessBoard === null) {
            return fen;
        }

        let currEmptyCount = 0;
        for (const boardLine of ChessCheat.currChessBoard) {
            for (const currPiece of boardLine) {
                if (currPiece.length === 0) {
                    currEmptyCount++;
                    continue;
                }

                if (currEmptyCount !== 0) {
                    fen += currEmptyCount;
                }
                currEmptyCount = 0;
                fen += currPiece;
            }

            if (currEmptyCount !== 0) {
                fen += currEmptyCount;
            }
            currEmptyCount = 0;
            fen += "/";
        }

        fen = fen.substring(0, fen.length - 1);
        fen += " " + ChessCheat.allyPlayerColor;
        fen += " ";
        if (!ChessCheat.canWhiteCastleK && !ChessCheat.canWhiteCastleQ && !ChessCheat.canBlackCastleK && !ChessCheat.canBlackCastleQ) {
            fen += "-";
        } else {
            if (ChessCheat.canWhiteCastleK) fen += "K";
            if (ChessCheat.canWhiteCastleQ) fen += "Q";
            if (ChessCheat.canBlackCastleK) fen += "k";
            if (ChessCheat.canBlackCastleQ) fen += "q";
        }
        fen += " " + ChessCheat.canEnPassantCoords;
        fen += " " + "0";
        fen += " " + ChessCheat.currTurnCount;

        return fen;
    }

    public static async RequestStockFish(fen: string, depth: number): Promise<StockFishResponse | null> {
        const url = new URL(StockFish.API);
        url.searchParams.append("fen", fen);
        url.searchParams.append("depth", depth.toString());

        const r = await fetch(url.toString(), {
            method: "GET"
        });

        if (!r.ok) {
            return null;
        }

        return await r.json();
    }

    public static HighlightSquare(sqX: number, sqY: number): void {
        const hlEl = document.createElement("div");
        hlEl.classList.add("highlight", "square-" + sqX.toString() + sqY.toString());
        hlEl.setAttribute("data-test-element", "highlight");
        hlEl.style.backgroundColor = "rgb(235, 97, 80)";
        hlEl.style.opacity = "0.8";
        ChessCheat.chessBoard.insertBefore(hlEl, ChessCheat.chessBoard.childNodes[1]);
    }

    public static NumCoordsToChessCoords(sqX: number, sqY: number): string {
        return String.fromCharCode(97 + sqX) + sqY;
    }
}
