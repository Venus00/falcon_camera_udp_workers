# SMART Protocol Reference

## Overview
The SMART (Smart Monitoring And Recording Technology) protocol provides advanced camera control features including rapid focus adaptation, multi-object detection, smart tracking, and automated recording.

**Server:** Server 2  
**Default Port:** 5001  
**Response Port:** 52383  
**Packet Size:** 7 bytes  

---

## Packet Structure

### Request Packet (7 bytes)
```
Byte 1: 0xFA (Header)
Byte 2: Camera ID (0x00-0xFF)
Byte 3: SMART Command (0x10, 0x20, 0x30, 0x40)
Byte 4: Parameter 1
Byte 5: Parameter 2
Byte 6: Parameter 3
Byte 7: Checksum
```

### Checksum Calculation
```
Checksum = (CameraId + SmartCmd + Param1 + Param2 + Param3) % 256
```

---

## Commands

### 0x10 - Rapid Focus Adaptation
Adjusts camera focus based on scene conditions.

**Modes:**
- `0x01` - Auto Focus
- `0x02` - Low-Light Optimization
- `0x03` - Fast-Moving Objects

**Example:**
```
FA 01 10 01 00 00 0C  // Camera 1, Auto Focus
FA 01 10 02 00 00 0D  // Camera 1, Low-Light
FA 01 10 03 00 00 0E  // Camera 1, Fast-Moving
```

---

### 0x20 - Multi-Object Classification Snapshot
Requests camera to scan and identify multiple objects in the frame.

**Response:** Camera sends response on port **52383** with detected objects.

**Example Request:**
```
FA 01 20 00 00 00 21  // Camera 1, Multi-Object Scan
```

**Response Format (0xFB header):**
```
Byte 1: 0xFB (Response Header)
Byte 2: Object Count
Bytes 3-N: Object data (type, x, y, z for each object)
```

---

### 0x30 - Smart Tracking Lock
Locks onto and tracks a specific object in the scene.

**Parameters:**
- Param1: Object ID (from Multi-Object Scan)
- Param2: Tracking Mode
  - `0x01` - Normal Tracking
  - `0x02` - Aggressive Tracking (faster response)
  - `0x03` - Stealth Tracking (minimal movement)

**Example:**
```
FA 01 30 05 01 00 37  // Camera 1, Track Object 5, Normal Mode
FA 01 30 03 02 00 36  // Camera 1, Track Object 3, Aggressive Mode
FA 01 30 07 03 00 3B  // Camera 1, Track Object 7, Stealth Mode
```

---

### 0x40 - Auto-Record + Edge Learning Trigger
Controls automated recording with different trigger reasons.

**Parameters:**
- Param1: Action
  - `0x01` - Start Recording
  - `0x02` - Stop Recording
- Param2: Reason (when starting)
  - `0x01` - Manual Start
  - `0x02` - Object Detected
  - `0x03` - Alert Triggered
- Param3: Duration (seconds, 0-255)

**Examples:**
```
FA 01 40 01 01 1E 61  // Camera 1, Start Manual, 30 seconds
FA 01 40 01 02 3C 7E  // Camera 1, Start on Object, 60 seconds
FA 01 40 01 03 78 BC  // Camera 1, Start on Alert, 120 seconds
FA 01 40 02 00 00 43  // Camera 1, Stop Recording
```

---

## TypeScript Usage

### Using SmartCommandBuilder
```typescript
import { SmartCommandBuilder } from './protocols/SmartCommandBuilder';

const builder = new SmartCommandBuilder(1); // Camera ID 1

// Rapid Focus
const autoFocus = builder.rapidFocusAuto();
const lowLight = builder.rapidFocusLowLight();
const fastMoving = builder.rapidFocusFastMoving();

// Multi-Object Scan
const scan = builder.multiObjectScan();

// Smart Tracking
const trackNormal = builder.trackObjectNormal(5);
const trackAggressive = builder.trackObjectAggressive(3);
const trackStealth = builder.trackObjectStealth(7);

// Auto-Record
const startManual = builder.startRecordManual(30);
const startObject = builder.startRecordObject(60);
const startAlert = builder.startRecordAlert(120);
const stop = builder.stopRecord();
```

### Using SmartServer
```typescript
import { SmartServer } from './servers/SmartServer';

const server = new SmartServer({
    port: 5001,
    responsePort: 52383,
    defaultCameraId: 1,
    onCommand: (decoded) => {
        console.log('Received:', decoded);
    },
    onMultiObjectResponse: (response) => {
        console.log('Objects:', response.objects);
    }
});

await server.start();
```

### Decoding Packets
```typescript
import { SmartDecoder } from './protocols/SmartDecoder';

const buffer = Buffer.from([0xFA, 0x01, 0x10, 0x01, 0x00, 0x00, 0x0C]);
const decoded = SmartDecoder.decode(buffer);

console.log(decoded.valid);       // true
console.log(decoded.cameraId);    // 1
console.log(decoded.command);     // 0x10
console.log(decoded.param1);      // 1 (Auto Focus)
```

---

## Running Examples

### Start SMART Server (Server 2)
```bash
npm run smart:server
```

### Send SMART Commands
```bash
npm run smart:client
```

### Interactive Terminal
```bash
npm run smart:terminal
```

Terminal commands:
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
```

---

## Multi-Object Response Format

When command `0x20` is sent, the camera responds on port **52383**:

```
0xFB [Count] [Type1 X1 Y1 Z1] [Type2 X2 Y2 Z2] ...
```

Each object is 4 bytes:
- Byte 1: Object Type (1=Person, 2=Vehicle, etc.)
- Byte 2: X coordinate
- Byte 3: Y coordinate  
- Byte 4: Z distance

**Example Response:**
```
FB 02 01 32 28 0A 02 64 3C 14
```
Decodes to:
- 2 objects detected
- Object 1: Person at (50, 40, 10)
- Object 2: Vehicle at (100, 60, 20)

---

## Tips

1. **Focus Adaptation:** Use Auto mode for general scenes, Low-Light for dark environments, Fast-Moving for action scenes
2. **Multi-Object Scan:** Always listen on port 52383 for responses
3. **Smart Tracking:** Start with Normal mode, use Aggressive for erratic movement, Stealth for covert monitoring
4. **Auto-Record:** Set appropriate duration limits; max is 255 seconds (4.25 minutes)
5. **Testing:** Use the terminal client for quick testing and debugging

---

## Error Handling

- Invalid checksums are rejected
- Packet length must be exactly 7 bytes
- Camera ID range: 0-255
- Duration range: 0-255 seconds
- Object ID range: 0-255

---

## See Also
- `src/types/smart.types.ts` - Type definitions
- `src/protocols/SmartEncoder.ts` - Packet building
- `src/protocols/SmartDecoder.ts` - Packet parsing
- `src/servers/SmartServer.ts` - Server implementation
- `PELCO-D-REFERENCE.md` - PELCO-D protocol reference
