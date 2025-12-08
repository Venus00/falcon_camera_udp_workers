/**
 * PELCO-D Protocol Types and Interfaces
 * Protocol for PTZ (Pan-Tilt-Zoom) Camera Control
 */

/**
 * PELCO-D Packet Structure (7 bytes)
 */
export interface PelcoDPacket {
    start: number;        // Byte 1: Always 0xFF
    address: number;      // Byte 2: Camera ID (0x00-0xFF)
    command1: number;     // Byte 3: Command 1
    command2: number;     // Byte 4: Command 2
    data1: number;        // Byte 5: Data 1 (usually speed)
    data2: number;        // Byte 6: Data 2 (usually speed)
    checksum: number;     // Byte 7: Checksum
}

/**
 * PTZ Action Types
 */
export enum PelcoDAction {
    STOP = 'STOP',
    PAN_LEFT = 'PAN_LEFT',
    PAN_RIGHT = 'PAN_RIGHT',
    TILT_UP = 'TILT_UP',
    TILT_DOWN = 'TILT_DOWN',
    ZOOM_IN = 'ZOOM_IN',
    ZOOM_OUT = 'ZOOM_OUT',
    FOCUS_NEAR = 'FOCUS_NEAR',
    FOCUS_FAR = 'FOCUS_FAR',
    PAN_LEFT_TILT_UP = 'PAN_LEFT_TILT_UP',
    PAN_LEFT_TILT_DOWN = 'PAN_LEFT_TILT_DOWN',
    PAN_RIGHT_TILT_UP = 'PAN_RIGHT_TILT_UP',
    PAN_RIGHT_TILT_DOWN = 'PAN_RIGHT_TILT_DOWN'
}

/**
 * Command Definition
 */
export interface PelcoDCommand {
    cmd1: number;
    cmd2: number;
    data1: number;
    data2: number;
}

/**
 * PTZ Control Parameters
 */
export interface PtzControlParams {
    cameraId: number;     // Camera address (0-255)
    action: PelcoDAction; // Action to perform
    panSpeed?: number;    // Pan speed (0x00-0x3F, 0-63)
    tiltSpeed?: number;   // Tilt speed (0x00-0x3F, 0-63)
    zoomSpeed?: number;   // Zoom speed (0x00-0x3F, 0-63)
    focusSpeed?: number;  // Focus speed (0x00-0x3F, 0-63)
}

/**
 * Decoded PELCO-D Message
 */
export interface DecodedPelcoD {
    valid: boolean;
    cameraId: number;
    action?: PelcoDAction;
    command1: number;
    command2: number;
    data1: number;
    data2: number;
    rawPacket: Buffer;
    checksumValid: boolean;
}

/**
 * PELCO-D Protocol Constants
 */
export const PELCO_D_CONSTANTS = {
    START_BYTE: 0xFF,
    PACKET_LENGTH: 7,

    // Command 1 bits
    CMD1_SENSE: 0x80,
    CMD1_AUTO_SCAN: 0x10,
    CMD1_CAMERA_ON: 0x08,
    CMD1_IRIS_CLOSE: 0x04,
    CMD1_IRIS_OPEN: 0x02,
    CMD1_FOCUS_NEAR: 0x01,

    // Command 2 bits
    CMD2_FOCUS_FAR: 0x80,
    CMD2_ZOOM_OUT: 0x40,
    CMD2_ZOOM_IN: 0x20,
    CMD2_TILT_DOWN: 0x10,
    CMD2_TILT_UP: 0x08,
    CMD2_PAN_RIGHT: 0x02,
    CMD2_PAN_LEFT: 0x04,

    // Speed limits
    MIN_SPEED: 0x00,
    MAX_SPEED: 0x3F
};

/**
 * PELCO-D Server Configuration
 */
export interface PelcoDServerConfig {
    port: number;
    host?: string;
    defaultCameraId?: number;
    focusServerUrl?: string;  // HTTP API server URL (default: http://localhost:3000)
    cameraName?: string;      // Camera name for API requests (default: cam2)
    onCommand?: (decoded: DecodedPelcoD) => void;
    onError?: (error: Error) => void;
}
