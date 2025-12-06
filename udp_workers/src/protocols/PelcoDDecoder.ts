/**
 * PELCO-D Protocol Decoder
 * Parses and validates PELCO-D packets
 */

import {
    PelcoDPacket,
    DecodedPelcoD,
    PelcoDAction,
    PELCO_D_CONSTANTS
} from '../types/pelco-d.types';

export class PelcoDDecoder {
    /**
     * Verify checksum of a packet
     */
    private static verifyChecksum(buffer: Buffer): boolean {
        if (buffer.length !== PELCO_D_CONSTANTS.PACKET_LENGTH) {
            return false;
        }

        const address = buffer[1];
        const cmd1 = buffer[2];
        const cmd2 = buffer[3];
        const data1 = buffer[4];
        const data2 = buffer[5];
        const checksum = buffer[6];

        const calculatedChecksum = (address + cmd1 + cmd2 + data1 + data2) % 256;
        return calculatedChecksum === checksum;
    }

    /**
     * Parse buffer into PELCO-D packet
     */
    public static parsePacket(buffer: Buffer): PelcoDPacket | null {
        if (buffer.length !== PELCO_D_CONSTANTS.PACKET_LENGTH) {
            return null;
        }

        if (buffer[0] !== PELCO_D_CONSTANTS.START_BYTE) {
            return null;
        }

        return {
            start: buffer[0],
            address: buffer[1],
            command1: buffer[2],
            command2: buffer[3],
            data1: buffer[4],
            data2: buffer[5],
            checksum: buffer[6]
        };
    }

    /**
     * Determine action from command bytes
     */
    private static determineAction(cmd1: number, cmd2: number): PelcoDAction | undefined {
        // Check for combined movements first
        if ((cmd2 & 0x04) && (cmd2 & 0x08)) return PelcoDAction.PAN_LEFT_TILT_UP;
        if ((cmd2 & 0x04) && (cmd2 & 0x10)) return PelcoDAction.PAN_LEFT_TILT_DOWN;
        if ((cmd2 & 0x02) && (cmd2 & 0x08)) return PelcoDAction.PAN_RIGHT_TILT_UP;
        if ((cmd2 & 0x02) && (cmd2 & 0x10)) return PelcoDAction.PAN_RIGHT_TILT_DOWN;

        // Check individual movements
        if (cmd2 & PELCO_D_CONSTANTS.CMD2_PAN_LEFT) return PelcoDAction.PAN_LEFT;
        if (cmd2 & PELCO_D_CONSTANTS.CMD2_PAN_RIGHT) return PelcoDAction.PAN_RIGHT;
        if (cmd2 & PELCO_D_CONSTANTS.CMD2_TILT_UP) return PelcoDAction.TILT_UP;
        if (cmd2 & PELCO_D_CONSTANTS.CMD2_TILT_DOWN) return PelcoDAction.TILT_DOWN;
        if (cmd2 & PELCO_D_CONSTANTS.CMD2_ZOOM_IN) return PelcoDAction.ZOOM_IN;
        if (cmd2 & PELCO_D_CONSTANTS.CMD2_ZOOM_OUT) return PelcoDAction.ZOOM_OUT;
        if (cmd2 & PELCO_D_CONSTANTS.CMD2_FOCUS_FAR) return PelcoDAction.FOCUS_FAR;
        if (cmd1 & PELCO_D_CONSTANTS.CMD1_FOCUS_NEAR) return PelcoDAction.FOCUS_NEAR;

        // If no movement detected, it's a stop command
        if (cmd1 === 0x00 && cmd2 === 0x00) return PelcoDAction.STOP;

        return undefined;
    }

    /**
     * Decode a PELCO-D packet
     */
    public static decode(buffer: Buffer): DecodedPelcoD {
        const checksumValid = this.verifyChecksum(buffer);
        const packet = this.parsePacket(buffer);

        if (!packet) {
            return {
                valid: false,
                cameraId: 0,
                command1: 0,
                command2: 0,
                data1: 0,
                data2: 0,
                rawPacket: buffer,
                checksumValid: false
            };
        }

        const action = this.determineAction(packet.command1, packet.command2);

        return {
            valid: checksumValid && action !== undefined,
            cameraId: packet.address,
            action: action,
            command1: packet.command1,
            command2: packet.command2,
            data1: packet.data1,
            data2: packet.data2,
            rawPacket: buffer,
            checksumValid: checksumValid
        };
    }

    /**
     * Get human-readable description of a decoded packet
     */
    public static describe(decoded: DecodedPelcoD): string {
        if (!decoded.valid) {
            return 'Invalid PELCO-D packet';
        }

        const parts: string[] = [];
        parts.push(`Camera ${decoded.cameraId}`);

        if (decoded.action) {
            parts.push(`Action: ${decoded.action}`);
        }

        // Add speed information
        if (decoded.data1 > 0) {
            parts.push(`Pan Speed: ${decoded.data1}`);
        }
        if (decoded.data2 > 0) {
            parts.push(`Tilt/Zoom/Focus Speed: ${decoded.data2}`);
        }

        return parts.join(' | ');
    }

    /**
     * Convert decoded packet to JSON for logging
     */
    public static toJSON(decoded: DecodedPelcoD): object {
        return {
            valid: decoded.valid,
            checksumValid: decoded.checksumValid,
            cameraId: decoded.cameraId,
            action: decoded.action,
            command1: `0x${decoded.command1.toString(16).padStart(2, '0').toUpperCase()}`,
            command2: `0x${decoded.command2.toString(16).padStart(2, '0').toUpperCase()}`,
            data1: decoded.data1,
            data2: decoded.data2,
            rawHex: decoded.rawPacket.toString('hex').toUpperCase()
        };
    }

    /**
     * Validate if buffer could be a PELCO-D packet
     */
    public static isValidPelcoDPacket(buffer: Buffer): boolean {
        return buffer.length === PELCO_D_CONSTANTS.PACKET_LENGTH &&
               buffer[0] === PELCO_D_CONSTANTS.START_BYTE &&
               this.verifyChecksum(buffer);
    }
}
