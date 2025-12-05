/**
 * PELCO-D Client Example
 * Demonstrates sending PELCO-D PTZ commands to a camera or server
 */

import { PelcoDServer } from '../servers/PelcoDServer';

console.log('='.repeat(70));
console.log('PELCO-D CLIENT - PTZ CAMERA CONTROL');
console.log('='.repeat(70));

// Configuration
const TARGET_HOST = 'localhost';  // Change to camera IP address
const TARGET_PORT = 5000;         // Change to camera port
const CAMERA_ID = 1;              // Camera ID to control

// Create command builder
const builder = PelcoDServer.createCommandBuilder(CAMERA_ID);

// Create a sender (we'll use the server's sender functionality)
const client = new PelcoDServer({
    port: 5001,  // Client listening port (if needed for responses)
    host: '0.0.0.0',
    defaultCameraId: CAMERA_ID
});

async function sendCommand(description: string, commandBuffer: Buffer) {
    console.log(`\n📤 ${description}`);
    console.log(`   Hex: ${commandBuffer.toString('hex').toUpperCase()}`);
    
    await client.sendCommand(TARGET_HOST, TARGET_PORT, commandBuffer);
    
    // Small delay between commands
    await new Promise(resolve => setTimeout(resolve, 500));
}

async function demonstratePTZControls() {
    console.log(`\n🎮 Controlling Camera ${CAMERA_ID} at ${TARGET_HOST}:${TARGET_PORT}`);
    console.log('='.repeat(70));

    try {
        // Pan commands
        console.log('\n--- PAN CONTROLS ---');
        await sendCommand('Pan Left (Speed: 32)', builder.panLeft(32));
        await sendCommand('Stop', builder.stop());
        await sendCommand('Pan Right (Speed: 32)', builder.panRight(32));
        await sendCommand('Stop', builder.stop());

        // Tilt commands
        console.log('\n--- TILT CONTROLS ---');
        await sendCommand('Tilt Up (Speed: 32)', builder.tiltUp(32));
        await sendCommand('Stop', builder.stop());
        await sendCommand('Tilt Down (Speed: 32)', builder.tiltDown(32));
        await sendCommand('Stop', builder.stop());

        // Zoom commands
        console.log('\n--- ZOOM CONTROLS ---');
        await sendCommand('Zoom In (Speed: 16)', builder.zoomIn(16));
        await sendCommand('Stop', builder.stop());
        await sendCommand('Zoom Out (Speed: 16)', builder.zoomOut(16));
        await sendCommand('Stop', builder.stop());

        // Focus commands
        console.log('\n--- FOCUS CONTROLS ---');
        await sendCommand('Focus Near (Speed: 16)', builder.focusNear(16));
        await sendCommand('Stop', builder.stop());
        await sendCommand('Focus Far (Speed: 16)', builder.focusFar(16));
        await sendCommand('Stop', builder.stop());

        // Combined movements
        console.log('\n--- COMBINED MOVEMENTS ---');
        await sendCommand('Pan Left + Tilt Up', builder.panLeftTiltUp(20, 20));
        await sendCommand('Stop', builder.stop());
        await sendCommand('Pan Right + Tilt Down', builder.panRightTiltDown(20, 20));
        await sendCommand('Stop', builder.stop());

        // Speed variations
        console.log('\n--- SPEED VARIATIONS ---');
        await sendCommand('Pan Left (Slow - Speed: 10)', builder.panLeft(10));
        await sendCommand('Stop', builder.stop());
        await sendCommand('Pan Right (Fast - Speed: 50)', builder.panRight(50));
        await sendCommand('Stop', builder.stop());

        console.log('\n✅ All commands sent successfully!');
        console.log('\n💡 Command Sequence Examples:');
        await demonstrateSequence();

    } catch (error) {
        console.error('\n❌ Error sending commands:', error);
    }
}

async function demonstrateSequence() {
    console.log('\n--- COMMAND SEQUENCE ---');
    
    const sequence = builder.createSequence()
        .panLeft(30, 1000)    // Pan left for 1 second
        .stop(500)            // Stop for 0.5 seconds
        .panRight(30, 1000)   // Pan right for 1 second
        .stop(500)
        .tiltUp(25, 800)      // Tilt up for 0.8 seconds
        .stop(500)
        .tiltDown(25, 800)    // Tilt down for 0.8 seconds
        .stop();

    console.log('   Executing: Pan Left → Stop → Pan Right → Stop → Tilt Up → Stop → Tilt Down → Stop');
    
    await sequence.execute(async (buffer) => {
        await client.sendCommand(TARGET_HOST, TARGET_PORT, buffer);
    });

    console.log('   ✅ Sequence completed!');
}

async function run() {
    console.log('\n⚙️  Starting PELCO-D client...');
    
    // Give time for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await demonstratePTZControls();
    
    console.log('\n👋 Demo complete. Closing client...');
    await client.stop();
    process.exit(0);
}

run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
