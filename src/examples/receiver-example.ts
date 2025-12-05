/**
 * Example 1: Simple UDP Receiver
 * This example demonstrates how to create a basic UDP receiver
 */

import { UdpReceiver } from '../modules/UdpReceiver';

// Create a receiver that listens on port 8080
const receiver = new UdpReceiver(
    {
        port: 8080,
        host: '0.0.0.0'
    },
    {
        onMessage: (message) => {
            console.log(`Received from ${message.remoteAddress}:${message.remotePort}`);
            console.log(`Data: ${message.data.toString()}`);
            console.log(`Timestamp: ${message.timestamp.toISOString()}`);
        },
        onListening: (address, port) => {
            console.log(`UDP Receiver listening on ${address}:${port}`);
        },
        onError: (error) => {
            console.error('Receiver error:', error);
        },
        onClose: () => {
            console.log('UDP Receiver closed');
        }
    }
);

// Start listening
receiver.start()
    .then(() => {
        console.log('Receiver started successfully');
    })
    .catch((error) => {
        console.error('Failed to start receiver:', error);
    });

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await receiver.stop();
    process.exit(0);
});
