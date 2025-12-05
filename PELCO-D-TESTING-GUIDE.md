# PELCO-D Terminal Client - Testing Guide

## 🎯 Overview

The PELCO-D Terminal Client is an interactive command-line tool for testing Server 1 (PELCO-D Server) by sending PTZ commands from your terminal.

## 🚀 Quick Start

### Step 1: Start Server 1 (Terminal 1)

```bash
npm run pelco:server
```

You should see:
```
======================================================================
SERVER 1 - PELCO-D PTZ CAMERA CONTROL PROTOCOL
======================================================================
[PELCO-D SERVER] Listening on 0.0.0.0:5000
⏳ Waiting for PELCO-D commands...
```

### Step 2: Start Terminal Client (Terminal 2)

```bash
npm run pelco:terminal
```

You should see:
```
======================================================================
PELCO-D INTERACTIVE TERMINAL CLIENT
======================================================================

📡 Client Configuration:
   Server: localhost:5000
   Camera ID: 1
   Speed Range: 0-63

💡 Type "help" for available commands

PELCO-D [Camera 1]>
```

## 📝 Available Commands

### PTZ Control Commands

| Command | Shortcut | Description | Example |
|---------|----------|-------------|---------|
| `left [speed]` | `l` | Pan left | `left 50` |
| `right [speed]` | `r` | Pan right | `right 30` |
| `up [speed]` | `u` | Tilt up | `up 40` |
| `down [speed]` | `d` | Tilt down | `down 25` |
| `zoomin [speed]` | `zi` | Zoom in | `zoomin 20` |
| `zoomout [speed]` | `zo` | Zoom out | `zoomout 20` |
| `focusnear [speed]` | `fn` | Focus near | `fn 15` |
| `focusfar [speed]` | `ff` | Focus far | `ff 15` |
| `stop` | `s` | Stop all movements | `stop` |

**Note:** Speed is optional and defaults to 32 if not specified.

### Raw Hex Commands

Send raw PELCO-D packets:

```
hex FF 01 00 04 20 00 25
```

Or without spaces:
```
hex FF0100042000 25
```

The client will decode and display the packet before sending it.

### Configuration Commands

| Command | Description | Example |
|---------|-------------|---------|
| `camera <id>` | Set camera ID (0-255) | `camera 2` |
| `test` | Run test sequence | `test` |
| `help` | Show help menu | `help` |
| `exit` | Exit program | `exit` |

## 🧪 Testing Examples

### Example 1: Basic Movement Test

```
PELCO-D [Camera 1]> left
📤 Sending: Pan Left (speed: 32)
   Hex: FF0100042000 25
   Bytes: [0xFF, 0x01, 0x00, 0x04, 0x20, 0x00, 0x25]
✅ Sent to localhost:5000

PELCO-D [Camera 1]> stop
📤 Sending: Stop All Movements
   Hex: FF010000000001
   Bytes: [0xFF, 0x01, 0x00, 0x00, 0x00, 0x00, 0x01]
✅ Sent to localhost:5000
```

**Server 1 Output:**
```
[PELCO-D] Received: Camera 1 | Action: PAN_LEFT | Pan Speed: 32
[PELCO-D] Details: {
  "valid": true,
  "cameraId": 1,
  "action": "PAN_LEFT",
  ...
}

[PELCO-D] Received: Camera 1 | Action: STOP
```

### Example 2: Speed Variations

```
PELCO-D [Camera 1]> right 10
📤 Sending: Pan Right (speed: 10)
...

PELCO-D [Camera 1]> right 63
📤 Sending: Pan Right (speed: 63)
...
```

### Example 3: Multi-Camera Control

```
PELCO-D [Camera 1]> camera 2
✅ Camera ID set to: 2

PELCO-D [Camera 2]> up 30
📤 Sending: Tilt Up (speed: 30)
   Hex: FF02000800001E30
   Bytes: [0xFF, 0x02, 0x00, 0x08, 0x00, 0x1E, 0x30]
✅ Sent to localhost:5000
```

### Example 4: Raw Hex Packet

```
PELCO-D [Camera 1]> hex FF 01 00 04 20 00 25

📋 Decoded packet:
{
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

📤 Sending: Raw hex command
   Hex: FF0100042000 25
✅ Sent to localhost:5000
```

### Example 5: Test Sequence

```
PELCO-D [Camera 1]> test

🧪 Running test sequence...

📤 Sending: Test: Pan Left
   Hex: FF0100042000 25
✅ Sent to localhost:5000

📤 Sending: Test: Stop
   Hex: FF010000000001
✅ Sent to localhost:5000

📤 Sending: Test: Tilt Up
   Hex: FF0100080000191A
✅ Sent to localhost:5000

📤 Sending: Test: Stop
   Hex: FF010000000001
✅ Sent to localhost:5000

✅ Test sequence complete
```

## 📋 PELCO-D Packet Format Reference

Every command sent shows the hex representation:

```
FF 01 00 04 20 00 25
│  │  │  │  │  │  └── Checksum (0x25 = 37)
│  │  │  │  │  └───── Data2 (Tilt/Zoom/Focus speed: 0x00 = 0)
│  │  │  │  └──────── Data1 (Pan speed: 0x20 = 32)
│  │  │  └─────────── CMD2 (0x04 = Pan Left)
│  │  └────────────── CMD1 (0x00)
│  └───────────────── Camera ID (0x01 = 1)
└──────────────────── Start Byte (0xFF)
```

## 🔍 Monitoring Server Response

While running commands in Terminal 2, watch Terminal 1 (Server) for decoded output:

**Terminal 1 (Server):**
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

## 💡 Tips & Tricks

### 1. Quick Movement Testing
```
l        # Pan left (default speed)
s        # Stop
r        # Pan right
s        # Stop
u        # Tilt up
s        # Stop
```

### 2. Test Different Speeds
```
left 10     # Slow
left 32     # Medium (default)
left 63     # Maximum speed
```

### 3. Control Multiple Cameras
```
camera 1    # Switch to camera 1
left        # Pan camera 1 left
camera 2    # Switch to camera 2
right       # Pan camera 2 right
```

### 4. Send Custom Packets
```
hex FF 01 00 0C 20 20 4D    # Pan Left + Tilt Up
hex FF 02 00 20 00 10 32    # Camera 2: Zoom In at speed 16
```

## 🚨 Troubleshooting

### Problem: "Error: connect ECONNREFUSED"
**Solution:** Make sure Server 1 is running (`npm run pelco:server`)

### Problem: Invalid hex string
**Solution:** Ensure hex bytes are valid (0-9, A-F) and total 7 bytes
```
✅ Good: hex FF 01 00 04 20 00 25
❌ Bad:  hex FF 01 00 04            (only 4 bytes)
```

### Problem: No response from server
**Solution:** 
- Check server is running on port 5000
- Verify camera ID matches (use `camera` command)
- Check hex packet checksum is correct

## 📊 Command Reference Card

```
╔══════════════════════════════════════════════════════════════╗
║              PELCO-D TERMINAL CLIENT COMMANDS                ║
╠══════════════════════════════════════════════════════════════╣
║ Movement:         │ Raw:                │ Config:            ║
║ left [s]    (l)   │ hex <bytes>         │ camera <id>  (cam) ║
║ right [s]   (r)   │                     │ help         (h)   ║
║ up [s]      (u)   │ Utility:            │ exit         (q)   ║
║ down [s]    (d)   │ test                │                    ║
║ zoomin [s]  (zi)  │ stop          (s)   │                    ║
║ zoomout [s] (zo)  │                     │                    ║
║ focusnear [s](fn) │                     │                    ║
║ focusfar [s] (ff) │                     │                    ║
╚══════════════════════════════════════════════════════════════╝
```

## 🎯 Advanced Usage

### Create Custom Test Scripts

You can pipe commands into the terminal:

```powershell
# Create a test script
@"
camera 1
left 30
timeout /t 2
stop
up 25
timeout /t 2
stop
"@ | npm run pelco:terminal
```

### Monitor in Real-Time

Run both terminals side-by-side to see:
- **Left Terminal:** Commands being sent
- **Right Terminal:** Server decoding and processing

This is perfect for debugging PELCO-D integration!
