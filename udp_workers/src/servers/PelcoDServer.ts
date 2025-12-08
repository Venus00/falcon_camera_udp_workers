/**
 * PELCO-D UDP Server
 * Server 1: Handles PELCO-D protocol for PTZ camera control
 */

import axios from 'axios';
import { UdpReceiver } from '../modules/UdpReceiver';
import { UdpSender } from '../modules/UdpSender';
import { PelcoDDecoder } from '../protocols/PelcoDDecoder';
import { PelcoDCommandBuilder } from '../protocols/PelcoDCommandBuilder';
import {
    PelcoDServerConfig,
    DecodedPelcoD,
    PelcoDAction,
    PELCO_D_CONSTANTS
} from '../types/pelco-d.types';

export class PelcoDServer {
    private receiver: UdpReceiver;
    private sender: UdpSender;
    private commandBuilder: PelcoDCommandBuilder;
    private config: PelcoDServerConfig;
    private focusServerUrl: string;
    private cameraName: string;

    constructor(config: PelcoDServerConfig) {
        this.config = config;
        this.commandBuilder = new PelcoDCommandBuilder(config.defaultCameraId || 1);
        this.focusServerUrl = config.focusServerUrl || 'http://localhost:3000';
        this.cameraName = config.cameraName || 'cam2';

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
     * Map PelcoD action to API direction
     */
    private mapPelcoDActionToDirection(action: PelcoDAction): string | null {
        const directionMap: Record<PelcoDAction, string> = {
            [PelcoDAction.PAN_LEFT]: 'left',
            [PelcoDAction.PAN_RIGHT]: 'right',
            [PelcoDAction.TILT_UP]: 'up',
            [PelcoDAction.TILT_DOWN]: 'down',
            [PelcoDAction.PAN_LEFT_TILT_UP]: 'left-up',
            [PelcoDAction.PAN_LEFT_TILT_DOWN]: 'left-down',
            [PelcoDAction.PAN_RIGHT_TILT_UP]: 'right-up',
            [PelcoDAction.PAN_RIGHT_TILT_DOWN]: 'right-down',
            [PelcoDAction.ZOOM_IN]: 'zoom-in',
            [PelcoDAction.ZOOM_OUT]: 'zoom-out',
            [PelcoDAction.STOP]: 'stop',
            [PelcoDAction.FOCUS_NEAR]: 'focus-near',
            [PelcoDAction.FOCUS_FAR]: 'focus-far'
        };

        return directionMap[action] || null;
    }

    /**
     * Send PTZ request to HTTP API
     */
    private async sendPtzRequest(direction: string, speed: number = 4): Promise<void> {
        const url = `${this.focusServerUrl}/camera/${this.cameraName}/ptz/move/${direction}`;
        const payload = { speed };

        try {
            const response = await axios.post(url, payload, { timeout: 500 });
            if (response.status === 200) {
                console.log(`[PTZ] ${this.cameraName} moved ${direction} successfully`);
            } else {
                console.log(`[PTZ] Request failed (${response.status}): ${response.statusText}`);
            }
        } catch (error: any) {
            console.log(`[PTZ] Error sending request: ${error.message}`);
        }
    }

    /**
     * Map PelcoD speed (0-63) to API speed (typically 1-10)
     */
    private mapSpeed(pelcoDSpeed: number): number {
        // PelcoD speed range: 0-63 (0x00-0x3F)
        // API speed range: 1-10 (assuming)
        // Map 0-63 to 1-10
        if (pelcoDSpeed === 0) return 1;
        return Math.min(10, Math.max(1, Math.ceil((pelcoDSpeed / 63) * 10)));
    }

    /**
     * Handle incoming PELCO-D message
     */
    private async handlePelcoDMessage(data: Buffer): Promise<void> {
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

        // Process the action if valid
        if (decoded.valid && decoded.action) {
            const direction = this.mapPelcoDActionToDirection(decoded.action);

            if (direction) {
                // Get speed from data1 (pan speed) or data2 (tilt/zoom speed)
                const rawSpeed = Math.max(decoded.data1, decoded.data2);
                const apiSpeed = this.mapSpeed(rawSpeed);

                console.log(`[PELCO-D] Executing action: ${decoded.action} -> ${direction} (speed: ${apiSpeed})`);
                await this.sendPtzRequest(direction, apiSpeed);
            } else {
                console.log(`[PELCO-D] Action ${decoded.action} has no direction mapping`);
            }
        }

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
