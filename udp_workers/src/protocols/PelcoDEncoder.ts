/**
 * PELCO-D Protocol Encoder
 * Builds PELCO-D packets with proper checksum calculation
 */

import {
    PelcoDPacket,
    PelcoDCommand,
    PtzControlParams,
    PelcoDAction,
    PELCO_D_CONSTANTS
} from '../types/pelco-d.types';

export class PelcoDEncoder {
    /**
     * Calculate PELCO-D checksum
     * Checksum = (Address + Cmd1 + Cmd2 + Data1 + Data2) % 256
     */
    private static calculateChecksum(
        address: number,
        cmd1: number,
        cmd2: number,
        data1: number,
        data2: number
    ): number {
        return (address + cmd1 + cmd2 + data1 + data2) % 256;
    }

    /**
     * Validate speed value (0x00 - 0x3F)
     */
    private static validateSpeed(speed: number): number {
        if (speed < PELCO_D_CONSTANTS.MIN_SPEED) return PELCO_D_CONSTANTS.MIN_SPEED;
        if (speed > PELCO_D_CONSTANTS.MAX_SPEED) return PELCO_D_CONSTANTS.MAX_SPEED;
        return Math.floor(speed);
    }

    /**
     * Create a PELCO-D packet
     */
    public static createPacket(
        cameraId: number,
        cmd1: number,
        cmd2: number,
        data1: number,
        data2: number
    ): PelcoDPacket {
        const checksum = this.calculateChecksum(cameraId, cmd1, cmd2, data1, data2);
        
        return {
            start: PELCO_D_CONSTANTS.START_BYTE,
            address: cameraId & 0xFF,
            command1: cmd1 & 0xFF,
            command2: cmd2 & 0xFF,
            data1: data1 & 0xFF,
            data2: data2 & 0xFF,
            checksum: checksum
        };
    }

    /**
     * Convert packet to Buffer
     */
    public static packetToBuffer(packet: PelcoDPacket): Buffer {
        return Buffer.from([
            packet.start,
            packet.address,
            packet.command1,
            packet.command2,
            packet.data1,
            packet.data2,
            packet.checksum
        ]);
    }

    /**
     * Get command bytes for specific action
     */
    public static getActionCommand(action: PelcoDAction): PelcoDCommand {
        const commands: Record<PelcoDAction, PelcoDCommand> = {
            [PelcoDAction.STOP]: { cmd1: 0x00, cmd2: 0x00, data1: 0x00, data2: 0x00 },
            [PelcoDAction.PAN_LEFT]: { cmd1: 0x00, cmd2: 0x04, data1: 0x00, data2: 0x00 },
            [PelcoDAction.PAN_RIGHT]: { cmd1: 0x00, cmd2: 0x02, data1: 0x00, data2: 0x00 },
            [PelcoDAction.TILT_UP]: { cmd1: 0x00, cmd2: 0x08, data1: 0x00, data2: 0x00 },
            [PelcoDAction.TILT_DOWN]: { cmd1: 0x00, cmd2: 0x10, data1: 0x00, data2: 0x00 },
            [PelcoDAction.ZOOM_IN]: { cmd1: 0x00, cmd2: 0x20, data1: 0x00, data2: 0x00 },
            [PelcoDAction.ZOOM_OUT]: { cmd1: 0x00, cmd2: 0x40, data1: 0x00, data2: 0x00 },
            [PelcoDAction.FOCUS_NEAR]: { cmd1: 0x01, cmd2: 0x00, data1: 0x00, data2: 0x00 },
            [PelcoDAction.FOCUS_FAR]: { cmd1: 0x00, cmd2: 0x80, data1: 0x00, data2: 0x00 },
            [PelcoDAction.PAN_LEFT_TILT_UP]: { cmd1: 0x00, cmd2: 0x0C, data1: 0x00, data2: 0x00 },
            [PelcoDAction.PAN_LEFT_TILT_DOWN]: { cmd1: 0x00, cmd2: 0x14, data1: 0x00, data2: 0x00 },
            [PelcoDAction.PAN_RIGHT_TILT_UP]: { cmd1: 0x00, cmd2: 0x0A, data1: 0x00, data2: 0x00 },
            [PelcoDAction.PAN_RIGHT_TILT_DOWN]: { cmd1: 0x00, cmd2: 0x12, data1: 0x00, data2: 0x00 }
        };

        return commands[action];
    }

    /**
     * Build a complete PTZ command
     */
    public static buildCommand(params: PtzControlParams): Buffer {
        const actionCmd = this.getActionCommand(params.action);
        let cmd1 = actionCmd.cmd1;
        let cmd2 = actionCmd.cmd2;
        let data1 = actionCmd.data1;
        let data2 = actionCmd.data2;

        // Apply speeds based on action
        switch (params.action) {
            case PelcoDAction.PAN_LEFT:
            case PelcoDAction.PAN_RIGHT:
                data1 = this.validateSpeed(params.panSpeed ?? 0x20);
                break;
            
            case PelcoDAction.TILT_UP:
            case PelcoDAction.TILT_DOWN:
                data2 = this.validateSpeed(params.tiltSpeed ?? 0x20);
                break;
            
            case PelcoDAction.ZOOM_IN:
            case PelcoDAction.ZOOM_OUT:
                data2 = this.validateSpeed(params.zoomSpeed ?? 0x20);
                break;
            
            case PelcoDAction.FOCUS_NEAR:
            case PelcoDAction.FOCUS_FAR:
                data2 = this.validateSpeed(params.focusSpeed ?? 0x20);
                break;
            
            case PelcoDAction.PAN_LEFT_TILT_UP:
            case PelcoDAction.PAN_LEFT_TILT_DOWN:
            case PelcoDAction.PAN_RIGHT_TILT_UP:
            case PelcoDAction.PAN_RIGHT_TILT_DOWN:
                data1 = this.validateSpeed(params.panSpeed ?? 0x20);
                data2 = this.validateSpeed(params.tiltSpeed ?? 0x20);
                break;
        }

        const packet = this.createPacket(params.cameraId, cmd1, cmd2, data1, data2);
        return this.packetToBuffer(packet);
    }

    /**
     * Helper methods for common commands
     */
    public static panLeft(cameraId: number, speed: number = 0x20): Buffer {
        return this.buildCommand({ cameraId, action: PelcoDAction.PAN_LEFT, panSpeed: speed });
    }

    public static panRight(cameraId: number, speed: number = 0x20): Buffer {
        return this.buildCommand({ cameraId, action: PelcoDAction.PAN_RIGHT, panSpeed: speed });
    }

    public static tiltUp(cameraId: number, speed: number = 0x20): Buffer {
        return this.buildCommand({ cameraId, action: PelcoDAction.TILT_UP, tiltSpeed: speed });
    }

    public static tiltDown(cameraId: number, speed: number = 0x20): Buffer {
        return this.buildCommand({ cameraId, action: PelcoDAction.TILT_DOWN, tiltSpeed: speed });
    }

    public static zoomIn(cameraId: number, speed: number = 0x20): Buffer {
        return this.buildCommand({ cameraId, action: PelcoDAction.ZOOM_IN, zoomSpeed: speed });
    }

    public static zoomOut(cameraId: number, speed: number = 0x20): Buffer {
        return this.buildCommand({ cameraId, action: PelcoDAction.ZOOM_OUT, zoomSpeed: speed });
    }

    public static focusNear(cameraId: number, speed: number = 0x20): Buffer {
        return this.buildCommand({ cameraId, action: PelcoDAction.FOCUS_NEAR, focusSpeed: speed });
    }

    public static focusFar(cameraId: number, speed: number = 0x20): Buffer {
        return this.buildCommand({ cameraId, action: PelcoDAction.FOCUS_FAR, focusSpeed: speed });
    }

    public static stop(cameraId: number): Buffer {
        return this.buildCommand({ cameraId, action: PelcoDAction.STOP });
    }
}
