import Debug from "./Debug";
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
    public static oppClock: HTMLElement;

    public static gameObserver: MutationObserver | null = null;

    public static allyTurnObserver: MutationObserver | null = null;
    public static oppTurnObserver: MutationObserver | null = null;

    public static srcHighlightedSquares: HTMLDivElement[] = [];
    public static dstHighlightedSquares: HTMLDivElement[] = [];

    public static evalEl: HTMLDivElement | null = null;

    public static gameOverObserver: MutationObserver | null = null;

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
                Debug.DisplayLog("ChessCheat: Chess Board Found.");

                boardObserver.disconnect();

                ChessCheat.chessBoard = chessBoard;

                const allyClock = document.querySelector<HTMLElement>(".clock-bottom");
                if (!allyClock) {
                    return;
                }
                ChessCheat.allyClock = allyClock;

                const oppClock = document.querySelector<HTMLElement>(".clock-top");
                if (!oppClock) {
                    return;
                }
                ChessCheat.oppClock = oppClock;

                ChessCheat.WaitForGame();
            }
        });

        boardObserver.observe(document.body, { childList: true, subtree: true });
    }

    public static WaitForGame(): void {
        ChessCheat.gameObserver = new MutationObserver(() => {
            const takeOver = document.querySelector<HTMLElement>(".takeover");
            if (takeOver) {
                ChessCheat.StartGame(100);
            }
        });

        ChessCheat.gameObserver.observe(document.body, { childList: true, subtree: true });
    }

    public static StartGame(afterTime: number): void {
        Debug.DisplayLog("ChessCheat: Game Start.");

        if (ChessCheat.gameObserver) {
            ChessCheat.gameObserver.disconnect();
            ChessCheat.gameObserver = null;
        }
        if (ChessCheat.allyTurnObserver) {
            ChessCheat.allyTurnObserver.disconnect();
            ChessCheat.allyTurnObserver = null;
        }
        if (ChessCheat.oppTurnObserver) {
            ChessCheat.oppTurnObserver.disconnect();
            ChessCheat.oppTurnObserver = null;
        }
        if (ChessCheat.gameOverObserver) {
            ChessCheat.gameOverObserver.disconnect();
            ChessCheat.gameOverObserver = null;
        }

        const afterTimeout = () => {
            ChessCheat.ResetChessCheat();

            ChessCheat.UpdateAllyPlayerColor();

            const playerBottom = document.querySelector(".player-bottom");
            if (playerBottom) {
                const userTaglineComponent = playerBottom.querySelector(".user-tagline-component");
                if (userTaglineComponent) {
                    const evalEl = document.createElement("div");
                    evalEl.classList.add("cc-text-medium");
                    evalEl.style.color = "red";
                    evalEl.textContent = " (Eval: 0.00) ";
                    userTaglineComponent.appendChild(evalEl);
                    if (ChessCheat.evalEl && userTaglineComponent.contains(ChessCheat.evalEl)) {
                        userTaglineComponent.removeChild(ChessCheat.evalEl);
                    }
                    ChessCheat.evalEl = evalEl;
                }
            }

            ChessCheat.WaitForAllyTurn();
            ChessCheat.WaitForOppTurn();

            ChessCheat.WaitForGameOver();

            if (ChessCheat.allyClock.classList.contains("clock-player-turn")) {
                ChessCheat.SuggestMove();
            }
        }

        if (afterTime !== 0) {
            setTimeout(afterTimeout, afterTime);
        } else {
            afterTimeout();
        }
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

    public static WaitForAllyTurn(): void {
        ChessCheat.allyTurnObserver = new MutationObserver(() => {
            if (!ChessCheat.allyClock.classList.contains("clock-player-turn")) {
                return;
            }

            Debug.DisplayLog("ChessCheat: Your Turn Detected.");

            ChessCheat.ClearHighlightedSquares();

            setTimeout(ChessCheat.SuggestMove, 100);
        });

        ChessCheat.allyTurnObserver.observe(ChessCheat.allyClock, { attributes: true });
    }

    public static WaitForOppTurn(): void {
        ChessCheat.oppTurnObserver = new MutationObserver(() => {
            if (!ChessCheat.oppClock.classList.contains("clock-player-turn")) {
                return;
            }

            Debug.DisplayLog("ChessCheat: Opponent Turn Detected.");

            ChessCheat.ClearHighlightedSquares();
        });

        ChessCheat.oppTurnObserver.observe(ChessCheat.oppClock, { attributes: true });
    }

    public static SuggestMove(): void {
        ChessCheat.UpdateChessBoard();
        ChessCheat.UpdateChessBoardSettings();

        ChessCheat.FindMove();
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

    public static ComputeFEN(): string {
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

    public static FindMove(): void {
        chrome.storage.sync.get(["onOff", "depth"], (result) => {
            if (!result.onOff) {
                return;
            }

            const fen = ChessCheat.ComputeFEN();

            Debug.DisplayLog("ChessCheat: FEN \"" + fen + "\"");

            let depth = 10;
            if (result.depth !== undefined) {
                depth = result.depth;
            }

            ChessCheat.RequestStockFish(fen, depth)
                .then((stockFishResponse) => {
                    if (!stockFishResponse) {
                        return;
                    }

                    const bestMove = stockFishResponse.bestmove.substring(9, 13);
                    const srcCoords = ChessCheat.ChessCoordsToNumCoords(bestMove.substring(0, 2));
                    const dstCoords = ChessCheat.ChessCoordsToNumCoords(bestMove.substring(2, 4));
                    const srcHighlightedSquare = ChessCheat.HighlightSquare(srcCoords.nX + 1, srcCoords.nY + 1);
                    const dstHighlightedSquare = ChessCheat.HighlightSquare(dstCoords.nX + 1, dstCoords.nY + 1);
                    ChessCheat.srcHighlightedSquares.push(srcHighlightedSquare);
                    ChessCheat.dstHighlightedSquares.push(dstHighlightedSquare);

                    Debug.DisplayLog("ChessCheat: Best Move \"" + bestMove + "\"");

                    let evalStr = "";
                    if (stockFishResponse.evaluation !== null) {
                        if (stockFishResponse.evaluation > 0) {
                            evalStr += "+";
                        }
                        evalStr = stockFishResponse.evaluation.toString();
                    }
                    if (stockFishResponse.mate !== null) {
                        if (stockFishResponse.mate > 0) {
                            evalStr = "+M" + stockFishResponse.mate;
                        } else {
                            evalStr = "-M" + (-stockFishResponse.mate);
                        }
                    }
                    if (ChessCheat.evalEl) {
                        ChessCheat.evalEl.textContent = " (Eval: " + evalStr + ") ";
                    }

                    Debug.DisplayLog("ChessCheat: Evaluation \"" + evalStr + "\"");
                })
                .catch((error) => {
                    console.log("ChessCheat: Error Fetching StockFish Response.");
                    console.log(error);
                });
        });
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
        // 235 97 80
        hlEl.style.backgroundColor = "rgb(0, 255, 255)";
        hlEl.style.opacity = "0.8";
        ChessCheat.chessBoard.insertBefore(hlEl, ChessCheat.chessBoard.childNodes[1]);

        return hlEl;
    }

    public static ClearHighlightedSquares(): void {
        for (const srcHighlightedSquare of ChessCheat.srcHighlightedSquares) {
            if (ChessCheat.chessBoard.contains(srcHighlightedSquare)) {
                ChessCheat.chessBoard.removeChild(srcHighlightedSquare);
            }
        }
        ChessCheat.srcHighlightedSquares = [];

        for (const dstHighlightedSquare of ChessCheat.dstHighlightedSquares) {
            if (ChessCheat.chessBoard.contains(dstHighlightedSquare)) {
                ChessCheat.chessBoard.removeChild(dstHighlightedSquare);
            }
        }
        ChessCheat.dstHighlightedSquares = [];
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

    public static WaitForGameOver(): void {
        ChessCheat.gameOverObserver = new MutationObserver(() => {
            const gameOverModalContent = document.querySelector<HTMLElement>(".game-over-modal-content");
            if (gameOverModalContent) {
                Debug.DisplayLog("ChessCheat: Game Over Detected.");

                if (ChessCheat.gameOverObserver) {
                    ChessCheat.gameOverObserver.disconnect();
                    ChessCheat.gameOverObserver = null;
                }

                if (ChessCheat.allyTurnObserver) {
                    ChessCheat.allyTurnObserver.disconnect();
                    ChessCheat.allyTurnObserver = null;
                }
                if (ChessCheat.oppTurnObserver) {
                    ChessCheat.oppTurnObserver.disconnect();
                    ChessCheat.oppTurnObserver = null;
                }

                ChessCheat.ClearHighlightedSquares();

                if (ChessCheat.evalEl) {
                    ChessCheat.evalEl.textContent = "";
                }

                ChessCheat.WaitForGame();
            }
        });

        ChessCheat.gameOverObserver.observe(document.body, { childList: true, subtree: true });
    }
}
