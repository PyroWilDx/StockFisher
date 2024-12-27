import ChessCheat from "./ChessCheat";
import Debug from "./Debug";

(() => {
    if (window.location.hostname !== "www.chess.com") {
        return;
    }

    Debug.DisplayLog("ChessCheat: Activated.");

    ChessCheat.InitChessCheat();
})();
