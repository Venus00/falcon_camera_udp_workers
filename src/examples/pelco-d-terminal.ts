/**
 * PELCO-D Interactive Terminal Client
 * Read commands from terminal and send to Server 1
 */

import * as readline from 'readline';
import { PelcoDServer } from '../servers/PelcoDServer';
import { PelcoDCommandBuilder } from '../protocols/PelcoDCommandBuilder';
import { PelcoDDecoder } from '../protocols/PelcoDDecoder';

console.log('='.repeat(70));
console.log('PELCO-D INTERACTIVE TERMINAL CLIENT');
console.log('='.repeat(70));

// Configuration
const SERVER_HOST = 'localhost';
const SERVER_PORT = 5000;
let CURRENT_CAMERA_ID = 1;

// Create client
const client = new PelcoDServer({
    port: 5001,  // Client port (different from server)
    defaultCameraId: CURRENT_CAMERA_ID
});

const builder = new PelcoDCommandBuilder(CURRENT_CAMERA_ID);

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Send PELCO-D command
async function sendCommand(buffer: Buffer, description: string) {
    console.log(`\n📤 Sending: ${description}`);
    console.log(`   Hex: ${buffer.toString('hex').toUpperCase()}`);
    console.log(`   Bytes: [${Array.from(buffer).map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(', ')}]`);
    
    try {
        await client.sendCommand(SERVER_HOST, SERVER_PORT, buffer);
        console.log(`✅ Sent to ${SERVER_HOST}:${SERVER_PORT}`);
    } catch (error) {
        console.error(`❌ Error:`, error);
    }
}

// Parse hex string to buffer
function parseHexString(hex: string): Buffer | null {
    // Remove spaces and any non-hex characters
    const cleaned = hex.replace(/[^0-9a-fA-F]/g, '');
    
    // Check if valid hex and even length
    if (cleaned.length % 2 !== 0 || cleaned.length === 0) {
        return null;
    }
    
    // Convert to buffer
    const bytes: number[] = [];
    for (let i = 0; i < cleaned.length; i += 2) {
        bytes.push(parseInt(cleaned.substr(i, 2), 16));
    }
    
    return Buffer.from(bytes);
}

// Process user command
async function processCommand(input: string) {
    const parts = input.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    
    if (!cmd) {
        showPrompt();
        return;
    }
    
    try {
        switch (cmd) {
            case 'help':
            case 'h':
                showHelp();
                break;
            
            case 'camera':
            case 'cam':
                if (parts[1]) {
                    CURRENT_CAMERA_ID = parseInt(parts[1]);
                    builder.setCamera(CURRENT_CAMERA_ID);
                    console.log(`✅ Camera ID set to: ${CURRENT_CAMERA_ID}`);
                } else {
                    console.log(`Current Camera ID: ${CURRENT_CAMERA_ID}`);
                }
                break;
            
            case 'hex':
                // Send raw hex bytes
                const hexData = parts.slice(1).join('');
                const hexBuffer = parseHexString(hexData);
                if (hexBuffer) {
                    if (hexBuffer.length === 7) {
                        const decoded = PelcoDDecoder.decode(hexBuffer);
                        console.log('\n📋 Decoded packet:');
                        console.log(JSON.stringify(PelcoDDecoder.toJSON(decoded), null, 2));
                        await sendCommand(hexBuffer, 'Raw hex command');
                    } else {
                        console.log(`❌ Invalid packet length: ${hexBuffer.length} (expected 7)`);
                    }
                } else {
                    console.log('❌ Invalid hex string. Use format: hex FF0100042000 25');
                }
                break;
            
            case 'left':
            case 'l':
                const leftSpeed = parseInt(parts[1] || '32');
                await sendCommand(builder.panLeft(leftSpeed), `Pan Left (speed: ${leftSpeed})`);
                break;
            
            case 'right':
            case 'r':
                const rightSpeed = parseInt(parts[1] || '32');
                await sendCommand(builder.panRight(rightSpeed), `Pan Right (speed: ${rightSpeed})`);
                break;
            
            case 'up':
            case 'u':
                const upSpeed = parseInt(parts[1] || '32');
                await sendCommand(builder.tiltUp(upSpeed), `Tilt Up (speed: ${upSpeed})`);
                break;
            
            case 'down':
            case 'd':
                const downSpeed = parseInt(parts[1] || '32');
                await sendCommand(builder.tiltDown(downSpeed), `Tilt Down (speed: ${downSpeed})`);
                break;
            
            case 'zoomin':
            case 'zi':
                const ziSpeed = parseInt(parts[1] || '32');
                await sendCommand(builder.zoomIn(ziSpeed), `Zoom In (speed: ${ziSpeed})`);
                break;
            
            case 'zoomout':
            case 'zo':
                const zoSpeed = parseInt(parts[1] || '32');
                await sendCommand(builder.zoomOut(zoSpeed), `Zoom Out (speed: ${zoSpeed})`);
                break;
            
            case 'focusnear':
            case 'fn':
                const fnSpeed = parseInt(parts[1] || '32');
                await sendCommand(builder.focusNear(fnSpeed), `Focus Near (speed: ${fnSpeed})`);
                break;
            
            case 'focusfar':
            case 'ff':
                const ffSpeed = parseInt(parts[1] || '32');
                await sendCommand(builder.focusFar(ffSpeed), `Focus Far (speed: ${ffSpeed})`);
                break;
            
            case 'stop':
            case 's':
                await sendCommand(builder.stop(), 'Stop All Movements');
                break;
            
            case 'test':
                console.log('\n🧪 Running test sequence...');
                await sendCommand(builder.panLeft(32), 'Test: Pan Left');
                await new Promise(r => setTimeout(r, 1000));
                await sendCommand(builder.stop(), 'Test: Stop');
                await new Promise(r => setTimeout(r, 500));
                await sendCommand(builder.tiltUp(25), 'Test: Tilt Up');
                await new Promise(r => setTimeout(r, 1000));
                await sendCommand(builder.stop(), 'Test: Stop');
                console.log('✅ Test sequence complete');
                break;
            
            case 'exit':
            case 'quit':
            case 'q':
                console.log('\n👋 Goodbye!');
                rl.close();
                await client.stop();
                process.exit(0);
                return;
            
            default:
                console.log(`❌ Unknown command: ${cmd}`);
                console.log('Type "help" for available commands');
        }
    } catch (error) {
        console.error('❌ Error processing command:', error);
    }
    
    showPrompt();
}

function showHelp() {
    console.log('\n📖 AVAILABLE COMMANDS:\n');
    console.log('PTZ Controls:');
    console.log('  left [speed]    (l)  - Pan left (default speed: 32)');
    console.log('  right [speed]   (r)  - Pan right (default speed: 32)');
    console.log('  up [speed]      (u)  - Tilt up (default speed: 32)');
    console.log('  down [speed]    (d)  - Tilt down (default speed: 32)');
    console.log('  zoomin [speed]  (zi) - Zoom in (default speed: 32)');
    console.log('  zoomout [speed] (zo) - Zoom out (default speed: 32)');
    console.log('  focusnear [sp]  (fn) - Focus near (default speed: 32)');
    console.log('  focusfar [sp]   (ff) - Focus far (default speed: 32)');
    console.log('  stop            (s)  - Stop all movements');
    console.log('\nRaw Commands:');
    console.log('  hex <bytes>          - Send raw hex bytes (e.g., hex FF 01 00 04 20 00 25)');
    console.log('\nConfiguration:');
    console.log('  camera <id>     (cam) - Set camera ID (0-255)');
    console.log('\nUtility:');
    console.log('  test                 - Run test sequence');
    console.log('  help            (h)  - Show this help');
    console.log('  exit/quit       (q)  - Exit program');
    console.log('\nExamples:');
    console.log('  left 50              - Pan left at speed 50');
    console.log('  up                   - Tilt up at default speed (32)');
    console.log('  camera 2             - Switch to camera 2');
    console.log('  hex FF0100042000 25  - Send raw PELCO-D packet');
    console.log(`\nCurrent Camera ID: ${CURRENT_CAMERA_ID}`);
    console.log(`Server: ${SERVER_HOST}:${SERVER_PORT}\n`);
}

function showPrompt() {
    rl.question(`\nPELCO-D [Camera ${CURRENT_CAMERA_ID}]> `, processCommand);
}

// Initialize
async function init() {
    console.log(`\n📡 Client Configuration:`);
    console.log(`   Server: ${SERVER_HOST}:${SERVER_PORT}`);
    console.log(`   Camera ID: ${CURRENT_CAMERA_ID}`);
    console.log(`   Speed Range: 0-63`);
    console.log(`\n💡 Type "help" for available commands`);
    console.log(`💡 Make sure Server 1 is running: npm run pelco:server\n`);
    
    showPrompt();
}

init();
