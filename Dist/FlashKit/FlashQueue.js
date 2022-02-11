export let debugModeEnabled = false;
export function debugMode_keyListener(ev) {
    var _a, _b;
    const IndexInRange = (index) => index >= 0 && index < globalQueue.queue.length;
    let newIndex = -1;
    if (ev.code == "ArrowLeft")
        newIndex = ((_a = globalQueue.lastShown_index) !== null && _a !== void 0 ? _a : -1) - 1;
    else if (ev.code == "ArrowRight")
        newIndex = ((_b = globalQueue.lastShown_index) !== null && _b !== void 0 ? _b : -1) + 1;
    else if (ev.code == "ArrowUp")
        newIndex = 0;
    else if (ev.code == "ArrowDown")
        newIndex = globalQueue.queue.length - 1;
    if (IndexInRange(newIndex)) {
        const entry = globalQueue.queue[newIndex];
        console.log(`Showing flash-entry. @index:${newIndex} @latest:${globalQueue.queue.length - 1} @entry:`, entry);
        entry.Show();
        globalQueue.lastShown_index = newIndex;
    }
}
export function SetDebugMode(enabled) {
    debugModeEnabled = enabled;
    if (enabled) {
        document.addEventListener("keydown", debugMode_keyListener);
    }
    else {
        document.removeEventListener("keydown", debugMode_keyListener);
    }
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
export let globalQueue = new FlashQueue();
