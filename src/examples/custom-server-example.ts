/**
 * Example 5: Custom Auto-Reply Server
 * Demonstrates advanced message handling with custom logic
 */

import { UdpServerManager } from '../modules/UdpServerManager';
import { UdpMessage } from '../types/udp.types';

const customServer = new UdpServerManager({
    receiverConfig: {
        port: 6000,
        host: '0.0.0.0'
    },
    callbacks: {
        onListening: (address, port) => {
            console.log(`[CUSTOM SERVER] Listening on ${address}:${port}`);
            console.log('Supported commands: PING, TIME, ECHO <message>');
        },
        onError: (error) => {
            console.error('[ERROR]', error);
        }
    }
});

// Custom message handler
customServer.enableAutoReply((message: UdpMessage) => {
    const data = message.data.toString().trim();
    console.log(`[RECEIVED] ${data} from ${message.remoteAddress}:${message.remotePort}`);
    
    // Handle different commands
    if (data === 'PING') {
        return 'PONG';
    } else if (data === 'TIME') {
        return `Current time: ${new Date().toISOString()}`;
    } else if (data.startsWith('ECHO ')) {
        return data.substring(5);
    } else if (data === 'STATUS') {
        return JSON.stringify({
            status: 'online',
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    } else {
        return `Unknown command: ${data}. Try PING, TIME, ECHO <msg>, or STATUS`;
    }
});

// Start the server
customServer.startReceiver()
    .then(() => {
        console.log('Custom server started successfully');
    })
    .catch((error) => {
        console.error('Failed to start server:', error);
    });

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[SHUTDOWN] Shutting down custom server...');
    await customServer.close();
    process.exit(0);
});
