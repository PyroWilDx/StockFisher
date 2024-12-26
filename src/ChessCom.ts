import StockFish, { StockFishResponse } from "./StockFish";

export default class ChessCom {
    public static readonly chessBoardId = "board-single";
    public static chessBoard: HTMLElement;
    public static allyClock: HTMLElement;
    public static oppClock: HTMLElement;

    public static InitChessCom(): void {
        ChessCom.WaitForBoard();
    }

    public static WaitForBoard(): void {
        const docObserver = new MutationObserver(() => {
            const chessBoard = document.getElementById(ChessCom.chessBoardId);
            if (chessBoard) {
                docObserver.disconnect();

                ChessCom.chessBoard = chessBoard;

                const allyClock = document.querySelector<HTMLElement>(".clock-bottom");
                const oppClock = document.querySelector<HTMLElement>(".clock-top");
                if (!allyClock || !oppClock) {
                    return;
                }
                ChessCom.allyClock = allyClock;
                ChessCom.oppClock = oppClock;

                ChessCom.WaitForTurn();
            }
        });

        docObserver.observe(document.body, { childList: true, subtree: true });
    }

    public static WaitForTurn(): void {
        const clockObserver = new MutationObserver(() => {
            if (!ChessCom.allyClock.classList.contains("clock-player-turn")) {
                return;
            }

            ChessCom.SuggestMove();
        });

        clockObserver.observe(ChessCom.allyClock, { attributes: true });
    }

    public static SuggestMove(): void {

    }

    public static async RequestStockFish(fen: string, depth: number): Promise<StockFishResponse | null> {
        const url = new URL(StockFish.API);
        url.searchParams.append('fen', fen);
        url.searchParams.append('depth', depth.toString());

        const r = await fetch(url.toString(), {
            method: 'GET'
        });

        if (!r.ok) {
            return null;
        }

        return await r.json();
    }

    public static HighlightSquare(x: number, y: number): void {
        const hlEl = document.createElement("div");
        hlEl.classList.add("highlight", "square-" + x.toString() + y.toString());
        hlEl.setAttribute("data-test-element", "highlight");
        hlEl.style.backgroundColor = "rgb(235, 97, 80)";
        hlEl.style.opacity = "0.8";
        ChessCom.chessBoard.insertBefore(hlEl, ChessCom.chessBoard.childNodes[1]);
    }
}
