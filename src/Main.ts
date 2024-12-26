import ChessCom from "./ChessCom";

(() => {
    if (window.location.hostname !== "www.chess.com") {
        return;
    }

    console.log("ChessCheat");

    ChessCom.InitChessCom();
})();
