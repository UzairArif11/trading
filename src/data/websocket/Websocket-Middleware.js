
//Web-Socket-Middleware.js doing below tasks
//implement all events-handler fired from Web-Socket-Manager.js
//handle the live feed data (e.g., update the Symbols live feeds)
//emit a custom event for components to listen to

import { webSocketManagerGlobal } from "./Websocket-Manager";

//create new web-socket instance
const ws_create = () => {
    return {
        // Local WebSocketManager instance(s)

        //establish provided web-socket connection and pass event handlers to manager
        ws_connect: async (wsUrl, dispatchEventName) => {
            try {
                const ws = await webSocketManagerGlobal.connect(wsUrl, { onOpen, onMessage, onError, onClose }, dispatchEventName);
                // use the WebSocket instance here if needed.
            } catch (error) {
                // Handle the error
                console.error('WebSocket connection error:', error);
            }
        },
        //close provided web-socket connection
        ws_disconnect: async (wsUrl) => {
            try {
                await webSocketManagerGlobal.disconnect(wsUrl);
            } catch (error) {
                // Handle the error
                console.error('WebSocket disconnect error:', error);
            }
        },
        //send data to server
        ws_send: async (wsUrl, data) => {
            try {
                await webSocketManagerGlobal.sendData(wsUrl, data);
            } catch (error) {
                // Handle the error
                console.error('WebSocket send data error:', error);
            }
        },
    };
};

//close all existing web-socket connection
const ws_close_all = async () => {
    //close all web-socket connection
    try {
        await webSocketManagerGlobal.disconnectAll();
    } catch (error) {
        // Handle the error
        console.error('WebSocket disconnect all error:', error);
    }
}

//Event Handlers...

const onOpen = (event) => {
    // console.log('WebSocket connection is open:', event);
    document.dispatchEvent(new CustomEvent('connectionOpened', { detail: true }));
};

const onMessage = (event, dispatchEventName) => {
    // Handle the live feed data (e.g., update the UI)
    // Emit a custom event for components to listen to
    const ws_data = JSON.parse(event.data);
    document.dispatchEvent(new CustomEvent(dispatchEventName, { detail: ws_data }));
};

const onError = (event) => {
    // console.error('WebSocket connection error:', event);
    // document.dispatchEvent(new CustomEvent('connectionClosed', { detail: true }));
};

const onClose = (event) => {
    console.error('WebSocket connection close:', event);
    document.dispatchEvent(new CustomEvent('connectionClosed', { detail: true }));
};

const handleReconnect = () => {
    return webSocketManagerGlobal.reconnectHandler();
}

export { ws_create, ws_close_all, handleReconnect };
