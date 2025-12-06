# Stockage - File Storage System

FTP Server + Express REST API for file storage and management.

## Features

### 🗂️ FTP Server
- Anonymous FTP access
- File upload/download
- Directory operations
- Passive mode support
- Port: **21**

### 🌐 Express API
- RESTful file operations
- File upload via HTTP
- File download
- File listing and search
- CORS enabled
- Port: **3000**

## Installation

```bash
cd stockage
npm install
```

## Running the Services

### Run Both (FTP + API)
```bash
npm run dev
```

### Run FTP Server Only
```bash
npm run ftp
```

### Run Express API Only
```bash
npm run api
```

### Build Project
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```http
GET http://localhost:3000/health
```

### List All Files
```http
GET http://localhost:3000/files
```

Response:
```json
{
  "count": 2,
  "files": [
    {
      "name": "document.pdf",
      "size": 1024,
      "created": "2025-12-06T10:00:00.000Z",
      "modified": "2025-12-06T10:00:00.000Z",
      "isDirectory": false
    }
  ]
}
```

### Get File Info
```http
GET http://localhost:3000/files/document.pdf/info
```

### Download File
```http
GET http://localhost:3000/files/document.pdf
```

### Upload File
```http
POST http://localhost:3000/files
Content-Type: multipart/form-data

file: <binary data>
```

Response:
```json
{
  "message": "File uploaded successfully",
  "file": {
    "name": "document.pdf",
    "size": 1024,
    "path": "/files/document.pdf"
  }
}
```

### Delete File
```http
DELETE http://localhost:3000/files/document.pdf
```

### Search Files
```http
GET http://localhost:3000/search?q=document
```

## FTP Usage

### Connect via FTP Client

**Command Line (Windows):**
```cmd
ftp localhost
> anonymous
> (press Enter for password)
> ls
> get filename.txt
> put newfile.txt
> bye
```

**FileZilla:**
```
Host: localhost
Port: 21
Username: anonymous
Password: (leave empty)
```

### FTP Commands
- `ls` - List files
- `get <filename>` - Download file
- `put <filename>` - Upload file
- `delete <filename>` - Delete file
- `mkdir <dirname>` - Create directory
- `rmdir <dirname>` - Remove directory

## File Storage

All files are stored in: `./ftp_storage/`

This directory is shared between:
- FTP Server (port 21)
- Express API (port 3000)

## Example: Upload via cURL

```bash
# Upload file
curl -F "file=@document.pdf" http://localhost:3000/files

# List files
curl http://localhost:3000/files

# Download file
curl -O http://localhost:3000/files/document.pdf

# Delete file
curl -X DELETE http://localhost:3000/files/document.pdf
```

## Example: Upload via PowerShell

```powershell
# Upload file
$filePath = "C:\path\to\file.txt"
$uri = "http://localhost:3000/files"

$formData = @{
    file = Get-Item -Path $filePath
}

Invoke-RestMethod -Uri $uri -Method Post -Form $formData

# List files
Invoke-RestMethod -Uri "http://localhost:3000/files"

# Download file
Invoke-WebRequest -Uri "http://localhost:3000/files/file.txt" -OutFile "downloaded.txt"
```

## Architecture

```
stockage/
├── src/
│   ├── index.ts         # Main entry (runs both services)
│   ├── ftp-server.ts    # FTP server
│   └── express-api.ts   # Express API
├── ftp_storage/         # File storage directory
├── dist/                # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Security Notes

⚠️ **For development only!**

This implementation uses:
- Anonymous FTP login (no authentication)
- No encryption (plain FTP, not FTPS)
- No rate limiting
- No file size limits

For production, consider:
- Adding authentication
- Using FTPS/SFTP
- Implementing rate limiting
- Adding file validation
- Setting upload size limits
- Using environment variables for configuration

## Integration with UDP Workers

The `stockage` project can work alongside the `udp_workers` project to:
1. Store camera snapshots received via UDP
2. Store PELCO-D/SMART command logs
3. Serve recorded video files
4. Provide file management for camera system

## Troubleshooting

### Port Already in Use

**FTP (Port 21):**
```bash
# Windows: Find process using port 21
netstat -ano | findstr :21
taskkill /PID <process_id> /F
```

**API (Port 3000):**
```bash
# Windows: Find process using port 3000
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### Permission Denied (Port 21)

On some systems, port 21 requires administrator privileges:
- Run as administrator, OR
- Change FTP port to 2121 in `src/ftp-server.ts`

## License

ISC
