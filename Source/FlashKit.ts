import React from "react";
import ReactDOM from "react-dom";
import {n, RequiredBy} from "./Utils/@Internal/Types.js";
import {GetHashForString_cyrb53, RNG_Mulberry32} from "./Utils/PRNG.js";

function FindDOM(comp: React.Component|n) {
	if (comp == null) return null;
	return ReactDOM.findDOMNode(comp) as Element;
}

export class FlashOptions {
	// parent project can set defaults for the values here (applied in FlashElement() func)
	static defaults: Partial<FlashOptions> = {};
	static finalizers = [] as Array<(opts: FlashOptions)=>any>;
	/** Useful for chaining in console. Example: FlashKit.FlashOptions.AddFinalizer_TextMustContain("...").ClearEarlier() */
	static finalizerChainHelpers = {
		ClearEarlier: ()=>{
			FlashOptions.finalizers.splice(0, FlashOptions.finalizers.length - 1);
			return FlashOptions.finalizerChainHelpers;
		},
	}
	static AddFinalizer_TextMustContain(textToContain: string) {
		FlashOptions.finalizers.push(opts=>{
			if (!opts.text.includes(textToContain)) {
				opts.enabled = false;
			}
		});
		return FlashOptions.finalizerChainHelpers;
	}

	enabled = true;
	el: HTMLElement;
	color = "red";
	duration = 3;
	waitForPriorFlashes = true;

	// outline
	outlineEnabled = true;
	thickness = 5;

	// text
	textEnabled = true;
	background = "rgba(0,0,0,.7)";
	text = "";
	fontSize = 13;
}
const tempElHolder = document.getElementById("hidden_early");

export const elementFlashQueues = new WeakMap<Element, FlashQueue>();
export function GetFlashQueueFor(el: Element) {
	if (!elementFlashQueues.has(el)) elementFlashQueues.set(el, new FlashQueue());
	return elementFlashQueues.get(el)!;
}
export class FlashQueue {
	queue: FlashEntry[] = [];
	lastShown_index: number;
	get LatestEntry() { return this.queue.slice(-1)[0]; }
	get LastShown() { return this.queue[this.lastShown_index]; }
	get CurrentlyVisibleEntry() {
		return this.LastShown && !this.LastShown.completed ? this.LastShown : null;
	}
	get EntriesToStillStart() {
		return this.queue.slice(this.lastShown_index + 1);
	}
	lastSequenceStarter_index: number;
}
export class FlashEntry {
	constructor(data: RequiredBy<Partial<FlashEntry>, "queue" | "opt" | "indexInSequence">) {
		this.idAsClass = `flash_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
		this.completionPromise = new Promise(resolve=>this.completionPromise_resolve = resolve);
		Object.assign(this, data);
	}
	queue: FlashQueue;
	opt: FlashOptions;
	idAsClass: string;
	indexInSequence: number;

	styleForTextPseudoEl: HTMLStyleElement;
	timeoutID: number;
	get WasShown() { return this.timeoutID != null; }
	Show() {
		this.queue.lastShown_index = this.queue.queue.indexOf(this);
		if (this.opt.outlineEnabled) {
			this.opt.el.style.outline = `${this.opt.thickness}px solid ${this.opt.color}`;
		}
	
		if (this.opt.textEnabled) {
			this.opt.el.classList.add(this.idAsClass);
			const indexInSequence_str = this.indexInSequence == 0 ? "" : `[+${this.indexInSequence}] `;

			this.styleForTextPseudoEl = document.createElement("style");
			tempElHolder?.appendChild(this.styleForTextPseudoEl);
			this.styleForTextPseudoEl.innerHTML = `
				.${this.idAsClass}:before {
					position: absolute;
					left: 0;
					bottom: 0;
					z-index: 100;
					padding: 3px 5px;
					background: ${this.opt.background};
					content: ${JSON.stringify(indexInSequence_str + this.opt.text)};
					color: ${this.opt.color};
					font-weight: bold;
					font-size: ${this.opt.fontSize}px;
				}
			`;
			}

		//await new Promise(resolve=>setTimeout(resolve, this.opt.duration == -1 ? 100_000_000_000 : this.opt.duration * 1000));
		this.timeoutID = setTimeout(()=>{
			this.CompleteNow();
		}, this.opt.duration == -1 ? 100_000_000_000 : this.opt.duration * 1000);

		return this.completionPromise;
	}
	ClearEffects() {
		// clear UI changes made
		this.opt.el.classList.remove(this.idAsClass);
		this.opt.el.style.outline = "none";
		if (this.styleForTextPseudoEl) this.styleForTextPseudoEl.remove();
	}

	completed = false;
	completionPromise: Promise<void>;
	completionPromise_resolve: ()=>void;
	CompleteNow() {
		if (this.WasShown) {
			clearTimeout(this.timeoutID);
			this.ClearEffects();
		}

		this.completed = true;
		this.completionPromise_resolve();
	}
}

export async function FlashElement(options: RequiredBy<Partial<FlashOptions>, "el">) {
	const opt = Object.assign(new FlashOptions(), FlashOptions.defaults, options);
	for (const finalizer of FlashOptions.finalizers) {
		finalizer(opt);
	}
	if (!opt.enabled) return;

	const queue = GetFlashQueueFor(options.el);
	const entry = new FlashEntry({
		queue, opt,
		indexInSequence: queue.CurrentlyVisibleEntry != null ? queue.LatestEntry.indexInSequence + 1 : 0,
	});
	const latestEntryOtherThanSelf = queue.LatestEntry;
	queue.queue.push(entry);

	if (queue.CurrentlyVisibleEntry) {
		if (opt.waitForPriorFlashes) {
			await latestEntryOtherThanSelf.completionPromise;
		} else {
			queue.CurrentlyVisibleEntry.CompleteNow();
			for (const entry of queue.EntriesToStillStart) {
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
};