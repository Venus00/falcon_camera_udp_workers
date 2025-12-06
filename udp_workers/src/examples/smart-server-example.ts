/**
 * SMART Server Example (Server 2)
 * Demonstrates receiving SMART protocol commands
 */

import { SmartServer } from '../servers/SmartServer';
import { DecodedSmart, MultiObjectResponse } from '../types/smart.types';

// Configuration
const SERVER_CONFIG = {
    port: 5001,  // Different port from PELCO-D (5000)
    host: '0.0.0.0',
    defaultCameraId: 1,
    responsePort: 52383,  // For camera multi-object responses
    
    // Callback when SMART command is received
    onCommand: (decoded: DecodedSmart) => {
        console.log('\n========== SMART COMMAND RECEIVED ==========');
        console.log(`Camera ID: ${decoded.cameraId}`);
        console.log(`Command: 0x${decoded.command?.toString(16).toUpperCase().padStart(2, '0') || 'Unknown'}`);
        console.log(`Params: [${decoded.param1}, ${decoded.param2}, ${decoded.param3}]`);
        console.log(`Valid: ${decoded.valid}`);
        console.log(`Raw Hex: ${decoded.rawPacket.toString('hex').toUpperCase()}`);
        
        // Handle specific commands
        switch (decoded.command) {
            case 0x10:
                console.log('→ RAPID FOCUS ADAPTATION');
                const mode = decoded.param1;
                if (mode === 0x01) console.log('  Mode: Auto Focus');
                else if (mode === 0x02) console.log('  Mode: Low-Light');
                else if (mode === 0x03) console.log('  Mode: Fast-Moving Objects');
                break;
                
            case 0x20:
                console.log('→ MULTI-OBJECT SCAN');
                console.log('  Awaiting camera response on port 52383...');
                break;
                
            case 0x30:
                console.log('→ SMART TRACKING LOCK');
                console.log(`  Object ID: ${decoded.param1}`);
                const trackMode = decoded.param2;
                if (trackMode === 0x01) console.log('  Mode: Normal Tracking');
                else if (trackMode === 0x02) console.log('  Mode: Aggressive Tracking');
                else if (trackMode === 0x03) console.log('  Mode: Stealth Tracking');
                break;
                
            case 0x40:
                console.log('→ AUTO-RECORD');
                const action = decoded.param1;
                if (action === 0x01) {
                    console.log('  Action: START');
                    const reason = decoded.param2;
                    if (reason === 0x01) console.log('  Reason: Manual');
                    else if (reason === 0x02) console.log('  Reason: Object Detected');
                    else if (reason === 0x03) console.log('  Reason: Alert Triggered');
                    console.log(`  Duration: ${decoded.param3} seconds`);
                } else if (action === 0x02) {
                    console.log('  Action: STOP');
                }
                break;
        }
        console.log('===========================================\n');
    },
    
    // Callback when multi-object scan response is received
    onMultiObjectResponse: (response: MultiObjectResponse) => {
        console.log('\n========== MULTI-OBJECT SCAN RESPONSE ==========');
        console.log(`Total Objects: ${response.objectCount}`);
        
        response.objects.forEach((obj, index) => {
            console.log(`\nObject ${index + 1}:`);
            console.log(`  Position: (${obj.x}, ${obj.y}, ${obj.z})`);
            console.log(`  Type: ${obj.type === 1 ? 'Person' : obj.type === 2 ? 'Vehicle' : 'Unknown'}`);
        });
        console.log('===============================================\n');
    },
    
    // Error handler
    onError: (error: Error) => {
        console.error('[SMART SERVER ERROR]:', error.message);
    }
};

async function main() {
    console.log('===========================================');
    console.log('  SMART Protocol Server (Server 2)');
    console.log('===========================================');
    console.log();
    
    // Create SMART server
    const server = new SmartServer(SERVER_CONFIG);
    
    // Start server
    await server.start();
    
    console.log('Server Status:');
    console.log(`  Main Port: ${SERVER_CONFIG.port}`);
    console.log(`  Response Port: ${SERVER_CONFIG.responsePort}`);
    console.log(`  Listening: ${server.isListening()}`);
    console.log();
    console.log('SMART Commands:');
    console.log('  0x10 - Rapid Focus Adaptation');
    console.log('  0x20 - Multi-Object Scan');
    console.log('  0x30 - Smart Tracking Lock');
    console.log('  0x40 - Auto-Record');
    console.log();
    console.log('Waiting for SMART commands...');
    console.log('Press Ctrl+C to stop');
    console.log();
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\n\nShutting down SMART server...');
        await server.stop();
        console.log('Server stopped.');
        process.exit(0);
    });
}

// Run the server
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
