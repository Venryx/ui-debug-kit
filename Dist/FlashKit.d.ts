import React from "react";
import { RequiredBy } from "./Utils/@Internal/Types.js";
export declare class FlashElementOptions {
    el: HTMLElement;
    color: string;
    text: string;
    fontSize: number;
    duration: number;
    thickness: number;
}
export declare function FlashElement(options: RequiredBy<Partial<FlashElementOptions>, "el">): void;
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
