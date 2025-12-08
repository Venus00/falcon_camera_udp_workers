# PELCO-D to PTZ HTTP API Integration

This module integrates the PELCO-D UDP server with an HTTP API for PTZ (Pan-Tilt-Zoom) camera control.

## Overview

The `PelcoDServer` now automatically translates incoming PELCO-D commands into HTTP API requests, allowing you to control cameras through a REST API.

## Features

- **Automatic Command Translation**: PELCO-D actions are automatically mapped to API directions
- **Speed Mapping**: PELCO-D speed values (0-63) are converted to API speed values (1-10)
- **Configurable**: Customize API server URL and camera name
- **Error Handling**: Graceful handling of API connection errors
- **Full Logging**: Detailed logs of received commands and API requests

## Configuration

```typescript
const pelcoServer = new PelcoDServer({
    port: 5000,                               // UDP port to listen on
    host: '0.0.0.0',                          // Host to bind to
    defaultCameraId: 1,                       // Default PELCO-D camera ID
    focusServerUrl: 'http://localhost:3000',  // HTTP API server URL (optional)
    cameraName: 'cam2',                       // Camera name in API (optional)
    onCommand: (decoded) => { /* ... */ },    // Command callback (optional)
    onError: (error) => { /* ... */ }         // Error callback (optional)
});
```

### Configuration Options

- **port**: UDP port to listen for PELCO-D commands (required)
- **host**: Host address to bind to (default: '0.0.0.0')
- **defaultCameraId**: Default camera ID for PELCO-D protocol (default: 1)
- **focusServerUrl**: URL of the HTTP API server (default: 'http://localhost:3000')
- **cameraName**: Camera name used in API requests (default: 'cam2')
- **onCommand**: Callback for received commands (optional)
- **onError**: Callback for errors (optional)

## Action Mapping

PELCO-D actions are mapped to HTTP API directions as follows:

| PELCO-D Action | API Direction |
|----------------|---------------|
| PAN_LEFT | left |
| PAN_RIGHT | right |
| TILT_UP | up |
| TILT_DOWN | down |
| PAN_LEFT_TILT_UP | left-up |
| PAN_LEFT_TILT_DOWN | left-down |
| PAN_RIGHT_TILT_UP | right-up |
| PAN_RIGHT_TILT_DOWN | right-down |
| ZOOM_IN | zoom-in |
| ZOOM_OUT | zoom-out |
| FOCUS_NEAR | focus-near |
| FOCUS_FAR | focus-far |
| STOP | stop |

## Speed Mapping

PELCO-D speed values (0-63) are converted to API speed values (1-10):

```
PELCO-D Speed: 0     → API Speed: 1
PELCO-D Speed: 1-6   → API Speed: 1
PELCO-D Speed: 7-12  → API Speed: 2
PELCO-D Speed: 13-19 → API Speed: 3
...
PELCO-D Speed: 57-63 → API Speed: 10
```

## HTTP API Request Format

The server sends POST requests to the following endpoint:

```
POST {focusServerUrl}/camera/{cameraName}/ptz/move/{direction}
Content-Type: application/json

{
  "speed": 1-10
}
```

### Example API Request

```http
POST http://localhost:3000/camera/cam2/ptz/move/left
Content-Type: application/json

{
  "speed": 4
}
```

## Usage

### Starting the Server

```typescript
import { PelcoDServer } from './servers/PelcoDServer';

const server = new PelcoDServer({
    port: 5000,
    focusServerUrl: 'http://localhost:3000',
    cameraName: 'cam2'
});

await server.start();
```

### Using the Example

Run the included example:

```bash
npm run pelco:ptz-api
```

Or run the standard PELCO-D server (which now includes API integration):

```bash
npm run pelco:server
```

### Testing with a Client

Send PELCO-D commands using the client:

```bash
npm run pelco:client
```

## Workflow

1. **PELCO-D Client** sends UDP packet to server
2. **PelcoDServer** receives and decodes the packet
3. Server extracts action and speed from packet
4. Action is mapped to API direction
5. Speed is converted from PELCO-D range (0-63) to API range (1-10)
6. **HTTP POST** request is sent to API server
7. API server controls the camera

## Example Output

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
  "rawHex": "FF0100043200004B"
}
[PELCO-D] Executing action: PAN_LEFT -> left (speed: 5)
[PTZ] cam2 moved left successfully
```

## Error Handling

The server handles errors gracefully:

- **Connection Errors**: Logged but don't crash the server
- **Invalid Packets**: Logged with warning
- **API Timeouts**: Set to 500ms, errors are logged
- **Invalid Actions**: Logged but ignored

## Python API Server Example

The server is designed to work with the following Python API format:

```python
import requests

FOCUS_SERVER = "http://localhost:3000"

def send_ptz_request(direction, speed=4):
    url = f"{FOCUS_SERVER}/camera/cam2/ptz/move/{direction}"
    payload = {"speed": speed}
    try:
        r = requests.post(url, json=payload, timeout=0.5)
        if r.status_code == 200:
            print(f"[PTZ] cam2 moved {direction} successfully")
        else:
            print(f"[PTZ] Request failed ({r.status_code}): {r.text}")
    except Exception as e:
        print(f"[PTZ] Error sending request: {e}")
```

## Notes

- The API server must be running before starting the PELCO-D server
- API timeout is set to 500ms to prevent blocking
- Requests are asynchronous and don't block PELCO-D packet processing
- The server will continue to operate even if the API server is unavailable
