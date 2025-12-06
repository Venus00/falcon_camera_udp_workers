/**
 * FTP Server for file storage
 * Handles file uploads and downloads via FTP protocol
 */

import { FtpSrv } from 'ftp-srv';
import * as path from 'path';
import * as fs from 'fs';

// Configuration
const FTP_CONFIG = {
    host: '0.0.0.0',
    port: 21,
    pasv_url: '127.0.0.1',
    pasv_min: 1024,
    pasv_max: 1048,
    greeting: 'Welcome to Stockage FTP Server',
    storage_path: path.join(__dirname, '../ftp_storage')
};

// Ensure storage directory exists
if (!fs.existsSync(FTP_CONFIG.storage_path)) {
    fs.mkdirSync(FTP_CONFIG.storage_path, { recursive: true });
    console.log(`Created storage directory: ${FTP_CONFIG.storage_path}`);
}

// Create FTP server
const ftpServer = new FtpSrv({
    url: `ftp://${FTP_CONFIG.host}:${FTP_CONFIG.port}`,
    pasv_url: FTP_CONFIG.pasv_url,
    pasv_min: FTP_CONFIG.pasv_min,
    pasv_max: FTP_CONFIG.pasv_max,
    greeting: FTP_CONFIG.greeting,
    anonymous: true  // Allow anonymous login for simplicity
});

// Handle login
ftpServer.on('login', (data: any, resolve: any, reject: any) => {
    console.log(`[FTP] Login attempt - User: ${data.username}`);
    
    // For anonymous or any user, grant access to storage directory
    resolve({ root: FTP_CONFIG.storage_path });
    console.log(`[FTP] User "${data.username}" logged in successfully`);
});

// Handle client connections
ftpServer.on('client-error', (data: any) => {
    console.error('[FTP] Client error:', data.error?.message || 'Unknown error');
});

// Start FTP server
async function startFtpServer() {
    try {
        await ftpServer.listen();
        console.log('='.repeat(60));
        console.log('  FTP SERVER STARTED');
        console.log('='.repeat(60));
        console.log(`Host: ${FTP_CONFIG.host}:${FTP_CONFIG.port}`);
        console.log(`Storage: ${FTP_CONFIG.storage_path}`);
        console.log(`Passive Ports: ${FTP_CONFIG.pasv_min}-${FTP_CONFIG.pasv_max}`);
        console.log(`Anonymous Login: Enabled`);
        console.log('='.repeat(60));
        console.log('\nFTP Server is ready to accept connections...\n');
    } catch (error) {
        console.error('Failed to start FTP server:', error);
        process.exit(1);
    }
}

// Handle shutdown
process.on('SIGINT', async () => {
    console.log('\n\nShutting down FTP server...');
    await ftpServer.close();
    console.log('FTP server stopped.');
    process.exit(0);
});

// Start the server
if (require.main === module) {
    startFtpServer();
}

export { ftpServer, FTP_CONFIG };
