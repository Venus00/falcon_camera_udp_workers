/**
 * PELCO-D UDP Server
 * Server 1: Handles PELCO-D protocol for PTZ camera control
 */

import { UdpReceiver } from '../modules/UdpReceiver';
import { UdpSender } from '../modules/UdpSender';
import { PelcoDDecoder } from '../protocols/PelcoDDecoder';
import { PelcoDCommandBuilder } from '../protocols/PelcoDCommandBuilder';
import {
    PelcoDServerConfig,
    DecodedPelcoD,
    PELCO_D_CONSTANTS
} from '../types/pelco-d.types';

export class PelcoDServer {
    private receiver: UdpReceiver;
    private sender: UdpSender;
    private commandBuilder: PelcoDCommandBuilder;
    private config: PelcoDServerConfig;

    constructor(config: PelcoDServerConfig) {
        this.config = config;
        this.commandBuilder = new PelcoDCommandBuilder(config.defaultCameraId || 1);

        // Initialize sender
        this.sender = new UdpSender({
            onError: (error) => {
                if (this.config.onError) {
                    this.config.onError(error);
                }
            }
        });

        // Initialize receiver with PELCO-D packet handler
        this.receiver = new UdpReceiver(
            {
                port: config.port,
                host: config.host || '0.0.0.0'
            },
            {
                onMessage: (message) => {
                    this.handlePelcoDMessage(message.data);
                },
                onListening: (address, port) => {
                    console.log(`[PELCO-D SERVER] Listening on ${address}:${port}`);
                },
                onError: (error) => {
                    if (this.config.onError) {
                        this.config.onError(error);
                    }
                },
                onClose: () => {
                    console.log('[PELCO-D SERVER] Closed');
                }
            }
        );
    }

    /**
     * Handle incoming PELCO-D message
     */
    private handlePelcoDMessage(data: Buffer): void {
        // Check if it's a valid PELCO-D packet (7 bytes)
        if (data.length !== PELCO_D_CONSTANTS.PACKET_LENGTH) {
            console.warn(`[PELCO-D] Invalid packet length: ${data.length} bytes (expected ${PELCO_D_CONSTANTS.PACKET_LENGTH})`);
            return;
        }

        // Decode the packet
        const decoded = PelcoDDecoder.decode(data);

        // Log the decoded packet
        console.log('[PELCO-D] Received:', PelcoDDecoder.describe(decoded));
        console.log('[PELCO-D] Details:', JSON.stringify(PelcoDDecoder.toJSON(decoded), null, 2));

        // Call user callback
        if (this.config.onCommand) {
            this.config.onCommand(decoded);
        }

        // Warn if invalid
        if (!decoded.valid) {
            console.warn('[PELCO-D] Warning: Invalid or malformed packet');
        }
    }

    /**
     * Start the PELCO-D server
     */
    public async start(): Promise<void> {
        await this.receiver.start();
    }

    /**
     * Stop the PELCO-D server
     */
    public async stop(): Promise<void> {
        await this.receiver.stop();
        await this.sender.close();
    }

    /**
     * Send a PELCO-D command to a camera
     */
    public async sendCommand(
        targetHost: string,
        targetPort: number,
        commandBuffer: Buffer
    ): Promise<number> {
        return this.sender.send({
            targetHost,
            targetPort,
            data: commandBuffer
        });
    }

    /**
     * Get command builder for creating PELCO-D commands
     */
    public getCommandBuilder(): PelcoDCommandBuilder {
        return this.commandBuilder;
    }

    /**
     * Check if server is listening
     */
    public isListening(): boolean {
        return this.receiver.getIsListening();
    }

    /**
     * Send a command and log it
     */
    public async sendAndLog(
        targetHost: string,
        targetPort: number,
        commandBuffer: Buffer,
        description: string
    ): Promise<void> {
        console.log(`[PELCO-D] Sending: ${description}`);
        console.log(`[PELCO-D] Target: ${targetHost}:${targetPort}`);
        console.log(`[PELCO-D] Hex: ${commandBuffer.toString('hex').toUpperCase()}`);
        
        const bytes = await this.sendCommand(targetHost, targetPort, commandBuffer);
        console.log(`[PELCO-D] Sent ${bytes} bytes`);
    }

    /**
     * Decode and display a PELCO-D packet (for debugging)
     */
    public static decodePelcoD(buffer: Buffer): DecodedPelcoD {
        return PelcoDDecoder.decode(buffer);
    }

    /**
     * Create a new command builder for a specific camera
     */
    public static createCommandBuilder(cameraId: number = 1): PelcoDCommandBuilder {
        return new PelcoDCommandBuilder(cameraId);
    }
}
