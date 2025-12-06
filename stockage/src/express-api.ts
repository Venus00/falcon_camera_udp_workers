/**
 * Express API Server
 * Serves files from FTP storage via HTTP REST API
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import multer from 'multer';

// Configuration
const API_CONFIG = {
    port: 3000,
    host: '0.0.0.0',
    storage_path: path.join(__dirname, '../ftp_storage')
};

// Ensure storage directory exists
if (!fs.existsSync(API_CONFIG.storage_path)) {
    fs.mkdirSync(API_CONFIG.storage_path, { recursive: true });
    console.log(`Created storage directory: ${API_CONFIG.storage_path}`);
}

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
        cb(null, API_CONFIG.storage_path);
    },
    filename: (req: any, file: any, cb: any) => {
        // Keep original filename
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// ==================== ROUTES ====================

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'Stockage API',
        timestamp: new Date().toISOString()
    });
});

// List all files
app.get('/files', (req: Request, res: Response) => {
    try {
        const files = fs.readdirSync(API_CONFIG.storage_path);
        
        const fileList = files.map(filename => {
            const filePath = path.join(API_CONFIG.storage_path, filename);
            const stats = fs.statSync(filePath);
            
            return {
                name: filename,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                isDirectory: stats.isDirectory()
            };
        });
        
        res.json({
            count: fileList.length,
            files: fileList
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to list files',
            message: (error as Error).message
        });
    }
});

// Get file info
app.get('/files/:filename/info', (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(API_CONFIG.storage_path, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        const stats = fs.statSync(filePath);
        
        res.json({
            name: filename,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            isDirectory: stats.isDirectory(),
            path: `/files/${filename}`
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get file info',
            message: (error as Error).message
        });
    }
});

// Download file
app.get('/files/:filename', (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(API_CONFIG.storage_path, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        console.log(`[API] 📥 Serving file: ${filename}`);
        res.download(filePath, filename);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to download file',
            message: (error as Error).message
        });
    }
});

// Upload file
app.post('/files', upload.single('file'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        console.log(`[API] ✅ File uploaded: ${req.file.filename}`);
        
        res.status(201).json({
            message: 'File uploaded successfully',
            file: {
                name: req.file.filename,
                size: req.file.size,
                path: `/files/${req.file.filename}`
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to upload file',
            message: (error as Error).message
        });
    }
});

// Delete file
app.delete('/files/:filename', (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(API_CONFIG.storage_path, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        fs.unlinkSync(filePath);
        console.log(`[API] 🗑️  File deleted: ${filename}`);
        
        res.json({
            message: 'File deleted successfully',
            filename
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to delete file',
            message: (error as Error).message
        });
    }
});

// Search files
app.get('/search', (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query required' });
        }
        
        const files = fs.readdirSync(API_CONFIG.storage_path);
        const matches = files.filter(file => 
            file.toLowerCase().includes(query.toLowerCase())
        );
        
        const results = matches.map(filename => {
            const filePath = path.join(API_CONFIG.storage_path, filename);
            const stats = fs.statSync(filePath);
            
            return {
                name: filename,
                size: stats.size,
                modified: stats.mtime,
                path: `/files/${filename}`
            };
        });
        
        res.json({
            query,
            count: results.length,
            results
        });
    } catch (error) {
        res.status(500).json({
            error: 'Search failed',
            message: (error as Error).message
        });
    }
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path
    });
});

// Start server
async function startApiServer() {
    app.listen(API_CONFIG.port, API_CONFIG.host, () => {
        console.log('='.repeat(60));
        console.log('  EXPRESS API SERVER STARTED');
        console.log('='.repeat(60));
        console.log(`URL: http://${API_CONFIG.host}:${API_CONFIG.port}`);
        console.log(`Storage: ${API_CONFIG.storage_path}`);
        console.log('\nAvailable Endpoints:');
        console.log('  GET    /health              - Health check');
        console.log('  GET    /files               - List all files');
        console.log('  GET    /files/:filename     - Download file');
        console.log('  GET    /files/:filename/info - Get file info');
        console.log('  POST   /files               - Upload file');
        console.log('  DELETE /files/:filename     - Delete file');
        console.log('  GET    /search?q=<query>    - Search files');
        console.log('='.repeat(60));
        console.log('\nAPI Server is ready!\n');
    });
}

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down API server...');
    process.exit(0);
});

// Start the server
if (require.main === module) {
    startApiServer();
}

export { app, API_CONFIG };
