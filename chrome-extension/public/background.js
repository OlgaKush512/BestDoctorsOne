/* global chrome */

// On install, prefer opening the side panel when the action icon is clicked (if supported).
chrome.runtime.onInstalled.addListener(async () => {
  try {
    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }
  } catch (e) {
    console.debug("setPanelBehavior not available:", e);
  }
});

// Keep the side panel enabled and pointing to index.html on all tabs
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  try {
    if (!tabId || !tab || !tab.url) return;
    await chrome.sidePanel.setOptions({
      tabId,
      path: "index.html",
      enabled: true
    });
  } catch (e) {
    // Ignore errors on unsupported pages (e.g., chrome:// URLs)
    console.debug("sidePanel.setOptions error:", e);
  }
});

// Fallback: when user clicks the extension icon, explicitly open/enable the side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (!tab || !tab.id) return;
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: "index.html",
      enabled: true
    });
    // If open() is available, call it (Chrome 116+). Otherwise, panel should open via behavior.
    if (chrome.sidePanel && chrome.sidePanel.open) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  } catch (e) {
    console.debug("sidePanel open fallback error:", e);
  }
});
