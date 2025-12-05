/**
 * SMART Protocol Encoder
 * Builds SMART packets with proper checksum calculation
 */

import {
    SmartPacket,
    SmartCommand,
    SmartCommandParams,
    RapidFocusParams,
    MultiObjectScanParams,
    SmartTrackingParams,
    AutoRecordParams,
    FocusMode,
    TrackingMode,
    RecordReason,
    SMART_CONSTANTS
} from '../types/smart.types';

export class SmartEncoder {
    /**
     * Calculate SMART checksum
     * Checksum = (CameraId + SmartCmd + P1 + P2 + P3) % 256
     */
    private static calculateChecksum(
        cameraId: number,
        smartCmd: number,
        param1: number,
        param2: number,
        param3: number
    ): number {
        return (cameraId + smartCmd + param1 + param2 + param3) % 256;
    }

    /**
     * Create a SMART packet
     */
    public static createPacket(
        cameraId: number,
        smartCmd: number,
        param1: number = 0,
        param2: number = 0,
        param3: number = 0
    ): SmartPacket {
        const checksum = this.calculateChecksum(cameraId, smartCmd, param1, param2, param3);
        
        return {
            header: SMART_CONSTANTS.HEADER_BYTE,
            cameraId: cameraId & 0xFF,
            smartCmd: smartCmd & 0xFF,
            param1: param1 & 0xFF,
            param2: param2 & 0xFF,
            param3: param3 & 0xFF,
            checksum: checksum
        };
    }

    /**
     * Convert packet to Buffer
     */
    public static packetToBuffer(packet: SmartPacket): Buffer {
        return Buffer.from([
            packet.header,
            packet.cameraId,
            packet.smartCmd,
            packet.param1,
            packet.param2,
            packet.param3,
            packet.checksum
        ]);
    }

    /**
     * Build a complete SMART command
     */
    public static buildCommand(params: SmartCommandParams): Buffer {
        const packet = this.createPacket(
            params.cameraId,
            params.command,
            params.param1 || 0,
            params.param2 || 0,
            params.param3 || 0
        );
        return this.packetToBuffer(packet);
    }

    /**
     * SMART_CMD 0x10 - Rapid Focus Adaptation
     * Recalcul Autofocus + Varifocal + Distance
     */
    public static rapidFocusAdaptation(params: RapidFocusParams): Buffer {
        return this.buildCommand({
            cameraId: params.cameraId,
            command: SmartCommand.RAPID_FOCUS,
            param1: params.mode,
            param2: 0,  // Reserved
            param3: 0   // Reserved
        });
    }

    /**
     * SMART_CMD 0x20 - Multi-Object Classification Snapshot
     * Commande de scan intelligent
     */
    public static multiObjectScan(params: MultiObjectScanParams): Buffer {
        return this.buildCommand({
            cameraId: params.cameraId,
            command: SmartCommand.MULTI_OBJECT_SCAN,
            param1: 0,
            param2: 0,
            param3: 0
        });
    }

    /**
     * SMART_CMD 0x30 - Smart Tracking Lock
     * Demande de suivre un objet ID
     */
    public static smartTrackingLock(params: SmartTrackingParams): Buffer {
        return this.buildCommand({
            cameraId: params.cameraId,
            command: SmartCommand.SMART_TRACKING,
            param1: params.objectId,
            param2: params.mode,
            param3: 0  // Reserved
        });
    }

    /**
     * SMART_CMD 0x40 - Auto-Record + Edge Learning Trigger
     */
    public static autoRecord(params: AutoRecordParams): Buffer {
        return this.buildCommand({
            cameraId: params.cameraId,
            command: SmartCommand.AUTO_RECORD,
            param1: params.start ? 1 : 0,
            param2: params.reason,
            param3: params.duration
        });
    }

    /**
     * Helper methods for quick access
     */

    // Rapid Focus helpers
    public static rapidFocusAuto(cameraId: number): Buffer {
        return this.rapidFocusAdaptation({ cameraId, mode: FocusMode.AUTO });
    }

    public static rapidFocusLowLight(cameraId: number): Buffer {
        return this.rapidFocusAdaptation({ cameraId, mode: FocusMode.LOW_LIGHT });
    }

    public static rapidFocusFastMoving(cameraId: number): Buffer {
        return this.rapidFocusAdaptation({ cameraId, mode: FocusMode.FAST_MOVING });
    }

    // Tracking helpers
    public static trackObjectNormal(cameraId: number, objectId: number): Buffer {
        return this.smartTrackingLock({ 
            cameraId, 
            objectId, 
            mode: TrackingMode.NORMAL 
        });
    }

    public static trackObjectAggressive(cameraId: number, objectId: number): Buffer {
        return this.smartTrackingLock({ 
            cameraId, 
            objectId, 
            mode: TrackingMode.AGGRESSIVE 
        });
    }

    public static trackObjectStealth(cameraId: number, objectId: number): Buffer {
        return this.smartTrackingLock({ 
            cameraId, 
            objectId, 
            mode: TrackingMode.STEALTH 
        });
    }

    // Record helpers
    public static startRecordManual(cameraId: number, duration: number): Buffer {
        return this.autoRecord({ 
            cameraId, 
            start: true, 
            reason: RecordReason.MANUAL, 
            duration 
        });
    }

    public static startRecordObject(cameraId: number, duration: number): Buffer {
        return this.autoRecord({ 
            cameraId, 
            start: true, 
            reason: RecordReason.OBJECT, 
            duration 
        });
    }

    public static startRecordAlert(cameraId: number, duration: number): Buffer {
        return this.autoRecord({ 
            cameraId, 
            start: true, 
            reason: RecordReason.ALERT, 
            duration 
        });
    }

    public static stopRecord(cameraId: number): Buffer {
        return this.autoRecord({ 
            cameraId, 
            start: false, 
            reason: RecordReason.MANUAL, 
            duration: 0 
        });
    }
}
