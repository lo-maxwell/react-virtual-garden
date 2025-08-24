export const UserEventTypes = Object.freeze({
	DAILY:   { name: "DAILYLOGIN" },
	WEEKLY: { name: "WEEKLYLOGIN" },
	SPECIAL: { name: "SPECIALREWARD" },
	ERROR: { name: "ERROR" },
  } as const);

export type UserEventType = typeof UserEventTypes[keyof typeof UserEventTypes]["name"];