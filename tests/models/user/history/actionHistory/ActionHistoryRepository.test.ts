import { actionHistoryMetadataRepository, ActionHistoryMetadataRepository} from "@/models/user/history/actionHistory/ActionHistoryMetadataRepository"

test('Should Initialize ActionHistoryMetadataRepository Object', () => {
	const repo = new ActionHistoryMetadataRepository();
	expect(repo.histories.length).toBe(actionHistoryMetadataRepository.histories.length);
	const history = repo.getActionHistoryInterfaceByIdentifiers('PLANT', 'ONION', 'harvested');
	expect(history).toBeTruthy();
})

test('Should Create ActionHistoryInterface By Name', () => {
	const history = actionHistoryMetadataRepository.getActionHistoryInterfaceByName("Total Plants Harvested");
	expect(history).toBeTruthy();
	expect(history?.quantity).toBe(0);
	expect(history?.name).toBe("Total Plants Harvested");
	expect(history?.description).toBe("The number of plants harvested by this user");
	expect(history?.identifier).toBe("plant:all:harvested");
})

test('Should Not Create Invalid ActionHistoryInterface By Name', () => {
	const history = actionHistoryMetadataRepository.getActionHistoryInterfaceByName("Invalid name");
	expect(history).toBe(null);
})

test('Should Create ActionHistoryInterface By Identifiers', () => {
	const history = actionHistoryMetadataRepository.getActionHistoryInterfaceByIdentifiers("plant", "all", "harvested");
	expect(history).toBeTruthy();
	expect(history?.quantity).toBe(0);
	expect(history?.name).toBe("Total Plants Harvested");
	expect(history?.description).toBe("The number of plants harvested by this user");
	expect(history?.identifier).toBe("plant:all:harvested");
})

test('Should Not Create Invalid ActionHistoryInterface By Identifiers', () => {
	const history = actionHistoryMetadataRepository.getActionHistoryInterfaceByIdentifiers("Invalid name", "", "");
	expect(history).toBe(null);
})

test('Should Create ActionHistoryInterface By Identifier String', () => {
	const history = actionHistoryMetadataRepository.getActionHistoryInterfaceByIdentifierString("plant:all:harvested");
	expect(history).toBeTruthy();
	expect(history?.quantity).toBe(0);
	expect(history?.name).toBe("Total Plants Harvested");
	expect(history?.description).toBe("The number of plants harvested by this user");
	expect(history?.identifier).toBe("plant:all:harvested");
})

test('Should Not Create Invalid ActionHistoryInterface By Identifier String', () => {
	const history = actionHistoryMetadataRepository.getActionHistoryInterfaceByIdentifierString("Invalid identifier");
	expect(history).toBe(null);
})