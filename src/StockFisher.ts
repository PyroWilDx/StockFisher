import Debug from "./Debug";
import StockFish, { StockFishResponse } from "./StockFish";

export default class StockFisher {
    public static lastChessBoard: string[][];
    public static currChessBoard: string[][];

    public static allyPlayerColor: string;
    public static oppPlayerColor: string;

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

    public static InitStockFisher(): void {
        StockFisher.ResetStockFisher();

        StockFisher.WaitForBoard();
    }

    public static ResetStockFisher(): void {
        StockFisher.lastChessBoard = [
            ["r", "n", "b", "q", "k", "b", "n", "r"],
            ["p", "p", "p", "p", "p", "p", "p", "p"],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["P", "P", "P", "P", "P", "P", "P", "P"],
            ["R", "N", "B", "Q", "K", "B", "N", "R"]
        ];
        StockFisher.currChessBoard = [
            ["r", "n", "b", "q", "k", "b", "n", "r"],
            ["p", "p", "p", "p", "p", "p", "p", "p"],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["P", "P", "P", "P", "P", "P", "P", "P"],
            ["R", "N", "B", "Q", "K", "B", "N", "R"]
        ];

        StockFisher.canWhiteCastleK = true;
        StockFisher.canWhiteCastleQ = true;
        StockFisher.canBlackCastleK = true;
        StockFisher.canBlackCastleQ = true;

        StockFisher.canEnPassantCoords = "-";

        StockFisher.currTurnCount = -1;
    }

    public static WaitForBoard(): void {
        const boardObserver = new MutationObserver(() => {
            const chessBoard = document.getElementById(StockFisher.chessBoardId);
            if (chessBoard) {
                Debug.DisplayLog("StockFisher: Chess Board Found.");

                boardObserver.disconnect();

                StockFisher.chessBoard = chessBoard;

                const allyClock = document.querySelector<HTMLElement>(".clock-bottom");
                if (!allyClock) {
                    return;
                }
                StockFisher.allyClock = allyClock;

                const oppClock = document.querySelector<HTMLElement>(".clock-top");
                if (!oppClock) {
                    return;
                }
                StockFisher.oppClock = oppClock;

                StockFisher.WaitForGame();
            }
        });

        boardObserver.observe(document.body, { childList: true, subtree: true });
    }

    public static WaitForGame(): void {
        StockFisher.gameObserver = new MutationObserver(() => {
            const takeOver = document.querySelector<HTMLElement>(".takeover");
            if (takeOver) {
                StockFisher.StartGame(100);
            }
        });

        StockFisher.gameObserver.observe(document.body, { childList: true, subtree: true });
    }

    public static StartGame(afterTime: number): void {
        Debug.DisplayLog("StockFisher: Game Start.");

        if (StockFisher.gameObserver) {
            StockFisher.gameObserver.disconnect();
            StockFisher.gameObserver = null;
        }
        if (StockFisher.allyTurnObserver) {
            StockFisher.allyTurnObserver.disconnect();
            StockFisher.allyTurnObserver = null;
        }
        if (StockFisher.oppTurnObserver) {
            StockFisher.oppTurnObserver.disconnect();
            StockFisher.oppTurnObserver = null;
        }
        if (StockFisher.gameOverObserver) {
            StockFisher.gameOverObserver.disconnect();
            StockFisher.gameOverObserver = null;
        }

        const afterTimeFn = () => {
            StockFisher.ResetStockFisher();

            StockFisher.UpdateAllyPlayerColor();

            const playerBottom = document.querySelector(".player-bottom");
            if (playerBottom) {
                const userTaglineComponent = playerBottom.querySelector(".user-tagline-component");
                if (userTaglineComponent) {
                    const evalEl = document.createElement("div");
                    evalEl.classList.add("cc-text-medium");
                    evalEl.style.color = "red";
                    evalEl.textContent = " (Eval: 0.00) ";

                    if (StockFisher.evalEl && userTaglineComponent.contains(StockFisher.evalEl)) {
                        userTaglineComponent.removeChild(StockFisher.evalEl);
                    }
                    StockFisher.evalEl = evalEl;

                    chrome.storage.sync.get(["showEval"], (result) => {
                        if (result.showEval) {
                            userTaglineComponent.appendChild(evalEl);
                        }
                    });
                }
            }

            StockFisher.WaitForAllyTurn();
            StockFisher.WaitForOppTurn();

            StockFisher.WaitForGameOver();

            if (StockFisher.IsClockTurn(StockFisher.allyClock)) {
                StockFisher.SuggestMove(StockFisher.allyPlayerColor);
            } else {
                StockFisher.SuggestMove(StockFisher.oppPlayerColor);
            }
        }

        if (afterTime !== 0) {
            setTimeout(afterTimeFn, afterTime);
        } else {
            afterTimeFn();
        }
    }

    public static UpdateAllyPlayerColor(): void {
        for (const className of StockFisher.allyClock.classList) {
            if (className.includes("white")) {
                StockFisher.allyPlayerColor = "w";
                StockFisher.oppPlayerColor = "b";
                break;
            }

            if (className.includes("black")) {
                StockFisher.allyPlayerColor = "b";
                StockFisher.oppPlayerColor = "w";
                break;
            }
        }
    }

    public static WaitForAllyTurn(): void {
        StockFisher.allyTurnObserver = new MutationObserver(() => {
            if (!StockFisher.IsClockTurn(StockFisher.allyClock)) {
                return;
            }

            Debug.DisplayLog("StockFisher: Your Turn Detected.");

            StockFisher.ClearHighlightedSquares();

            setTimeout(() => {
                StockFisher.SuggestMove(StockFisher.allyPlayerColor);
            }, 100);
        });

        StockFisher.allyTurnObserver.observe(StockFisher.allyClock, { attributes: true });
    }

    public static WaitForOppTurn(): void {
        StockFisher.oppTurnObserver = new MutationObserver(() => {
            if (!StockFisher.IsClockTurn(StockFisher.oppClock)) {
                return;
            }

            Debug.DisplayLog("StockFisher: Opponent Turn Detected.");

            StockFisher.ClearHighlightedSquares();

            setTimeout(() => {
                StockFisher.SuggestMove(StockFisher.oppPlayerColor);
            }, 100);
        });

        StockFisher.oppTurnObserver.observe(StockFisher.oppClock, { attributes: true });
    }

    public static IsClockTurn(pClock: HTMLElement): boolean {
        return pClock.classList.contains("clock-player-turn");
    }

    public static SuggestMove(playerColor: string): void {
        StockFisher.UpdateChessBoard();
        StockFisher.UpdateChessBoardSettings(playerColor);

        StockFisher.FindMove(playerColor);
    }

    public static UpdateChessBoard(): void {
        StockFisher.lastChessBoard = StockFisher.currChessBoard;

        StockFisher.currChessBoard = [
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""]
        ];

        const allPieces = StockFisher.chessBoard.querySelectorAll(".piece");
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

            StockFisher.currChessBoard[7 - pY][pX] = pName;
        }
    }

    public static UpdateChessBoardSettings(playerColor: string): void {
        StockFisher.canEnPassantCoords = "-";

        for (let sqX = 0; sqX < 8; sqX++) {
            for (let sqY = 0; sqY < 8; sqY++) {
                const lastPiece = StockFisher.lastChessBoard[sqY][sqX];
                const currPiece = StockFisher.currChessBoard[sqY][sqX];
                if (lastPiece.length === 0 || lastPiece === currPiece) {
                    continue;
                }

                if (lastPiece === "K") {
                    StockFisher.canWhiteCastleK = false;
                    StockFisher.canWhiteCastleQ = false;
                } else if (lastPiece === "R") {
                    if (sqY === 7) {
                        if (sqX === 7) {
                            StockFisher.canWhiteCastleK = false;
                        } else if (sqX === 0) {
                            StockFisher.canWhiteCastleQ = false;
                        }
                    }
                } else if (lastPiece === "k") {
                    StockFisher.canBlackCastleK = false;
                    StockFisher.canBlackCastleQ = false;
                } else if (lastPiece === "r") {
                    if (sqY === 7) {
                        if (sqX === 7) {
                            StockFisher.canBlackCastleK = false;
                        } else if (sqX === 0) {
                            StockFisher.canBlackCastleQ = false;
                        }
                    }
                }

                if (lastPiece === "P" && StockFisher.oppPlayerColor === "w") {
                    if (sqY === 6) {
                        const lastTargetSq = StockFisher.lastChessBoard[sqY - 2][sqX];
                        const currTargetSq = StockFisher.currChessBoard[sqY - 2][sqX];
                        if (lastTargetSq !== "P" && currTargetSq === "P") {
                            StockFisher.canEnPassantCoords = StockFisher.NumCoordsToChessCoords(sqX, 7 - (sqY - 1));
                        }
                    }
                } else if (lastPiece === "p" && StockFisher.oppPlayerColor === "b") {
                    if (sqY === 1) {
                        const lastTargetSq = StockFisher.lastChessBoard[sqY + 2][sqX];
                        const currTargetSq = StockFisher.currChessBoard[sqY + 2][sqX];
                        if (lastTargetSq !== "p" && currTargetSq === "p") {
                            StockFisher.canEnPassantCoords = StockFisher.NumCoordsToChessCoords(sqX, 7 - (sqY + 1));
                        }
                    }
                }
            }
        }

        if (playerColor === "w") {
            StockFisher.currTurnCount++;
        }
    }

    public static ComputeFEN(playerColor: string): string {
        let fen = "";

        let currEmptyCount = 0;
        for (const boardLine of StockFisher.currChessBoard) {
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
        fen += " " + playerColor;
        fen += " ";
        if (!StockFisher.canWhiteCastleK && !StockFisher.canWhiteCastleQ && !StockFisher.canBlackCastleK && !StockFisher.canBlackCastleQ) {
            fen += "-";
        } else {
            if (StockFisher.canWhiteCastleK) fen += "K";
            if (StockFisher.canWhiteCastleQ) fen += "Q";
            if (StockFisher.canBlackCastleK) fen += "k";
            if (StockFisher.canBlackCastleQ) fen += "q";
        }
        fen += " " + StockFisher.canEnPassantCoords;
        fen += " " + "0";
        fen += " " + StockFisher.currTurnCount;

        return fen;
    }

    public static FindMove(playerColor: string): void {
        chrome.storage.sync.get(["highlightMove", "depth"], (result) => {
            const fen = StockFisher.ComputeFEN(playerColor);

            Debug.DisplayLog("StockFisher: FEN \"" + fen + "\"");

            let depth = 10;
            if (result.depth !== undefined) {
                depth = result.depth;
            }

            StockFisher.RequestStockFish(fen, depth)
                .then((stockFishResponse) => {
                    if (!stockFishResponse) {
                        return;
                    }

                    const bestMove = stockFishResponse.bestmove.substring(9, 13);
                    if (playerColor === StockFisher.allyPlayerColor) {
                        const srcCoords = StockFisher.ChessCoordsToNumCoords(bestMove.substring(0, 2));
                        const dstCoords = StockFisher.ChessCoordsToNumCoords(bestMove.substring(2, 4));
                        const srcHighlightedSquare = StockFisher.HighlightSquare(srcCoords.nX + 1, srcCoords.nY + 1, result.highlightMove);
                        const dstHighlightedSquare = StockFisher.HighlightSquare(dstCoords.nX + 1, dstCoords.nY + 1, result.highlightMove);
                        StockFisher.srcHighlightedSquares.push(srcHighlightedSquare);
                        StockFisher.dstHighlightedSquares.push(dstHighlightedSquare);
                    }

                    Debug.DisplayLog("StockFisher: Best Move \"" + bestMove + "\"");

                    let evalStr = "";
                    if (stockFishResponse.evaluation !== null) {
                        if (stockFishResponse.evaluation !== 0) {
                            if (stockFishResponse.evaluation > 0) {
                                evalStr += "+";
                            }
                            evalStr += stockFishResponse.evaluation.toString();
                        } else {
                            evalStr = "0.00";
                        }
                    }
                    if (stockFishResponse.mate !== null) {
                        if (stockFishResponse.mate > 0) {
                            evalStr = "+M" + stockFishResponse.mate;
                        } else {
                            evalStr = "-M" + (-stockFishResponse.mate);
                        }
                    }
                    if (StockFisher.evalEl) {
                        StockFisher.evalEl.textContent = " (Eval: " + evalStr + ") ";
                    }

                    Debug.DisplayLog("StockFisher: Evaluation \"" + evalStr + "\"");
                })
                .catch((error) => {
                    console.log("StockFisher: Error Fetching StockFish Response.");
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

    public static HighlightSquare(sqX: number, sqY: number, highlightMove: boolean): HTMLDivElement {
        const hlEl = document.createElement("div");
        hlEl.classList.add("highlight", "square-" + sqX.toString() + sqY.toString());
        hlEl.setAttribute("data-test-element", "highlight");
        // 235 97 80
        hlEl.style.backgroundColor = "rgb(0, 255, 255)";
        hlEl.style.opacity = "0.8";

        if (highlightMove) {
            StockFisher.chessBoard.insertBefore(hlEl, StockFisher.chessBoard.childNodes[1]);
        }

        return hlEl;
    }


    public static ShowHighlightedSquares(): void {
        for (const srcHighlightedSquare of StockFisher.srcHighlightedSquares) {
            if (!StockFisher.chessBoard.contains(srcHighlightedSquare)) {
                StockFisher.chessBoard.insertBefore(srcHighlightedSquare, StockFisher.chessBoard.childNodes[1]);
            }
        }

        for (const dstHighlightedSquare of StockFisher.dstHighlightedSquares) {
            if (!StockFisher.chessBoard.contains(dstHighlightedSquare)) {
                StockFisher.chessBoard.insertBefore(dstHighlightedSquare, StockFisher.chessBoard.childNodes[1]);
            }
        }
    }

    public static HideHighlightedSquares(): void {
        for (const srcHighlightedSquare of StockFisher.srcHighlightedSquares) {
            if (StockFisher.chessBoard.contains(srcHighlightedSquare)) {
                StockFisher.chessBoard.removeChild(srcHighlightedSquare);
            }
        }

        for (const dstHighlightedSquare of StockFisher.dstHighlightedSquares) {
            if (StockFisher.chessBoard.contains(dstHighlightedSquare)) {
                StockFisher.chessBoard.removeChild(dstHighlightedSquare);
            }
        }
    }

    public static ClearHighlightedSquares(): void {
        StockFisher.HideHighlightedSquares();

        StockFisher.srcHighlightedSquares = [];
        StockFisher.dstHighlightedSquares = [];
    }

    public static ShowEvalElement(): void {
        if (StockFisher.evalEl) {
            StockFisher.evalEl.style.visibility = "visible";
        }
    }

    public static HideEvalElement(): void {
        if (StockFisher.evalEl) {
            StockFisher.evalEl.style.visibility = "hidden";
        }
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
        StockFisher.gameOverObserver = new MutationObserver(() => {
            const gameOverModalContent = document.querySelector<HTMLElement>(".game-over-modal-content");
            if (gameOverModalContent) {
                Debug.DisplayLog("StockFisher: Game Over Detected.");

                if (StockFisher.gameOverObserver) {
                    StockFisher.gameOverObserver.disconnect();
                    StockFisher.gameOverObserver = null;
                }

                if (StockFisher.allyTurnObserver) {
                    StockFisher.allyTurnObserver.disconnect();
                    StockFisher.allyTurnObserver = null;
                }
                if (StockFisher.oppTurnObserver) {
                    StockFisher.oppTurnObserver.disconnect();
                    StockFisher.oppTurnObserver = null;
                }

                StockFisher.ClearHighlightedSquares();
                StockFisher.HideEvalElement();

                StockFisher.WaitForGame();
            }
        });

        StockFisher.gameOverObserver.observe(document.body, { childList: true, subtree: true });
    }
}
