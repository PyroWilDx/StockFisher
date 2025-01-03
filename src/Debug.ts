export default class Debug {
    public static DisplayLog(log: string): void {
        chrome.storage.sync.get(["showLogs"], (result) => {
            if (!result.showLogs) {
                return;
            }

            console.log(log);
        });
    }

    public static DisplayChessBoard(chessBoard: string[][]): void {
        let boardStr = "";
        for (const boardLine of chessBoard) {
            for (const currPiece of boardLine) {
                if (currPiece.length !== 0) {
                    boardStr += currPiece;
                } else {
                    boardStr += " ";
                }
            }
            boardStr += "\n";
        }
        console.log(boardStr);
    }
}
