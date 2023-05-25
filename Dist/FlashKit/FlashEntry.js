import { debugModeEnabled, FlashQueue } from "./FlashQueue.js";
export class FinalizerEntry {
    constructor(data) {
        this.tags = [];
        Object.assign(this, data);
    }
}
export class FlashOptions {
    constructor() {
        // todo: make-so you can "scroll through" messages for an element, using arrow keys or something
        this.enabled = true;
        this.color = "red";
        this.duration = 3;
        this.waitForPriorFlashes = true;
        this.recordStackTrace = false;
        // outline
        this.outlineEnabled = true;
        this.thickness = 5;
        // text
        this.textEnabled = true;
        this.background = "rgba(0,0,0,.7)";
        this.text = "";
        this.fontSize = 13;
    }
    static AddFinalizer_TextMustContain(textToContain, caseSensitive = false, tags = ["dynamic"]) {
        const finalizer = new FinalizerEntry({
            tags,
            func: opts => {
                const strContained = caseSensitive ? opts.text.includes(textToContain) : opts.text.toLowerCase().includes(textToContain.toLowerCase());
                if (!strContained) {
                    opts.enabled = false;
                }
            },
        });
        FlashOptions.finalizers.push(finalizer);
        return FlashOptions.finalizerChainHelpers;
    }
}
// parent project can set defaults for the values here (applied in FlashElement() func)
FlashOptions.defaults = {};
FlashOptions.finalizers = [];
/** Useful for chaining in console. Example: FlashKit.FlashOptions.AddFinalizer_TextMustContain("...").ClearEarlier() */
FlashOptions.finalizerChainHelpers = {
    ClearDyn: () => FlashOptions.finalizerChainHelpers.ClearTagged("dynamic"),
    ClearTagged: (...tags) => {
        FlashOptions.finalizers = FlashOptions.finalizers.filter(entry => {
            return tags.every(tag => entry.tags.includes(tag));
        });
        return FlashOptions.finalizerChainHelpers;
    },
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
//export const MAX_TIMEOUT_DURATION = 100_000_000_000; // edit: why did I think this was valid before?
export const MAX_TIMEOUT_DURATION = 2147483647; // max safe value for setTimeout, according to: https://stackoverflow.com/a/12351592
export class FlashEntry {
    constructor(data) {
        this.completed = false;
        this.idAsClass = `flash_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
        this.completionPromise = new Promise(resolve => this.completionPromise_resolve = resolve);
        Object.assign(this, data);
        if (this.opt.recordStackTrace) {
            this.stackTraceErr = new Error();
        }
    }
    get WasShown() { return this.complete_timeoutID != null; }
    Render(faded = false) {
        var _a;
        const opts = { ...this.opt };
        if (faded) {
            Object.assign(opts, this.opt.fadeOverrides);
        }
        if (opts.outlineEnabled) {
            opts.el.style.outline = `${opts.thickness}px solid ${opts.color}`;
        }
        if (opts.textEnabled) {
            for (const className of [...opts.el.classList]) {
                const classNameAsStr = className;
                if (classNameAsStr.startsWith("flash_")) {
                    opts.el.classList.remove(className);
                }
            }
            opts.el.classList.add(this.idAsClass);
            const indexInSequence_str = this.indexInSequence == 0 || debugModeEnabled ? "" : `[+${this.indexInSequence}] `;
            if (this.styleForTextPseudoEl == null)
                this.styleForTextPseudoEl = document.createElement("style");
            if (!document.contains(this.styleForTextPseudoEl))
                tempElHolder === null || tempElHolder === void 0 ? void 0 : tempElHolder.appendChild(this.styleForTextPseudoEl);
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
					${(_a = opts.pseudoEl_extraStyles) !== null && _a !== void 0 ? _a : ""}
				}
			`;
        }
    }
    Show() {
        this.queue.lastShown_index = this.queue.queue.indexOf(this);
        this.Render();
        //await new Promise(resolve=>setTimeout(resolve, this.opt.duration == -1 ? 100_000_000_000 : this.opt.duration * 1000));
        this.complete_timeoutID = setTimeout(() => {
            this.CompleteNow();
        }, this.opt.duration == -1 ? MAX_TIMEOUT_DURATION : this.opt.duration * 1000);
        if (this.opt.fadeDuration != null) {
            this.fade_timeoutID = setTimeout(() => {
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
        if (this.styleForTextPseudoEl)
            this.styleForTextPseudoEl.remove();
    }
    CompleteNow() {
        if (this.WasShown) {
            this.ClearTimeouts();
            this.ClearEffects();
        }
        this.completed = true;
        this.completionPromise_resolve();
    }
}
