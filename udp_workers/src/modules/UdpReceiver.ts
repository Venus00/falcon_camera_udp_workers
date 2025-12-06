/**
 * UDP Receiver Module
 * Handles receiving UDP messages on a specific port
 */

import * as dgram from 'dgram';
import { UdpMessage, UdpServerConfig, UdpReceiverCallbacks } from '../types/udp.types';

export class UdpReceiver {
    private socket: dgram.Socket | null = null;
    private config: UdpServerConfig;
    private callbacks: UdpReceiverCallbacks;
    private isListening: boolean = false;

    constructor(config: UdpServerConfig, callbacks: UdpReceiverCallbacks = {}) {
        this.config = config;
        this.callbacks = callbacks;
    }

    /**
     * Start listening for UDP messages
     */
    public start(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isListening) {
                reject(new Error('UDP Receiver is already listening'));
                return;
            }

            this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: this.config.reuseAddr || false });

            // Handle incoming messages
            this.socket.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
                const udpMessage: UdpMessage = {
                    data: msg,
                    remoteAddress: rinfo.address,
                    remotePort: rinfo.port,
                    timestamp: new Date()
                };

                if (this.callbacks.onMessage) {
                    this.callbacks.onMessage(udpMessage);
                }
            });

            // Handle errors
            this.socket.on('error', (err: Error) => {
                if (this.callbacks.onError) {
                    this.callbacks.onError(err);
                }
            });

            // Handle listening event
            this.socket.on('listening', () => {
                const address = this.socket?.address();
                this.isListening = true;
                
                if (this.callbacks.onListening && address && typeof address === 'object') {
                    this.callbacks.onListening(address.address, address.port);
                }
                
                resolve();
            });

            // Handle close event
            this.socket.on('close', () => {
                this.isListening = false;
                
                if (this.callbacks.onClose) {
                    this.callbacks.onClose();
                }
            });

            // Bind to port
            try {
                this.socket.bind(this.config.port, this.config.host || '0.0.0.0');
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Stop listening for UDP messages
     */
    public stop(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.socket || !this.isListening) {
                resolve();
                return;
            }

            this.socket.close(() => {
                this.socket = null;
                resolve();
            });
        });
    }

    /**
     * Check if receiver is currently listening
     */
    public getIsListening(): boolean {
        return this.isListening;
    }

    /**
     * Get current configuration
     */
    public getConfig(): UdpServerConfig {
        return { ...this.config };
    }

    /**
     * Update callbacks
     */
    public updateCallbacks(callbacks: UdpReceiverCallbacks): void {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }
}
