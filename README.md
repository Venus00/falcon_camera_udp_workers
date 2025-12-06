# Military Workers - Multi-Service Project

This project contains two TypeScript services:

## 📡 UDP Workers
**Location:** `./udp_workers/`

Camera control system with UDP communication:
- **Server 1:** PELCO-D Protocol (PTZ camera control)
- **Server 2:** SMART Protocol (AI-powered camera features)
- UDP communication modules
- Interactive terminal clients

**Port:** 5000 (PELCO-D), 5001 (SMART)

[→ See UDP Workers README](./udp_workers/README.md)

## 🗂️ Stockage
**Location:** `./stockage/`

File storage system:
- **FTP Server** (port 21) - File upload/download via FTP
- **Express API** (port 3000) - RESTful file operations
- Shared storage directory

[→ See Stockage README](./stockage/README.md)

---

## Project Structure

```
miltitary workers/
├── udp_workers/          # UDP camera control system
│   ├── src/
│   │   ├── types/        # TypeScript interfaces
│   │   ├── modules/      # UDP modules
│   │   ├── protocols/    # PELCO-D & SMART protocols
│   │   ├── servers/      # Server implementations
│   │   └── examples/     # Example scripts
│   ├── package.json
│   └── README.md
│
├── stockage/             # File storage system
│   ├── src/
│   │   ├── index.ts      # Main entry (both services)
│   │   ├── ftp-server.ts # FTP server
│   │   └── express-api.ts # Express API
│   ├── ftp_storage/      # File storage directory
│   ├── package.json
│   └── README.md
│
└── package.json.root     # Root package manager
```

---

## Quick Start

### 1. Install All Dependencies

**Option A - Install both projects:**
```bash
# From root directory
cd udp_workers
npm install
cd ../stockage
npm install
cd ..
```

**Option B - If you rename package.json.root to package.json:**
```bash
npm run install:all
```

### 2. Run Services

#### Run UDP Workers (Both Camera Servers)
```bash
cd udp_workers
npm run dev
```
Starts:
- PELCO-D Server (port 5000)
- SMART Server (port 5001)

#### Run Stockage (FTP + API)
```bash
cd stockage
npm run dev
```
Starts:
- FTP Server (port 21)
- Express API (port 3000)

#### Run Everything (All 4 Services)
If you have `concurrently` installed:
```bash
# Requires: npm install -g concurrently
concurrently "cd udp_workers && npm run dev" "cd stockage && npm run dev"
```

---

## Service Overview

### 🎥 UDP Workers Services

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| Server 1 | 5000 | PELCO-D | PTZ camera control |
| Server 2 | 5001 | SMART | AI camera features |

**Commands:**
```bash
cd udp_workers

# Run both servers
npm run dev

# Run Server 1 only
npm run pelco:server

# Run Server 2 only
npm run smart:server

# Interactive testing
npm run pelco:terminal
npm run smart:terminal
```

### 📁 Stockage Services

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| FTP Server | 21 | FTP | File upload/download |
| Express API | 3000 | HTTP | REST API for files |

**Commands:**
```bash
cd stockage

# Run both FTP + API
npm run dev

# Run FTP only
npm run ftp

# Run API only
npm run api
```

---

## Example Use Cases

### 1. Camera Control via UDP
```bash
# Terminal 1: Start camera servers
cd udp_workers
npm run dev

# Terminal 2: Control PELCO-D camera
cd udp_workers
npm run pelco:terminal
> left 30
> up 25
> zoomin 40

# Terminal 3: Control SMART camera
cd udp_workers
npm run smart:terminal
> focus auto
> scan
> track 5 normal
```

### 2. File Storage
```bash
# Terminal 1: Start storage services
cd stockage
npm run dev

# Terminal 2: Upload via API
curl -F "file=@camera_snapshot.jpg" http://localhost:3000/files

# Or use FTP
ftp localhost
> put video_recording.mp4

# List files via API
curl http://localhost:3000/files
```

### 3. Integrated System
```bash
# Run all services together
# Terminal 1
cd udp_workers && npm run dev

# Terminal 2
cd stockage && npm run dev

# Now you have:
# - Camera control (UDP ports 5000, 5001)
# - File storage (FTP port 21, HTTP port 3000)
```

---

## Architecture

### Communication Flow

```
Camera Devices
     ↓ (UDP)
UDP Workers (ports 5000, 5001)
     ↓
[Process camera commands]
     ↓
Store snapshots/recordings
     ↓
Stockage (ports 21, 3000)
     ↓
Client Access (FTP/HTTP)
```

### Integration Points

1. **UDP Workers** can save camera data to `../stockage/ftp_storage/`
2. **Stockage API** can serve files recorded by cameras
3. Both systems share file system access
4. Independent operation or combined deployment

---

## Port Reference

| Port | Service | Protocol |
|------|---------|----------|
| 21 | FTP Server | FTP |
| 3000 | Express API | HTTP |
| 5000 | PELCO-D Server | UDP |
| 5001 | SMART Server | UDP |
| 52383 | SMART Responses | UDP |

---

## Development

### UDP Workers
```bash
cd udp_workers
npm run watch        # Auto-compile TypeScript
npm run build        # Build for production
```

### Stockage
```bash
cd stockage
npm run watch        # Auto-compile TypeScript
npm run build        # Build for production
```

---

## Documentation

- **[UDP Workers README](./udp_workers/README.md)** - Full UDP/Camera documentation
- **[Stockage README](./stockage/README.md)** - Full FTP/API documentation
- **[PELCO-D Reference](./udp_workers/PELCO-D-REFERENCE.md)** - PELCO-D protocol
- **[SMART Reference](./udp_workers/SMART-REFERENCE.md)** - SMART protocol

---

## Next Steps

### To Move Existing Files:

**Manual approach (recommended):**
1. Create `udp_workers` folder
2. Move these files/folders into `udp_workers/`:
   - `src/`
   - `package.json`
   - `package-lock.json`
   - `tsconfig.json`
   - `node_modules/`
   - `README.md`
   - `PELCO-D-REFERENCE.md`
   - `SMART-REFERENCE.md`
   - All other `.md` files

3. Rename `package.json.root` to `package.json` in the root directory

**PowerShell approach:**
```powershell
# Create udp_workers directory if not exists
New-Item -ItemType Directory -Path "udp_workers" -Force

# Move files
Move-Item -Path "src" -Destination "udp_workers/"
Move-Item -Path "package.json" -Destination "udp_workers/"
Move-Item -Path "package-lock.json" -Destination "udp_workers/"
Move-Item -Path "tsconfig.json" -Destination "udp_workers/"
Move-Item -Path "node_modules" -Destination "udp_workers/"
Move-Item -Path "*.md" -Destination "udp_workers/"

# Rename root package.json
Rename-Item -Path "package.json.root" -NewName "package.json"

# Install stockage dependencies
cd stockage
npm install
```

---

## License

ISC
