
export const GoosePersonalities = Object.freeze({
    FRIENDLY:      { name: "friendly" },
    AGGRESSIVE:    { name: "aggressive" },
    CURIOUS:       { name: "curious" },
    SHY:           { name: "shy" },
    PLAYFUL:       { name: "playful" },
    PROUD:         { name: "proud" },
    LAZY:          { name: "lazy" },
    MISCHIEVOUS:   { name: "mischievous" },
    NERVOUS:       { name: "nervous" },
    CONFIDENT:     { name: "confident" },
	ERROR: 		   { name: "ERROR" },
} as const);

export type GoosePersonality =
    typeof GoosePersonalities[keyof typeof GoosePersonalities]["name"];

export function isGoosePersonality(value: any): value is GoosePersonality {
	return Object.values(GoosePersonalities)
		.some(p => p.name === value);
}