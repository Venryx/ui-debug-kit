import React from "react";
import ReactDOM from "react-dom";
import {n, RequiredBy} from "./Utils/@Internal/Types.js";
import {GetHashForString_cyrb53, RNG_Mulberry32} from "./Utils/PRNG.js";

function FindDOM(comp: React.Component|n) {
	if (comp == null) return null;
	return ReactDOM.findDOMNode(comp) as Element;
}

export class FlashElementOptions {
	el: HTMLElement;
	color = "red";
	text = "";
	fontSize = 13;
	duration = 3;
	thickness = 5;
}
const tempElHolder = document.getElementById("hidden_early");
export function FlashElement(options: RequiredBy<Partial<FlashElementOptions>, "el">) {
	const opt = Object.assign(new FlashElementOptions(), options);
	const flashID_class = `flash_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

	opt.el.classList.add(flashID_class);
	opt.el.style.outline = `${opt.thickness}px solid ${opt.color}`;

	const styleForTextPseudoEl = document.createElement("style");
	tempElHolder?.appendChild(styleForTextPseudoEl);
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
			font-size: ${opt.fontSize}px;
		}
	`;

	let timeoutID; // eslint-disable-line
	const completeFlash = ()=>{
		// clear management
		clearTimeout(timeoutID);
		delete opt.el["currentFlash_completeNow"];
		// clear UI changes made
		opt.el.classList.remove(flashID_class);
		opt.el.style.outline = "none";
		styleForTextPseudoEl.remove();
	};

	opt.el["currentFlash_completeNow"] = completeFlash;
	timeoutID = setTimeout(completeFlash, opt.duration == -1 ? 100_000_000_000 : opt.duration * 1000);
}
export function FlashComp(comp: React.Component | HTMLElement | null | undefined, options?: Partial<FlashElementOptions> & {wait?: number}) {
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
globalThis["GetFlashCustomizationsForComp"] = GetFlashCustomizationsForComp;
export function GetFlashCustomizationsForComp(compName: string) {
	if (!flashCustomizationsByComp.has(compName)) flashCustomizationsByComp.set(compName, new FlashCustomizations());
	return flashCustomizationsByComp.get(compName)!;
}