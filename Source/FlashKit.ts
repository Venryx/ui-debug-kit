import React from "react";
import ReactDOM from "react-dom";
import {FlashOptions, GetFlashQueueFor, FlashEntry, elementFlashQueues} from "./FlashKit/FlashEntry.js";
import {debugModeEnabled, FlashQueue, globalQueue, SetDebugMode} from "./FlashKit/FlashQueue.js";
import {n, RequiredBy} from "./Utils/@Internal/Types.js";
import {GetHashForString_cyrb53, RNG_Mulberry32} from "./Utils/PRNG.js";

function FindDOM(comp: React.Component|n) {
	if (comp == null) return null;
	return ReactDOM.findDOMNode(comp) as Element;
}

export async function FlashElement(options: RequiredBy<Partial<FlashOptions>, "el">) {
	const opt = Object.assign(new FlashOptions(), FlashOptions.defaults, options);
	for (const finalizer of FlashOptions.finalizers) {
		finalizer.func(opt);
	}
	if (!opt.enabled) return;

	const localQueue = GetFlashQueueFor(options.el);
	const entry = new FlashEntry({
		queue: localQueue, opt,
		indexInSequence: localQueue.CurrentlyVisibleEntry != null ? localQueue.LatestEntry.indexInSequence + 1 : 0,
	});
	const latestEntryOtherThanSelf = localQueue.LatestEntry;
	localQueue.queue.push(entry);
	if (debugModeEnabled) {
		globalQueue.queue.push(entry);
	}

	if (localQueue.CurrentlyVisibleEntry) {
		if (opt.waitForPriorFlashes) {
			await latestEntryOtherThanSelf.completionPromise;
		} else {
			localQueue.CurrentlyVisibleEntry.CompleteNow();
			for (const entry of localQueue.EntriesToStillStart) {
				entry.CompleteNow();
			}
		}
	}

	entry.Show();
}
export function FlashComp(comp: React.Component | HTMLElement | null | undefined, options?: Partial<FlashOptions> & {wait?: number}) {
	if (comp == null) return;
	const compName = comp instanceof HTMLElement ? comp.className.split(/\s+/).filter(a=>!a.startsWith("flash_")).join(" ") : comp.constructor.name;
	const customizations = flashCustomizationsByComp.get(compName) ?? new FlashCustomizations();
	if (!customizations.enabled) return;

	const randFloat_fromCompName = new RNG_Mulberry32(GetHashForString_cyrb53(compName)).GetNextFloat();
	const flash = ()=>{
		const el = options?.el ?? (comp instanceof HTMLElement ? comp : FindDOM(comp) as HTMLElement);
		if (el == null) return; // element must have been unmounted while a wait was in-progress
		FlashElement({
			el,
			color: `hsla(${Math.floor(randFloat_fromCompName * 360)}, 100%, 50%, 1)`,
			...options,
			...customizations.durationOverride != null && {duration: customizations.durationOverride},
		});
	};
	if (options?.wait != null) {
		setTimeout(flash, options.wait);
	} else {
		flash();
	}
}

export const flashCustomizationsByComp = new Map<string, FlashCustomizations>();
export class FlashCustomizations {
	enabled = true;
	durationOverride?: number;

	// helpers for dev-tools
	SetEnabled(enabled: boolean | 1 | 0) { this.enabled = !!enabled; }
	SetDurationOverride(duration: number | -1 | undefined) { this.durationOverride = duration; }
}
export function GetFlashCustomizationsForComp(compName: string) {
	if (!flashCustomizationsByComp.has(compName)) flashCustomizationsByComp.set(compName, new FlashCustomizations());
	return flashCustomizationsByComp.get(compName)!;
}

// helpers for use in dev-tools (should include all exports)
globalThis.FlashKit = {
	FlashOptions,
	elementFlashQueues,
	GetFlashQueueFor,
	FlashQueue,
	FlashEntry,
	FlashElement,
	FlashComp,
	flashCustomizationsByComp,
	FlashCustomizations,
	GetFlashCustomizationsForComp,
	globalQueue,
	SetDebugMode,
};