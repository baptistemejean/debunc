const filter = {
  url: [
    {
      urlMatches: "https://*.x.com/*",
    },
  ],
};

let popupPort = null;
let contentPort = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    popupPort = port;

    port.onMessage.addListener((msg) => {
      if (msg == "ON_POPUP_OPEN") {
        if (contentPort) contentPort.postMessage(msg);
        else port.postMessage("CONTENT_PORT_CLOSED");
      }
    });

    port.onDisconnect.addListener((p) => (popupPort = null));
  }

  if (port.name === "content") {
    contentPort = port;

    port.onMessage.addListener((msg) => {
      if (popupPort) popupPort.postMessage(msg);
    });

    port.onDisconnect.addListener((p) => (contentPort = null));
  }
});
