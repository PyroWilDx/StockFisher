export default class ChessCom {
    public static readonly chessBoardId = "board-single";
    public static chessBoard: HTMLElement;

    public static initChessCom() {
        ChessCom.waitForBoard();
    }

    public static waitForBoard(): void {
        const boardObserver = new MutationObserver(() => {
            const chessBoard = document.getElementById(ChessCom.chessBoardId);
            if (chessBoard) {
                ChessCom.chessBoard = chessBoard;

                boardObserver.disconnect();
            }
        });

        boardObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
}
