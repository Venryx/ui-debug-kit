import { FlashEntry } from "./FlashEntry.js";
export declare let debugModeEnabled: boolean;
export declare function debugMode_keyListener(this: Document, ev: DocumentEventMap["keydown"]): void;
export declare function SetDebugMode(enabled: boolean): void;
export declare class FlashQueue {
    queue: FlashEntry[];
    lastShown_index: number;
    get LatestEntry(): FlashEntry;
    get LastShown(): FlashEntry;
    get CurrentlyVisibleEntry(): FlashEntry | null;
    get EntriesToStillStart(): FlashEntry[];
    lastSequenceStarter_index: number;
}
export declare let globalQueue: FlashQueue;
