import { actionHistoryRepository, ActionHistoryRepository } from "@/models/user/history/actionHistory/ActionHistoryRepository"

test('Should Initialize ActionHistoryRepository Object', () => {
	const repo = new ActionHistoryRepository();
	expect(repo.histories.length).toBe(actionHistoryRepository.histories.length);
	const history = repo.getActionHistoryInterfaceByIdentifiers('PLANT', 'ONION', 'harvested');
	expect(history).toBeTruthy();
})

test('Should Create ActionHistoryInterface By Name', () => {
	const history = actionHistoryRepository.getActionHistoryInterfaceByName("Total Plants Harvested");
	expect(history).toBeTruthy();
	expect(history?.quantity).toBe(0);
	expect(history?.name).toBe("Total Plants Harvested");
	expect(history?.description).toBe("The number of plants harvested by this user");
	expect(history?.identifier).toBe("plant:all:harvested");
})

test('Should Not Create Invalid ActionHistoryInterface By Name', () => {
	const history = actionHistoryRepository.getActionHistoryInterfaceByName("Invalid name");
	expect(history).toBe(null);
})

test('Should Create ActionHistoryInterface By Identifiers', () => {
	const history = actionHistoryRepository.getActionHistoryInterfaceByIdentifiers("plant", "all", "harvested");
	expect(history).toBeTruthy();
	expect(history?.quantity).toBe(0);
	expect(history?.name).toBe("Total Plants Harvested");
	expect(history?.description).toBe("The number of plants harvested by this user");
	expect(history?.identifier).toBe("plant:all:harvested");
})

test('Should Not Create Invalid ActionHistoryInterface By Identifiers', () => {
	const history = actionHistoryRepository.getActionHistoryInterfaceByIdentifiers("Invalid name", "", "");
	expect(history).toBe(null);
})

test('Should Create ActionHistoryInterface By Identifier String', () => {
	const history = actionHistoryRepository.getActionHistoryInterfaceByIdentifierString("plant:all:harvested");
	expect(history).toBeTruthy();
	expect(history?.quantity).toBe(0);
	expect(history?.name).toBe("Total Plants Harvested");
	expect(history?.description).toBe("The number of plants harvested by this user");
	expect(history?.identifier).toBe("plant:all:harvested");
})

test('Should Not Create Invalid ActionHistoryInterface By Identifier String', () => {
	const history = actionHistoryRepository.getActionHistoryInterfaceByIdentifierString("Invalid identifier");
	expect(history).toBe(null);
})