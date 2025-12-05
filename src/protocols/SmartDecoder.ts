/**
 * SMART Protocol Decoder
 * Parses and validates SMART packets and responses
 */

import {
    SmartPacket,
    DecodedSmart,
    SmartCommand,
    MultiObjectResponse,
    ObjectInfo,
    SMART_CONSTANTS
} from '../types/smart.types';

export class SmartDecoder {
    /**
     * Verify checksum of a packet
     */
    private static verifyChecksum(buffer: Buffer): boolean {
        if (buffer.length !== SMART_CONSTANTS.PACKET_LENGTH) {
            return false;
        }

        const cameraId = buffer[1];
        const smartCmd = buffer[2];
        const param1 = buffer[3];
        const param2 = buffer[4];
        const param3 = buffer[5];
        const checksum = buffer[6];

        const calculatedChecksum = (cameraId + smartCmd + param1 + param2 + param3) % 256;
        return calculatedChecksum === checksum;
    }

    /**
     * Parse buffer into SMART packet
     */
    public static parsePacket(buffer: Buffer): SmartPacket | null {
        if (buffer.length !== SMART_CONSTANTS.PACKET_LENGTH) {
            return null;
        }

        if (buffer[0] !== SMART_CONSTANTS.HEADER_BYTE) {
            return null;
        }

        return {
            header: buffer[0],
            cameraId: buffer[1],
            smartCmd: buffer[2],
            param1: buffer[3],
            param2: buffer[4],
            param3: buffer[5],
            checksum: buffer[6]
        };
    }

    /**
     * Determine command from command byte
     */
    private static determineCommand(cmdByte: number): SmartCommand | undefined {
        switch (cmdByte) {
            case SMART_CONSTANTS.CMD_RAPID_FOCUS:
                return SmartCommand.RAPID_FOCUS;
            case SMART_CONSTANTS.CMD_MULTI_OBJECT:
                return SmartCommand.MULTI_OBJECT_SCAN;
            case SMART_CONSTANTS.CMD_SMART_TRACKING:
                return SmartCommand.SMART_TRACKING;
            case SMART_CONSTANTS.CMD_AUTO_RECORD:
                return SmartCommand.AUTO_RECORD;
            default:
                return undefined;
        }
    }

    /**
     * Decode a SMART packet
     */
    public static decode(buffer: Buffer): DecodedSmart {
        const checksumValid = this.verifyChecksum(buffer);
        const packet = this.parsePacket(buffer);

        if (!packet) {
            return {
                valid: false,
                cameraId: 0,
                param1: 0,
                param2: 0,
                param3: 0,
                rawPacket: buffer,
                checksumValid: false
            };
        }

        const command = this.determineCommand(packet.smartCmd);

        return {
            valid: checksumValid && command !== undefined,
            cameraId: packet.cameraId,
            command: command,
            param1: packet.param1,
            param2: packet.param2,
            param3: packet.param3,
            rawPacket: buffer,
            checksumValid: checksumValid
        };
    }

    /**
     * Get human-readable description of a decoded packet
     */
    public static describe(decoded: DecodedSmart): string {
        if (!decoded.valid) {
            return 'Invalid SMART packet';
        }

        const parts: string[] = [];
        parts.push(`Camera ${decoded.cameraId}`);

        switch (decoded.command) {
            case SmartCommand.RAPID_FOCUS:
                const focusMode = ['Auto', 'Low-Light', 'Fast-Moving'][decoded.param1] || 'Unknown';
                parts.push(`RAPID FOCUS: Mode=${focusMode}`);
                break;
            
            case SmartCommand.MULTI_OBJECT_SCAN:
                parts.push('MULTI-OBJECT SCAN');
                break;
            
            case SmartCommand.SMART_TRACKING:
                const trackMode = ['Normal', 'Aggressive', 'Stealth'][decoded.param2] || 'Unknown';
                parts.push(`SMART TRACKING: Object=${decoded.param1}, Mode=${trackMode}`);
                break;
            
            case SmartCommand.AUTO_RECORD:
                const action = decoded.param1 === 1 ? 'START' : 'STOP';
                const reason = ['Manual', 'Object', 'Alert'][decoded.param2] || 'Unknown';
                parts.push(`AUTO RECORD ${action}: Reason=${reason}, Duration=${decoded.param3}s`);
                break;
            
            default:
                parts.push(`Command: 0x${decoded.rawPacket[2].toString(16).toUpperCase()}`);
        }

        return parts.join(' | ');
    }

    /**
     * Convert decoded packet to JSON for logging
     */
    public static toJSON(decoded: DecodedSmart): object {
        return {
            valid: decoded.valid,
            checksumValid: decoded.checksumValid,
            cameraId: decoded.cameraId,
            command: decoded.command,
            commandByte: `0x${decoded.rawPacket[2].toString(16).padStart(2, '0').toUpperCase()}`,
            param1: decoded.param1,
            param2: decoded.param2,
            param3: decoded.param3,
            rawHex: decoded.rawPacket.toString('hex').toUpperCase()
        };
    }

    /**
     * Parse Multi-Object Response from camera
     * Response format: 0xFB | NB_OBJ | [T1][X1][Y1][Z1] | [T2][X2][Y2][Z2] | ...
     */
    public static parseMultiObjectResponse(buffer: Buffer): MultiObjectResponse | null {
        if (buffer.length < 2) {
            return null;
        }

        if (buffer[0] !== SMART_CONSTANTS.RESPONSE_HEADER) {
            return null;
        }

        const objectCount = buffer[1];
        const objects: ObjectInfo[] = [];

        // Each object is 4 bytes: [Type][X][Y][Z]
        const expectedLength = 2 + (objectCount * 4);
        if (buffer.length < expectedLength) {
            return null;
        }

        for (let i = 0; i < objectCount; i++) {
            const offset = 2 + (i * 4);
            objects.push({
                type: buffer[offset],
                x: buffer[offset + 1],
                y: buffer[offset + 2],
                z: buffer[offset + 3]
            });
        }

        return {
            header: buffer[0],
            objectCount: objectCount,
            objects: objects
        };
    }

    /**
     * Describe multi-object response
     */
    public static describeMultiObjectResponse(response: MultiObjectResponse): string {
        const parts: string[] = [];
        parts.push(`Detected ${response.objectCount} object(s)`);
        
        response.objects.forEach((obj, idx) => {
            parts.push(`\n  Object ${idx + 1}: Type=${obj.type}, Position=(${obj.x},${obj.y},${obj.z})`);
        });

        return parts.join('');
    }

    /**
     * Validate if buffer could be a SMART packet
     */
    public static isValidSmartPacket(buffer: Buffer): boolean {
        return buffer.length === SMART_CONSTANTS.PACKET_LENGTH &&
               buffer[0] === SMART_CONSTANTS.HEADER_BYTE &&
               this.verifyChecksum(buffer);
    }

    /**
     * Validate if buffer could be a Multi-Object response
     */
    public static isValidMultiObjectResponse(buffer: Buffer): boolean {
        return buffer.length >= 2 &&
               buffer[0] === SMART_CONSTANTS.RESPONSE_HEADER;
    }
}
