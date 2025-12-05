/**
 * PELCO-D Command Builder
 * High-level interface for building PTZ commands
 */

import { PelcoDEncoder } from './PelcoDEncoder';
import { PtzControlParams, PelcoDAction } from '../types/pelco-d.types';

export class PelcoDCommandBuilder {
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
     * Pan left
     */
    public panLeft(speed: number = 0x20): Buffer {
        return PelcoDEncoder.panLeft(this.cameraId, speed);
    }

    /**
     * Pan right
     */
    public panRight(speed: number = 0x20): Buffer {
        return PelcoDEncoder.panRight(this.cameraId, speed);
    }

    /**
     * Tilt up
     */
    public tiltUp(speed: number = 0x20): Buffer {
        return PelcoDEncoder.tiltUp(this.cameraId, speed);
    }

    /**
     * Tilt down
     */
    public tiltDown(speed: number = 0x20): Buffer {
        return PelcoDEncoder.tiltDown(this.cameraId, speed);
    }

    /**
     * Zoom in
     */
    public zoomIn(speed: number = 0x20): Buffer {
        return PelcoDEncoder.zoomIn(this.cameraId, speed);
    }

    /**
     * Zoom out
     */
    public zoomOut(speed: number = 0x20): Buffer {
        return PelcoDEncoder.zoomOut(this.cameraId, speed);
    }

    /**
     * Focus near
     */
    public focusNear(speed: number = 0x20): Buffer {
        return PelcoDEncoder.focusNear(this.cameraId, speed);
    }

    /**
     * Focus far
     */
    public focusFar(speed: number = 0x20): Buffer {
        return PelcoDEncoder.focusFar(this.cameraId, speed);
    }

    /**
     * Stop all movement
     */
    public stop(): Buffer {
        return PelcoDEncoder.stop(this.cameraId);
    }

    /**
     * Pan left and tilt up simultaneously
     */
    public panLeftTiltUp(panSpeed: number = 0x20, tiltSpeed: number = 0x20): Buffer {
        return PelcoDEncoder.buildCommand({
            cameraId: this.cameraId,
            action: PelcoDAction.PAN_LEFT_TILT_UP,
            panSpeed,
            tiltSpeed
        });
    }

    /**
     * Pan left and tilt down simultaneously
     */
    public panLeftTiltDown(panSpeed: number = 0x20, tiltSpeed: number = 0x20): Buffer {
        return PelcoDEncoder.buildCommand({
            cameraId: this.cameraId,
            action: PelcoDAction.PAN_LEFT_TILT_DOWN,
            panSpeed,
            tiltSpeed
        });
    }

    /**
     * Pan right and tilt up simultaneously
     */
    public panRightTiltUp(panSpeed: number = 0x20, tiltSpeed: number = 0x20): Buffer {
        return PelcoDEncoder.buildCommand({
            cameraId: this.cameraId,
            action: PelcoDAction.PAN_RIGHT_TILT_UP,
            panSpeed,
            tiltSpeed
        });
    }

    /**
     * Pan right and tilt down simultaneously
     */
    public panRightTiltDown(panSpeed: number = 0x20, tiltSpeed: number = 0x20): Buffer {
        return PelcoDEncoder.buildCommand({
            cameraId: this.cameraId,
            action: PelcoDAction.PAN_RIGHT_TILT_DOWN,
            panSpeed,
            tiltSpeed
        });
    }

    /**
     * Build custom command
     */
    public custom(params: Omit<PtzControlParams, 'cameraId'>): Buffer {
        return PelcoDEncoder.buildCommand({
            ...params,
            cameraId: this.cameraId
        });
    }

    /**
     * Create a command sequence
     */
    public createSequence(): PelcoDSequence {
        return new PelcoDSequence(this.cameraId);
    }
}

/**
 * PELCO-D Command Sequence Builder
 * For creating sequences of commands with delays
 */
export class PelcoDSequence {
    private cameraId: number;
    private commands: Array<{ buffer: Buffer; delay: number }> = [];

    constructor(cameraId: number) {
        this.cameraId = cameraId;
    }

    /**
     * Add a command to the sequence
     */
    public add(buffer: Buffer, delayMs: number = 0): this {
        this.commands.push({ buffer, delay: delayMs });
        return this;
    }

    /**
     * Add pan left command
     */
    public panLeft(speed: number = 0x20, delayMs: number = 0): this {
        return this.add(PelcoDEncoder.panLeft(this.cameraId, speed), delayMs);
    }

    /**
     * Add pan right command
     */
    public panRight(speed: number = 0x20, delayMs: number = 0): this {
        return this.add(PelcoDEncoder.panRight(this.cameraId, speed), delayMs);
    }

    /**
     * Add tilt up command
     */
    public tiltUp(speed: number = 0x20, delayMs: number = 0): this {
        return this.add(PelcoDEncoder.tiltUp(this.cameraId, speed), delayMs);
    }

    /**
     * Add tilt down command
     */
    public tiltDown(speed: number = 0x20, delayMs: number = 0): this {
        return this.add(PelcoDEncoder.tiltDown(this.cameraId, speed), delayMs);
    }

    /**
     * Add zoom in command
     */
    public zoomIn(speed: number = 0x20, delayMs: number = 0): this {
        return this.add(PelcoDEncoder.zoomIn(this.cameraId, speed), delayMs);
    }

    /**
     * Add zoom out command
     */
    public zoomOut(speed: number = 0x20, delayMs: number = 0): this {
        return this.add(PelcoDEncoder.zoomOut(this.cameraId, speed), delayMs);
    }

    /**
     * Add stop command
     */
    public stop(delayMs: number = 0): this {
        return this.add(PelcoDEncoder.stop(this.cameraId), delayMs);
    }

    /**
     * Add delay
     */
    public wait(delayMs: number): this {
        if (this.commands.length > 0) {
            this.commands[this.commands.length - 1].delay += delayMs;
        }
        return this;
    }

    /**
     * Get all commands
     */
    public getCommands(): Array<{ buffer: Buffer; delay: number }> {
        return this.commands;
    }

    /**
     * Execute sequence using a send function
     */
    public async execute(sendFn: (buffer: Buffer) => Promise<void>): Promise<void> {
        for (const cmd of this.commands) {
            await sendFn(cmd.buffer);
            if (cmd.delay > 0) {
                await new Promise(resolve => setTimeout(resolve, cmd.delay));
            }
        }
    }
}
