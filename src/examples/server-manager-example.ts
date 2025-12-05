/**
 * Example 3: Full UDP Server Manager
 * This example demonstrates bidirectional UDP communication
 */

import { UdpServerManager } from '../modules/UdpServerManager';

// Create a server that can both send and receive
const server = new UdpServerManager({
    receiverConfig: {
        port: 9000,
        host: '0.0.0.0'
    },
    callbacks: {
        onMessage: (message) => {
            console.log(`\n[RECEIVED] From ${message.remoteAddress}:${message.remotePort}`);
            console.log(`Data: ${message.data.toString()}`);
            
            // Auto-reply to sender
            server.send({
                targetHost: message.remoteAddress,
                targetPort: message.remotePort,
                data: `ACK: Received your message - ${message.data.toString()}`
            });
        },
        onListening: (address, port) => {
            console.log(`[SERVER] UDP Server listening on ${address}:${port}`);
        },
        onSent: (bytes, host, port) => {
            console.log(`[SENT] ${bytes} bytes to ${host}:${port}`);
        },
        onError: (error) => {
            console.error('[ERROR]', error);
        },
        onClose: () => {
            console.log('[SERVER] Server closed');
        }
    }
});

// Start the server
async function startServer() {
    try {
        await server.startReceiver();
        console.log('Server is ready to send and receive messages');
        
        // Example: Send a test message to another server
        setTimeout(async () => {
            await server.send({
                targetHost: 'localhost',
                targetPort: 8080,
                data: 'Test message from server manager'
            });
        }, 2000);
        
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[SHUTDOWN] Shutting down server...');
    await server.close();
    process.exit(0);
});
