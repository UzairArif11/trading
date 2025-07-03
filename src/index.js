import React from 'react';
import ReactDOM from 'react-dom/client';
import 'jquery';
import '@popperjs/core/dist/umd/popper.js';
import 'bootstrap';
import 'simplebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'simplebar/dist/simplebar.min.css';
import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Modal from 'react-modal';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import getBackendUrl, { getBackendPic,manifestData } from './components/utils/RedirectUrl';
 
// Set the app element for react-modal
Modal.setAppElement('#root');

const manifest = document.createElement('link');
manifest.rel = 'apple-touch-icon';
manifest.href =`${getBackendUrl()}/assets/admin/images/${getBackendPic()}favicon.png`; // Or your dynamic source

document.head.appendChild(manifest);
const manifest1 = document.createElement('link');
manifest1.rel = 'icon';
manifest1.href =`${getBackendUrl()}/assets/admin/images/${getBackendPic()}favicon.png`; // Or your dynamic source

document.head.appendChild(manifest1);
const manifest2 = document.createElement('link');

const blob = new Blob([JSON.stringify(manifestData)], { type: "application/json" });
const manifestURL = URL.createObjectURL(blob);


manifest2.rel = 'manifest';
manifest2.href = manifestURL;

document.head.appendChild(manifest2);

document.head.appendChild(manifest2);
// 🌟 Add Global Error Handling Before Rendering the App
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global Error Caught:", message);
  if (message.includes("removeChild") || message.includes("Node")) {
    console.log("Refreshing the page due to a DOM error...");
    window.location.reload();
  }
};

// Create the root and render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  <>
    <App />
    <ToastContainer />
  </>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
