/**
 * Stockage Main Entry Point
 * Runs both FTP Server and Express API simultaneously
 */

import { ftpServer } from './ftp-server';
import { app, API_CONFIG } from './express-api';

console.log('='.repeat(70));
console.log('  STOCKAGE - File Storage System');
console.log('  FTP Server + Express API');
console.log('='.repeat(70));
console.log();

// Start FTP Server
async function startFtpServer() {
    try {
        await ftpServer.listen();
        console.log('✅ FTP Server started on port 21');
    } catch (error) {
        console.error('❌ Failed to start FTP server:', error);
        process.exit(1);
    }
}

// Start Express API
async function startApiServer() {
    app.listen(API_CONFIG.port, API_CONFIG.host, () => {
        console.log(`✅ Express API started on http://${API_CONFIG.host}:${API_CONFIG.port}`);
        console.log();
        console.log('='.repeat(70));
        console.log('Both services are running!');
        console.log('='.repeat(70));
        console.log();
        console.log('FTP Server:');
        console.log('  - Port: 21');
        console.log('  - Anonymous login enabled');
        console.log('  - Storage: ./ftp_storage');
        console.log();
        console.log('Express API:');
        console.log(`  - URL: http://localhost:${API_CONFIG.port}`);
        console.log('  - Endpoints:');
        console.log('    GET    /health');
        console.log('    GET    /files');
        console.log('    GET    /files/:filename');
        console.log('    POST   /files');
        console.log('    DELETE /files/:filename');
        console.log('    GET    /search?q=<query>');
        console.log();
        console.log('Press Ctrl+C to stop both servers');
        console.log('='.repeat(70));
    });
}

// Start both services
async function start() {
    await startFtpServer();
    await startApiServer();
}

// Handle shutdown
process.on('SIGINT', async () => {
    console.log('\n\n' + '='.repeat(70));
    console.log('Shutting down Stockage services...');
    console.log('='.repeat(70));
    
    console.log('Stopping FTP server...');
    await ftpServer.close();
    
    console.log('Stopping Express API...');
    
    console.log('\n✅ All services stopped. Goodbye!');
    process.exit(0);
});

// Run
start().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
