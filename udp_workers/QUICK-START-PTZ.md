# Quick Start - PELCO-D to PTZ API

## Installation

```bash
cd udp_workers
npm install
npm run build
```

## Start the Server

```bash
npm run pelco:ptz-api
```

## Configuration

Edit `src/examples/pelco-ptz-api-example.ts`:

```typescript
const pelcoServer = new PelcoDServer({
    port: 5000,                               // PELCO-D UDP port
    focusServerUrl: 'http://localhost:3000',  // Change to your API URL
    cameraName: 'cam2',                       // Change to your camera name
});
```

## Test

In another terminal:

```bash
npm run pelco:client
```

## API Endpoints Called

When you move the camera, the server calls:

```
POST http://localhost:3000/camera/cam2/ptz/move/left       {"speed": 1-10}
POST http://localhost:3000/camera/cam2/ptz/move/right      {"speed": 1-10}
POST http://localhost:3000/camera/cam2/ptz/move/up         {"speed": 1-10}
POST http://localhost:3000/camera/cam2/ptz/move/down       {"speed": 1-10}
POST http://localhost:3000/camera/cam2/ptz/move/zoom-in    {"speed": 1-10}
POST http://localhost:3000/camera/cam2/ptz/move/zoom-out   {"speed": 1-10}
POST http://localhost:3000/camera/cam2/ptz/move/stop       {"speed": 1-10}
```

## Expected Python API Server

```python
from flask import Flask, request

app = Flask(__name__)

@app.route('/camera/<camera_name>/ptz/move/<direction>', methods=['POST'])
def ptz_move(camera_name, direction):
    data = request.get_json()
    speed = data.get('speed', 4)
    
    # Control your camera here
    print(f"Moving {camera_name} {direction} at speed {speed}")
    
    return {"status": "success"}, 200

if __name__ == '__main__':
    app.run(port=3000)
```

## Troubleshooting

**"Connection refused"**: Make sure your API server is running on port 3000

**"No response"**: Check the `focusServerUrl` in your configuration

**"Invalid packet"**: Verify PELCO-D client is sending correct 7-byte packets

## Documentation

- Full documentation: `PTZ-API-INTEGRATION.md`
- Implementation details: `IMPLEMENTATION-SUMMARY.md`
- PELCO-D protocol: `PELCO-D-REFERENCE.md`
