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
    if (message.action === "HighlightMove") {
        if (message.value) ChessCheat.ShowHighlightedSquares();
        else ChessCheat.HideHighlightedSquares();
    }

    if (message.action === "ShowEval") {
        if (message.value) ChessCheat.ShowEvalElement();
        else ChessCheat.HideEvalElement();
    }

    if (message.action === "ForceStartGame") {
        if (!ChessCheat.chessBoard) {
            alert("ChessCheat couldn't be started because chess board was not found.");
            return;
        }

        if (!ChessCheat.gameObserver) {
            alert("It seems like ChessCheat is already started.");
        }

        Debug.DisplayLog("ChessCheat: Forced Game Start.");

        ChessCheat.StartGame(0);

        sendResponse({ status: "success" });
    }
});
