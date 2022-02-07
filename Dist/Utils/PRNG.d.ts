export declare function GetHashForString_cyrb53(str: String, seed?: number): number;
export declare class RNG_Mulberry32 {
    constructor(seed_int: number, stateShiftsForInit?: number);
    state: number;
    GetNextUint32(): number;
    /** Returns a float between 0[inclusive] and 1[exclusive] -- like Math.random(). */
    GetNextFloat(): number;
}
