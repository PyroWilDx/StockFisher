(() => {
    const onOffSwitch = document.getElementById("onOffSwitch");
    const showLogsSwitch = document.getElementById("showLogsSwitch");
    const depthValue = document.getElementById("depthValue");
    const depthSlider = document.getElementById("depthSlider");
    const forceStartButton = document.getElementById("forceStartButton");

    chrome.storage.sync.get(["onOff", "showLogs", "depth"], (result) => {
        if (result.onOff !== undefined) {
            onOffSwitch.checked = result.onOff;
        } else {
            onOffSwitch.checked = true;
            StoreOnOffData(true);
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

    onOffSwitch.addEventListener("change", () => {
        StoreOnOffData(onOffSwitch.checked);
    });

    showLogsSwitch.addEventListener("change", () => {
        StoreShowLogsData(showLogsSwitch.checked);
    });

    depthSlider.addEventListener("input", () => {
        depthValue.textContent = depthSlider.value;
    })

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
        })
    });
})();

function StoreOnOffData(onOff) {
    chrome.storage.sync.set({ onOff }, () => { });
}

function StoreShowLogsData(showLogs) {
    chrome.storage.sync.set({ showLogs }, () => { });
}

function StoreDepthData(depth) {
    chrome.storage.sync.set({ depth }, () => { });
}
