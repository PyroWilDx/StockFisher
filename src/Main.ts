import ChessCheat from "./ChessCheat";
import Debug from "./Debug";

(() => {
    if (window.location.hostname !== "www.chess.com") {
        return;
    }

    Debug.DisplayLog("ChessCheat: Activated.");

    ChessCheat.InitChessCheat();
})();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "ForceStartGame") {
        if (!ChessCheat.chessBoard) {
            alert("ChessCheat couldn't be started because chess board was not found.");
            return;
        }

        Debug.DisplayLog("ChessCheat: Forced Game Start.");

        ChessCheat.StartGame();

        if (ChessCheat.allyClock.classList.contains("clock-player-turn")) {
            // Not pretty, but it's because StartGame() also has a setTimeout.
            setTimeout(ChessCheat.SuggestMove, 120);
        }

        sendResponse({ status: "success" });
    }
});
