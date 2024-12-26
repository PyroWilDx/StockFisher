import ChessCheat from "./ChessCom";

export default class Debug {
    public static DisplayChessCom(): void {
        if (!ChessCheat.currChessBoard) {
            return;
        }

        let boardStr = "";
        for (const line of ChessCheat.currChessBoard) {
            for (const square of line) {
                if (square.length !== 0) {
                    boardStr += square;
                } else {
                    boardStr += " ";
                }
            }
            boardStr += "\n";
        }
        console.log(boardStr);
    }
}
