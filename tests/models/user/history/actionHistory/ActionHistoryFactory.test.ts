import { actionHistoryFactory } from "@/models/user/history/actionHistory/ActionHistoryFactory";

test('Should Create ActionHistory By Name', () => {
	const history = actionHistoryFactory.createActionHistoryByName("Total Plants Harvested", 5);
	expect(history).toBeTruthy();
	expect(history!.getQuantity()).toBe(5);
	expect(history?.getName()).toBe("Total Plants Harvested");
	expect(history?.getDescription()).toBe("The number of plants harvested by this user");
	expect(history?.getIdentifier()).toBe("plant:all:harvested");
})

test('Should Not Create Invalid ActionHistory By Name', () => {
	const history = actionHistoryFactory.createActionHistoryByName("Invalid name", 0);
	expect(history).toBe(null);
})

test('Should Create ActionHistory By Identifiers', () => {
	const history = actionHistoryFactory.createActionHistoryByIdentifiers("plant", "all", "harvested", 5);
	expect(history).toBeTruthy();
	expect(history!.getQuantity()).toBe(5);
	expect(history?.getName()).toBe("Total Plants Harvested");
	expect(history?.getDescription()).toBe("The number of plants harvested by this user");
	expect(history?.getIdentifier()).toBe("plant:all:harvested");
})

test('Should Not Create Invalid ActionHistory By Identifiers', () => {
	const history = actionHistoryFactory.createActionHistoryByIdentifiers("Invalid name", "", "", 0);
	expect(history).toBe(null);
})

test('Should Create ActionHistory By Identifier String', () => {
	const history = actionHistoryFactory.createActionHistoryByIdentifierString("plant:all:harvested", 5);
	expect(history).toBeTruthy();
	expect(history!.getQuantity()).toBe(5);
	expect(history?.getName()).toBe("Total Plants Harvested");
	expect(history?.getDescription()).toBe("The number of plants harvested by this user");
	expect(history?.getIdentifier()).toBe("plant:all:harvested");
})

test('Should Not Create Invalid ActionHistory By Identifier String', () => {
	const history = actionHistoryFactory.createActionHistoryByIdentifierString("Invalid identifier", 0);
	expect(history).toBe(null);
})