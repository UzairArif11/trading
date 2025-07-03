// firebase-config.js
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyBrJBSc_fOgfirAnSPbAAh2DqaEF_84ZC0",
  authDomain: "platform-rxbt.firebaseapp.com",
  projectId: "platform-rxbt",
  storageBucket: "platform-rxbt.appspot.com",
  messagingSenderId: "499369166971",
  appId: "1:499369166971:web:b3dda2e3fcdf562f9cbade",
  measurementId: "G-077SZL5RN7"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(firebaseApp);

export { messaging };
