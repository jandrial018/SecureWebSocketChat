
document.addEventListener("DOMContentLoaded", () => {
  const checkbox = document.getElementById("notificationsToggle");
  const clearBadgeBtn = document.getElementById("clearBadgeBtn");
  const statusLight = document.getElementById('statusLight');
  const statusText = document.getElementById('statusText');
  const label = document.getElementById('label');


  // Load initial setting
  chrome.storage.local.get(["notificationsEnabled"], (result) => {
    checkbox.checked = result.notificationsEnabled !== false;
  });

  // Save setting when toggled
  checkbox.addEventListener("change", () => {
    chrome.storage.local.set({ notificationsEnabled: checkbox.checked });
  });

  // Clear badge
  clearBadgeBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage("clearBadge");
  });


 chrome.runtime.sendMessage({ action: "getWebSocketStatus" }, (response) => {
    //const statusLight = document.getElementById("statusLight");
    if (response.status === "connected")
      {
        statusLight.style.backgroundColor = '#4CAF50';
        statusLight.title = 'Connected';
        statusText.textContent = 'Connected';
        label.textContent = 'Connected';
    }
    else 
    {
        statusLight.style.backgroundColor = '#f44336';
        statusLight.title = 'Disconnected';
        statusText.textContent = 'Disconnected';
        label.textContent = 'Disconnected';
    }
  });

});
