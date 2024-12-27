import StockFish, { StockFishResponse } from "./StockFish";

export default class ChessCheat {
    public static lastChessBoard: string[][];
    public static currChessBoard: string[][];

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

    public static turnObserver: MutationObserver | null = null;

    public static srcHl: HTMLDivElement | null = null;
    public static dstHl: HTMLDivElement | null = null;

    public static InitChessCheat(): void {
        ChessCheat.ResetChessCheat();

        ChessCheat.WaitForBoard();
    }

    public static ResetChessCheat(): void {
        ChessCheat.lastChessBoard = [
            ["r", "n", "b", "q", "k", "b", "n", "r"],
            ["p", "p", "p", "p", "p", "p", "p", "p"],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["P", "P", "P", "P", "P", "P", "P", "P"],
            ["R", "N", "B", "Q", "K", "B", "N", "R"]
        ];
        ChessCheat.currChessBoard = [
            ["r", "n", "b", "q", "k", "b", "n", "r"],
            ["p", "p", "p", "p", "p", "p", "p", "p"],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["P", "P", "P", "P", "P", "P", "P", "P"],
            ["R", "N", "B", "Q", "K", "B", "N", "R"]
        ];

        ChessCheat.canWhiteCastleK = true;
        ChessCheat.canWhiteCastleQ = true;
        ChessCheat.canBlackCastleK = true;
        ChessCheat.canBlackCastleQ = true;

        ChessCheat.canEnPassantCoords = "-";

        ChessCheat.currTurnCount = 0;
    }

    public static WaitForBoard(): void {
        const boardObserver = new MutationObserver(() => {
            const chessBoard = document.getElementById(ChessCheat.chessBoardId);
            if (chessBoard) {
                console.log("ChessCheat: Chess Board Found.");

                boardObserver.disconnect();

                ChessCheat.chessBoard = chessBoard;

                const allyClock = document.querySelector<HTMLElement>(".clock-bottom");
                if (!allyClock) {
                    return;
                }
                ChessCheat.allyClock = allyClock;

                ChessCheat.WaitForGame();
            }
        });

        boardObserver.observe(document.body, { childList: true, subtree: true });
    }

    public static WaitForGame(): void {
        const gameObserver = new MutationObserver(() => {
            const takeOver = document.querySelector<HTMLElement>(".takeover");
            if (takeOver) {
                console.log("ChessCheat: Game Start Detected.");

                gameObserver.disconnect();

                setTimeout(() => {
                    ChessCheat.ResetChessCheat();

                    ChessCheat.UpdateAllyPlayerColor();

                    ChessCheat.WaitForTurn();

                    ChessCheat.GameOverObserver();
                }, 100);
            }
        });

        gameObserver.observe(document.body, { childList: true, subtree: true });
    }

    public static UpdateAllyPlayerColor(): void {
        for (const className of ChessCheat.allyClock.classList) {
            if (className.includes("white")) {
                ChessCheat.allyPlayerColor = "w";
                break;
            }

            if (className.includes("black")) {
                ChessCheat.allyPlayerColor = "b";
                break;
            }
        }
    }

    public static WaitForTurn(): void {
        ChessCheat.turnObserver = new MutationObserver(() => {
            if (!ChessCheat.allyClock.classList.contains("clock-player-turn")) {
                return;
            }

            console.log("ChessCheat: Your Turn Detected.");

            if (ChessCheat.srcHl !== null && ChessCheat.dstHl !== null) {
                if (ChessCheat.chessBoard.contains(ChessCheat.srcHl)) {
                    ChessCheat.chessBoard.removeChild(ChessCheat.srcHl);
                }
                if (ChessCheat.chessBoard.contains(ChessCheat.dstHl)) {
                    ChessCheat.chessBoard.removeChild(ChessCheat.dstHl);
                }
            }

            setTimeout(ChessCheat.SuggestMove, 100);
        });

        ChessCheat.turnObserver.observe(ChessCheat.allyClock, { attributes: true });
    }

    public static SuggestMove(): void {
        ChessCheat.UpdateChessBoard();
        ChessCheat.UpdateChessBoardSettings();

        const fen = ChessCheat.ComputeFen();

        console.log("ChessCheat: FEN \"" + fen + "\"");

        ChessCheat.RequestStockFish(fen, 10)
            .then((stockFishResponse) => {
                if (!stockFishResponse) {
                    return;
                }

                const bestMove = stockFishResponse.bestmove.substring(9, 13);

                console.log("ChessCheat: Best Move \"" + bestMove + "\"");

                const evalStr = stockFishResponse.evaluation !== null
                    ? stockFishResponse.evaluation.toString()
                    : "M" + stockFishResponse.mate;

                console.log("ChessCheat: Evaluation \"" + evalStr + "\"");

                const srcSquare = ChessCheat.ChessCoordsToNumCoords(bestMove.substring(0, 2));
                const dstSquare = ChessCheat.ChessCoordsToNumCoords(bestMove.substring(2, 4));
                ChessCheat.srcHl = ChessCheat.HighlightSquare(srcSquare.nX + 1, srcSquare.nY + 1);
                ChessCheat.dstHl = ChessCheat.HighlightSquare(dstSquare.nX + 1, dstSquare.nY + 1);
            })
            .catch((error) => {
                console.log("ChessCheat: Error Fetching StockFish Response.");
                console.log(error);
            });
    }

    public static UpdateChessBoard(): void {
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

    public static UpdateChessBoardSettings(): void {
        const oppPlayerColor = ChessCheat.allyPlayerColor !== "w"
            ? "w"
            : "b";

        ChessCheat.canEnPassantCoords = "-";

        for (let sqX = 0; sqX < 8; sqX++) {
            for (let sqY = 0; sqY < 8; sqY++) {
                const lastPiece = ChessCheat.lastChessBoard[sqY][sqX];
                const currPiece = ChessCheat.currChessBoard[sqY][sqX];
                if (lastPiece.length === 0 || lastPiece === currPiece) {
                    continue;
                }

                if (lastPiece === "K") {
                    ChessCheat.canWhiteCastleK = false;
                    ChessCheat.canWhiteCastleQ = false;
                } else if (lastPiece === "R") {
                    if (sqY === 7) {
                        if (sqX === 7) {
                            ChessCheat.canWhiteCastleK = false;
                        } else if (sqX === 0) {
                            ChessCheat.canWhiteCastleQ = false;
                        }
                    }
                } else if (lastPiece === "k") {
                    ChessCheat.canBlackCastleK = false;
                    ChessCheat.canBlackCastleQ = false;
                } else if (lastPiece === "r") {
                    if (sqY === 7) {
                        if (sqX === 7) {
                            ChessCheat.canBlackCastleK = false;
                        } else if (sqX === 0) {
                            ChessCheat.canBlackCastleQ = false;
                        }
                    }
                }

                if (lastPiece === "P" && oppPlayerColor === "w") {
                    if (sqY === 6) {
                        const lastTargetSq = ChessCheat.lastChessBoard[sqY - 2][sqX];
                        const currTargetSq = ChessCheat.currChessBoard[sqY - 2][sqX];
                        if (lastTargetSq !== "P" && currTargetSq === "P") {
                            ChessCheat.canEnPassantCoords = ChessCheat.NumCoordsToChessCoords(sqX, 7 - (sqY - 1));
                        }
                    }
                } else if (lastPiece === "p" && oppPlayerColor === "b") {
                    if (sqY === 1) {
                        const lastTargetSq = ChessCheat.lastChessBoard[sqY + 2][sqX];
                        const currTargetSq = ChessCheat.currChessBoard[sqY + 2][sqX];
                        if (lastTargetSq !== "p" && currTargetSq === "p") {
                            ChessCheat.canEnPassantCoords = ChessCheat.NumCoordsToChessCoords(sqX, 7 - (sqY + 1));
                        }
                    }
                }
            }
        }

        ChessCheat.currTurnCount++;
    }

    public static ComputeFen(): string {
        let fen = "";

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

    public static HighlightSquare(sqX: number, sqY: number): HTMLDivElement {
        const hlEl = document.createElement("div");
        hlEl.classList.add("highlight", "square-" + sqX.toString() + sqY.toString());
        hlEl.setAttribute("data-test-element", "highlight");
        hlEl.style.backgroundColor = "rgb(235, 97, 80)";
        hlEl.style.opacity = "0.8";
        ChessCheat.chessBoard.insertBefore(hlEl, ChessCheat.chessBoard.childNodes[1]);

        return hlEl;
    }

    public static NumCoordsToChessCoords(nX: number, nY: number): string {
        return String.fromCharCode(nX + 97) + (nY + 1);
    }

    public static ChessCoordsToNumCoords(chessCoords: string): { nX: number, nY: number } {
        return {
            nX: chessCoords[0].charCodeAt(0) - 97,
            nY: parseInt(chessCoords[1]) - 1
        }
    }

    public static GameOverObserver(): void {
        const gameOverObserver = new MutationObserver(() => {
            const gameOverModalContent = document.querySelector<HTMLElement>(".game-over-modal-content");
            if (gameOverModalContent) {
                console.log("ChessCheat: Game Over Detected.");

                gameOverObserver.disconnect();

                if (ChessCheat.turnObserver) {
                    ChessCheat.turnObserver.disconnect();
                }

                ChessCheat.WaitForGame();
            }
        });

        gameOverObserver.observe(document.body, { childList: true, subtree: true });
    }
}
