/**
 * SMART Client Example
 * Demonstrates sending SMART protocol commands to a camera
 */

import { SmartCommandBuilder } from '../protocols/SmartCommandBuilder';
import { UdpSender } from '../modules/UdpSender';

// Configuration
const CAMERA_CONFIG = {
    host: '127.0.0.1',      // Camera IP
    port: 5001,             // SMART server port
    cameraId: 1             // Camera ID
};

async function main() {
    console.log('===========================================');
    console.log('  SMART Protocol Client Demo');
    console.log('===========================================');
    console.log();
    
    // Create command builder
    const builder = new SmartCommandBuilder(CAMERA_CONFIG.cameraId);
    
    // Create UDP sender
    const sender = new UdpSender({
        onError: (error) => {
            console.error('[ERROR]:', error.message);
        }
    });
    
    console.log(`Target: ${CAMERA_CONFIG.host}:${CAMERA_CONFIG.port}`);
    console.log(`Camera ID: ${CAMERA_CONFIG.cameraId}`);
    console.log();
    
    // Helper function to send command
    const sendCommand = async (buffer: Buffer, description: string) => {
        console.log(`\n→ ${description}`);
        console.log(`  Hex: ${buffer.toString('hex').toUpperCase()}`);
        
        const bytes = await sender.send({
            targetHost: CAMERA_CONFIG.host,
            targetPort: CAMERA_CONFIG.port,
            data: buffer
        });
        
        console.log(`  Sent: ${bytes} bytes`);
    };
    
    // Wait helper
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
        // Demo 1: Rapid Focus - Auto Focus
        await sendCommand(
            builder.rapidFocusAuto(),
            'RAPID FOCUS - Auto Focus'
        );
        await wait(1000);
        
        // Demo 2: Rapid Focus - Low Light
        await sendCommand(
            builder.rapidFocusLowLight(),
            'RAPID FOCUS - Low Light Mode'
        );
        await wait(1000);
        
        // Demo 3: Rapid Focus - Fast Moving
        await sendCommand(
            builder.rapidFocusFastMoving(),
            'RAPID FOCUS - Fast Moving Objects'
        );
        await wait(1000);
        
        // Demo 4: Multi-Object Scan
        await sendCommand(
            builder.multiObjectScan(),
            'MULTI-OBJECT SCAN - Request Scan'
        );
        console.log('  → Camera will respond on port 52383');
        await wait(2000);
        
        // Demo 5: Smart Tracking - Normal Mode
        await sendCommand(
            builder.trackObjectNormal(5),
            'SMART TRACKING - Track Object 5 (Normal Mode)'
        );
        await wait(1000);
        
        // Demo 6: Smart Tracking - Aggressive Mode
        await sendCommand(
            builder.trackObjectAggressive(3),
            'SMART TRACKING - Track Object 3 (Aggressive Mode)'
        );
        await wait(1000);
        
        // Demo 7: Smart Tracking - Stealth Mode
        await sendCommand(
            builder.trackObjectStealth(7),
            'SMART TRACKING - Track Object 7 (Stealth Mode)'
        );
        await wait(1000);
        
        // Demo 8: Auto-Record - Start Manual
        await sendCommand(
            builder.startRecordManual(30),
            'AUTO-RECORD - Start Manual (30 seconds)'
        );
        await wait(1000);
        
        // Demo 9: Auto-Record - Start on Object Detection
        await sendCommand(
            builder.startRecordObject(60),
            'AUTO-RECORD - Start on Object Detected (60 seconds)'
        );
        await wait(1000);
        
        // Demo 10: Auto-Record - Start on Alert
        await sendCommand(
            builder.startRecordAlert(120),
            'AUTO-RECORD - Start on Alert (120 seconds)'
        );
        await wait(1000);
        
        // Demo 11: Auto-Record - Stop
        await sendCommand(
            builder.stopRecord(),
            'AUTO-RECORD - Stop Recording'
        );
        
        console.log('\n===========================================');
        console.log('  Demo Complete!');
        console.log('===========================================\n');
        
    } catch (error) {
        console.error('Error during demo:', error);
    } finally {
        await sender.close();
        console.log('Sender closed.');
    }
}

// Run the demo
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
