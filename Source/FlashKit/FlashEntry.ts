import {RequiredBy} from "../Utils/@Internal/Types.js";
import {FlashQueue} from "./FlashQueue.js";

export class FinalizerEntry {
	constructor(data: RequiredBy<Partial<FinalizerEntry>, "func">) {
		Object.assign(this, data);
	}
	func: (opts: FlashOptions)=>any;
	tags = [] as string[];
}
export class FlashOptions {
	// parent project can set defaults for the values here (applied in FlashElement() func)
	static defaults: Partial<FlashOptions> = {};
	static finalizers = [] as FinalizerEntry[];
	/** Useful for chaining in console. Example: FlashKit.FlashOptions.AddFinalizer_TextMustContain("...").ClearEarlier() */
	static finalizerChainHelpers = {
		ClearDyn: ()=>FlashOptions.finalizerChainHelpers.ClearTagged("dynamic"),
		ClearTagged: (...tags: string[])=>{
			FlashOptions.finalizers = FlashOptions.finalizers.filter(entry=>{
				return tags.every(tag=>entry.tags.includes(tag));
			});
			return FlashOptions.finalizerChainHelpers;
		},
		ClearEarlier: ()=>{
			FlashOptions.finalizers.splice(0, FlashOptions.finalizers.length - 1);
			return FlashOptions.finalizerChainHelpers;
		},
	}
	static AddFinalizer_TextMustContain(textToContain: string, caseSensitive = false, tags = ["dynamic"]) {
		const finalizer = new FinalizerEntry({
			tags,
			func: opts=>{
				const strContained = caseSensitive ? opts.text.includes(textToContain) : opts.text.toLowerCase().includes(textToContain.toLowerCase());
				if (!strContained) {
					opts.enabled = false;
				}
			},
		});
		FlashOptions.finalizers.push(finalizer);
		return FlashOptions.finalizerChainHelpers;
	}

	// todo: make-so you can "scroll through" messages for an element, using arrow keys or something

	enabled = true;
	el: HTMLElement;
	color = "red";
	duration = 3;
	waitForPriorFlashes = true;

	// fade overrides
	fadeOverrides?: Partial<FlashOptions>;
	fadeDuration?: number;

	// outline
	outlineEnabled = true;
	thickness = 5;

	// text
	textEnabled = true;
	background = "rgba(0,0,0,.7)";
	text = "";
	fontSize = 13;
	pseudoEl_extraStyles?: string;
}
const tempElHolder = document.getElementById("hidden_early");

export const elementFlashQueues = new WeakMap<Element, FlashQueue>();
export function GetFlashQueueFor(el: Element) {
	if (!elementFlashQueues.has(el)) elementFlashQueues.set(el, new FlashQueue());
	return elementFlashQueues.get(el)!;
}

export const MAX_TIMEOUT_DURATION = 100_000_000_000;

export class FlashEntry {
	constructor(data: RequiredBy<Partial<FlashEntry>, "queue" | "opt" | "indexInSequence">) {
		this.idAsClass = `flash_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
		this.completionPromise = new Promise(resolve=>this.completionPromise_resolve = resolve);
		Object.assign(this, data);
	}
	queue: FlashQueue;
	opt: FlashOptions;
	idAsClass: string;
	indexInSequence: number;

	styleForTextPseudoEl: HTMLStyleElement;
	complete_timeoutID: number;
	get WasShown() { return this.complete_timeoutID != null; }
	
	fade_timeoutID: number;

	Render(faded = false) {
		const opts = {...this.opt};
		if (faded) {
			Object.assign(opts, this.opt.fadeOverrides);
		}
		
		if (opts.outlineEnabled) {
			opts.el.style.outline = `${opts.thickness}px solid ${opts.color}`;
		}
	
		if (opts.textEnabled) {
			for (const className of [...opts.el.classList as any]) {
				const classNameAsStr = className as string;
				if (classNameAsStr.startsWith("flash_")) {
					opts.el.classList.remove(className);
				}
			}
			opts.el.classList.add(this.idAsClass);
			
			const indexInSequence_str = this.indexInSequence == 0 ? "" : `[+${this.indexInSequence}] `;

			if (this.styleForTextPseudoEl == null) this.styleForTextPseudoEl = document.createElement("style");
			if (!document.contains(this.styleForTextPseudoEl)) tempElHolder?.appendChild(this.styleForTextPseudoEl);
			this.styleForTextPseudoEl.innerHTML = `
				.${this.idAsClass}:before {
					position: absolute;
					left: 0;
					bottom: 0;
					z-index: 100;
					padding: 3px 5px;
					background: ${opts.background};
					content: ${JSON.stringify(indexInSequence_str + opts.text)};
					color: ${opts.color};
					font-weight: bold;
					font-size: ${opts.fontSize}px;
					${opts.pseudoEl_extraStyles ?? ""}
				}
			`;
		}
	}
	Show() {
		this.queue.lastShown_index = this.queue.queue.indexOf(this);
		
		this.Render();

		// make sure we don't have a previous timeout still running (can happen in debug-mode)
		this.ClearTimeouts();

		//await new Promise(resolve=>setTimeout(resolve, this.opt.duration == -1 ? 100_000_000_000 : this.opt.duration * 1000));
		this.complete_timeoutID = setTimeout(()=>{
			this.CompleteNow();
		}, this.opt.duration == -1 ? MAX_TIMEOUT_DURATION : this.opt.duration * 1000);

		if (this.opt.fadeDuration != null) {
			this.fade_timeoutID = setTimeout(()=>{
				this.Render(true);
			}, this.opt.fadeDuration == -1 ? MAX_TIMEOUT_DURATION : this.opt.fadeDuration * 1000);
		}

		return this.completionPromise;
	}
	ClearTimeouts() {
		clearTimeout(this.complete_timeoutID);
		clearTimeout(this.fade_timeoutID);
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
			this.ClearTimeouts();
			this.ClearEffects();
		}

		this.completed = true;
		this.completionPromise_resolve();
	}
}