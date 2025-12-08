/**
 * SMART Protocol Interactive Terminal
 * Test SMART commands by sending them from terminal
 */

import * as readline from 'readline';
import { SmartCommandBuilder } from '../protocols/SmartCommandBuilder';
import { SmartDecoder } from '../protocols/SmartDecoder';
import { UdpSender } from '../modules/UdpSender';

// Configuration
const CONFIG = {
    host: '127.0.0.1',
    port: 52382,         // SMART server port
    cameraId: 1
};

// Create command builder
const builder = new SmartCommandBuilder(CONFIG.cameraId);

// Create UDP sender
const sender = new UdpSender({
    onError: (error) => {
        console.error('[ERROR]:', error.message);
    }
});

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'SMART> '
});

// Send a command
async function sendCommand(buffer: Buffer, description: string): Promise<void> {
    console.log(`→ ${description}`);
    console.log(`  Hex: ${buffer.toString('hex').toUpperCase()}`);

    const bytes = await sender.send({
        targetHost: CONFIG.host,
        targetPort: CONFIG.port,
        data: buffer
    });

    console.log(`  Sent ${bytes} bytes to ${CONFIG.host}:${CONFIG.port}`);

    // Decode and display
    const decoded = SmartDecoder.decode(buffer);
    console.log(`  Valid: ${decoded.valid}, Checksum: ${decoded.checksumValid}`);
}

// Display help
function showHelp(): void {
    console.log('\n=== SMART Protocol Terminal ===');
    console.log(`Target: ${CONFIG.host}:${CONFIG.port}`);
    console.log(`Camera ID: ${CONFIG.cameraId}\n`);

    console.log('Commands:');
    console.log('  focus auto          - Rapid Focus (Auto mode)');
    console.log('  focus lowlight      - Rapid Focus (Low-Light mode)');
    console.log('  focus fast          - Rapid Focus (Fast-Moving mode)');
    console.log();
    console.log('  scan                - Multi-Object Scan (response on port 52383)');
    console.log();
    console.log('  track <id>          - Track object (Normal mode)');
    console.log('  track <id> normal   - Track object (Normal mode)');
    console.log('  track <id> aggr     - Track object (Aggressive mode)');
    console.log('  track <id> stealth  - Track object (Stealth mode)');
    console.log();
    console.log('  record start <sec>  - Start recording (manual, duration in seconds)');
    console.log('  record obj <sec>    - Start recording (object detected, duration)');
    console.log('  record alert <sec>  - Start recording (alert triggered, duration)');
    console.log('  record stop         - Stop recording');
    console.log();
    console.log('  hex <bytes>         - Send raw hex (e.g., hex FA 01 10 01 00 00 0C)');
    console.log('  camera <id>         - Change camera ID');
    console.log('  help                - Show this help');
    console.log('  exit                - Exit terminal');
    console.log();
}

// Handle user input
async function handleInput(line: string): Promise<void> {
    const input = line.trim().toLowerCase();
    const parts = input.split(/\s+/);

    if (!input || parts.length === 0) {
        rl.prompt();
        return;
    }

    const cmd = parts[0];

    try {
        switch (cmd) {
            case 'help':
            case '?':
                showHelp();
                break;

            case 'exit':
            case 'quit':
                console.log('Goodbye!');
                await sender.close();
                process.exit(0);
                break;

            case 'camera':
                if (parts.length < 2) {
                    console.log('Usage: camera <id>');
                } else {
                    const newId = parseInt(parts[1]);
                    if (isNaN(newId) || newId < 0 || newId > 255) {
                        console.log('Invalid camera ID (must be 0-255)');
                    } else {
                        builder.setCamera(newId);
                        CONFIG.cameraId = newId;
                        console.log(`Camera ID changed to ${newId}`);
                    }
                }
                break;

            // FOCUS commands
            case 'focus':
                if (parts.length < 2) {
                    console.log('Usage: focus <auto|lowlight|fast>');
                } else {
                    const mode = parts[1];
                    if (mode === 'auto') {
                        await sendCommand(builder.rapidFocusAuto(), 'Rapid Focus - Auto');
                    } else if (mode === 'lowlight') {
                        await sendCommand(builder.rapidFocusLowLight(), 'Rapid Focus - Low-Light');
                    } else if (mode === 'fast') {
                        await sendCommand(builder.rapidFocusFastMoving(), 'Rapid Focus - Fast-Moving');
                    } else {
                        console.log('Invalid mode. Use: auto, lowlight, or fast');
                    }
                }
                break;

            // SCAN command
            case 'scan':
                await sendCommand(builder.multiObjectScan(), 'Multi-Object Scan');
                console.log('  → Camera will respond on port 52383');
                break;

            // TRACK commands
            case 'track':
                if (parts.length < 2) {
                    console.log('Usage: track <objectId> [normal|aggr|stealth]');
                } else {
                    const objectId = parseInt(parts[1]);
                    if (isNaN(objectId)) {
                        console.log('Invalid object ID');
                    } else {
                        const mode = parts.length > 2 ? parts[2] : 'normal';

                        if (mode === 'normal') {
                            await sendCommand(
                                builder.trackObjectNormal(objectId),
                                `Track Object ${objectId} - Normal Mode`
                            );
                        } else if (mode === 'aggr' || mode === 'aggressive') {
                            await sendCommand(
                                builder.trackObjectAggressive(objectId),
                                `Track Object ${objectId} - Aggressive Mode`
                            );
                        } else if (mode === 'stealth') {
                            await sendCommand(
                                builder.trackObjectStealth(objectId),
                                `Track Object ${objectId} - Stealth Mode`
                            );
                        } else {
                            console.log('Invalid mode. Use: normal, aggr, or stealth');
                        }
                    }
                }
                break;

            // RECORD commands
            case 'record':
                if (parts.length < 2) {
                    console.log('Usage: record <start|obj|alert|stop> [duration]');
                } else {
                    const action = parts[1];

                    if (action === 'stop') {
                        await sendCommand(builder.stopRecord(), 'Stop Recording');
                    } else if (action === 'start' || action === 'obj' || action === 'alert') {
                        if (parts.length < 3) {
                            console.log('Duration required (in seconds)');
                        } else {
                            const duration = parseInt(parts[2]);
                            if (isNaN(duration) || duration < 0 || duration > 255) {
                                console.log('Invalid duration (must be 0-255 seconds)');
                            } else {
                                if (action === 'start') {
                                    await sendCommand(
                                        builder.startRecordManual(duration),
                                        `Start Recording - Manual (${duration}s)`
                                    );
                                } else if (action === 'obj') {
                                    await sendCommand(
                                        builder.startRecordObject(duration),
                                        `Start Recording - Object Detected (${duration}s)`
                                    );
                                } else if (action === 'alert') {
                                    await sendCommand(
                                        builder.startRecordAlert(duration),
                                        `Start Recording - Alert Triggered (${duration}s)`
                                    );
                                }
                            }
                        }
                    } else {
                        console.log('Invalid action. Use: start, obj, alert, or stop');
                    }
                }
                break;

            // RAW HEX command
            case 'hex':
                if (parts.length < 2) {
                    console.log('Usage: hex <byte1> <byte2> ... <byte7>');
                    console.log('Example: hex FA 01 10 01 00 00 0C');
                } else {
                    const hexBytes = parts.slice(1);
                    if (hexBytes.length !== 7) {
                        console.log('SMART packets must be exactly 7 bytes');
                    } else {
                        try {
                            const buffer = Buffer.alloc(7);
                            for (let i = 0; i < 7; i++) {
                                const byte = parseInt(hexBytes[i], 16);
                                if (isNaN(byte) || byte < 0 || byte > 255) {
                                    throw new Error(`Invalid hex byte: ${hexBytes[i]}`);
                                }
                                buffer[i] = byte;
                            }
                            await sendCommand(buffer, 'Raw Hex Command');
                        } catch (error) {
                            console.log('Invalid hex format:', (error as Error).message);
                        }
                    }
                }
                break;

            default:
                console.log(`Unknown command: ${cmd}`);
                console.log('Type "help" for available commands');
                break;
        }
    } catch (error) {
        console.error('Error:', (error as Error).message);
    }

    rl.prompt();
}

// Main
console.log('===========================================');
console.log('  SMART Protocol Interactive Terminal');
console.log('===========================================');
showHelp();

rl.prompt();

rl.on('line', (line) => {
    handleInput(line);
});

rl.on('close', async () => {
    console.log('\nGoodbye!');
    await sender.close();
    process.exit(0);
});

// Handle Ctrl+C
process.on('SIGINT', async () => {
    console.log('\n\nShutting down...');
    await sender.close();
    process.exit(0);
});
