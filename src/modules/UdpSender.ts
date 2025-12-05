/**
 * UDP Sender Module
 * Handles sending UDP messages to remote hosts
 */

import * as dgram from 'dgram';
import { UdpSendOptions, UdpSenderCallbacks } from '../types/udp.types';

export class UdpSender {
    private socket: dgram.Socket;
    private callbacks: UdpSenderCallbacks;

    constructor(callbacks: UdpSenderCallbacks = {}) {
        this.socket = dgram.createSocket('udp4');
        this.callbacks = callbacks;

        // Handle socket errors
        this.socket.on('error', (err: Error) => {
            if (this.callbacks.onError) {
                this.callbacks.onError(err);
            }
        });
    }

    /**
     * Send a UDP message to a specific host and port
     */
    public send(options: UdpSendOptions): Promise<number> {
        return new Promise((resolve, reject) => {
            const buffer = Buffer.isBuffer(options.data) 
                ? options.data 
                : Buffer.from(options.data);

            this.socket.send(
                buffer,
                0,
                buffer.length,
                options.targetPort,
                options.targetHost,
                (err, bytes) => {
                    if (err) {
                        if (this.callbacks.onError) {
                            this.callbacks.onError(err);
                        }
                        reject(err);
                    } else {
                        if (this.callbacks.onSent) {
                            this.callbacks.onSent(bytes, options.targetHost, options.targetPort);
                        }
                        resolve(bytes);
                    }
                }
            );
        });
    }

    /**
     * Send a broadcast message to all devices on the network
     */
    public async broadcast(port: number, data: string | Buffer): Promise<number> {
        this.socket.setBroadcast(true);
        
        return this.send({
            targetHost: '255.255.255.255',
            targetPort: port,
            data: data
        });
    }

    /**
     * Send multiple messages in sequence
     */
    public async sendMultiple(messages: UdpSendOptions[]): Promise<number[]> {
        const results: number[] = [];
        
        for (const message of messages) {
            const bytes = await this.send(message);
            results.push(bytes);
        }
        
        return results;
    }

    /**
     * Send a message and wait for response (requires setting up a receiver)
     */
    public sendAndReceive(
        options: UdpSendOptions,
        timeout: number = 5000
    ): Promise<{ sent: number; response?: Buffer }> {
        return new Promise((resolve, reject) => {
            let timeoutHandle: NodeJS.Timeout;
            let responseReceived = false;

            // Set up one-time listener for response
            const onMessage = (msg: Buffer) => {
                if (!responseReceived) {
                    responseReceived = true;
                    clearTimeout(timeoutHandle);
                    this.socket.removeListener('message', onMessage);
                    
                    this.send(options).then(sent => {
                        resolve({ sent, response: msg });
                    });
                }
            };

            this.socket.on('message', onMessage);

            // Set timeout
            timeoutHandle = setTimeout(() => {
                if (!responseReceived) {
                    responseReceived = true;
                    this.socket.removeListener('message', onMessage);
                    
                    this.send(options).then(sent => {
                        resolve({ sent, response: undefined });
                    });
                }
            }, timeout);

            // Send the message
            this.send(options).catch(reject);
        });
    }

    /**
     * Close the sender socket
     */
    public close(): Promise<void> {
        return new Promise((resolve) => {
            this.socket.close(() => {
                resolve();
            });
        });
    }

    /**
     * Update callbacks
     */
    public updateCallbacks(callbacks: UdpSenderCallbacks): void {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Get socket reference (for advanced usage)
     */
    public getSocket(): dgram.Socket {
        return this.socket;
    }
}
