# PELCO-D Protocol Quick Reference

## Overview
PELCO-D is a communication protocol for PTZ (Pan-Tilt-Zoom) camera control over serial or UDP connections.

## Packet Structure (7 bytes)

```
┌─────┬─────┬─────┬─────┬─────┬─────┬──────────┐
│ FF  │ ADR │ CMD1│ CMD2│ DA1 │ DA2 │ CHECKSUM │
└─────┴─────┴─────┴─────┴─────┴─────┴──────────┘
  1     2     3     4     5     6        7
```

- **Byte 1 (0xFF)**: Start byte (always 0xFF)
- **Byte 2 (ADR)**: Camera address/ID (0x00-0xFF)
- **Byte 3 (CMD1)**: Command 1
- **Byte 4 (CMD2)**: Command 2
- **Byte 5 (DA1)**: Data 1 (usually pan speed)
- **Byte 6 (DA2)**: Data 2 (usually tilt/zoom/focus speed)
- **Byte 7 (CHK)**: Checksum = (ADR + CMD1 + CMD2 + DA1 + DA2) % 256

## Command Reference

### Pan Commands

| Command | CMD1 | CMD2 | Data1 | Data2 | Hex Example (Camera 1, Speed 32) |
|---------|------|------|-------|-------|----------------------------------|
| Pan Left | 0x00 | 0x04 | speed | 0x00 | FF 01 00 04 20 00 25 |
| Pan Right | 0x00 | 0x02 | speed | 0x00 | FF 01 00 02 20 00 23 |

### Tilt Commands

| Command | CMD1 | CMD2 | Data1 | Data2 | Hex Example (Camera 1, Speed 32) |
|---------|------|------|-------|-------|----------------------------------|
| Tilt Up | 0x00 | 0x08 | 0x00 | speed | FF 01 00 08 00 20 29 |
| Tilt Down | 0x00 | 0x10 | 0x00 | speed | FF 01 00 10 00 20 31 |

### Zoom Commands

| Command | CMD1 | CMD2 | Data1 | Data2 | Hex Example (Camera 1, Speed 32) |
|---------|------|------|-------|-------|----------------------------------|
| Zoom In | 0x00 | 0x20 | 0x00 | speed | FF 01 00 20 00 20 41 |
| Zoom Out | 0x00 | 0x40 | 0x00 | speed | FF 01 00 40 00 20 61 |

### Focus Commands

| Command | CMD1 | CMD2 | Data1 | Data2 | Hex Example (Camera 1, Speed 32) |
|---------|------|------|-------|-------|----------------------------------|
| Focus Near | 0x01 | 0x00 | 0x00 | speed | FF 01 01 00 00 20 22 |
| Focus Far | 0x00 | 0x80 | 0x00 | speed | FF 01 00 80 00 20 A1 |

### Stop Command

| Command | CMD1 | CMD2 | Data1 | Data2 | Hex Example (Camera 1) |
|---------|------|------|-------|-------|------------------------|
| Stop | 0x00 | 0x00 | 0x00 | 0x00 | FF 01 00 00 00 00 01 |

### Combined Commands

| Command | CMD2 (bitwise OR) | Example |
|---------|-------------------|---------|
| Pan Left + Tilt Up | 0x04 \| 0x08 = 0x0C | FF 01 00 0C 20 20 4D |
| Pan Left + Tilt Down | 0x04 \| 0x10 = 0x14 | FF 01 00 14 20 20 55 |
| Pan Right + Tilt Up | 0x02 \| 0x08 = 0x0A | FF 01 00 0A 20 20 4B |
| Pan Right + Tilt Down | 0x02 \| 0x10 = 0x12 | FF 01 00 12 20 20 53 |

## Speed Values

- **Range**: 0x00 to 0x3F (0 to 63 decimal)
- **0x00**: Stop/Slowest
- **0x3F**: Maximum speed (63 decimal)
- **0x20**: Medium speed (32 decimal) - commonly used default

## Code Examples

### TypeScript

```typescript
import { PelcoDCommandBuilder } from './protocols/PelcoDCommandBuilder';

const builder = new PelcoDCommandBuilder(1); // Camera ID 1

// Simple commands
const panLeft = builder.panLeft(32);      // Speed 32
const stop = builder.stop();

// Combined movement
const diagonal = builder.panLeftTiltUp(30, 30);

// Sequence
const sequence = builder.createSequence()
    .panLeft(30, 1000)
    .stop(500)
    .tiltUp(25, 800)
    .stop();
```

### Manual Packet Construction

```typescript
// Pan Left, Camera 1, Speed 32
const packet = Buffer.from([
    0xFF,  // Start
    0x01,  // Camera 1
    0x00,  // CMD1
    0x04,  // CMD2 (Pan Left)
    0x20,  // Data1 (Speed 32)
    0x00,  // Data2
    0x25   // Checksum: (1+0+4+32+0) % 256 = 37 (0x25)
]);
```

## Checksum Calculation

```typescript
function calculateChecksum(address, cmd1, cmd2, data1, data2) {
    return (address + cmd1 + cmd2 + data1 + data2) % 256;
}

// Example: Pan Left, Camera 1, Speed 32
const checksum = (0x01 + 0x00 + 0x04 + 0x20 + 0x00) % 256;
// Result: 37 (0x25)
```

## Testing Commands

### Using PowerShell

```powershell
# Pan Camera 1 Left at speed 32
$client = New-Object System.Net.Sockets.UdpClient
$bytes = @(0xFF, 0x01, 0x00, 0x04, 0x20, 0x00, 0x25)
$client.Send($bytes, $bytes.Length, "192.168.1.100", 5000)
$client.Close()
```

### Using This Project

```bash
# Start PELCO-D Server
npm run pelco:server

# In another terminal, send commands
npm run pelco:client
```

## Command Bit Flags (CMD2)

| Bit | Hex | Function |
|-----|-----|----------|
| 0 | 0x01 | (Reserved) |
| 1 | 0x02 | Pan Right |
| 2 | 0x04 | Pan Left |
| 3 | 0x08 | Tilt Up |
| 4 | 0x10 | Tilt Down |
| 5 | 0x20 | Zoom In |
| 6 | 0x40 | Zoom Out |
| 7 | 0x80 | Focus Far |

## Command Bit Flags (CMD1)

| Bit | Hex | Function |
|-----|-----|----------|
| 0 | 0x01 | Focus Near |
| 1 | 0x02 | Iris Open |
| 2 | 0x04 | Iris Close |
| 3 | 0x08 | Camera On |
| 4 | 0x10 | Auto Scan |
| 7 | 0x80 | Sense |

## Common Issues

### Invalid Checksum
- Verify all bytes are summed correctly
- Ensure modulo 256 is applied
- Check for byte overflow

### No Response from Camera
- Verify camera ID matches
- Check network connectivity
- Ensure camera supports PELCO-D protocol
- Verify baud rate (for serial) or port (for UDP)

### Camera Ignores Commands
- Some cameras require a specific start sequence
- Check if camera is in PELCO-D mode (vs PELCO-P)
- Verify speed values are within camera's supported range

## Resources

- Official PELCO-D Protocol Specification
- Camera manufacturer documentation
- This project's examples: `src/examples/pelco-d-*`
