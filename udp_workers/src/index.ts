/**
 * Main Application - Runs both Server 1 (PELCO-D) and Server 2 (SMART) simultaneously
 */

import { PelcoDServer } from './servers/PelcoDServer';
import { SmartServer } from './servers/SmartServer';
import { PelcoDDecoder } from './protocols/PelcoDDecoder';
import { SmartDecoder } from './protocols/SmartDecoder';
import { DecodedPelcoD } from './types/pelco-d.types';
import { DecodedSmart, MultiObjectResponse } from './types/smart.types';

console.log('='.repeat(70));
console.log('  DUAL CAMERA CONTROL SYSTEM');
console.log('  Server 1: PELCO-D Protocol (PTZ Control)');
console.log('  Server 2: SMART Protocol (AI Features)');
console.log('='.repeat(70));
console.log();

// Server 1: PELCO-D Configuration
const pelcoDConfig = {
    port: 52381,
    host: '0.0.0.0',
    defaultCameraId: 1,

    onCommand: (decoded: DecodedPelcoD) => {
        console.log('\n[SERVER 1 - PELCO-D] Command Received:');
        console.log('  Camera ID:', decoded.cameraId);
        console.log('  Action:', decoded.action || 'Unknown');
        console.log('  Valid:', decoded.valid);
        console.log('  Hex:', decoded.rawPacket.toString('hex').toUpperCase());

        if (decoded.action) {
            const desc = PelcoDDecoder.describe(decoded);
            console.log('  Description:', desc);
        }
    },

    onError: (error: Error) => {
        console.error('[SERVER 1 - ERROR]:', error.message);
    }
};

// Server 2: SMART Configuration
const smartConfig = {
    port: 52382,
    responsePort: 52383,
    host: '0.0.0.0',
    defaultCameraId: 1,

    onCommand: async (decoded: DecodedSmart) => {
        console.log('\n[SERVER 2 - SMART] Command Received:');
        console.log('  Camera ID:', decoded.cameraId);
        console.log('  Command: 0x' + (decoded.command?.toString(16).toUpperCase().padStart(2, '0') || 'Unknown'));
        console.log('  Params:', [decoded.param1, decoded.param2, decoded.param3]);
        console.log('  Valid:', decoded.valid);
        console.log('  Hex:', decoded.rawPacket.toString('hex').toUpperCase());
        //TO DO post request 


        // Describe the command
        const desc = SmartDecoder.describe(decoded);
        console.log('  Description:', desc);
        // POST requests based on command
        try {
            const baseUrl = 'http://localhost:9898';
            // const baseUrl = 'http://192.168.1.237:9898';

            // Command 0x10 - Focus Start
            if (decoded.command === 0x10) {
                console.log('  → Sending POST request: focus/start');
                const response = await fetch(`${baseUrl}/focus/start`, {
                    method: 'POST'
                });

                console.log(`  Status: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    console.log('   Focus start request sent successfully');
                } else {
                    console.log(`   Focus start request failed: ${response.status}`);
                }
            }

            // Command 0x20 - Detection Start/Stop
            else if (decoded.command === 0x20) {
                const endpoint = decoded.param1 === 0 ? 'detection/stop' :
                    decoded.param1 === 1 ? 'detection/start' : null;

                if (endpoint === null) {
                    console.log(`   Unknown param1 value: ${decoded.param1}`);
                    return;
                }

                console.log(`  → Sending POST request: ${endpoint}`);
                const response = await fetch(`${baseUrl}/${endpoint}`, {
                    method: 'POST'
                });

                console.log(`  Status: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    console.log(`   ${endpoint} request sent successfully`);
                } else {
                    console.log(`   ${endpoint} request failed: ${response.status}`);
                }
            }

            else if (decoded.command === 0x30) {
                const endpoint = decoded.param2 === 0 ? 'track/stop' :
                    decoded.param2 === 1 ? `track/object/${decoded.param1}` : null;

                if (endpoint === null) {
                    console.log(`   Unknown param2 value: ${decoded.param2}`);
                    return;
                }

                console.log(`  → Sending POST request: ${endpoint}`);
                const response = await fetch(`${baseUrl}/${endpoint}`, {
                    method: 'POST'
                });

                console.log(`  Status: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    console.log(`   ${endpoint} request sent successfully`);
                } else {
                    console.log(`   ${endpoint} request failed: ${response.status}`);
                }
            }

            // else if (decoded.command === 0x30) {
            //     console.log(`  → Sending POST request with id: ${decoded.param1}`);
            //     const response = await fetch(`${baseUrl}/track/object/${decoded.param1}`, {
            //         method: 'POST',
            //         // body: JSON.stringify({ id: decoded.param1 })
            //     });

            //     console.log(`  Status: ${response.status} ${response.statusText}`);

            //     if (response.ok) {
            //         console.log(`   ID ${decoded.param1} sent successfully`);
            //     } else {
            //         console.log(`   ID request failed: ${response.status}`);
            //     }
            // }
        } catch (error) {
            if (error instanceof Error) {
                console.error('   POST request error:', error.message);
            } else {
                console.error('   POST request error:', error);
            }
        }
    },

    onMultiObjectResponse: (response: MultiObjectResponse) => {
        console.log('\n[SERVER 2 - SMART] Multi-Object Response:');
        console.log('  Objects Detected:', response.objectCount);
        response.objects.forEach((obj, idx) => {
            console.log(`  Object ${idx + 1}: Type=${obj.type}, Position=(${obj.x}, ${obj.y}, ${obj.z})`);
        });
    },

    onError: (error: Error) => {
        console.error('[SERVER 2 - ERROR]:', error.message);
    }
};

async function main() {
    try {
        // Create both servers
        const server1 = new PelcoDServer(pelcoDConfig);
        const server2 = new SmartServer(smartConfig);

        // Start Server 1 (PELCO-D)
        console.log('Starting Server 1 (PELCO-D)...');
        await server1.start();
        console.log('✅ Server 1 (PELCO-D) running on port 5000');

        // Start Server 2 (SMART)
        console.log('Starting Server 2 (SMART)...');
        await server2.start();
        console.log('✅ Server 2 (SMART) running on port 5001');
        console.log('✅ Server 2 (SMART) response listener on port 52383');

        console.log();
        console.log('='.repeat(70));
        console.log('  BOTH SERVERS ARE RUNNING');
        console.log('='.repeat(70));
        console.log();
        console.log('Server 1 (PELCO-D):');
        console.log('  Port: 5000');
        console.log('  Protocol: PELCO-D (PTZ Camera Control)');
        console.log('  Commands: Pan, Tilt, Zoom, Focus');
        console.log('  Test: npm run pelco:terminal');
        console.log();
        console.log('Server 2 (SMART):');
        console.log('  Port: 5001');
        console.log('  Response Port: 52383');
        console.log('  Protocol: SMART (AI Camera Control)');
        console.log('  Commands: Rapid Focus, Multi-Object Scan, Smart Tracking, Auto-Record');
        console.log('  Test: npm run smart:terminal');
        console.log();
        console.log('Press Ctrl+C to stop both servers');
        console.log('='.repeat(70));
        console.log();

        // Handle shutdown gracefully
        const shutdown = async () => {
            console.log('\n\nShutting down servers...');
            await server1.stop();
            console.log('✅ Server 1 (PELCO-D) stopped');
            await server2.stop();
            console.log('✅ Server 2 (SMART) stopped');
            console.log('Goodbye!');
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Run the application
if (require.main === module) {
    main();
}
