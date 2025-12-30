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
    host: '0.0.0.0',
    defaultCameraId: 1,

    onCommand: async (decoded: DecodedSmart) => {
        console.log('\n[SERVER 2 - SMART] Command Received:');
        console.log('  Camera ID:', decoded.cameraId);
        console.log('  Command: 0x' + (decoded.command?.toString(16).toUpperCase().padStart(2, '0') || 'Unknown'));
        console.log('  Params:', [decoded.param1, decoded.param2, decoded.param3]);
        console.log('  Valid:', decoded.valid);
        console.log('  Hex:', decoded.rawPacket.toString('hex').toUpperCase());

        // Describe the command
        const desc = SmartDecoder.describe(decoded);
        console.log('  Description:', desc);

        // POST requests based on command
        try {
            const baseUrl = 'http://localhost:9898';
            // const baseUrl = 'http://192.168.1.237:9898';

            // Déterminer la caméra (param1: 0 = cam1, 1 = cam2)
            const camera = decoded.param1 === 0 ? 'cam1' : decoded.param1 === 1 ? 'cam2' : null;

            if (camera === null) {
                console.log(`   Invalid camera parameter (param1): ${decoded.param1}`);
                return;
            }

            // Command 0x10 - Focus Start/Stop
            if (decoded.command === 0x10) {
                // param1: 0=cam1, 1=cam2
                // param2: 0=stop, 1=start
                const action = decoded.param2 === 0 ? 'stop' : decoded.param2 === 1 ? 'start' : null;

                if (action === null) {
                    console.log(`   Invalid action parameter (param2): ${decoded.param2}`);
                    return;
                }

                const endpoint = `ia_process/focus/${camera}/${action}`;
                console.log(`  → Sending POST request: ${endpoint}`);

                const response = await fetch(`${baseUrl}/${endpoint}`, {
                    method: 'POST'
                });

                console.log(`  Status: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    console.log(`   Focus ${action} for ${camera} sent successfully`);
                } else {
                    console.log(`   Focus ${action} for ${camera} failed: ${response.status}`);
                }
            }

            // Command 0x20 - Track Object Start/Stop
            else if (decoded.command === 0x20) {
                // param1: 0=cam1, 1=cam2
                // param2: 0=stop, 1=start
                const action = decoded.param2 === 0 ? 'stop' : decoded.param2 === 1 ? 'start' : null;

                if (action === null) {
                    console.log(`   Invalid action parameter (param2): ${decoded.param2}`);
                    return;
                }

                const endpoint = `ia_process/trackobject/${camera}/${action}`;
                console.log(`  → Sending POST request: ${endpoint}`);

                const response = await fetch(`${baseUrl}/${endpoint}`, {
                    method: 'POST'
                });

                console.log(`  Status: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    console.log(`   Track object ${action} for ${camera} sent successfully`);
                } else {
                    console.log(`   Track object ${action} for ${camera} failed: ${response.status}`);
                }
            }

            // Command 0x30 - Track Object with ID
            else if (decoded.command === 0x30) {
                // param1: 0=cam1, 1=cam2
                // param2: 0=stop, 1=start
                // param3: ID de l'objet (octet hex à convertir en décimal)
                
                // Conversion explicite de param3 (hex) en décimal
                const objectId = parseInt(decoded.param3.toString(), 10);
                console.log(`     Object ID (hex): 0x${decoded.param3.toString(16).toUpperCase().padStart(2, '0')}`);
                console.log(`     Object ID (decimal): ${objectId}`);

                const action = decoded.param2 === 0 ? 'stop' : decoded.param2 === 1 ? 'start' : null;

                if (action === null) {
                    console.log(`   Invalid action parameter (param2): ${decoded.param2}`);
                    return;
                }

                let endpoint: string;

                if (action === 'stop') {
                    // Pour stop, pas besoin d'ID dans l'endpoint
                    endpoint = `ia_process/trackobject_ids/${camera}/stop`;
                } else {
                    // Pour start, toujours inclure l'ID converti en décimal
                    endpoint = `ia_process/trackobject_ids/${camera}/start/${objectId}`;
                }

                console.log(`  → Sending POST request: ${endpoint}`);

                const response = await fetch(`${baseUrl}/${endpoint}`, {
                    method: 'POST'
                });

                console.log(`  Status: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    console.log(`   Track object with ID ${action} for ${camera} sent successfully`);
                } else {
                    console.log(`   Track object with ID ${action} for ${camera} failed: ${response.status}`);
                }
            }

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
        console.log('  Commands:');
        console.log('    0x10 - Focus (cam1/cam2)');
        console.log('    0x20 - Track Object (cam1/cam2)');
        console.log('    0x30 - Track Object with ID (cam1/cam2)');
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