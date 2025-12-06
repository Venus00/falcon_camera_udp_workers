/**
 * Example 4: Echo Server
 * Responds back with the same message it receives
 */

import { UdpServerManager } from '../modules/UdpServerManager';

const echoServer = new UdpServerManager({
    receiverConfig: {
        port: 7000,
        host: '0.0.0.0'
    },
    callbacks: {
        onListening: (address, port) => {
            console.log(`[ECHO SERVER] Listening on ${address}:${port}`);
            console.log('Send UDP messages to this port, and they will be echoed back!');
        },
        onError: (error) => {
            console.error('[ERROR]', error);
        }
    }
});

// Set up the echo server
echoServer.createEchoServer();

// Start the echo server
echoServer.startReceiver()
    .then(() => {
        console.log('Echo server started successfully');
    })
    .catch((error) => {
        console.error('Failed to start echo server:', error);
    });

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[SHUTDOWN] Shutting down echo server...');
    await echoServer.close();
    process.exit(0);
});
