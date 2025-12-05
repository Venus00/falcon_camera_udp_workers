# UDP Server Project with PELCO-D & SMART Protocols - TypeScript

A modular TypeScript UDP server system with two specialized camera control protocols:
- **PELCO-D Protocol** (Server 1): Traditional PTZ camera control
- **SMART Protocol** (Server 2): Advanced AI-powered camera control

## Project Structure

```
src/
├── types/
│   ├── udp.types.ts           # UDP TypeScript interfaces
│   ├── pelco-d.types.ts       # PELCO-D protocol types
│   └── smart.types.ts         # SMART protocol types
├── modules/
│   ├── UdpReceiver.ts         # UDP receiver module
│   ├── UdpSender.ts           # UDP sender module
│   └── UdpServerManager.ts    # Combined server manager
├── protocols/
│   ├── PelcoDEncoder.ts       # PELCO-D packet encoder
│   ├── PelcoDDecoder.ts       # PELCO-D packet decoder
│   ├── PelcoDCommandBuilder.ts # PTZ command builder
│   ├── SmartEncoder.ts        # SMART packet encoder
│   ├── SmartDecoder.ts        # SMART packet decoder
│   └── SmartCommandBuilder.ts # SMART command builder
├── servers/
│   ├── PelcoDServer.ts        # PELCO-D UDP server (Server 1)
│   └── SmartServer.ts         # SMART UDP server (Server 2)
├── examples/
│   ├── receiver-example.ts    # Example: Simple receiver
│   ├── sender-example.ts      # Example: Simple sender
│   ├── server-manager-example.ts  # Example: Full server
│   ├── echo-server-example.ts     # Example: Echo server
│   ├── custom-server-example.ts   # Example: Custom commands
│   ├── pelco-d-server-example.ts  # Example: PELCO-D server
│   ├── pelco-d-client-example.ts  # Example: PELCO-D client
│   ├── pelco-d-terminal.ts        # Interactive: PELCO-D terminal
│   ├── smart-server-example.ts    # Example: SMART server
│   ├── smart-client-example.ts    # Example: SMART client
│   └── smart-terminal.ts          # Interactive: SMART terminal
└── index.ts                   # Main export file
```

## Features

### 🔹 Modular Design
- **UdpReceiver**: Standalone module for receiving UDP messages
- **UdpSender**: Standalone module for sending UDP messages
- **UdpServerManager**: Combined module for bidirectional communication

### 🎥 PELCO-D Protocol Support (Server 1)
- **Full PELCO-D Implementation**: 7-byte packet protocol for PTZ cameras
- **Encoder/Decoder**: Build and parse PELCO-D commands
- **PTZ Controls**: Pan, Tilt, Zoom, Focus with speed control
- **Command Builder**: High-level API for easy command creation
- **Sequence Support**: Create command sequences with delays
- **Interactive Terminal**: Test PELCO-D commands in real-time

### 🤖 SMART Protocol Support (Server 2)
- **Advanced AI Features**: Rapid focus, object tracking, auto-recording
- **Multi-Object Detection**: Scan and classify multiple objects
- **Smart Tracking**: Lock onto and follow objects with 3 modes
- **Auto-Record**: Context-aware recording triggers
- **Response Port**: Receives camera feedback on port 52383
- **Interactive Terminal**: Test SMART commands in real-time

### 🔹 Key Capabilities
- ✅ Send and receive UDP messages
- ✅ Broadcast support
- ✅ Multiple message sending
- ✅ Echo server functionality
- ✅ Custom auto-reply handlers
- ✅ TypeScript type safety
- ✅ Event-driven callbacks
- ✅ Graceful shutdown support
- ✅ Two specialized camera control protocols

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Run the project in development mode:

```bash
npm run dev
```

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

### Run

Run the compiled JavaScript:

```bash
npm start
```

### Watch Mode

Compile TypeScript in watch mode (auto-recompile on changes):

```bash
npm run watch
```

## Quick Start

### 1. Simple Receiver
```typescript
import { UdpReceiver } from './modules/UdpReceiver';

const receiver = new UdpReceiver(
    { port: 8080, host: '0.0.0.0' },
    {
        onMessage: (message) => {
            console.log(`Received: ${message.data.toString()}`);
        }
    }
);

await receiver.start();
```

### 2. Simple Sender
```typescript
import { UdpSender } from './modules/UdpSender';

const sender = new UdpSender();

await sender.send({
    targetHost: 'localhost',
    targetPort: 8080,
    data: 'Hello UDP!'
});
```

### 3. Full Server (Send & Receive)
```typescript
import { UdpServerManager } from './modules/UdpServerManager';

const server = new UdpServerManager({
    receiverConfig: { port: 9000 },
    callbacks: {
        onMessage: (message) => {
            console.log(`Received: ${message.data.toString()}`);
            
            // Auto-reply
            server.send({
                targetHost: message.remoteAddress,
                targetPort: message.remotePort,
                data: 'ACK'
            });
        }
    }
});

await server.startReceiver();
```

## Running Examples

### UDP Examples

### Example 1: UDP Receiver
```bash
npm run example:receiver
```
Starts a UDP receiver on port 8080 that logs all incoming messages.

### Example 2: UDP Sender
```bash
npm run example:sender
```
Sends test messages to localhost:8080.

### Example 3: Server Manager
```bash
npm run example:server
```
Runs a full bidirectional UDP server on port 9000.

### Example 4: Echo Server
```bash
npm run example:echo
```
Starts an echo server on port 7000 that replies with the same message.

### Example 5: Custom Server
```bash
npm run example:custom
```
Runs a server on port 6000 with custom commands:
- `PING` → Returns `PONG`
- `TIME` → Returns current timestamp
- `ECHO <message>` → Returns the message
- `STATUS` → Returns server status JSON

### PELCO-D Protocol Examples

### Server 1: PELCO-D Server
```bash
npm run pelco:server
```
Starts the PELCO-D PTZ camera control server on port 5000.

**Features:**
- Receives PELCO-D commands (7-byte packets)
- Validates checksums
- Decodes PTZ commands (Pan, Tilt, Zoom, Focus)
- Logs all received commands

### PELCO-D Client
```bash
npm run pelco:client
```
Demonstrates sending PELCO-D commands to control a PTZ camera.

**Demonstrates:**
- Pan Left/Right with speed control
- Tilt Up/Down with speed control
- Zoom In/Out
- Focus Near/Far
- Combined movements (Pan + Tilt)
- Command sequences with delays

### PELCO-D Interactive Terminal
```bash
npm run pelco:terminal
```
Interactive terminal for testing PELCO-D commands.

**Commands:**
- `left`, `right`, `up`, `down` - Movement commands
- `zoomin`, `zoomout` - Zoom control
- `focusnear`, `focusfar` - Focus control
- `stop` - Stop all movement
- `hex FF 01 00 04 20 00 25` - Send raw hex packet

### SMART Protocol Examples

### Server 2: SMART Server
```bash
npm run smart:server
```
Starts the SMART advanced camera control server on port 5001.

**Features:**
- Receives SMART commands (7-byte packets, 0xFA header)
- Rapid Focus Adaptation (0x10)
- Multi-Object Classification (0x20)
- Smart Tracking Lock (0x30)
- Auto-Record + Edge Learning (0x40)
- Listens for camera responses on port 52383

### SMART Client
```bash
npm run smart:client
```
Demonstrates sending SMART commands to an AI-powered camera.

**Demonstrates:**
- Rapid Focus modes (Auto, Low-Light, Fast-Moving)
- Multi-Object Scan with response parsing
- Smart Tracking (Normal, Aggressive, Stealth modes)
- Auto-Record with different triggers

### SMART Interactive Terminal
```bash
npm run smart:terminal
```
Interactive terminal for testing SMART commands.

**Commands:**
- `focus auto/lowlight/fast` - Focus adaptation
- `scan` - Multi-object scan (response on port 52383)
- `track <id> normal/aggr/stealth` - Object tracking
- `record start/obj/alert <sec>` - Start recording
- `record stop` - Stop recording
- `hex FA 01 10 01 00 00 0C` - Send raw hex packet

## API Reference

### UdpReceiver

```typescript
class UdpReceiver {
    constructor(config: UdpServerConfig, callbacks: UdpReceiverCallbacks);
    start(): Promise<void>;
    stop(): Promise<void>;
    getIsListening(): boolean;
    updateCallbacks(callbacks: UdpReceiverCallbacks): void;
}
```

### UdpSender

```typescript
class UdpSender {
    constructor(callbacks: UdpSenderCallbacks);
    send(options: UdpSendOptions): Promise<number>;
    broadcast(port: number, data: string | Buffer): Promise<number>;
    sendMultiple(messages: UdpSendOptions[]): Promise<number[]>;
    close(): Promise<void>;
}
```

### UdpServerManager

```typescript
class UdpServerManager {
    constructor(config: UdpServerManagerConfig);
    startReceiver(): Promise<void>;
    stopReceiver(): Promise<void>;
    send(options: UdpSendOptions): Promise<number>;
    broadcast(port: number, data: string | Buffer): Promise<number>;
    createEchoServer(): void;
    enableAutoReply(handler: (message: UdpMessage) => string | Buffer | null): void;
    close(): Promise<void>;
}
```

### PelcoDServer (Server 1)

```typescript
class PelcoDServer {
    constructor(config: PelcoDServerConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    sendCommand(targetHost: string, targetPort: number, buffer: Buffer): Promise<number>;
    getCommandBuilder(): PelcoDCommandBuilder;
    static createCommandBuilder(cameraId: number): PelcoDCommandBuilder;
}
```

### PelcoDCommandBuilder

```typescript
class PelcoDCommandBuilder {
    constructor(cameraId: number);
    panLeft(speed?: number): Buffer;
    panRight(speed?: number): Buffer;
    tiltUp(speed?: number): Buffer;
    tiltDown(speed?: number): Buffer;
    zoomIn(speed?: number): Buffer;
    zoomOut(speed?: number): Buffer;
    focusNear(speed?: number): Buffer;
    focusFar(speed?: number): Buffer;
    stop(): Buffer;
    panLeftTiltUp(panSpeed?: number, tiltSpeed?: number): Buffer;
    createSequence(): PelcoDSequence;
}
```

### SmartServer (Server 2)

```typescript
class SmartServer {
    constructor(config: SmartServerConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    sendCommand(targetHost: string, targetPort: number, buffer: Buffer): Promise<number>;
    getCommandBuilder(): SmartCommandBuilder;
    static createCommandBuilder(cameraId: number): SmartCommandBuilder;
}
```

### SmartCommandBuilder

```typescript
class SmartCommandBuilder {
    constructor(cameraId: number);
    
    // Rapid Focus (0x10)
    rapidFocusAuto(): Buffer;
    rapidFocusLowLight(): Buffer;
    rapidFocusFastMoving(): Buffer;
    
    // Multi-Object Scan (0x20)
    multiObjectScan(): Buffer;
    
    // Smart Tracking (0x30)
    trackObjectNormal(objectId: number): Buffer;
    trackObjectAggressive(objectId: number): Buffer;
    trackObjectStealth(objectId: number): Buffer;
    
    // Auto-Record (0x40)
    startRecordManual(duration: number): Buffer;
    startRecordObject(duration: number): Buffer;
    startRecordAlert(duration: number): Buffer;
    stopRecord(): Buffer;
    
    setCamera(id: number): void;
}
```

## Configuration Types

### UDP Configuration

```typescript
interface UdpServerConfig {
    port: number;
    host?: string;
    reuseAddr?: boolean;
}

interface UdpSendOptions {
    targetHost: string;
    targetPort: number;
    data: string | Buffer;
}

interface UdpMessage {
    data: Buffer;
    remoteAddress: string;
    remotePort: number;
    timestamp: Date;
}
```

### PELCO-D Configuration

```typescript
interface PelcoDServerConfig {
    port: number;
    host?: string;
    defaultCameraId?: number;
    onCommand?: (decoded: DecodedPelcoD) => void;
    onError?: (error: Error) => void;
}

interface PtzControlParams {
    cameraId: number;
    action: PelcoDAction;
    panSpeed?: number;    // 0x00-0x3F (0-63)
    tiltSpeed?: number;   // 0x00-0x3F (0-63)
    zoomSpeed?: number;   // 0x00-0x3F (0-63)
    focusSpeed?: number;  // 0x00-0x3F (0-63)
}

enum PelcoDAction {
    STOP, PAN_LEFT, PAN_RIGHT, TILT_UP, TILT_DOWN,
    ZOOM_IN, ZOOM_OUT, FOCUS_NEAR, FOCUS_FAR,
    PAN_LEFT_TILT_UP, PAN_RIGHT_TILT_DOWN, // etc.
}
```

### SMART Configuration

```typescript
interface SmartServerConfig {
    port: number;
    responsePort?: number;  // Default: 52383
    host?: string;
    defaultCameraId?: number;
    onCommand?: (decoded: DecodedSmart) => void;
    onMultiObjectResponse?: (response: MultiObjectResponse) => void;
    onTrajectoryUpdate?: (data: TrajectoryData) => void;
    onError?: (error: Error) => void;
}

enum SmartCommand {
    RAPID_FOCUS = 0x10,
    MULTI_OBJECT_SCAN = 0x20,
    SMART_TRACKING = 0x30,
    AUTO_RECORD = 0x40
}

enum FocusMode {
    AUTO = 0,
    LOW_LIGHT = 1,
    FAST_MOVING = 2
}

enum TrackingMode {
    NORMAL = 0,
    AGGRESSIVE = 1,
    STEALTH = 2
}
```

## PELCO-D Protocol Details

### Packet Format (7 bytes)

| Byte | Description | Value |
|------|-------------|-------|
| 1 | Start Byte | 0xFF |
| 2 | Camera ID | 0x00-0xFF |
| 3 | Command 1 | Command byte 1 |
| 4 | Command 2 | Command byte 2 |
| 5 | Data 1 | Pan speed |
| 6 | Data 2 | Tilt/Zoom/Focus speed |
| 7 | Checksum | (Σ bytes 2-6) % 256 |

### Standard Commands

| Action | Cmd1 | Cmd2 | Data1 | Data2 |
|--------|------|------|-------|-------|
| Pan Left | 0x00 | 0x04 | speed | 0x00 |
| Pan Right | 0x00 | 0x02 | speed | 0x00 |
| Tilt Up | 0x00 | 0x08 | 0x00 | speed |
| Tilt Down | 0x00 | 0x10 | 0x00 | speed |
| Zoom In | 0x00 | 0x20 | 0x00 | speed |
| Zoom Out | 0x00 | 0x40 | 0x00 | speed |
| Focus Near | 0x01 | 0x00 | 0x00 | speed |
| Focus Far | 0x00 | 0x80 | 0x00 | speed |

**Speed Range:** 0x00 (stop) to 0x3F (maximum, 63 decimal)

### Example Usage

```typescript
import { PelcoDServer, PelcoDCommandBuilder } from './src/pelco-index';

// Create command builder for Camera 1
const builder = new PelcoDCommandBuilder(1);

// Pan left at medium speed
const panLeftCmd = builder.panLeft(32);
// Returns: Buffer [0xFF, 0x01, 0x00, 0x04, 0x20, 0x00, 0x25]

// Create and execute a sequence
const sequence = builder.createSequence()
    .panLeft(30, 1000)   // Pan left for 1 second
    .stop(500)           // Stop and wait 500ms
    .panRight(30, 1000)  // Pan right for 1 second
    .stop();

await sequence.execute(async (buffer) => {
    // Send buffer to camera
});
```

## SMART Protocol Details

### Packet Format (7 bytes)

| Byte | Description | Value |
|------|-------------|-------|
| 1 | Start Byte | 0xFA |
| 2 | Camera ID | 0x00-0xFF |
| 3 | SMART Command | 0x10, 0x20, 0x30, 0x40 |
| 4 | Parameter 1 | Command specific |
| 5 | Parameter 2 | Command specific |
| 6 | Parameter 3 | Command specific |
| 7 | Checksum | (Σ bytes 2-6) % 256 |

### SMART Commands

| Command | Code | Description | Params |
|---------|------|-------------|--------|
| Rapid Focus | 0x10 | Auto-adjust focus | Mode (0=Auto, 1=LowLight, 2=FastMoving) |
| Multi-Object Scan | 0x20 | Detect multiple objects | None (response on port 52383) |
| Smart Tracking | 0x30 | Track specific object | ObjectID, Mode (0=Normal, 1=Aggr, 2=Stealth) |
| Auto-Record | 0x40 | Control recording | Action, Reason, Duration |

### Example Usage

```typescript
import { SmartServer, SmartCommandBuilder } from './src/index';

// Create command builder for Camera 1
const builder = new SmartCommandBuilder(1);

// Rapid focus - Auto mode
const autoFocus = builder.rapidFocusAuto();
// Returns: Buffer [0xFA, 0x01, 0x10, 0x01, 0x00, 0x00, 0x0C]

// Multi-object scan (camera responds on port 52383)
const scan = builder.multiObjectScan();

// Track object 5 in normal mode
const track = builder.trackObjectNormal(5);

// Start recording for 30 seconds (manual trigger)
const record = builder.startRecordManual(30);

// Stop recording
const stop = builder.stopRecord();
```

### Multi-Object Response Format

When SMART command 0x20 is sent, the camera responds on **port 52383**:

```
Response Header: 0xFB
Object Count: 1 byte
Object Data: [Type, X, Y, Z] × objectCount
```

Example response with 2 objects:
```
FB 02 01 32 28 0A 02 64 3C 14
```
- Object 1: Type 1 (Person) at position (50, 40, 10)
- Object 2: Type 2 (Vehicle) at position (100, 60, 20)

## Testing

### UDP Testing

To test the system, you can run two terminals:

**Terminal 1 - Start receiver:**
```bash
npm run example:receiver
```

**Terminal 2 - Send messages:**
```bash
npm run example:sender
```

Or use PowerShell to send test messages:
```powershell
# Create a UDP client in PowerShell
$udpClient = New-Object System.Net.Sockets.UdpClient
$bytes = [System.Text.Encoding]::UTF8.GetBytes("Hello from PowerShell")
$udpClient.Send($bytes, $bytes.Length, "localhost", 8080)
$udpClient.Close()
```

### PELCO-D Testing

**Terminal 1 - Start PELCO-D Server:**
```bash
npm run pelco:server
```

**Terminal 2 - Run PELCO-D Client:**
```bash
npm run pelco:client
```

Or use the interactive terminal:
```bash
npm run pelco:terminal
```

Or send raw PELCO-D packets using PowerShell:
```powershell
# Pan Camera 1 Left at speed 32
$udpClient = New-Object System.Net.Sockets.UdpClient
$bytes = @(0xFF, 0x01, 0x00, 0x04, 0x20, 0x00, 0x25)  # PELCO-D packet
$udpClient.Send($bytes, $bytes.Length, "localhost", 5000)
$udpClient.Close()
```

### SMART Testing

**Terminal 1 - Start SMART Server:**
```bash
npm run smart:server
```

**Terminal 2 - Run SMART Client:**
```bash
npm run smart:client
```

Or use the interactive terminal:
```bash
npm run smart:terminal
```

Or send raw SMART packets using PowerShell:
```powershell
# Rapid Focus Auto mode for Camera 1
$udpClient = New-Object System.Net.Sockets.UdpClient
$bytes = @(0xFA, 0x01, 0x10, 0x01, 0x00, 0x00, 0x0C)  # SMART packet
$udpClient.Send($bytes, $bytes.Length, "localhost", 5001)
$udpClient.Close()
```

## Use Cases

- 📡 IoT device communication
- 🎮 Game server messaging
- 📊 Real-time data streaming
- 🔔 Event notifications
- 🌐 Network discovery and broadcasting
- 💬 Simple messaging systems
- 🎥 **PTZ Camera Control** (PELCO-D protocol - Server 1)
- 🤖 **AI-Powered Camera Control** (SMART protocol - Server 2)
- 🛡️ **Military/Security Systems** (Multi-camera surveillance)
- 🏭 **Industrial Automation** (Remote device control)
- 🎯 **Object Tracking** (Smart tracking and classification)
- 📹 **Automated Recording** (Context-aware recording triggers)

## Documentation

- **[README.md](./README.md)** - This file
- **[PELCO-D-REFERENCE.md](./PELCO-D-REFERENCE.md)** - PELCO-D protocol quick reference
- **[SMART-REFERENCE.md](./SMART-REFERENCE.md)** - SMART protocol quick reference
- **[SERVER-1-PELCO-D.md](./SERVER-1-PELCO-D.md)** - Server 1 implementation details
- **[PELCO-D-TESTING-GUIDE.md](./PELCO-D-TESTING-GUIDE.md)** - Interactive testing guide
- **[PROJECT-SUMMARY.md](./PROJECT-SUMMARY.md)** - Overall project summary
