import Debug from "./Debug";
import StockFish, { StockFishResponse } from "./StockFish";

export default class ChessCheat {
    public static lastChessBoard: string[][] | null;
    public static currChessBoard: string[][] | null;

    public static currPlayerTurn: string;

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

    public static InitChessCheat(): void {
        ChessCheat.lastChessBoard = null;
        ChessCheat.currChessBoard = null;

        ChessCheat.currPlayerTurn = "w";

        ChessCheat.canWhiteCastleK = true;
        ChessCheat.canWhiteCastleQ = true;
        ChessCheat.canBlackCastleK = true;
        ChessCheat.canBlackCastleQ = true;

        ChessCheat.canEnPassantCoords = "-";

        ChessCheat.currTurnCount = 0;

        ChessCheat.WaitForBoard();
    }

    public static WaitForBoard(): void {
        const docObserver = new MutationObserver(() => {
            const chessBoard = document.getElementById(ChessCheat.chessBoardId);
            if (chessBoard) {
                docObserver.disconnect();

                ChessCheat.chessBoard = chessBoard;

                const allyClock = document.querySelector<HTMLElement>(".clock-bottom");
                const oppClock = document.querySelector<HTMLElement>(".clock-top");
                if (!allyClock || !oppClock) {
                    return;
                }
                ChessCheat.allyClock = allyClock;
                ChessCheat.oppClock = oppClock;

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

            setTimeout(ChessCheat.SuggestMove, 100);
        });

        clockObserver.observe(ChessCheat.allyClock, { attributes: true });
    }

    public static SuggestMove(): void {
        ChessCheat.UpdateChessBoard();
        Debug.DisplayChessCom();
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

            ChessCheat.currChessBoard[(8 - 1) - pY][pX] = pName;
        }
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
}
