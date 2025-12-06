/**
 * SMART UDP Server (Server 2)
 * Handles SMART protocol for advanced camera control
 */

import { UdpReceiver } from '../modules/UdpReceiver';
import { UdpSender } from '../modules/UdpSender';
import { SmartDecoder } from '../protocols/SmartDecoder';
import { SmartCommandBuilder } from '../protocols/SmartCommandBuilder';
import {
    SmartServerConfig,
    DecodedSmart,
    MultiObjectResponse,
    SMART_CONSTANTS
} from '../types/smart.types';

export class SmartServer {
    private receiver: UdpReceiver;
    private responseReceiver?: UdpReceiver;  // For camera responses on port 52383
    private sender: UdpSender;
    private commandBuilder: SmartCommandBuilder;
    private config: SmartServerConfig;

    constructor(config: SmartServerConfig) {
        this.config = config;
        this.commandBuilder = new SmartCommandBuilder(config.defaultCameraId || 1);

        // Initialize sender
        this.sender = new UdpSender({
            onError: (error) => {
                if (this.config.onError) {
                    this.config.onError(error);
                }
            }
        });

        // Initialize main command receiver
        this.receiver = new UdpReceiver(
            {
                port: config.port,
                host: config.host || '0.0.0.0'
            },
            {
                onMessage: (message) => {
                    this.handleSmartMessage(message.data);
                },
                onListening: (address, port) => {
                    console.log(`[SMART SERVER] Listening on ${address}:${port}`);
                },
                onError: (error) => {
                    if (this.config.onError) {
                        this.config.onError(error);
                    }
                },
                onClose: () => {
                    console.log('[SMART SERVER] Closed');
                }
            }
        );

        // Initialize response receiver on port 52383 if callback provided
        if (config.onMultiObjectResponse || config.onTrajectoryUpdate) {
            const responsePort = config.responsePort || SMART_CONSTANTS.RESPONSE_PORT;
            this.responseReceiver = new UdpReceiver(
                {
                    port: responsePort,
                    host: config.host || '0.0.0.0'
                },
                {
                    onMessage: (message) => {
                        this.handleCameraResponse(message.data);
                    },
                    onListening: (address, port) => {
                        console.log(`[SMART SERVER] Camera response listener on ${address}:${port}`);
                    },
                    onError: (error) => {
                        if (this.config.onError) {
                            this.config.onError(error);
                        }
                    }
                }
            );
        }
    }

    /**
     * Handle incoming SMART command message
     */
    private handleSmartMessage(data: Buffer): void {
        // Check if it's a valid SMART packet (7 bytes)
        if (data.length !== SMART_CONSTANTS.PACKET_LENGTH) {
            console.warn(`[SMART] Invalid packet length: ${data.length} bytes (expected ${SMART_CONSTANTS.PACKET_LENGTH})`);
            return;
        }

        // Decode the packet
        const decoded = SmartDecoder.decode(data);

        // Log the decoded packet
        console.log('[SMART] Received:', SmartDecoder.describe(decoded));
        console.log('[SMART] Details:', JSON.stringify(SmartDecoder.toJSON(decoded), null, 2));

        // Call user callback
        if (this.config.onCommand) {
            this.config.onCommand(decoded);
        }

        // Warn if invalid
        if (!decoded.valid) {
            console.warn('[SMART] Warning: Invalid or malformed packet');
        }
    }

    /**
     * Handle camera response (Multi-Object scan or trajectory data)
     */
    private handleCameraResponse(data: Buffer): void {
        // Check if it's a multi-object response (0xFB header)
        if (SmartDecoder.isValidMultiObjectResponse(data)) {
            const response = SmartDecoder.parseMultiObjectResponse(data);
            if (response && this.config.onMultiObjectResponse) {
                console.log('[SMART] Multi-Object Response:', SmartDecoder.describeMultiObjectResponse(response));
                this.config.onMultiObjectResponse(response);
            }
        }
        // Could be trajectory data - handle if callback provided
        else if (this.config.onTrajectoryUpdate) {
            // Parse trajectory data if needed
            console.log('[SMART] Trajectory update received');
        }
    }

    /**
     * Start the SMART server
     */
    public async start(): Promise<void> {
        await this.receiver.start();
        
        // Start response receiver if configured
        if (this.responseReceiver) {
            await this.responseReceiver.start();
        }
    }

    /**
     * Stop the SMART server
     */
    public async stop(): Promise<void> {
        await this.receiver.stop();
        
        if (this.responseReceiver) {
            await this.responseReceiver.stop();
        }
        
        await this.sender.close();
    }

    /**
     * Send a SMART command to a camera
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
     * Get command builder for creating SMART commands
     */
    public getCommandBuilder(): SmartCommandBuilder {
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
        console.log(`[SMART] Sending: ${description}`);
        console.log(`[SMART] Target: ${targetHost}:${targetPort}`);
        console.log(`[SMART] Hex: ${commandBuffer.toString('hex').toUpperCase()}`);
        
        const bytes = await this.sendCommand(targetHost, targetPort, commandBuffer);
        console.log(`[SMART] Sent ${bytes} bytes`);
    }

    /**
     * Decode and display a SMART packet (for debugging)
     */
    public static decodeSmart(buffer: Buffer): DecodedSmart {
        return SmartDecoder.decode(buffer);
    }

    /**
     * Create a new command builder for a specific camera
     */
    public static createCommandBuilder(cameraId: number = 1): SmartCommandBuilder {
        return new SmartCommandBuilder(cameraId);
    }
}
