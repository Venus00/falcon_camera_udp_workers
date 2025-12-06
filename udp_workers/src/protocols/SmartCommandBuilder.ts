/**
 * SMART Command Builder
 * High-level interface for building SMART commands
 */

import { SmartEncoder } from './SmartEncoder';
import {
    FocusMode,
    TrackingMode,
    RecordReason,
    SmartCommandParams
} from '../types/smart.types';

export class SmartCommandBuilder {
    private cameraId: number;

    constructor(cameraId: number = 1) {
        this.cameraId = cameraId;
    }

    /**
     * Set the camera ID
     */
    public setCamera(cameraId: number): this {
        this.cameraId = cameraId;
        return this;
    }

    /**
     * Get current camera ID
     */
    public getCamera(): number {
        return this.cameraId;
    }

    /**
     * SMART_CMD 0x10 - Rapid Focus Adaptation
     */
    public rapidFocusAuto(): Buffer {
        return SmartEncoder.rapidFocusAuto(this.cameraId);
    }

    public rapidFocusLowLight(): Buffer {
        return SmartEncoder.rapidFocusLowLight(this.cameraId);
    }

    public rapidFocusFastMoving(): Buffer {
        return SmartEncoder.rapidFocusFastMoving(this.cameraId);
    }

    public rapidFocus(mode: FocusMode): Buffer {
        return SmartEncoder.rapidFocusAdaptation({ cameraId: this.cameraId, mode });
    }

    /**
     * SMART_CMD 0x20 - Multi-Object Classification Snapshot
     */
    public multiObjectScan(): Buffer {
        return SmartEncoder.multiObjectScan({ cameraId: this.cameraId });
    }

    /**
     * SMART_CMD 0x30 - Smart Tracking Lock
     */
    public trackObjectNormal(objectId: number): Buffer {
        return SmartEncoder.trackObjectNormal(this.cameraId, objectId);
    }

    public trackObjectAggressive(objectId: number): Buffer {
        return SmartEncoder.trackObjectAggressive(this.cameraId, objectId);
    }

    public trackObjectStealth(objectId: number): Buffer {
        return SmartEncoder.trackObjectStealth(this.cameraId, objectId);
    }

    public trackObject(objectId: number, mode: TrackingMode): Buffer {
        return SmartEncoder.smartTrackingLock({
            cameraId: this.cameraId,
            objectId,
            mode
        });
    }

    /**
     * SMART_CMD 0x40 - Auto-Record + Edge Learning Trigger
     */
    public startRecordManual(duration: number): Buffer {
        return SmartEncoder.startRecordManual(this.cameraId, duration);
    }

    public startRecordObject(duration: number): Buffer {
        return SmartEncoder.startRecordObject(this.cameraId, duration);
    }

    public startRecordAlert(duration: number): Buffer {
        return SmartEncoder.startRecordAlert(this.cameraId, duration);
    }

    public startRecord(reason: RecordReason, duration: number): Buffer {
        return SmartEncoder.autoRecord({
            cameraId: this.cameraId,
            start: true,
            reason,
            duration
        });
    }

    public stopRecord(): Buffer {
        return SmartEncoder.stopRecord(this.cameraId);
    }

    /**
     * Build custom command with raw parameters
     */
    public custom(params: Omit<SmartCommandParams, 'cameraId'>): Buffer {
        return SmartEncoder.buildCommand({
            ...params,
            cameraId: this.cameraId
        });
    }
}
