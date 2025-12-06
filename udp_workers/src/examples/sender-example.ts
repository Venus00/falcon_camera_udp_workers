/**
 * Example 2: Simple UDP Sender
 * This example demonstrates how to send UDP messages
 */

import { UdpSender } from '../modules/UdpSender';

// Create a sender
const sender = new UdpSender({
    onSent: (bytes, host, port) => {
        console.log(`Sent ${bytes} bytes to ${host}:${port}`);
    },
    onError: (error) => {
        console.error('Sender error:', error);
    }
});

// Send a single message
async function sendMessage() {
    try {
        const bytes = await sender.send({
            targetHost: 'localhost',
            targetPort: 8080,
            data: 'Hello from UDP Sender!'
        });
        console.log(`Message sent: ${bytes} bytes`);
    } catch (error) {
        console.error('Failed to send message:', error);
    }
}

// Send multiple messages
async function sendMultipleMessages() {
    const messages = [
        { targetHost: 'localhost', targetPort: 8080, data: 'Message 1' },
        { targetHost: 'localhost', targetPort: 8080, data: 'Message 2' },
        { targetHost: 'localhost', targetPort: 8080, data: 'Message 3' }
    ];

    try {
        const results = await sender.sendMultiple(messages);
        console.log('All messages sent:', results);
    } catch (error) {
        console.error('Failed to send messages:', error);
    }
}

// Send a broadcast message
async function sendBroadcast() {
    try {
        const bytes = await sender.broadcast(8080, 'Broadcast message to all!');
        console.log(`Broadcast sent: ${bytes} bytes`);
    } catch (error) {
        console.error('Failed to broadcast:', error);
    }
}

// Run examples
(async () => {
    await sendMessage();
    
    // Wait a bit before sending multiple messages
    await new Promise(resolve => setTimeout(resolve, 1000));
    await sendMultipleMessages();
    
    // Close sender when done
    await sender.close();
    console.log('Sender closed');
})();
