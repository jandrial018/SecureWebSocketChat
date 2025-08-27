
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

/* 
	const firebaseConfig = {
	  apiKey: "AIzaSyDXiCD83oV7sobKIkRPsMOiDAHWERNFZyY",
	  authDomain: "chromeextention-c9fd2.firebaseapp.com",
	  projectId: "chromeextention-c9fd2",
	  storageBucket: "chromeextention-c9fd2.firebasestorage.app",
	  messagingSenderId: "508642757127",
	  appId: "1:508642757127:web:fb71604cfacad338e878a2",
	  measurementId: "G-YVRN1Z5MLR"
	};
	firebase.initializeApp(firebaseConfig);

	const messaging = firebase.messaging();

	Notification.requestPermission().then((permission) => {
	  if (permission === "granted")
	  {
		console.log("Notification permission granted.");
		messaging.getToken({
		  vapidKey: "BHMSBk8UlWzIAwIZmPF0LTGniejaGDzmFe4HGKcUTtUXhYUa6sZRd1dHvfnRDgaHfOEQDQuT7JY7HD_jvpf9fPE"
		}).then((currentToken) => {
		  if (currentToken)
		  {
			console.log("FCM Token:", currentToken);
			// Send this token to your server for push messaging
			 chrome.runtime.sendMessage({ action: "sendFireBaseToken",token:currentToken }, (response) => {
			});
		  }
		  else
		  {
			console.log("No registration token available. Request permission to generate one.");
		  }
		}).catch((err) => {
		  console.log("An error occurred while retrieving token. ", err);
		});
	  }
	  else
	  {
		console.log("Unable to get permission to notify.");
	  }
	}); */




});
