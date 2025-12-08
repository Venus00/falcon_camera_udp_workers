# PELCO-D Server PTZ API Integration - Summary

## Changes Made

### 1. Updated `PelcoDServer.ts`

Added HTTP API integration to translate PELCO-D commands into REST API calls:

- **New Dependencies**: Added `axios` for HTTP requests
- **New Properties**:
  - `focusServerUrl`: Configurable API server URL (default: `http://localhost:3000`)
  - `cameraName`: Configurable camera name (default: `cam2`)

- **New Methods**:
  - `mapPelcoDActionToDirection()`: Maps PELCO-D actions to API directions
  - `sendPtzRequest()`: Sends HTTP POST requests to the PTZ API
  - `mapSpeed()`: Converts PELCO-D speed (0-63) to API speed (1-10)

- **Updated Methods**:
  - `handlePelcoDMessage()`: Now async, automatically sends API requests when valid commands are received

### 2. Updated `pelco-d.types.ts`

Extended `PelcoDServerConfig` interface with:
- `focusServerUrl?: string` - HTTP API server URL
- `cameraName?: string` - Camera name for API requests

### 3. Updated `pelco-d-server-example.ts`

Added new configuration options to demonstrate the PTZ API integration.

### 4. New Files Created

- **`pelco-ptz-api-example.ts`**: Dedicated example showing PTZ API integration
- **`PTZ-API-INTEGRATION.md`**: Comprehensive documentation

### 5. Updated `package.json`

- Added `axios` dependency
- Added new script: `"pelco:ptz-api": "ts-node src/examples/pelco-ptz-api-example.ts"`

## How It Works

```
PELCO-D Client (UDP) 
    ↓
PelcoDServer (Port 5000)
    ↓ [Decode & Parse]
PELCO-D Action + Speed
    ↓ [Map & Convert]
API Direction + Speed
    ↓ [HTTP POST]
PTZ API Server (Port 3000)
    ↓
Camera Control
```

## Usage

### Start the server:
```bash
npm run pelco:ptz-api
```

### Send PELCO-D commands:
```bash
npm run pelco:client
```

### Example Flow:

1. Client sends PELCO-D packet: `FF 01 00 04 20 00 25` (Pan Left, Speed 32)
2. Server decodes: `PAN_LEFT` action with speed 32
3. Server maps: `left` direction with speed 5 (mapped from 32)
4. Server sends: `POST http://localhost:3000/camera/cam2/ptz/move/left` with `{"speed": 5}`
5. API responds with status 200
6. Server logs: `[PTZ] cam2 moved left successfully`

## API Endpoint Format

```
POST {focusServerUrl}/camera/{cameraName}/ptz/move/{direction}
Content-Type: application/json

{
  "speed": 1-10
}
```

## Supported Directions

- `left`, `right`, `up`, `down`
- `left-up`, `left-down`, `right-up`, `right-down`
- `zoom-in`, `zoom-out`
- `focus-near`, `focus-far`
- `stop`

## Configuration Example

```typescript
const server = new PelcoDServer({
    port: 5000,
    host: '0.0.0.0',
    focusServerUrl: 'http://localhost:3000',  // Your API server
    cameraName: 'cam2',                        // Your camera name
    defaultCameraId: 1
});
```

## Testing

1. Ensure your HTTP API server is running on `http://localhost:3000`
2. Run the PELCO-D server: `npm run pelco:ptz-api`
3. Send test commands using the PELCO-D client or terminal tools
4. Monitor the logs to see command decoding and API requests

## Notes

- API requests timeout after 500ms to prevent blocking
- Errors are logged but don't crash the server
- The server continues to work even if the API is unavailable
- Speed mapping ensures compatibility between PELCO-D (0-63) and API (1-10) ranges
