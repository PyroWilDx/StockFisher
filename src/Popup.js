(() => {
    const highlightMoveSwitch = document.getElementById("highlightMoveSwitch");
    const showEvalSwitch = document.getElementById("showEvalSwitch");
    const showLogsSwitch = document.getElementById("showLogsSwitch");
    const depthValue = document.getElementById("depthValue");
    const depthSlider = document.getElementById("depthSlider");
    const forceStartButton = document.getElementById("forceStartButton");

    chrome.storage.sync.get([
        "highlightMove",
        "showEval",
        "showLogs",
        "depth"
    ], (result) => {
        if (result.highlightMove !== undefined) {
            highlightMoveSwitch.checked = result.highlightMove;
        } else {
            highlightMoveSwitch.checked = true;
            StoreHighlightMove(true);
        }

        if (result.showEval !== undefined) {
            showEvalSwitch.checked = result.showEval;
        } else {
            showEvalSwitch.checked = true;
            StoreShowEval(true);
        }

        if (result.showLogs !== undefined) {
            showLogsSwitch.checked = result.showLogs;
        } else {
            showLogsSwitch.checked = false;
            StoreShowLogsData(false);
        }

        if (result.depth !== undefined) {
            depthValue.textContent = result.depth.toString();
            depthSlider.value = result.depth;
        } else {
            depthValue.textContent = "10";
            depthSlider.value = 10;
            StoreDepthData(10);
        }
    });

    highlightMoveSwitch.addEventListener("change", () => {
        StoreHighlightMove(highlightMoveSwitch.checked);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                const url = tabs[0].url;
                if (url.includes("https://www.chess.com/")) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "HighlightMove", value: showEvalSwitch.checked });
                }
            }
        });
    });

    showEvalSwitch.addEventListener("change", () => {
        StoreShowEval(showEvalSwitch.checked);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                const url = tabs[0].url;
                if (url.includes("https://www.chess.com/")) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "ShowEval", value: showEvalSwitch.checked });
                }
            }
        });
    });

    showLogsSwitch.addEventListener("change", () => {
        StoreShowLogsData(showLogsSwitch.checked);
    });

    depthSlider.addEventListener("input", () => {
        depthValue.textContent = depthSlider.value;
    });

    depthSlider.addEventListener("change", () => {
        StoreDepthData(depthSlider.value);
    });

    forceStartButton.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                const url = tabs[0].url;
                if (url.includes("https://www.chess.com/")) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "ForceStartGame" });
                }
            }
        });
    });
})();

function StoreHighlightMove(highlightMove) {
    chrome.storage.sync.set({ highlightMove }, () => { });
}

function StoreShowEval(showEval) {
    chrome.storage.sync.set({ showEval }, () => { });
}

function StoreShowLogsData(showLogs) {
    chrome.storage.sync.set({ showLogs }, () => { });
}

function StoreDepthData(depth) {
    chrome.storage.sync.set({ depth }, () => { });
}
