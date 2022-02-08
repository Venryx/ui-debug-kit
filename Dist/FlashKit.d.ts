import React from "react";
import { RequiredBy } from "./Utils/@Internal/Types.js";
export declare class FlashOptions {
    static defaults: Partial<FlashOptions>;
    static finalizers: ((opts: FlashOptions) => any)[];
    /** Useful for chaining in console. Example: FlashKit.FlashOptions.AddFinalizer_TextMustContain("...").ClearEarlier() */
    static finalizerChainHelpers: {
        ClearEarlier: () => any;
    };
    static AddFinalizer_TextMustContain(textToContain: string): {
        ClearEarlier: () => any;
    };
    enabled: boolean;
    el: HTMLElement;
    color: string;
    duration: number;
    waitForPriorFlashes: boolean;
    outlineEnabled: boolean;
    thickness: number;
    textEnabled: boolean;
    background: string;
    text: string;
    fontSize: number;
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
    opt: FlashOptions;
    idAsClass: string;
    indexInSequence: number;
    styleForTextPseudoEl: HTMLStyleElement;
    timeoutID: number;
    get WasShown(): boolean;
    Show(): Promise<void>;
    ClearEffects(): void;
    completed: boolean;
    completionPromise: Promise<void>;
    completionPromise_resolve: () => void;
    CompleteNow(): void;
}
export declare function FlashElement(options: RequiredBy<Partial<FlashOptions>, "el">): Promise<void>;
export declare function FlashComp(comp: React.Component | HTMLElement | null | undefined, options?: Partial<FlashOptions> & {
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
