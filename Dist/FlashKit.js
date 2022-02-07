import ReactDOM from "react-dom";
import { GetHashForString_cyrb53, RNG_Mulberry32 } from "./Utils/PRNG";
function FindDOM(comp) {
    if (comp == null)
        return null;
    return ReactDOM.findDOMNode(comp);
}
export class FlashElementOptions {
    constructor() {
        this.color = "red";
        this.text = "";
        this.duration = 3;
        this.thickness = 5;
    }
}
const tempElHolder = document.getElementById("hidden_early");
export function FlashElement(options) {
    const opt = Object.assign(new FlashElementOptions(), options);
    const flashID_class = `flash_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    opt.el.classList.add(flashID_class);
    opt.el.style.outline = `${opt.thickness}px solid ${opt.color}`;
    const styleForTextPseudoEl = document.createElement("style");
    tempElHolder === null || tempElHolder === void 0 ? void 0 : tempElHolder.appendChild(styleForTextPseudoEl);
    styleForTextPseudoEl.innerHTML = `
		.${flashID_class}:before {
			position: absolute;
			left: 0;
			bottom: 0;
			z-index: 100;
			padding: 3px 5px;
			background: rgba(0,0,0,.7);
			content: ${JSON.stringify(opt.text)};
			color: ${opt.color};
			font-weight: bold;
		}
	`;
    let timeoutID; // eslint-disable-line
    const completeFlash = () => {
        // clear management
        clearTimeout(timeoutID);
        delete opt.el["currentFlash_completeNow"];
        // clear UI changes made
        opt.el.classList.remove(flashID_class);
        opt.el.style.outline = "none";
        styleForTextPseudoEl.remove();
    };
    opt.el["currentFlash_completeNow"] = completeFlash;
    timeoutID = setTimeout(completeFlash, opt.duration == -1 ? 100000000000 : opt.duration * 1000);
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
globalThis["GetFlashCustomizationsForComp"] = GetFlashCustomizationsForComp;
export function GetFlashCustomizationsForComp(compName) {
    if (!flashCustomizationsByComp.has(compName))
        flashCustomizationsByComp.set(compName, new FlashCustomizations());
    return flashCustomizationsByComp.get(compName);
}
