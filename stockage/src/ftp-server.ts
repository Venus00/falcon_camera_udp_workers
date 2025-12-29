/**
 * FTP Server for file storage
 * Handles file uploads and downloads via FTP protocol
 */

import { FtpSrv } from 'ftp-srv';
import * as path from 'path';
import * as fs from 'fs';

const FTP_CONFIG = {
    host: '0.0.0.0',
    port: 2121,
    greeting: 'Welcome to Stockage FTP Server',
    storage_path: path.join(__dirname, '../ftp_storage'),

    pasv_url: '10.10.0.2',   // server IP
    pasv_min: 50000,
    pasv_max: 50100
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
    anonymous: false  // Allow anonymous login for simplicity
});

ftpServer.on('login', ({ username, password }, resolve, reject) => {
    console.log(`[FTP] Login attempt - User: ${username}`);

    const validUsers = {
        admin: '2899100*-+',
        admin1: '2899100*-+'
    };

    if (validUsers[username] === password) {
        console.log(`[FTP] User "${username}" logged in successfully`);
        return resolve({
            root: path.join(FTP_CONFIG.storage_path, username)

        });
    }

    console.log(`[FTP] Invalid credentials for "${username}"`);
    reject(new Error('Invalid credentials'));
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
