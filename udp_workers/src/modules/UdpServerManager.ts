/**
 * UDP Server Manager
 * Combines sender and receiver functionality for a complete UDP server
 */

import { UdpReceiver } from './UdpReceiver';
import { UdpSender } from './UdpSender';
import {
    UdpServerManagerConfig,
    UdpMessage,
    UdpSendOptions,
    UdpServerConfig
} from '../types/udp.types';

export class UdpServerManager {
    private receiver?: UdpReceiver;
    private sender: UdpSender;
    private config: UdpServerManagerConfig;

    constructor(config: UdpServerManagerConfig) {
        this.config = config;

        // Initialize sender
        this.sender = new UdpSender({
            onSent: config.callbacks?.onSent,
            onError: config.callbacks?.onError
        });

        // Initialize receiver if config provided
        if (config.receiverConfig) {
            this.receiver = new UdpReceiver(config.receiverConfig, {
                onMessage: config.callbacks?.onMessage,
                onError: config.callbacks?.onError,
                onListening: config.callbacks?.onListening,
                onClose: config.callbacks?.onClose
            });
        }
    }

    /**
     * Start the receiver (if configured)
     */
    public async startReceiver(): Promise<void> {
        if (!this.receiver) {
            throw new Error('Receiver not configured');
        }
        await this.receiver.start();
    }

    /**
     * Stop the receiver
     */
    public async stopReceiver(): Promise<void> {
        if (this.receiver) {
            await this.receiver.stop();
        }
    }

    /**
     * Send a UDP message
     */
    public async send(options: UdpSendOptions): Promise<number> {
        return this.sender.send(options);
    }

    /**
     * Broadcast a message
     */
    public async broadcast(port: number, data: string | Buffer): Promise<number> {
        return this.sender.broadcast(port, data);
    }

    /**
     * Send multiple messages
     */
    public async sendMultiple(messages: UdpSendOptions[]): Promise<number[]> {
        return this.sender.sendMultiple(messages);
    }

    /**
     * Check if receiver is listening
     */
    public isListening(): boolean {
        return this.receiver ? this.receiver.getIsListening() : false;
    }

    /**
     * Get receiver configuration
     */
    public getReceiverConfig(): UdpServerConfig | undefined {
        return this.receiver?.getConfig();
    }

    /**
     * Close all connections
     */
    public async close(): Promise<void> {
        await this.stopReceiver();
        await this.sender.close();
    }

    /**
     * Get sender instance (for advanced usage)
     */
    public getSender(): UdpSender {
        return this.sender;
    }

    /**
     * Get receiver instance (for advanced usage)
     */
    public getReceiver(): UdpReceiver | undefined {
        return this.receiver;
    }

    /**
     * Create a simple echo server that responds to all messages
     */
    public createEchoServer(): void {
        if (!this.receiver) {
            throw new Error('Receiver not configured for echo server');
        }

        this.receiver.updateCallbacks({
            onMessage: (message: UdpMessage) => {
                const response = `Echo: ${message.data.toString()}`;
                this.send({
                    targetHost: message.remoteAddress,
                    targetPort: message.remotePort,
                    data: response
                });
            }
        });
    }

    /**
     * Enable auto-reply mode with custom handler
     */
    public enableAutoReply(
        handler: (message: UdpMessage) => string | Buffer | null
    ): void {
        if (!this.receiver) {
            throw new Error('Receiver not configured for auto-reply');
        }

        this.receiver.updateCallbacks({
            onMessage: (message: UdpMessage) => {
                const response = handler(message);
                if (response) {
                    this.send({
                        targetHost: message.remoteAddress,
                        targetPort: message.remotePort,
                        data: response
                    });
                }
            }
        });
    }
}
