// firebase-messaging-sw.js
importScripts(
    "https://www.gstatic.com/firebasejs/9.9.0/firebase-app-compat.js"
  );
  importScripts(
    "https://www.gstatic.com/firebasejs/9.9.0/firebase-messaging-compat.js"
  );
  
  // Initialize the Firebase app in the service worker by passing in the messagingSenderId
  firebase.initializeApp({
      apiKey: "AIzaSyBrJBSc_fOgfirAnSPbAAh2DqaEF_84ZC0",
      authDomain: "platform-rxbt.firebaseapp.com",
      projectId: "platform-rxbt",
      storageBucket: "platform-rxbt.appspot.com",
      messagingSenderId: "499369166971",
      appId: "1:499369166971:web:b3dda2e3fcdf562f9cbade",
      measurementId: "G-077SZL5RN7"
    });  
  
  const messaging = firebase.messaging();
  
  // Handle background messages
  messaging.onBackgroundMessage(function (payload) {
    console.log("Received background message ", payload);
  
    const notificationTitle = payload.data.title;
    const notificationOptions = {
      body: payload.data.body,
      icon: payload.data?.icon || "https://platform.itrader.site/logo.png",  // Use icon from data or default icon
    };
  
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
  