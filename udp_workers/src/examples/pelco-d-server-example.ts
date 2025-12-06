/**
 * PELCO-D Server Example - Server 1
 * Demonstrates receiving and sending PELCO-D PTZ commands
 */

import { PelcoDServer } from '../servers/PelcoDServer';
import { DecodedPelcoD } from '../types/pelco-d.types';

console.log('='.repeat(70));
console.log('SERVER 1 - PELCO-D PTZ CAMERA CONTROL PROTOCOL');
console.log('='.repeat(70));

// Create PELCO-D server on port 5000
const pelcoServer = new PelcoDServer({
    port: 5000,
    host: '0.0.0.0',
    defaultCameraId: 1,
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
        
        console.log('\n📋 PELCO-D Packet Format:');
        console.log('   Byte 1: 0xFF (Start)');
        console.log('   Byte 2: Camera ID (0x00-0xFF)');
        console.log('   Byte 3: Command 1');
        console.log('   Byte 4: Command 2');
        console.log('   Byte 5: Data 1 (Pan Speed)');
        console.log('   Byte 6: Data 2 (Tilt/Zoom/Focus Speed)');
        console.log('   Byte 7: Checksum');
        
        console.log('\n🎮 Supported Commands:');
        console.log('   • Pan Left/Right');
        console.log('   • Tilt Up/Down');
        console.log('   • Zoom In/Out');
        console.log('   • Focus Near/Far');
        console.log('   • Combined movements (e.g., Pan Left + Tilt Up)');
        console.log('   • Stop all movements');
        
        console.log('\n💡 Test using the PELCO-D client example:');
        console.log('   npm run example:pelco-client');
        
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
