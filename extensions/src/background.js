let sums = { totalN11: 0, totalN12: 0, totalExx: 0 };

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "storeSums") {
    // Stocke les valeurs reçues de content.js
    sums.totalN11 = message.totalN11;
    sums.totalN12 = message.totalN12;
    sums.totalExx = message.totalExx;
  } else if (message.action === "getSums") {
    // Envoie les valeurs à popup.js lorsqu'il les demande
    sendResponse(sums);
  }
});