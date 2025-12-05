/**
 * UDP Server Types and Interfaces
 */

export interface UdpMessage {
    data: Buffer;
    remoteAddress: string;
    remotePort: number;
    timestamp: Date;
}

export interface UdpServerConfig {
    port: number;
    host?: string;
    reuseAddr?: boolean;
}

export interface UdpSendOptions {
    targetHost: string;
    targetPort: number;
    data: string | Buffer;
}

export interface UdpReceiverCallbacks {
    onMessage?: (message: UdpMessage) => void;
    onError?: (error: Error) => void;
    onListening?: (address: string, port: number) => void;
    onClose?: () => void;
}

export interface UdpSenderCallbacks {
    onSent?: (bytes: number, targetHost: string, targetPort: number) => void;
    onError?: (error: Error) => void;
}

export interface UdpServerManagerConfig {
    receiverConfig?: UdpServerConfig;
    senderConfig?: {
        sourcePort?: number;
        sourceHost?: string;
    };
    callbacks?: UdpReceiverCallbacks & UdpSenderCallbacks;
}
