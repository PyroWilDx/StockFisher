import ChessCheat from "./ChessCom";

(() => {
    if (window.location.hostname !== "www.chess.com") {
        return;
    }

    console.log("ChessCheat");

    ChessCheat.InitChessCheat();
})();
