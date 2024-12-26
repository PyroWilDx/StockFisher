import ChessCheat from "./ChessCheat";

(() => {
    if (window.location.hostname !== "www.chess.com") {
        return;
    }

    console.log("ChessCheat");

    ChessCheat.InitChessCheat();
})();
