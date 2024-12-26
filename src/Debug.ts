export default class Debug {
    public static DisplayChessBoard(chessBoard: string[][] | null): void {
        if (!chessBoard) {
            return;
        }

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
