import Debug from "./Debug";
import StockFisher from "./StockFisher";

(() => {
    if (window.location.hostname !== "www.chess.com") {
        return;
    }

    Debug.DisplayLog("StockFisher: Activated.");

    StockFisher.InitStockFisher();
})();

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "HighlightMove") {
        if (message.value) StockFisher.ShowHighlightedSquares();
        else StockFisher.HideHighlightedSquares();
    }

    if (message.action === "ShowEval") {
        if (message.value) StockFisher.ShowEvalElement();
        else StockFisher.HideEvalElement();
    }

    if (message.action === "ForceStartGame") {
        if (!StockFisher.chessBoard) {
            alert("StockFisher couldn't be started because chess board was not found.");
            return;
        }

        if (!StockFisher.gameObserver) {
            alert("It seems like StockFisher is already started.");
        }

        Debug.DisplayLog("StockFisher: Forced Game Start.");

        StockFisher.StartGame(0);

        sendResponse({ status: "success" });
    }
});
