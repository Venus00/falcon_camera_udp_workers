# Server 1 - PELCO-D Protocol Implementation Summary

## ✅ Implementation Complete

Server 1 has been successfully implemented with full PELCO-D protocol support for PTZ (Pan-Tilt-Zoom) camera control.

## 📦 What Was Built

### Core Protocol Components

1. **PelcoDEncoder** (`src/protocols/PelcoDEncoder.ts`)
   - Builds PELCO-D packets with automatic checksum calculation
   - Validates speed values (0x00-0x3F)
   - Helper methods for all PTZ commands

2. **PelcoDDecoder** (`src/protocols/PelcoDDecoder.ts`)
   - Parses incoming PELCO-D packets
   - Validates checksums
   - Determines action from command bytes
   - Provides human-readable descriptions

3. **PelcoDCommandBuilder** (`src/protocols/PelcoDCommandBuilder.ts`)
   - High-level API for building commands
   - Command sequence support with delays
   - Fluent interface for easy usage

4. **PelcoDServer** (`src/servers/PelcoDServer.ts`)
   - UDP server specialized for PELCO-D protocol
   - Receives and decodes PELCO-D commands
   - Sends PELCO-D commands to cameras
   - Event-driven callbacks

### Type Definitions

**File:** `src/types/pelco-d.types.ts`

- `PelcoDPacket` - 7-byte packet structure
- `PelcoDAction` - Enum of all PTZ actions
- `PtzControlParams` - Parameters for PTZ control
- `DecodedPelcoD` - Decoded packet information
- `PELCO_D_CONSTANTS` - Protocol constants

## 🎯 PELCO-D Protocol Specification

### Packet Format (7 bytes)
```
Byte 1: 0xFF (Start)
Byte 2: Camera ID (0x00-0xFF)
Byte 3: Command 1
Byte 4: Command 2
Byte 5: Data 1 (Pan Speed)
Byte 6: Data 2 (Tilt/Zoom/Focus Speed)
Byte 7: Checksum = (Bytes 2-6) % 256
```

### Supported Commands

| Action | CMD1 | CMD2 | Data1 | Data2 |
|--------|------|------|-------|-------|
| Pan Left | 0x00 | 0x04 | speed | 0x00 |
| Pan Right | 0x00 | 0x02 | speed | 0x00 |
| Tilt Up | 0x00 | 0x08 | 0x00 | speed |
| Tilt Down | 0x00 | 0x10 | 0x00 | speed |
| Zoom In | 0x00 | 0x20 | 0x00 | speed |
| Zoom Out | 0x00 | 0x40 | 0x00 | speed |
| Focus Near | 0x01 | 0x00 | 0x00 | speed |
| Focus Far | 0x00 | 0x80 | 0x00 | speed |
| Stop | 0x00 | 0x00 | 0x00 | 0x00 |

**Speed Range:** 0x00 to 0x3F (0-63 decimal)

## 🚀 Usage

### Start Server 1 (PELCO-D Server)

```bash
npm run pelco:server
```

Server listens on **port 5000** for PELCO-D commands.

### Send Commands (Client)

```bash
npm run pelco:client
```

### Programmatic Usage

```typescript
import { PelcoDServer, PelcoDCommandBuilder } from './src/pelco-index';

// Create server
const server = new PelcoDServer({
    port: 5000,
    defaultCameraId: 1,
    onCommand: (decoded) => {
        console.log(`Camera ${decoded.cameraId}: ${decoded.action}`);
    }
});

await server.start();

// Create commands
const builder = new PelcoDCommandBuilder(1); // Camera ID 1

// Send pan left command
const panLeftCmd = builder.panLeft(32); // Speed 32
await server.sendCommand('192.168.1.100', 5000, panLeftCmd);

// Create sequence
const sequence = builder.createSequence()
    .panLeft(30, 1000)   // Pan left for 1 second
    .stop(500)           // Stop and wait 500ms
    .tiltUp(25, 800)     // Tilt up for 0.8 seconds
    .stop();

await sequence.execute(async (buffer) => {
    await server.sendCommand('192.168.1.100', 5000, buffer);
});
```

## 📋 Features

### ✅ Encoding
- Build PELCO-D packets from high-level commands
- Automatic checksum calculation
- Speed validation (0x00-0x3F)
- All standard PTZ commands supported

### ✅ Decoding
- Parse incoming PELCO-D packets
- Checksum validation
- Action detection
- Combined movement detection (e.g., Pan + Tilt)

### ✅ Server Functionality
- UDP-based communication
- Receive and decode PELCO-D commands
- Send PELCO-D commands to cameras
- Event callbacks for commands and errors
- Detailed logging

### ✅ Command Builder
- Fluent API for building commands
- Helper methods for all actions
- Sequence creation with delays
- Multiple camera support

### ✅ Advanced Features
- Combined movements (Pan + Tilt simultaneously)
- Command sequences with timing
- Speed control for all movements
- Multi-camera support

## 🧪 Testing

### Test with Examples

**Terminal 1:**
```bash
npm run pelco:server
```

**Terminal 2:**
```bash
npm run pelco:client
```

### Test with PowerShell

```powershell
# Pan Camera 1 Left at speed 32
$client = New-Object System.Net.Sockets.UdpClient
$bytes = @(0xFF, 0x01, 0x00, 0x04, 0x20, 0x00, 0x25)
$client.Send($bytes, $bytes.Length, "localhost", 5000)
$client.Close()
```

### Expected Output (Server)

```
[PELCO-D] Received: Camera 1 | Action: PAN_LEFT | Pan Speed: 32
[PELCO-D] Details: {
  "valid": true,
  "checksumValid": true,
  "cameraId": 1,
  "action": "PAN_LEFT",
  "command1": "0x00",
  "command2": "0x04",
  "data1": 32,
  "data2": 0,
  "rawHex": "FF0100042000 25"
}
```

## 📁 Files Created

### Protocol Layer
- `src/types/pelco-d.types.ts` - Type definitions
- `src/protocols/PelcoDEncoder.ts` - Packet encoder
- `src/protocols/PelcoDDecoder.ts` - Packet decoder
- `src/protocols/PelcoDCommandBuilder.ts` - Command builder

### Server Layer
- `src/servers/PelcoDServer.ts` - PELCO-D UDP server

### Examples
- `src/examples/pelco-d-server-example.ts` - Server example
- `src/examples/pelco-d-client-example.ts` - Client example

### Documentation
- `PELCO-D-REFERENCE.md` - Complete protocol reference
- `README.md` - Updated with PELCO-D documentation

## 🎯 Use Cases

1. **Military Surveillance Systems**
   - Control PTZ cameras for perimeter monitoring
   - Remote camera control from command centers

2. **Security Operations**
   - CCTV camera control
   - Automated patrol patterns

3. **Industrial Monitoring**
   - Process observation cameras
   - Equipment inspection cameras

4. **Traffic Management**
   - Traffic camera control
   - Incident monitoring

## 🔧 Configuration

### Server Configuration

```typescript
interface PelcoDServerConfig {
    port: number;              // UDP port (e.g., 5000)
    host?: string;             // Listen address (default: '0.0.0.0')
    defaultCameraId?: number;  // Default camera ID (default: 1)
    onCommand?: (decoded: DecodedPelcoD) => void;
    onError?: (error: Error) => void;
}
```

### Camera IDs
- Range: 0x00 to 0xFF (0-255)
- Each camera on the network has a unique ID
- Server can control multiple cameras

## 📊 Status

✅ **COMPLETE** - Server 1 (PELCO-D) is fully implemented and tested
- All protocol functions working
- Encoding/decoding verified
- Examples tested and functional
- Documentation complete

## 🔗 Integration

Server 1 integrates with the existing UDP infrastructure:
- Uses `UdpReceiver` for listening
- Uses `UdpSender` for sending commands
- Modular and reusable
- Can be combined with other servers

## 📖 References

- `README.md` - Main project documentation
- `PELCO-D-REFERENCE.md` - Protocol quick reference
- `src/examples/pelco-d-*.ts` - Working examples
