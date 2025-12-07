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
    port: 3001,
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

// Get all videos from dynamic date/hour structure
app.get('/files', (req: Request, res: Response) => {
    try {
        const basePath = path.join(API_CONFIG.storage_path, 'share/HG0438PAZ00098');
        const videoList: any[] = [];

        // Check if base path exists
        if (!fs.existsSync(basePath)) {
            return res.json({
                count: 0,
                videos: [],
                message: 'Base path not found'
            });
        }

        // Read all date folders (2025-12-07, 2025-12-08, etc.)
        // Ces dossiers sont créés chaque jour automatiquement
        const dateFolders = fs.readdirSync(basePath).filter(item => {
            const itemPath = path.join(basePath, item);
            return fs.statSync(itemPath).isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(item);
        });

        // Loop through each date folder
        for (const dateFolder of dateFolders) {
            const datePath = path.join(basePath, dateFolder, '001/dav');

            if (!fs.existsSync(datePath)) continue;

            // Read all hour folders (00, 01, 02, ..., 23)
            // Ces dossiers sont créés chaque heure automatiquement
            const hourFolders = fs.readdirSync(datePath).filter(item => {
                const itemPath = path.join(datePath, item);
                return fs.statSync(itemPath).isDirectory() && /^\d{2}$/.test(item);
            });

            // Loop through each hour folder
            for (const hourFolder of hourFolders) {
                const hourPath = path.join(datePath, hourFolder);

                // Read files in hour folder
                if (!fs.existsSync(hourPath)) continue;

                const files = fs.readdirSync(hourPath);

                // Filter only .mp4_ files (not .mp4)
                const mp4Files = files.filter(file =>
                    file.toLowerCase().endsWith('.mp4')
                );

                // Add each video to the list with metadata
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
                        relativePath: `share/HG0438PAZ00098/${dateFolder}/001/dav/${hourFolder}/${videoFile}`,
                        downloadUrl: `/files/${encodeURIComponent(videoFile)}`
                    });
                }
            }
        }

        // Sort by date and hour (most recent first)
        videoList.sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;
            return parseInt(b.hour) - parseInt(a.hour);
        });

        res.json({
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



// Search and download video in one request
app.get('/files/search-video', (req: Request, res: Response) => {
    try {
        const { name, date } = req.query;

        // Validation des paramètres
        if (!name || !date) {
            return res.status(400).json({
                error: 'Missing parameters',
                message: 'Both "name" and "date" parameters are required',
                example: '/files/search-video?name=13.00.00-****.mp4&date=2025-12-07'
            });
        }

        const fileName = name as string;
        const fileDate = date as string;

        // Valider le format de la date (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fileDate)) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Date must be in format YYYY-MM-DD (e.g., 2025-12-07)'
            });
        }

        // Extraire l'heure du nom du fichier (les 2 premiers caractères)
        // Exemple: "13.00.00-****.mp4" -> hour = "13"
        const hourMatch = fileName.match(/^(\d{2})\./);
        if (!hourMatch) {
            return res.status(400).json({
                error: 'Invalid filename format',
                message: 'Filename must start with hour format (e.g., 13.00.00-****.mp4)'
            });
        }

        const hour = hourMatch[1];

        // Construire le chemin du dossier
        const targetPath = path.join(
            API_CONFIG.storage_path,
            'share/HG0438PAZ00098',
            fileDate,
            '001/dav',
            hour
        );

        console.log(`[API]  Searching for: ${fileName}`);
        console.log(`[API]  In directory: ${targetPath}`);

        // Vérifier si le dossier existe
        if (!fs.existsSync(targetPath)) {
            return res.status(404).json({
                error: 'Directory not found',
                message: `No directory found for date ${fileDate} and hour ${hour}`,
                searchPath: targetPath
            });
        }

        // Chercher le fichier dans le dossier
        const files = fs.readdirSync(targetPath);

        // Support pour wildcards: 13.00.00-****.mp4 peut matcher 13.00.00-1234.mp4
        const searchPattern = fileName.replace(/\*/g, '.*');
        const regex = new RegExp(`^${searchPattern}$`, 'i');

        const matchedFiles = files.filter(file =>
            regex.test(file) && file.toLowerCase().endsWith('.mp4')
        );

        if (matchedFiles.length === 0) {
            return res.status(404).json({
                error: 'File not found',
                message: `No file matching "${fileName}" found in ${fileDate}/${hour}`,
                searchPath: targetPath,
                availableFiles: files.filter(f => f.endsWith('.mp4'))
            });
        }

        // Prendre le premier fichier correspondant
        const matchedFile = matchedFiles[0];
        const filePath = path.join(targetPath, matchedFile);

        console.log(`[API]  File found: ${matchedFile}`);
        console.log(`[API]  Downloading video...`);

        // Télécharger directement le fichier
        res.download(filePath, matchedFile, (err) => {
            if (err) {
                console.error(`[API]  Download error:`, err);
                if (!res.headersSent) {
                    res.status(500).json({
                        error: 'Download failed',
                        message: err.message
                    });
                }
            } else {
                console.log(`[API]  Download completed: ${matchedFile}`);
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
app.get('/files/videos-by-date', (req: Request, res: Response) => {
    try {
        const { date } = req.query;

        // Validation du paramètre
        if (!date) {
            return res.status(400).json({
                error: 'Missing parameter',
                message: 'Date parameter is required',
                example: '/files/videos-by-date?date=2025-12-07'
            });
        }

        const fileDate = date as string;

        // Valider le format de la date (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fileDate)) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Date must be in format YYYY-MM-DD (e.g., 2025-12-07)'
            });
        }

        // Construire le chemin du jour
        const datePath = path.join(
            API_CONFIG.storage_path,
            'share/HG0438PAZ00098',
            fileDate,
            '001/dav'
        );

        console.log(`[API]  Searching videos for date: ${fileDate}`);
        console.log(`[API]  In directory: ${datePath}`);

        // Vérifier si le dossier de la date existe
        if (!fs.existsSync(datePath)) {
            return res.status(404).json({
                error: 'Date directory not found',
                message: `No videos found for date ${fileDate}`,
                searchPath: datePath,
                date: fileDate
            });
        }

        const videoList: any[] = [];

        // Lire tous les dossiers d'heures (00, 01, 02, ..., 23)
        const hourFolders = fs.readdirSync(datePath).filter(item => {
            const itemPath = path.join(datePath, item);
            return fs.statSync(itemPath).isDirectory() && /^\d{2}$/.test(item);
        });

        // Trier les dossiers d'heures
        hourFolders.sort();

        console.log(`[API]  Found ${hourFolders.length} hour folders`);

        // Parcourir chaque dossier d'heure
        for (const hourFolder of hourFolders) {
            const hourPath = path.join(datePath, hourFolder);

            // Lire les fichiers dans le dossier
            const files = fs.readdirSync(hourPath);

            // Filtrer uniquement les fichiers .mp4
            const mp4Files = files.filter(file =>
                file.toLowerCase().endsWith('.mp4')
            );

            // Ajouter chaque vidéo à la liste
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
                    relativePath: `share/HG0438PAZ00098/${fileDate}/001/dav/${hourFolder}/${videoFile}`,
                    downloadUrl: `/files/search-video?name=${encodeURIComponent(videoFile)}&date=${fileDate}`
                });
            }
        }

        // Trier par heure (du plus ancien au plus récent)
        videoList.sort((a, b) => {
            const hourCompare = parseInt(a.hour) - parseInt(b.hour);
            if (hourCompare !== 0) return hourCompare;
            return a.name.localeCompare(b.name);
        });

        console.log(`[API]  Found ${videoList.length} videos for ${fileDate}`);

        // Calculer la taille totale
        const totalSize = videoList.reduce((sum, video) => sum + video.size, 0);
        const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        const totalSizeInGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);

        res.json({
            success: true,
            date: fileDate,
            count: videoList.length,
            hours: hourFolders.length,
            totalSize: {
                bytes: totalSize,
                mb: totalSizeInMB,
                gb: totalSizeInGB
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

// app.get('/files/videos-summary-by-date', (req: Request, res: Response) => {
//     try {
//         const { date } = req.query;

//         if (!date) {
//             return res.status(400).json({
//                 error: 'Missing parameter',
//                 message: 'Date parameter is required',
//                 example: '/files/videos-summary-by-date?date=2025-12-07'
//             });
//         }

//         const fileDate = date as string;

//         if (!/^\d{4}-\d{2}-\d{2}$/.test(fileDate)) {
//             return res.status(400).json({
//                 error: 'Invalid date format',
//                 message: 'Date must be in format YYYY-MM-DD'
//             });
//         }

//         const datePath = path.join(
//             API_CONFIG.storage_path,
//             'share/HG0438PAZ00098',
//             fileDate,
//             '001/dav'
//         );

//         if (!fs.existsSync(datePath)) {
//             return res.status(404).json({
//                 error: 'Date directory not found',
//                 message: `No videos found for date ${fileDate}`
//             });
//         }

//         const hourSummary: any[] = [];

//         const hourFolders = fs.readdirSync(datePath).filter(item => {
//             const itemPath = path.join(datePath, item);
//             return fs.statSync(itemPath).isDirectory() && /^\d{2}$/.test(item);
//         });

//         hourFolders.sort();

//         for (const hourFolder of hourFolders) {
//             const hourPath = path.join(datePath, hourFolder);
//             const files = fs.readdirSync(hourPath);
//             const mp4Files = files.filter(file => file.toLowerCase().endsWith('.mp4'));

//             let totalSize = 0;
//             mp4Files.forEach(file => {
//                 const filePath = path.join(hourPath, file);
//                 const stats = fs.statSync(filePath);
//                 totalSize += stats.size;
//             });

//             hourSummary.push({
//                 hour: hourFolder,
//                 videoCount: mp4Files.length,
//                 totalSize: totalSize,
//                 totalSizeInMB: (totalSize / (1024 * 1024)).toFixed(2),
//                 videos: mp4Files
//             });
//         }

//         const totalVideos = hourSummary.reduce((sum, h) => sum + h.videoCount, 0);
//         const totalSize = hourSummary.reduce((sum, h) => sum + h.totalSize, 0);

//         res.json({
//             success: true,
//             date: fileDate,
//             totalVideos: totalVideos,
//             totalHours: hourSummary.length,
//             totalSize: {
//                 bytes: totalSize,
//                 mb: (totalSize / (1024 * 1024)).toFixed(2),
//                 gb: (totalSize / (1024 * 1024 * 1024)).toFixed(2)
//             },
//             hourlyBreakdown: hourSummary
//         });

//     } catch (error) {
//         console.error('[API Error] Failed to get summary:', error);
//         res.status(500).json({
//             error: 'Failed to get summary',
//             message: (error as Error).message
//         });
//     }
// });

// 1. Delete a specific video file ONLY
app.delete('/files/delete-video', (req: Request, res: Response) => {
    try {
        const { name, date } = req.query;

        // Validation des paramètres
        if (!name || !date) {
            return res.status(400).json({
                error: 'Missing parameters',
                message: 'Both "name" and "date" parameters are required',
                example: '/files/delete-video?name=13.00.00-1234.mp4&date=2025-12-07'
            });
        }

        const fileName = name as string;
        const fileDate = date as string;

        // Valider le format de la date
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fileDate)) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Date must be in format YYYY-MM-DD'
            });
        }

        // Extraire l'heure du nom du fichier
        const hourMatch = fileName.match(/^(\d{2})\./);
        if (!hourMatch) {
            return res.status(400).json({
                error: 'Invalid filename format',
                message: 'Filename must start with hour format (e.g., 13.00.00-1234.mp4)'
            });
        }

        const hour = hourMatch[1];

        // Construire le chemin complet du fichier
        const filePath = path.join(
            API_CONFIG.storage_path,
            'share/HG0438PAZ00098',
            fileDate,
            '001/dav',
            hour,
            fileName
        );

        console.log(`[API] 🗑️  Deleting video file: ${fileName}`);

        // Vérifier si le fichier existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: 'File not found',
                message: `File "${fileName}" not found in ${fileDate}/${hour}`
            });
        }

        // Supprimer SEULEMENT le fichier vidéo
        fs.unlinkSync(filePath);

        console.log(`[API] ✅ Video file deleted: ${fileName}`);

        res.json({
            success: true,
            message: 'Video file deleted successfully',
            deleted: {
                name: fileName,
                date: fileDate,
                hour: hour
            }
        });

    } catch (error) {
        console.error('[API Error] Failed to delete video file:', error);
        res.status(500).json({
            error: 'Failed to delete video file',
            message: (error as Error).message
        });
    }
});
// 2. Delete complete hour directory (folder + all contents)
app.delete('/files/delete-by-hour', (req: Request, res: Response) => {
    try {
        const { date, hour } = req.query;

        // Validation des paramètres
        if (!date || !hour) {
            return res.status(400).json({
                error: 'Missing parameters',
                message: 'Both "date" and "hour" parameters are required',
                example: '/files/delete-by-hour?date=2025-12-07&hour=13'
            });
        }

        const fileDate = date as string;
        const fileHour = hour as string;

        // Valider le format de la date
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fileDate)) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Date must be in format YYYY-MM-DD'
            });
        }

        // Valider le format de l'heure (00-23)
        if (!/^\d{2}$/.test(fileHour) || parseInt(fileHour) > 23) {
            return res.status(400).json({
                error: 'Invalid hour format',
                message: 'Hour must be in format 00-23 (e.g., 13, 00, 23)'
            });
        }

        // Construire le chemin du dossier d'heure
        const hourPath = path.join(
            API_CONFIG.storage_path,
            'share/HG0438PAZ00098',
            fileDate,
            '001/dav',
            fileHour
        );

        console.log(`[API] 🗑️  Deleting complete hour directory: ${fileHour}`);
        console.log(`[API] 📁 Path: ${hourPath}`);

        // Vérifier si le dossier existe
        if (!fs.existsSync(hourPath)) {
            return res.status(404).json({
                error: 'Hour directory not found',
                message: `No directory found for ${fileDate} at hour ${fileHour}`
            });
        }

        // Fonction récursive pour supprimer un dossier et tout son contenu
        function deleteFolderRecursive(dirPath: string): void {
            if (fs.existsSync(dirPath)) {
                fs.readdirSync(dirPath).forEach((file) => {
                    const curPath = path.join(dirPath, file);

                    if (fs.lstatSync(curPath).isDirectory()) {
                        // Récursif pour les sous-dossiers
                        deleteFolderRecursive(curPath);
                    } else {
                        // Supprimer le fichier
                        fs.unlinkSync(curPath);
                    }
                });

                // Supprimer le dossier vide
                fs.rmdirSync(dirPath);
            }
        }

        // Supprimer le dossier complet de l'heure
        deleteFolderRecursive(hourPath);

        console.log(`[API] ✅ Hour directory deleted completely: ${fileHour}`);

        res.json({
            success: true,
            message: `Hour directory ${fileHour} deleted completely`,
            deleted: {
                date: fileDate,
                hour: fileHour,
                path: hourPath
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

// 3. Delete complete date directory (folder + all contents)
app.delete('/files/delete-by-date', (req: Request, res: Response) => {
    try {
        const { date } = req.query;

        // Validation du paramètre
        if (!date) {
            return res.status(400).json({
                error: 'Missing parameter',
                message: 'Date parameter is required',
                example: '/files/delete-by-date?date=2025-12-07'
            });
        }

        const fileDate = date as string;

        // Valider le format de la date
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fileDate)) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Date must be in format YYYY-MM-DD'
            });
        }

        // Construire le chemin du dossier complet de la date
        const dateRootPath = path.join(
            API_CONFIG.storage_path,
            'share/HG0438PAZ00098',
            fileDate
        );

        console.log(`[API] 🗑️  Deleting complete date directory: ${fileDate}`);
        console.log(`[API] 📁 Path: ${dateRootPath}`);

        // Vérifier si le dossier existe
        if (!fs.existsSync(dateRootPath)) {
            return res.status(404).json({
                error: 'Date directory not found',
                message: `No directory found for date ${fileDate}`
            });
        }

        // Fonction récursive pour supprimer un dossier et tout son contenu
        function deleteFolderRecursive(dirPath: string): void {
            if (fs.existsSync(dirPath)) {
                fs.readdirSync(dirPath).forEach((file) => {
                    const curPath = path.join(dirPath, file);

                    if (fs.lstatSync(curPath).isDirectory()) {
                        // Récursif pour les sous-dossiers
                        deleteFolderRecursive(curPath);
                    } else {
                        // Supprimer le fichier
                        fs.unlinkSync(curPath);
                    }
                });

                // Supprimer le dossier vide
                fs.rmdirSync(dirPath);
            }
        }

        // Supprimer le dossier complet de la date
        deleteFolderRecursive(dateRootPath);

        console.log(`[API] ✅ Date directory deleted completely: ${fileDate}`);

        res.json({
            success: true,
            message: `Complete directory for ${fileDate} deleted successfully`,
            deleted: {
                date: fileDate,
                path: dateRootPath
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
