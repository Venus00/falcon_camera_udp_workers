/**
 * Express API Server
 * Serves files from FTP storage via HTTP REST API
 * Multi-camera support
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import multer from 'multer';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const API_CONFIG = {
    port: 3001,
    host: '0.0.0.0',
    storage_path: path.join(__dirname, '../ftp_storage'),
    cameras: {
        cam1: process.env.CAM1 || 'HG0438PAZ00052',
        cam2: process.env.CAM2 || 'HG0438PAZ00098'
    }
};

// Helper function to get camera path
function getCameraPath(camera?: string): { success: boolean; cameraId: string; error?: string } {
    const cam = camera?.toLowerCase();
    
    if (!cam) {
        return { success: false, cameraId: '', error: 'Camera parameter is required (cam1 or cam2)' };
    }
    
    if (cam === 'cam1') {
        return { success: true, cameraId: API_CONFIG.cameras.cam1 };
    } else if (cam === 'cam2') {
        return { success: true, cameraId: API_CONFIG.cameras.cam2 };
    } else {
        return { success: false, cameraId: '', error: 'Invalid camera. Use cam1 or cam2' };
    }
}

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
        timestamp: new Date().toISOString(),
        cameras: API_CONFIG.cameras
    });
});

// Get all videos from dynamic date/hour structure
app.get('/files', (req: Request, res: Response) => {
    try {
        const { camera } = req.query;
        
        // Validate camera parameter
        const cameraResult = getCameraPath(camera as string);
        if (!cameraResult.success) {
            return res.status(400).json({
                error: 'Invalid camera parameter',
                message: cameraResult.error,
                example: '/files?camera=cam1'
            });
        }

        const basePath = path.join(API_CONFIG.storage_path, 'share', cameraResult.cameraId);
        const videoList: any[] = [];

        if (!fs.existsSync(basePath)) {
            return res.json({
                camera: camera,
                cameraId: cameraResult.cameraId,
                count: 0,
                videos: [],
                message: 'Base path not found'
            });
        }

        const dateFolders = fs.readdirSync(basePath).filter(item => {
            const itemPath = path.join(basePath, item);
            return fs.statSync(itemPath).isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(item);
        });

        for (const dateFolder of dateFolders) {
            const datePath = path.join(basePath, dateFolder, '001/dav');
            if (!fs.existsSync(datePath)) continue;

            const hourFolders = fs.readdirSync(datePath).filter(item => {
                const itemPath = path.join(datePath, item);
                return fs.statSync(itemPath).isDirectory() && /^\d{2}$/.test(item);
            });

            for (const hourFolder of hourFolders) {
                const hourPath = path.join(datePath, hourFolder);
                if (!fs.existsSync(hourPath)) continue;

                const files = fs.readdirSync(hourPath);
                const mp4Files = files.filter(file => file.toLowerCase().endsWith('.mp4'));

                for (const videoFile of mp4Files) {
                    const videoPath = path.join(hourPath, videoFile);
                    const stats = fs.statSync(videoPath);

                    videoList.push({
                        name: videoFile,
                        size: stats.size,
                        sizeInMB: (stats.size / (1024 * 1024)).toFixed(2),
                        created: stats.birthtime,
                        modified: stats.mtime,
                        date: dateFolder,
                        hour: hourFolder,
                        camera: camera,
                        relativePath: `share/${cameraResult.cameraId}/${dateFolder}/001/dav/${hourFolder}/${videoFile}`,
                        downloadUrl: `/files/search-video?name=${encodeURIComponent(videoFile)}&date=${dateFolder}&camera=${camera}`
                    });
                }
            }
        }

        videoList.sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;
            return parseInt(b.hour) - parseInt(a.hour);
        });

        res.json({
            camera: camera,
            cameraId: cameraResult.cameraId,
            count: videoList.length,
            videos: videoList,
            message: `Found ${videoList.length} videos with .mp4 extension`
        });

    } catch (error) {
        console.error('[API Error] Failed to list videos:', error);
        res.status(500).json({
            error: 'Failed to list videos',
            message: (error as Error).message
        });
    }
});

// Search and download video
app.get('/files/search-video', (req: Request, res: Response) => {
    try {
        const { name, date, camera } = req.query;

        if (!name || !date || !camera) {
            return res.status(400).json({
                error: 'Missing parameters',
                message: 'Parameters "name", "date", and "camera" are required',
                example: '/files/search-video?name=13.00.00&date=2025-12-07&camera=cam1'
            });
        }

        const cameraResult = getCameraPath(camera as string);
        if (!cameraResult.success) {
            return res.status(400).json({
                error: 'Invalid camera parameter',
                message: cameraResult.error
            });
        }

        const fileName = name as string;
        const fileDate = date as string;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(fileDate)) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Date must be in format YYYY-MM-DD'
            });
        }

        const hourMatch = fileName.match(/^(\d{2})\./);
        if (!hourMatch) {
            return res.status(400).json({
                error: 'Invalid filename format',
                message: 'Filename must start with hour format'
            });
        }

        const hour = hourMatch[1];
        const targetPath = path.join(
            API_CONFIG.storage_path,
            'share',
            cameraResult.cameraId,
            fileDate,
            '001/dav',
            hour
        );

        console.log(`[API] Searching for: ${fileName} in ${camera}`);
        console.log(`[API] Directory: ${targetPath}`);

        if (!fs.existsSync(targetPath)) {
            return res.status(404).json({
                error: 'Directory not found',
                message: `No directory found for ${camera} on ${fileDate} at hour ${hour}`
            });
        }

        const files = fs.readdirSync(targetPath);
        const matchedFiles = files.filter(file => {
            const lowerFile = file.toLowerCase();
            const lowerSearch = fileName.toLowerCase();
            return lowerFile.startsWith(lowerSearch) && lowerFile.endsWith('.mp4');
        });

        if (matchedFiles.length === 0) {
            return res.status(404).json({
                error: 'File not found',
                message: `No file matching "${fileName}" found`,
                camera: camera,
                availableFiles: files.filter(f => f.toLowerCase().endsWith('.mp4'))
            });
        }

        const matchedFile = matchedFiles[0];
        const filePath = path.join(targetPath, matchedFile);

        console.log(`[API] Downloading: ${matchedFile}`);

        res.download(filePath, matchedFile, (err) => {
            if (err) {
                console.error(`[API] Download error:`, err);
                if (!res.headersSent) {
                    res.status(500).json({
                        error: 'Download failed',
                        message: err.message
                    });
                }
            } else {
                console.log(`[API] Download completed: ${matchedFile}`);
            }
        });

    } catch (error) {
        console.error('[API Error] Search/Download failed:', error);
        res.status(500).json({
            error: 'Search/Download failed',
            message: (error as Error).message
        });
    }
});

// Get videos by date
app.get('/files/videos-by-date', (req: Request, res: Response) => {
    try {
        const { date, camera } = req.query;

        if (!date || !camera) {
            return res.status(400).json({
                error: 'Missing parameters',
                message: 'Both "date" and "camera" parameters are required',
                example: '/files/videos-by-date?date=2025-12-07&camera=cam1'
            });
        }

        const cameraResult = getCameraPath(camera as string);
        if (!cameraResult.success) {
            return res.status(400).json({
                error: 'Invalid camera parameter',
                message: cameraResult.error
            });
        }

        const fileDate = date as string;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(fileDate)) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Date must be in format YYYY-MM-DD'
            });
        }

        const datePath = path.join(
            API_CONFIG.storage_path,
            'share',
            cameraResult.cameraId,
            fileDate,
            '001/dav'
        );

        console.log(`[API] Searching videos for ${camera} on ${fileDate}`);

        if (!fs.existsSync(datePath)) {
            return res.status(404).json({
                error: 'Date directory not found',
                message: `No videos found for ${camera} on ${fileDate}`,
                camera: camera
            });
        }

        const videoList: any[] = [];
        const hourFolders = fs.readdirSync(datePath).filter(item => {
            const itemPath = path.join(datePath, item);
            return fs.statSync(itemPath).isDirectory() && /^\d{2}$/.test(item);
        });

        hourFolders.sort();

        for (const hourFolder of hourFolders) {
            const hourPath = path.join(datePath, hourFolder);
            const files = fs.readdirSync(hourPath);
            const mp4Files = files.filter(file => file.toLowerCase().endsWith('.mp4'));

            for (const videoFile of mp4Files) {
                const videoPath = path.join(hourPath, videoFile);
                const stats = fs.statSync(videoPath);

                videoList.push({
                    name: videoFile,
                    size: stats.size,
                    sizeInMB: (stats.size / (1024 * 1024)).toFixed(2),
                    created: stats.birthtime,
                    modified: stats.mtime,
                    date: fileDate,
                    hour: hourFolder,
                    camera: camera,
                    relativePath: `share/${cameraResult.cameraId}/${fileDate}/001/dav/${hourFolder}/${videoFile}`,
                    downloadUrl: `/files/search-video?name=${encodeURIComponent(videoFile)}&date=${fileDate}&camera=${camera}`
                });
            }
        }

        videoList.sort((a, b) => {
            const hourCompare = parseInt(a.hour) - parseInt(b.hour);
            if (hourCompare !== 0) return hourCompare;
            return a.name.localeCompare(b.name);
        });

        const totalSize = videoList.reduce((sum, video) => sum + video.size, 0);

        res.json({
            success: true,
            camera: camera,
            cameraId: cameraResult.cameraId,
            date: fileDate,
            count: videoList.length,
            hours: hourFolders.length,
            totalSize: {
                bytes: totalSize,
                mb: (totalSize / (1024 * 1024)).toFixed(2),
                gb: (totalSize / (1024 * 1024 * 1024)).toFixed(2)
            },
            videos: videoList
        });

    } catch (error) {
        console.error('[API Error] Failed to get videos by date:', error);
        res.status(500).json({
            error: 'Failed to get videos',
            message: (error as Error).message
        });
    }
});

// Delete a specific video file
app.delete('/files/delete-video', (req: Request, res: Response) => {
    try {
        const { name, date, camera } = req.query;

        if (!name || !date || !camera) {
            return res.status(400).json({
                error: 'Missing parameters',
                message: 'Parameters "name", "date", and "camera" are required',
                example: '/files/delete-video?name=13.00.00-1234.mp4&date=2025-12-07&camera=cam1'
            });
        }

        const cameraResult = getCameraPath(camera as string);
        if (!cameraResult.success) {
            return res.status(400).json({
                error: 'Invalid camera parameter',
                message: cameraResult.error
            });
        }

        const fileName = name as string;
        const fileDate = date as string;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(fileDate)) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Date must be in format YYYY-MM-DD'
            });
        }

        const hourMatch = fileName.match(/^(\d{2})\./);
        if (!hourMatch) {
            return res.status(400).json({
                error: 'Invalid filename format',
                message: 'Filename must start with hour format'
            });
        }

        const hour = hourMatch[1];
        const filePath = path.join(
            API_CONFIG.storage_path,
            'share',
            cameraResult.cameraId,
            fileDate,
            '001/dav',
            hour,
            fileName
        );

        console.log(`[API]  Deleting video: ${fileName} from ${camera}`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: 'File not found',
                message: `File "${fileName}" not found for ${camera}`
            });
        }

        fs.unlinkSync(filePath);
        console.log(`[API]  Video deleted: ${fileName}`);

        res.json({
            success: true,
            message: 'Video file deleted successfully',
            deleted: {
                name: fileName,
                date: fileDate,
                hour: hour,
                camera: camera
            }
        });

    } catch (error) {
        console.error('[API Error] Failed to delete video:', error);
        res.status(500).json({
            error: 'Failed to delete video',
            message: (error as Error).message
        });
    }
});

// Delete hour directory
app.delete('/files/delete-by-hour', (req: Request, res: Response) => {
    try {
        const { date, hour, camera } = req.query;

        if (!date || !hour || !camera) {
            return res.status(400).json({
                error: 'Missing parameters',
                message: 'Parameters "date", "hour", and "camera" are required',
                example: '/files/delete-by-hour?date=2025-12-07&hour=13&camera=cam1'
            });
        }

        const cameraResult = getCameraPath(camera as string);
        if (!cameraResult.success) {
            return res.status(400).json({
                error: 'Invalid camera parameter',
                message: cameraResult.error
            });
        }

        const fileDate = date as string;
        const fileHour = hour as string;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(fileDate)) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Date must be in format YYYY-MM-DD'
            });
        }

        if (!/^\d{2}$/.test(fileHour) || parseInt(fileHour) > 23) {
            return res.status(400).json({
                error: 'Invalid hour format',
                message: 'Hour must be in format 00-23'
            });
        }

        const hourPath = path.join(
            API_CONFIG.storage_path,
            'share',
            cameraResult.cameraId,
            fileDate,
            '001/dav',
            fileHour
        );

        console.log(`[API]  Deleting hour directory: ${fileHour} for ${camera}`);

        if (!fs.existsSync(hourPath)) {
            return res.status(404).json({
                error: 'Hour directory not found',
                message: `No directory found for ${camera} on ${fileDate} at hour ${fileHour}`
            });
        }

        function deleteFolderRecursive(dirPath: string): void {
            if (fs.existsSync(dirPath)) {
                fs.readdirSync(dirPath).forEach((file) => {
                    const curPath = path.join(dirPath, file);
                    if (fs.lstatSync(curPath).isDirectory()) {
                        deleteFolderRecursive(curPath);
                    } else {
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(dirPath);
            }
        }

        deleteFolderRecursive(hourPath);
        console.log(`[API]  Hour directory deleted: ${fileHour}`);

        res.json({
            success: true,
            message: `Hour directory ${fileHour} deleted completely`,
            deleted: {
                date: fileDate,
                hour: fileHour,
                camera: camera
            }
        });

    } catch (error) {
        console.error('[API Error] Failed to delete hour directory:', error);
        res.status(500).json({
            error: 'Failed to delete hour directory',
            message: (error as Error).message
        });
    }
});

// Delete date directory
app.delete('/files/delete-by-date', (req: Request, res: Response) => {
    try {
        const { date, camera } = req.query;

        if (!date || !camera) {
            return res.status(400).json({
                error: 'Missing parameters',
                message: 'Parameters "date" and "camera" are required',
                example: '/files/delete-by-date?date=2025-12-07&camera=cam1'
            });
        }

        const cameraResult = getCameraPath(camera as string);
        if (!cameraResult.success) {
            return res.status(400).json({
                error: 'Invalid camera parameter',
                message: cameraResult.error
            });
        }

        const fileDate = date as string;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(fileDate)) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Date must be in format YYYY-MM-DD'
            });
        }

        const dateRootPath = path.join(
            API_CONFIG.storage_path,
            'share',
            cameraResult.cameraId,
            fileDate
        );

        console.log(`[API]  Deleting date directory: ${fileDate} for ${camera}`);

        if (!fs.existsSync(dateRootPath)) {
            return res.status(404).json({
                error: 'Date directory not found',
                message: `No directory found for ${camera} on ${fileDate}`
            });
        }

        function deleteFolderRecursive(dirPath: string): void {
            if (fs.existsSync(dirPath)) {
                fs.readdirSync(dirPath).forEach((file) => {
                    const curPath = path.join(dirPath, file);
                    if (fs.lstatSync(curPath).isDirectory()) {
                        deleteFolderRecursive(curPath);
                    } else {
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(dirPath);
            }
        }

        deleteFolderRecursive(dateRootPath);
        console.log(`[API]  Date directory deleted: ${fileDate}`);

        res.json({
            success: true,
            message: `Complete directory for ${fileDate} deleted successfully`,
            deleted: {
                date: fileDate,
                camera: camera
            }
        });

    } catch (error) {
        console.error('[API Error] Failed to delete date directory:', error);
        res.status(500).json({
            error: 'Failed to delete directory',
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
        console.log('  EXPRESS API SERVER STARTED - MULTI-CAMERA');
        console.log('='.repeat(60));
        console.log(`URL: http://${API_CONFIG.host}:${API_CONFIG.port}`);
        console.log(`Storage: ${API_CONFIG.storage_path}`);
        console.log('\nConfigured Cameras:');
        console.log(`  cam1: ${API_CONFIG.cameras.cam1}`);
        console.log(`  cam2: ${API_CONFIG.cameras.cam2}`);
        console.log('\nAvailable Endpoints (add ?camera=cam1 or ?camera=cam2):');
        console.log('  GET    /health');
        console.log('  GET    /files?camera=cam1');
        console.log('  GET    /files/search-video?name=X&date=Y&camera=cam1');
        console.log('  GET    /files/videos-by-date?date=Y&camera=cam1');
        console.log('  DELETE /files/delete-video?name=X&date=Y&camera=cam1');
        console.log('  DELETE /files/delete-by-hour?date=Y&hour=H&camera=cam1');
        console.log('  DELETE /files/delete-by-date?date=Y&camera=cam1');
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