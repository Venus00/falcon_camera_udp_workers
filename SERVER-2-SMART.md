# Server 2 - SMART Protocol Implementation

## Overview
Server 2 handles the **SMART (Smart Monitoring And Recording Technology) Protocol** for advanced AI-powered camera control.

## Key Features
- ✅ **Rapid Focus Adaptation** (0x10) - Auto-adjust focus based on scene conditions
- ✅ **Multi-Object Classification** (0x20) - Detect and classify multiple objects
- ✅ **Smart Tracking Lock** (0x30) - Lock onto and follow specific objects
- ✅ **Auto-Record + Edge Learning** (0x40) - Context-aware recording triggers
- ✅ **Camera Response Handling** - Receives feedback on port 52383
- ✅ **Interactive Terminal Client** - Real-time testing interface

---

## Architecture

### Server Components

```
SmartServer (Server 2)
├── Main Receiver (port 5001) - Receives SMART commands
├── Response Receiver (port 52383) - Receives camera feedback
├── UDP Sender - Sends commands to cameras
└── SmartCommandBuilder - High-level command API
```

### Protocol Stack

```
SmartCommandBuilder (High-level API)
    ↓
SmartEncoder (Packet Building)
    ↓
UDP Layer (dgram)
    ↓
Camera Hardware

Camera Response
    ↓
UDP Layer (port 52383)
    ↓
SmartDecoder (Packet Parsing)
    ↓
Callbacks (onMultiObjectResponse, onTrajectoryUpdate)
```

---

## Protocol Specification

### Packet Structure (7 bytes)
```
┌──────┬───────────┬────────────┬────────┬────────┬────────┬──────────┐
│ 0xFA │ Camera ID │ SMART CMD  │ Param1 │ Param2 │ Param3 │ Checksum │
├──────┼───────────┼────────────┼────────┼────────┼────────┼──────────┤
│  1   │     2     │     3      │   4    │   5    │   6    │    7     │
└──────┴───────────┴────────────┴────────┴────────┴────────┴──────────┘
```

### Checksum Calculation
```typescript
checksum = (cameraId + smartCmd + param1 + param2 + param3) % 256
```

---

## Commands

### 0x10 - Rapid Focus Adaptation

**Purpose:** Auto-adjust camera focus based on scene conditions

**Modes:**
- `0x01` - **Auto Focus** - Standard auto-focus mode
- `0x02` - **Low-Light** - Optimized for dark environments
- `0x03` - **Fast-Moving** - Optimized for action scenes

**Packet Format:**
```
FA [CamID] 10 [Mode] 00 00 [Checksum]
```

**Examples:**
```typescript
builder.rapidFocusAuto();        // FA 01 10 01 00 00 0C
builder.rapidFocusLowLight();    // FA 01 10 02 00 00 0D
builder.rapidFocusFastMoving();  // FA 01 10 03 00 00 0E
```

---

### 0x20 - Multi-Object Classification Snapshot

**Purpose:** Request camera to scan and identify multiple objects

**Response:** Camera sends response on **port 52383** with detected objects

**Packet Format:**
```
FA [CamID] 20 00 00 00 [Checksum]
```

**Example:**
```typescript
builder.multiObjectScan();  // FA 01 20 00 00 00 21
```

**Response Format (0xFB header):**
```
┌──────┬─────────────┬─────────────────────────────────────┐
│ 0xFB │ ObjectCount │ [Type X Y Z] × ObjectCount          │
└──────┴─────────────┴─────────────────────────────────────┘
```

**Response Example:**
```
FB 02 01 32 28 0A 02 64 3C 14
```
Decodes to:
- 2 objects detected
- Object 1: Type 1 (Person) at (50, 40, 10)
- Object 2: Type 2 (Vehicle) at (100, 60, 20)

---

### 0x30 - Smart Tracking Lock

**Purpose:** Lock onto and track a specific object in the scene

**Parameters:**
- **Param1:** Object ID (from Multi-Object Scan)
- **Param2:** Tracking Mode
  - `0x01` - **Normal** - Standard tracking
  - `0x02` - **Aggressive** - Faster response, higher power consumption
  - `0x03` - **Stealth** - Minimal movement, covert monitoring

**Packet Format:**
```
FA [CamID] 30 [ObjectID] [Mode] 00 [Checksum]
```

**Examples:**
```typescript
builder.trackObjectNormal(5);       // FA 01 30 05 01 00 37
builder.trackObjectAggressive(3);   // FA 01 30 03 02 00 36
builder.trackObjectStealth(7);      // FA 01 30 07 03 00 3B
```

**Use Cases:**
- **Normal:** General-purpose tracking
- **Aggressive:** Fast-moving targets, erratic movement
- **Stealth:** Covert surveillance, minimal camera movement

---

### 0x40 - Auto-Record + Edge Learning Trigger

**Purpose:** Control automated recording with context-aware triggers

**Parameters:**
- **Param1:** Action
  - `0x01` - **Start Recording**
  - `0x02` - **Stop Recording**
- **Param2:** Reason (when starting)
  - `0x01` - **Manual** - User-initiated
  - `0x02` - **Object Detected** - AI detected object
  - `0x03` - **Alert Triggered** - Security alert
- **Param3:** Duration (seconds, 0-255)

**Packet Format:**
```
FA [CamID] 40 [Action] [Reason] [Duration] [Checksum]
```

**Examples:**
```typescript
builder.startRecordManual(30);   // FA 01 40 01 01 1E 61
builder.startRecordObject(60);   // FA 01 40 01 02 3C 7E
builder.startRecordAlert(120);   // FA 01 40 01 03 78 BC
builder.stopRecord();             // FA 01 40 02 00 00 43
```

---

## Implementation Files

### Core Protocol
- **`src/types/smart.types.ts`** - TypeScript interfaces and enums
- **`src/protocols/SmartEncoder.ts`** - Packet building and encoding
- **`src/protocols/SmartDecoder.ts`** - Packet parsing and decoding
- **`src/protocols/SmartCommandBuilder.ts`** - High-level command API

### Server
- **`src/servers/SmartServer.ts`** - Main SMART UDP server

### Examples
- **`src/examples/smart-server-example.ts`** - Server demo
- **`src/examples/smart-client-example.ts`** - Client demo
- **`src/examples/smart-terminal.ts`** - Interactive terminal

---

## Running Server 2

### Start SMART Server
```bash
npm run smart:server
```

**Output:**
```
===========================================
  SMART Protocol Server (Server 2)
===========================================

[SMART SERVER] Listening on 0.0.0.0:5001
[SMART SERVER] Camera response listener on 0.0.0.0:52383

Server Status:
  Main Port: 5001
  Response Port: 52383
  Listening: true

SMART Commands:
  0x10 - Rapid Focus Adaptation
  0x20 - Multi-Object Scan
  0x30 - Smart Tracking Lock
  0x40 - Auto-Record

Waiting for SMART commands...
```

### Send Test Commands
```bash
npm run smart:client
```

### Interactive Testing
```bash
npm run smart:terminal
```

**Terminal Commands:**
```
focus auto              - Auto Focus
focus lowlight          - Low-Light Mode
focus fast              - Fast-Moving Mode
scan                    - Multi-Object Scan
track 5                 - Track Object 5 (Normal)
track 3 aggr            - Track Object 3 (Aggressive)
track 7 stealth         - Track Object 7 (Stealth)
record start 30         - Start Manual Recording (30s)
record obj 60           - Start Object Recording (60s)
record alert 120        - Start Alert Recording (120s)
record stop             - Stop Recording
hex FA 01 10 01 00 00 0C - Send raw hex
camera 2                - Change to Camera 2
help                    - Show help
exit                    - Exit terminal
```

---

## TypeScript Usage

### Basic Server Setup
```typescript
import { SmartServer } from './servers/SmartServer';

const server = new SmartServer({
    port: 5001,
    responsePort: 52383,
    defaultCameraId: 1,
    
    onCommand: (decoded) => {
        console.log('Received SMART command:', decoded);
    },
    
    onMultiObjectResponse: (response) => {
        console.log(`Detected ${response.objectCount} objects`);
        response.objects.forEach(obj => {
            console.log(`Object at (${obj.x}, ${obj.y}, ${obj.z})`);
        });
    },
    
    onError: (error) => {
        console.error('Server error:', error);
    }
});

await server.start();
```

### Sending Commands
```typescript
import { SmartCommandBuilder } from './protocols/SmartCommandBuilder';

const builder = new SmartCommandBuilder(1);

// Send rapid focus command
const buffer = builder.rapidFocusAuto();
await server.sendCommand('192.168.1.100', 5001, buffer);

// Change camera and send tracking command
builder.setCamera(2);
const trackBuffer = builder.trackObjectNormal(5);
await server.sendCommand('192.168.1.101', 5001, trackBuffer);
```

### Decoding Packets
```typescript
import { SmartDecoder } from './protocols/SmartDecoder';

const packet = Buffer.from([0xFA, 0x01, 0x10, 0x01, 0x00, 0x00, 0x0C]);
const decoded = SmartDecoder.decode(packet);

console.log(decoded.valid);          // true
console.log(decoded.checksumValid);  // true
console.log(decoded.cameraId);       // 1
console.log(decoded.command);        // 0x10 (RAPID_FOCUS)
console.log(decoded.param1);         // 1 (Auto mode)

// Human-readable description
console.log(SmartDecoder.describe(decoded));
// "SMART: Camera 1, Rapid Focus Adaptation, Params: [1, 0, 0]"
```

---

## Configuration Options

### SmartServerConfig
```typescript
interface SmartServerConfig {
    port: number;                    // Main server port (default: 5001)
    responsePort?: number;           // Camera response port (default: 52383)
    host?: string;                   // Bind address (default: '0.0.0.0')
    defaultCameraId?: number;        // Default camera ID (default: 1)
    
    // Callbacks
    onCommand?: (decoded: DecodedSmart) => void;
    onMultiObjectResponse?: (response: MultiObjectResponse) => void;
    onTrajectoryUpdate?: (data: TrajectoryData) => void;
    onError?: (error: Error) => void;
}
```

---

## Multi-Camera Setup

### Managing Multiple Cameras
```typescript
const camera1 = new SmartCommandBuilder(1);
const camera2 = new SmartCommandBuilder(2);
const camera3 = new SmartCommandBuilder(3);

// Camera 1: Auto focus
await server.sendCommand('192.168.1.100', 5001, camera1.rapidFocusAuto());

// Camera 2: Multi-object scan
await server.sendCommand('192.168.1.101', 5001, camera2.multiObjectScan());

// Camera 3: Track object 7 in stealth mode
await server.sendCommand('192.168.1.102', 5001, camera3.trackObjectStealth(7));
```

---

## Best Practices

### Focus Adaptation
- Use **Auto** for general scenes
- Use **Low-Light** for night vision or dark environments
- Use **Fast-Moving** for sports, action, or high-speed tracking

### Object Tracking
- Start with **Normal** mode for most scenarios
- Use **Aggressive** for erratic or fast-moving targets
- Use **Stealth** for covert surveillance (minimal movement)

### Auto-Record
- Set appropriate duration limits (max 255 seconds = 4.25 minutes)
- Use **Manual** for user-controlled recording
- Use **Object** for automated recording when objects appear
- Use **Alert** for security/alarm-triggered recording

### Multi-Object Scan
- Always listen on port 52383 for responses
- Parse response to get object positions and types
- Use object IDs for subsequent tracking commands

---

## Troubleshooting

### No Response from Camera
- Verify camera is powered on and network-connected
- Check camera IP and port settings
- Ensure firewall allows UDP traffic on ports 5001 and 52383
- Verify camera supports SMART protocol

### Invalid Checksum
- Check packet construction in SmartEncoder
- Verify all 7 bytes are being sent
- Ensure no byte corruption during transmission

### Multi-Object Response Not Received
- Confirm response listener is on port 52383
- Check onMultiObjectResponse callback is configured
- Verify camera is sending responses to correct IP/port

---

## Performance Considerations

- **Rapid Focus:** Low latency (~10ms response)
- **Multi-Object Scan:** Higher latency (~100-500ms depending on scene complexity)
- **Smart Tracking:** Real-time updates (~30-60 Hz depending on mode)
- **Auto-Record:** Immediate start/stop response

---

## Security Notes

- SMART protocol uses UDP (no encryption by default)
- Implement network-level security (VPN, firewall rules)
- Validate all incoming packets (checksums, bounds checking)
- Limit camera access to authorized IPs
- Monitor for unusual command patterns

---

## See Also

- **[SMART-REFERENCE.md](../SMART-REFERENCE.md)** - Quick reference guide
- **[README.md](../README.md)** - Main project documentation
- **[PELCO-D-REFERENCE.md](../PELCO-D-REFERENCE.md)** - Server 1 protocol
- **TypeScript Types:** `src/types/smart.types.ts`
- **Examples:** `src/examples/smart-*.ts`
