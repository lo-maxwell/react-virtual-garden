export interface EggDetails {
    parent1: string;
    parent2: string;
    laidAt: number;
    hatchAt: number;
    isFertilized: boolean;
}

export function generateDefaultEggDetails(): EggDetails {
    const now = Date.now();
    return {
        parent1: "unknown",
        parent2: "unknown",
        laidAt: now,
        hatchAt: now + 1000 * 60 * 60 * 24, // 24 hours later (example)
        isFertilized: false
    };
}