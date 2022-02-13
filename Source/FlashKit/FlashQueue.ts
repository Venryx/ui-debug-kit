import {KeyboardEvent, KeyboardEventHandler} from "react";
import {FlashEntry} from "./FlashEntry.js";

export let debugModeEnabled = false;
export function debugMode_keyListener(this: Document, ev: DocumentEventMap["keydown"]) {
	const IndexInRange = (index: number)=>index >= 0 && index < globalQueue.queue.length;
	let newIndex = -1;
	if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "ControlRight"].includes(ev.code)) {
		if (ev.code == "ArrowLeft") newIndex = (globalQueue.lastShown_index ?? -1) - 1;
		else if (ev.code == "ArrowRight") newIndex = (globalQueue.lastShown_index ?? -1) + 1;
		else if (ev.code == "ArrowUp") newIndex = 0;
		else if (ev.code == "ArrowDown") newIndex = globalQueue.queue.length - 1;
		else if (ev.code == "ControlRight") newIndex = globalQueue.lastShown_index; // this just re-shows the current entry (eg. to remove fade)

		if (ev.code != "ControlRight") ev.preventDefault();
	}
	else return;

	// try keep in range
	if (newIndex < 0) newIndex = 0;
	else if (newIndex >= globalQueue.queue.length) newIndex = globalQueue.queue.length - 1;
	
	if (IndexInRange(newIndex)) {
		const entry = globalQueue.queue[newIndex]
		console.log(`Showing flash-entry. @index:${newIndex} @latest:${globalQueue.queue.length - 1} @entry:`, entry)

		// cancel any "fade timers" that are active from other flash-entries on this element
		for (const otherEntry of globalQueue.queue.filter(a=>a.opt.el == entry.opt.el)) {
			otherEntry.ClearTimeouts();
		}
		
		entry.Show();
		globalQueue.lastShown_index = newIndex;
	}
}
export function SetDebugMode(enabled: boolean) {
	debugModeEnabled = enabled;
	if (enabled) {
		document.addEventListener("keydown", debugMode_keyListener);	
	} else {
		document.removeEventListener("keydown", debugMode_keyListener);
	}
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

export let globalQueue = new FlashQueue();