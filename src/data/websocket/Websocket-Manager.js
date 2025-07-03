
//WebSocketManager doing below tasks
// WebSocketManager handles WebSocket connections
//initialize all events of web-sockets and fire event-handlers correspondingly
//save all web-sockets in dictionary (key-value) (Map)
//open,close web-sockets base on their key (ws url)
//we can add more generic tasks in it...
class WebSocketManager {
    constructor() {
        // Dictionary (key-value) of all WebSocket connections
        this.TOTAL_ALLOWED_CONNECTIONS = 1; // Allowed number of connections at a time to maintain the load
        this.connections = new Map();
        this.calledFirstTime = true; // Flag to set first time called or not
        this.openedConnectionsCount = 0; // Counter for opened connections
        this.disconnectAllCalled = false; // Flag to track whether disconnectAll has been called   
        this.newConnectionQueue = new Map(); // New connection queue while disconnect all in progress
        this.reconnectInterval = 5000; // Reconnection interval in milliseconds
        this.eventHandlersMap = new Map(); // To store event handlers for reconnection
    }

    /**
     * Connects to a WebSocket and handles events.
     * Closes existing connection before establishing a new one.
     * @param {string} url - WebSocket URL.
     * @param {Object} eventHandlers - Object with event handlers (onOpen, onMessage, onError, onClose).
     * @param {string} dispatchEventName - Name of the event to dispatch.
     * @returns {Promise<WebSocket>} - Promise resolving to the WebSocket instance.
     */
    async connect(url, eventHandlers, dispatchEventName = "") {
        return new Promise(async (resolve, reject) => {
            // Save the event handlers for reconnection
            this.eventHandlersMap.set(url, { eventHandlers, dispatchEventName });

            // If not called first time 
            if (!this.calledFirstTime) {
                // If disconnectAll has not been called yet, call it
                if (!this.disconnectAllCalled) {
                    this.disconnectAllCalled = true;
                    await this.disconnectAll();

                    // Now that disconnectAll has resolved, establish the new connection
                    await this.establishConnection(url, eventHandlers, dispatchEventName, resolve, reject);

                    this.newConnectionQueue.forEach(async (connection, url) => {
                        await this.establishConnection(connection.url, connection.eventHandlers, connection.dispatchEventName, resolve, reject);
                    });

                    this.newConnectionQueue.clear();
                } else {
                    // Add new connection in queue while disconnect all in progress
                    // Once disconnect all resolved then open new connection in queue
                    this.newConnectionQueue.set(url, { url, eventHandlers, dispatchEventName });
                }
            } else {
                // Called first time, proceed to establish the connection                
                await this.establishConnection(url, eventHandlers, dispatchEventName, resolve, reject);
            }
        });
    }

    /**
     * Internal method to establish a connection after disconnectAll.
     */
    async establishConnection(url, eventHandlers, dispatchEventName, resolve, reject) {
        const ws = new WebSocket(url);

        ws.onopen = (event) => {
            if (eventHandlers.onOpen) {
                eventHandlers.onOpen(event);
            }
            resolve(ws); // Resolve the Promise with the WebSocket instance.

            // Increment the counter for opened connections
            if (this.calledFirstTime)
                this.openedConnectionsCount++;

            // Check if all connections are opened
            if (this.calledFirstTime && this.openedConnectionsCount === this.TOTAL_ALLOWED_CONNECTIONS) {
                this.openedConnectionsCount = 0;
                this.calledFirstTime = false;
            }
        };

        ws.onmessage = (event) => {
            if (eventHandlers.onMessage) {
                eventHandlers.onMessage(event, dispatchEventName);
            }
        };

        ws.onerror = (event) => {
            if (eventHandlers.onError) {
                eventHandlers.onError(event);
            }
            reject(event); // Reject the Promise on WebSocket error.
        };

        ws.onclose = (event) => {
            if (eventHandlers.onClose) {
                eventHandlers.onClose(event);
            }
            this.connections.delete(url);

            // Check if all connections are closed
            if (this.connections.size === 0) {
                // Reset the flag when all connections are closed
                this.disconnectAllCalled = false;
            }

            // Attempt to reconnect
            // this.reconnect(url);
            this.urlValue = url;
        };

        this.connections.set(url, ws);
    }

    /**
     * Reconnects to a WebSocket after it has been closed.
     * @param {string} url - WebSocket URL.
     */
    async reconnect(url) {
        setTimeout(() => {
            const connectionDetails = this.eventHandlersMap.get(url);
            if (connectionDetails) {
                this.connect(url, connectionDetails.eventHandlers, connectionDetails.dispatchEventName)
                    .then(ws => console.log(`Reconnected to ${url}`))
                    .catch(err => console.error(`Failed to reconnect to ${url}`, err));
            }
        }, this.reconnectInterval);
    }

    async reconnectHandler() {
        return new Promise(async (resolve, reject) => {
            const url = this.urlValue;
            const connectionDetails = this.eventHandlersMap.get(url);
            if (connectionDetails) {
                try {
                    const ws = await this.connect(url, connectionDetails.eventHandlers, connectionDetails.dispatchEventName);
                    console.log(`Reconnected to ${url}`);
                    resolve(ws);
                } catch (err) {
                    console.error(`Failed to reconnect to ${url}`, err);
                    reject(err);
                }
            } else {
                reject(new Error("Connection details not found."));
            }
        });
    }

    /**
     * Disconnects from a WebSocket.
     * @param {string} url - WebSocket URL.
     * @returns {Promise} - Promise that resolves when the WebSocket is closed.
     */
    async disconnect(url) {
        return new Promise(async (resolve, reject) => {
            const ws = this.connections.get(url);
            if (ws) {
                ws.onclose = () => {
                    this.connections.delete(url);
                    resolve(); // Resolve the disconnect Promise
                };

                await ws.close();
            } else {
                resolve(); // Resolve the disconnect Promise if there is no existing connection
            }
        });
    }

    // Send data to server from client
    async sendData(url, data) {
        return new Promise(async (resolve, reject) => {
            const ws = this.connections.get(url);
            if (ws) {
                ws.send(data);
                resolve();
            } else {
                reject(new Error("WebSocket connection not found."));
            }
        });
    }

    /**
     * Disconnects from all WebSocket connections.
     * @returns {Promise} - Promise that resolves when all connections are closed.
     */
    async disconnectAll() {
        return new Promise(async (resolve, reject) => {
            const totalConnections = this.connections.size;
            let closedConnections = 0;

            if (totalConnections === 0) {
                // Reset the flag when disconnectAll is called with no existing connections
                this.disconnectAllCalled = false;
                resolve();
                return;
            }

            const closePromises = [];

            this.connections.forEach((ws, url) => {
                const closePromise = new Promise(async (closeResolve) => {
                    this.urlValue = url;
                    ws.onclose = async () => {
                        // Ensure that the onclose event is awaited before resolving the closePromise
                        await new Promise((innerResolve) => setTimeout(innerResolve, 0));
                        closedConnections++;

                        if (closedConnections === totalConnections) {
                            // All connections are closed
                            this.connections.clear();
                            // Reset the flag when all connections are closed
                            this.disconnectAllCalled = false;
                            resolve();
                        }

                        closeResolve(); // Resolve the closePromise
                    };
                });

                closePromises.push(closePromise);

                // Close the WebSocket
                ws.close();
            });

            // Wait for all closePromises to resolve
            await Promise.all(closePromises);
        });
    }

    // Add more methods to handle other WebSocket events if needed
}

// Export WebSocketManager instance to maintain all connections globally
export const webSocketManagerGlobal = new WebSocketManager();
