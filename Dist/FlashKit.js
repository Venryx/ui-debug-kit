import ReactDOM from "react-dom";
import { GetHashForString_cyrb53, RNG_Mulberry32 } from "./Utils/PRNG.js";
function FindDOM(comp) {
    if (comp == null)
        return null;
    return ReactDOM.findDOMNode(comp);
}
export class FlashOptions {
    constructor() {
        this.enabled = true;
        this.color = "red";
        this.duration = 3;
        this.waitForPriorFlashes = true;
        // outline
        this.outlineEnabled = true;
        this.thickness = 5;
        // text
        this.textEnabled = true;
        this.background = "rgba(0,0,0,.7)";
        this.text = "";
        this.fontSize = 13;
    }
    static AddFinalizer_TextMustContain(textToContain) {
        FlashOptions.finalizers.push(opts => {
            if (!opts.text.includes(textToContain)) {
                opts.enabled = false;
            }
        });
        return FlashOptions.finalizerChainHelpers;
    }
}
// parent project can set defaults for the values here (applied in FlashElement() func)
FlashOptions.defaults = {};
FlashOptions.finalizers = [];
/** Useful for chaining in console. Example: FlashKit.FlashOptions.AddFinalizer_TextMustContain("...").ClearEarlier() */
FlashOptions.finalizerChainHelpers = {
    ClearEarlier: () => {
        FlashOptions.finalizers.splice(0, FlashOptions.finalizers.length - 1);
        return FlashOptions.finalizerChainHelpers;
    },
};
const tempElHolder = document.getElementById("hidden_early");
export const elementFlashQueues = new WeakMap();
export function GetFlashQueueFor(el) {
    if (!elementFlashQueues.has(el))
        elementFlashQueues.set(el, new FlashQueue());
    return elementFlashQueues.get(el);
}
export class FlashQueue {
    constructor() {
        this.queue = [];
    }
    get LatestEntry() { return this.queue.slice(-1)[0]; }
    get LastShown() { return this.queue[this.lastShown_index]; }
    get CurrentlyVisibleEntry() {
        return this.LastShown && !this.LastShown.completed ? this.LastShown : null;
    }
    get EntriesToStillStart() {
        return this.queue.slice(this.lastShown_index + 1);
    }
}
export class FlashEntry {
    constructor(data) {
        this.completed = false;
        this.idAsClass = `flash_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this.completionPromise = new Promise(resolve => this.completionPromise_resolve = resolve);
        Object.assign(this, data);
    }
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
            tempElHolder === null || tempElHolder === void 0 ? void 0 : tempElHolder.appendChild(this.styleForTextPseudoEl);
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
        this.timeoutID = setTimeout(() => {
            this.CompleteNow();
        }, this.opt.duration == -1 ? 100000000000 : this.opt.duration * 1000);
        return this.completionPromise;
    }
    ClearEffects() {
        // clear UI changes made
        this.opt.el.classList.remove(this.idAsClass);
        this.opt.el.style.outline = "none";
        if (this.styleForTextPseudoEl)
            this.styleForTextPseudoEl.remove();
    }
    CompleteNow() {
        if (this.WasShown) {
            clearTimeout(this.timeoutID);
            this.ClearEffects();
        }
        this.completed = true;
        this.completionPromise_resolve();
    }
}
export async function FlashElement(options) {
    const opt = Object.assign(new FlashOptions(), FlashOptions.defaults, options);
    for (const finalizer of FlashOptions.finalizers) {
        finalizer(opt);
    }
    if (!opt.enabled)
        return;
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
        }
        else {
            queue.CurrentlyVisibleEntry.CompleteNow();
            for (const entry of queue.EntriesToStillStart) {
                entry.CompleteNow();
            }
        }
    }
    entry.Show();
}
export function FlashComp(comp, options) {
    var _a;
    if (comp == null)
        return;
    const compName = comp instanceof HTMLElement ? comp.className.split(/\s+/).filter(a => !a.startsWith("flash_")).join(" ") : comp.constructor.name;
    const customizations = (_a = flashCustomizationsByComp.get(compName)) !== null && _a !== void 0 ? _a : new FlashCustomizations();
    if (!customizations.enabled)
        return;
    const randFloat_fromCompName = new RNG_Mulberry32(GetHashForString_cyrb53(compName)).GetNextFloat();
    const flash = () => {
        var _a;
        const el = (_a = options === null || options === void 0 ? void 0 : options.el) !== null && _a !== void 0 ? _a : (comp instanceof HTMLElement ? comp : FindDOM(comp));
        if (el == null)
            return; // element must have been unmounted while a wait was in-progress
        FlashElement({
            el,
            color: `hsla(${Math.floor(randFloat_fromCompName * 360)}, 100%, 50%, 1)`,
            ...options,
            ...customizations.durationOverride != null && { duration: customizations.durationOverride },
        });
    };
    if ((options === null || options === void 0 ? void 0 : options.wait) != null) {
        setTimeout(flash, options.wait);
    }
    else {
        flash();
    }
}
export const flashCustomizationsByComp = new Map();
export class FlashCustomizations {
    constructor() {
        this.enabled = true;
    }
    // helpers for dev-tools
    SetEnabled(enabled) { this.enabled = !!enabled; }
    SetDurationOverride(duration) { this.durationOverride = duration; }
}
export function GetFlashCustomizationsForComp(compName) {
    if (!flashCustomizationsByComp.has(compName))
        flashCustomizationsByComp.set(compName, new FlashCustomizations());
    return flashCustomizationsByComp.get(compName);
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
