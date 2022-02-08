import React from "react";
import { RequiredBy } from "./Utils/@Internal/Types.js";
export declare class FlashElementOptions {
    static defaults: Partial<FlashElementOptions>;
    static finalize: (opts: FlashElementOptions) => any;
    el: HTMLElement;
    color: string;
    text: string;
    fontSize: number;
    duration: number;
    thickness: number;
    waitForPriorFlashes: boolean;
}
export declare const elementFlashQueues: WeakMap<Element, FlashQueue>;
export declare function GetFlashQueueFor(el: Element): FlashQueue;
export declare class FlashQueue {
    queue: FlashEntry[];
    lastShown_index: number;
    get LatestEntry(): FlashEntry;
    get LastShown(): FlashEntry;
    get CurrentlyVisibleEntry(): FlashEntry | null;
    get EntriesToStillStart(): FlashEntry[];
    lastSequenceStarter_index: number;
}
export declare class FlashEntry {
    constructor(data: RequiredBy<Partial<FlashEntry>, "queue" | "opt" | "indexInSequence">);
    queue: FlashQueue;
    opt: FlashElementOptions;
    idAsClass: string;
    indexInSequence: number;
    styleForTextPseudoEl: HTMLStyleElement;
    timeoutID: number;
    Show(): Promise<void>;
    ClearEffects(): void;
    completed: boolean;
    completionPromise: Promise<void>;
    completionPromise_resolve: () => void;
    CompleteNow(): void;
}
export declare function FlashElement(options: RequiredBy<Partial<FlashElementOptions>, "el">): Promise<void>;
export declare function FlashComp(comp: React.Component | HTMLElement | null | undefined, options?: Partial<FlashElementOptions> & {
    wait?: number;
}): void;
export declare const flashCustomizationsByComp: Map<string, FlashCustomizations>;
export declare class FlashCustomizations {
    enabled: boolean;
    durationOverride?: number;
    SetEnabled(enabled: boolean | 1 | 0): void;
    SetDurationOverride(duration: number | -1 | undefined): void;
}
export declare function GetFlashCustomizationsForComp(compName: string): FlashCustomizations;
