import React from "react";
import { FlashOptions } from "./FlashKit/FlashEntry.js";
import { RequiredBy } from "./Utils/@Internal/Types.js";
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
