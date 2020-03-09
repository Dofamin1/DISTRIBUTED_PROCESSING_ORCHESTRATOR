const WebSocket = require('ws');

class WebSocketServer {
    constructor() {
        this.server = this._initServer();
        this.connections = [];
        this.server.on('connection', this._onConnectionHandler);
        this._initStatusEvents();
    }

    _initServer() {
        return new WebSocket.Server({
            port: 8080,
            perMessageDeflate: {
              zlibDeflateOptions: {
                // See zlib defaults.
                chunkSize: 1024,
                memLevel: 7,
                level: 3
              },
              zlibInflateOptions: {
                chunkSize: 10 * 1024
              },
              // Other options settable:
              clientNoContextTakeover: true, // Defaults to negotiated value.
              serverNoContextTakeover: true, // Defaults to negotiated value.
              serverMaxWindowBits: 10, // Defaults to negotiated value.
              // Below options specified as default values.
              concurrencyLimit: 10, // Limits zlib concurrency for perf.
              threshold: 1024 // Size (in bytes) below which messages
              // should not be compressed.
            }
          });
    }

    _onConnectionHandler(ws) {
        this.connections.push(ws);
    }

    allConnectionsListenToEvent({ event, callback }) {
        this.connections.forEach(c => c.on(event, callback))
    }

    sendEvent({ event, data }) {

    }
}

module.exports = WebSocketServer