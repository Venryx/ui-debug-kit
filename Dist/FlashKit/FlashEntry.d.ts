import { RequiredBy } from "../Utils/@Internal/Types.js";
import { FlashQueue } from "./FlashQueue.js";
export declare class FinalizerEntry {
    constructor(data: RequiredBy<Partial<FinalizerEntry>, "func">);
    func: (opts: FlashOptions) => any;
    tags: string[];
}
export declare class FlashOptions {
    static defaults: Partial<FlashOptions>;
    static finalizers: FinalizerEntry[];
    /** Useful for chaining in console. Example: FlashKit.FlashOptions.AddFinalizer_TextMustContain("...").ClearEarlier() */
    static finalizerChainHelpers: {
        ClearDyn: () => any;
        ClearTagged: (...tags: string[]) => any;
        ClearEarlier: () => any;
    };
    static AddFinalizer_TextMustContain(textToContain: string, caseSensitive?: boolean, tags?: string[]): {
        ClearDyn: () => any;
        ClearTagged: (...tags: string[]) => any;
        ClearEarlier: () => any;
    };
    enabled: boolean;
    el: HTMLElement;
    color: string;
    duration: number;
    waitForPriorFlashes: boolean;
    recordStackTrace: boolean;
    fadeOverrides?: Partial<FlashOptions>;
    fadeDuration?: number;
    outlineEnabled: boolean;
    thickness: number;
    textEnabled: boolean;
    background: string;
    text: string;
    fontSize: number;
    pseudoEl_extraStyles?: string;
}
export declare const elementFlashQueues: WeakMap<Element, FlashQueue>;
export declare function GetFlashQueueFor(el: Element): FlashQueue;
export declare const MAX_TIMEOUT_DURATION = 100000000000;
export declare class FlashEntry {
    constructor(data: RequiredBy<Partial<FlashEntry>, "queue" | "opt" | "indexInSequence">);
    queue: FlashQueue;
    opt: FlashOptions;
    idAsClass: string;
    indexInSequence: number;
    stackTraceErr?: Error;
    styleForTextPseudoEl: HTMLStyleElement;
    complete_timeoutID: number;
    get WasShown(): boolean;
    fade_timeoutID: number;
    Render(faded?: boolean): void;
    Show(): Promise<void>;
    ClearTimeouts(): void;
    ClearEffects(): void;
    completed: boolean;
    completionPromise: Promise<void>;
    completionPromise_resolve: () => void;
    CompleteNow(): void;
}
