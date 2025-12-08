/**
 * PELCO-D Server with PTZ API Integration - Example
 * Demonstrates receiving PELCO-D commands and forwarding to HTTP PTZ API
 */

import { PelcoDServer } from '../servers/PelcoDServer';
import { DecodedPelcoD } from '../types/pelco-d.types';

console.log('='.repeat(70));
console.log('PELCO-D SERVER WITH PTZ API INTEGRATION');
console.log('='.repeat(70));

// Create PELCO-D server on port 5000
const pelcoServer = new PelcoDServer({
    port: 5000,
    host: '0.0.0.0',
    defaultCameraId: 1,
    focusServerUrl: 'http://localhost:3000',  // Your HTTP API server
    cameraName: 'cam2',                        // Camera name in the API
    onCommand: (decoded: DecodedPelcoD) => {
        if (decoded.valid) {
            console.log('\n✅ Valid PELCO-D Command Received');
            console.log(`   Camera: ${decoded.cameraId}`);
            console.log(`   Action: ${decoded.action}`);
            if (decoded.data1 > 0) console.log(`   Pan Speed: ${decoded.data1}`);
            if (decoded.data2 > 0) console.log(`   Tilt/Zoom Speed: ${decoded.data2}`);
        } else {
            console.log('\n❌ Invalid PELCO-D Command');
        }
    },
    onError: (error) => {
        console.error('\n[ERROR]', error.message);
    }
});

// Start the server
async function startServer() {
    try {
        await pelcoServer.start();

        console.log('\n📡 PELCO-D Server Status:');
        console.log(`   Port: 5000`);
        console.log(`   Protocol: PELCO-D (7-byte packets)`);
        console.log(`   Default Camera ID: 1`);
        console.log(`   PTZ API Server: http://localhost:3000`);
        console.log(`   Camera Name: cam2`);

        console.log('\n🔄 PTZ Command Mapping:');
        console.log('   PAN_LEFT → left');
        console.log('   PAN_RIGHT → right');
        console.log('   TILT_UP → up');
        console.log('   TILT_DOWN → down');
        console.log('   ZOOM_IN → zoom-in');
        console.log('   ZOOM_OUT → zoom-out');
        console.log('   STOP → stop');
        console.log('   PAN_LEFT_TILT_UP → left-up');
        console.log('   etc...');

        console.log('\n⚙️ Speed Mapping:');
        console.log('   PELCO-D Speed (0-63) → API Speed (1-10)');

        console.log('\n📋 API Request Format:');
        console.log('   POST http://localhost:3000/camera/cam2/ptz/move/{direction}');
        console.log('   Body: { "speed": 1-10 }');

        console.log('\n💡 Test using the PELCO-D client:');
        console.log('   npm run pelco:client');

        console.log('\n⏳ Waiting for PELCO-D commands... (Press Ctrl+C to stop)\n');

    } catch (error) {
        console.error('Failed to start PELCO-D server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down PELCO-D server...');
    await pelcoServer.stop();
    console.log('✅ Server stopped. Goodbye!');
    process.exit(0);
});

// Start the server
startServer();
