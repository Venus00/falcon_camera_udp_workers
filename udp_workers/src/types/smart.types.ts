/**
 * SMART Protocol Types and Interfaces
 * Protocol for Advanced Camera Control
 */

/**
 * SMART Packet Structure (7 bytes)
 */
export interface SmartPacket {
    header: number;       // Byte 1: Always 0xFA (SMART header)
    cameraId: number;     // Byte 2: Camera ID (0x00-0xFF)
    smartCmd: number;     // Byte 3: SMART Command
    param1: number;       // Byte 4: Parameter 1
    param2: number;       // Byte 5: Parameter 2
    param3: number;       // Byte 6: Parameter 3
    checksum: number;     // Byte 7: Checksum
}

/**
 * SMART Command Types
 */
export enum SmartCommand {
    RAPID_FOCUS = 0x10,           // Rapid Focus Adaptation
    MULTI_OBJECT_SCAN = 0x20,     // Multi-Object Classification Snapshot
    SMART_TRACKING = 0x30,        // Smart Tracking Lock
    AUTO_RECORD = 0x40            // Auto-Record + Edge Learning Trigger
}

/**
 * Rapid Focus Mode (0x10)
 */
export enum FocusMode {
    AUTO = 0,
    LOW_LIGHT = 1,
    FAST_MOVING = 2
}

/**
 * Smart Tracking Mode (0x30)
 */
export enum TrackingMode {
    NORMAL = 0,
    AGGRESSIVE = 1,
    STEALTH = 2
}

/**
 * Auto-Record Reason (0x40)
 */
export enum RecordReason {
    MANUAL = 0,
    OBJECT = 1,
    ALERT = 2
}

/**
 * SMART Command Parameters
 */
export interface SmartCommandParams {
    cameraId: number;
    command: SmartCommand;
    param1?: number;
    param2?: number;
    param3?: number;
}

/**
 * Rapid Focus Adaptation Parameters (0x10)
 */
export interface RapidFocusParams {
    cameraId: number;
    mode: FocusMode;
}

/**
 * Multi-Object Scan Parameters (0x20)
 */
export interface MultiObjectScanParams {
    cameraId: number;
}

/**
 * Smart Tracking Lock Parameters (0x30)
 */
export interface SmartTrackingParams {
    cameraId: number;
    objectId: number;      // Object ID to track
    mode: TrackingMode;
}

/**
 * Auto-Record Parameters (0x40)
 */
export interface AutoRecordParams {
    cameraId: number;
    start: boolean;        // true = Start, false = Stop
    reason: RecordReason;
    duration: number;      // Duration in seconds
}

/**
 * Decoded SMART Message
 */
export interface DecodedSmart {
    valid: boolean;
    cameraId: number;
    command?: SmartCommand;
    param1: number;
    param2: number;
    param3: number;
    rawPacket: Buffer;
    checksumValid: boolean;
}

/**
 * Multi-Object Response Structure
 * Response from camera on port 52383
 */
export interface ObjectInfo {
    type: number;      // Object type
    x: number;         // X coordinate
    y: number;         // Y coordinate
    z: number;         // Z distance
}

export interface MultiObjectResponse {
    header: number;           // 0xFB
    objectCount: number;      // Number of detected objects
    objects: ObjectInfo[];    // Array of detected objects
}

/**
 * Trajectory Stream Data (for Smart Tracking)
 */
export interface TrajectoryData {
    timestamp: number;
    objectId: number;
    x: number;
    y: number;
    z: number;
    velocity: number;
}

/**
 * SMART Protocol Constants
 */
export const SMART_CONSTANTS = {
    HEADER_BYTE: 0xFA,              // SMART request header
    RESPONSE_HEADER: 0xFB,          // SMART response header
    PACKET_LENGTH: 7,               // Packet size
    RESPONSE_PORT: 52383,           // Camera response port
    
    // Command codes
    CMD_RAPID_FOCUS: 0x10,
    CMD_MULTI_OBJECT: 0x20,
    CMD_SMART_TRACKING: 0x30,
    CMD_AUTO_RECORD: 0x40,
    
    // Focus modes
    FOCUS_AUTO: 0,
    FOCUS_LOW_LIGHT: 1,
    FOCUS_FAST_MOVING: 2,
    
    // Tracking modes
    TRACK_NORMAL: 0,
    TRACK_AGGRESSIVE: 1,
    TRACK_STEALTH: 2,
    
    // Record control
    RECORD_STOP: 0,
    RECORD_START: 1,
    
    // Record reasons
    REASON_MANUAL: 0,
    REASON_OBJECT: 1,
    REASON_ALERT: 2
};

/**
 * SMART Server Configuration
 */
export interface SmartServerConfig {
    port: number;
    responsePort?: number;         // Port for receiving camera responses
    host?: string;
    defaultCameraId?: number;
    onCommand?: (decoded: DecodedSmart) => void;
    onMultiObjectResponse?: (response: MultiObjectResponse) => void;
    onTrajectoryUpdate?: (data: TrajectoryData) => void;
    onError?: (error: Error) => void;
}
