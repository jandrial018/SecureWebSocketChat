let socket;
let isWebSocketConnected = false;
let attempts = 0;
// importScripts("firebase/firebase-app-compat.js");
// importScripts("firebase/firebase-messaging-compat.js");

// // Initialize Firebase
// const firebaseConfig = {
//   apiKey: "AIzaSyDXiCD83oV7sobKIkRPsMOiDAHWERNFZyY",
//   authDomain: "chromeextention-c9fd2.firebaseapp.com",
//   projectId: "chromeextention-c9fd2",
//   storageBucket: "chromeextention-c9fd2.firebasestorage.app",
//   messagingSenderId: "508642757127",
//   appId: "1:508642757127:web:fb71604cfacad338e878a2",
//   measurementId: "G-YVRN1Z5MLR"
// };
// firebase.initializeApp(firebaseConfig);

// const messaging = firebase.messaging();

// messaging.onBackgroundMessage((payload) => {
//   console.log("[firebase-messaging-sw.js] Received background message ", payload);
  
//   self.registration.showNotification(payload.notification.title, {
//     body: payload.notification.body,
//     icon: '/icons/icon128.png'
//   });

//   if(!$isWebSocketConnected)
//   {
//     connectWebSocket();
//     incrementBadge();
//   }
// });

function connectWebSocket()
{
  attempts++;
  if(attempts > 10)
    return;
  socket = new WebSocket("wss://websocketchat.com:8443?source=extention");

  socket.onopen = () => {
    console.log("WebSocket connected!");
    isWebSocketConnected = true;
    sendPing();
  };

  socket.onmessage = (event) => {
    console.log("Message received:", event.data);
    handleMessage(event.data);
  };

  socket.onclose = () => {
    isWebSocketConnected = false;
    time = 60;
    console.log(`WebSocket closed, reconnecting in ${time}s...`);
    setTimeout(connectWebSocket, time*1000);
  };

  socket.onerror = (error) => {
    isWebSocketConnected = false;
    //console.log("WebSocket error:", error);
    socket.close();
  };
}

  function sendPing()
  {
      if(isWebSocketConnected)
      {
          const payload = JSON.stringify({'ping': "pong"});
          // ws.send(payload);
          socket.send(payload);
          setTimeout(() => { sendPing();}, 10000);
      }
  }

function handleMessage(message) 
{
  json = JSON.parse(message??[]);
  if(json.init || json.closed || json.ping)
    return;
  
  getNotificationSetting((enabled) => 
  {
    showNotificationIfNotOnChatPage(message, enabled);
  });
}

function showNotificationIfNotOnChatPage(message, enabled) 
{
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  
    if (tabs.length === 0 && enabled) 
    {
      incrementBadge();
      showNotification(message);
      return;
    }

    const activeTabUrl = tabs[0].url;
    const chatPageUrl = "https://websocketchat.com";

    if (activeTabUrl.startsWith(chatPageUrl))
    {
      console.log("On chat page, skip notification");
      clearBadge();
      return;
    }
    incrementBadge();
    if(enabled)
      showNotification(message);
  });
}

function showNotification(message)
{
    json = JSON.parse(message??[]);
    if(json)
    {
      message = json.message??'';
      myName  = json.name??'Anon';

      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/catIcon128.png",
        title: "New Message!",
        message: myName+": "+message
      });
    }
    else
    {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/catIcon128.png",
        title: "failed to connect",
        message: "failed"
      });
    }
}

function saveNotificationSetting(enabled)
{
  chrome.storage.local.set({ notificationsEnabled: enabled }, () => {
    console.log("Notifications setting saved:", enabled);
  });
}

function getNotificationSetting(callback)
{
  chrome.storage.local.get(["notificationsEnabled"], (result) => {
    callback(result.notificationsEnabled !== false); // Default to true
  });
}

function showNotificationIfEnabled(message)
{
  getNotificationSetting((enabled) => {
    if (!enabled) {
      console.log("Notifications disabled");
      return;
    }
    showNotification(message);
  });
}

let unreadCount = 0;

function incrementBadge() {
  console.log('incrementing');
  unreadCount += 1;
  chrome.action.setBadgeText({ text: unreadCount.toString() });
  chrome.action.setBadgeBackgroundColor({ color: "#FF0000" }); // red badge
}

function clearBadge()
{
  console.log('clearing badge');
  unreadCount = 0;
  chrome.action.setBadgeText({ text: "" });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getWebSocketStatus") {
    sendResponse({ status: isWebSocketConnected ? "connected" : "disconnected" });
  }
  else if (message === "clearBadge") {
    clearBadge();
  }
  // else if(message.action === "sendFireBaseToken" && message.token )
  // {
	//   socket.send(JSON.stringify(message));
  // }
});

connectWebSocket();
