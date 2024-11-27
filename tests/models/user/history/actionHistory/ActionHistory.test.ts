import ActionHistory from "@/models/user/history/actionHistory/ActionHistory"
import { actionHistoryFactory } from "@/models/user/history/actionHistory/ActionHistoryFactory";
import { v4 as uuidv4 } from 'uuid';


test('Should Initialize ActionHistory Object', () => {
	const history = new ActionHistory(uuidv4(), "test history", "test", "test", 100);
	expect(history.getName()).toBe("test history");
	expect(history.getDescription()).toBe("test");
	expect(history.getIdentifier()).toBe("test");
	expect(history.getQuantity()).toBe(100);
	history.setDescription("new test");
	expect(history.getDescription()).toBe("new test");
	history.setQuantity(5);
	expect(history.getQuantity()).toBe(5);
	history.updateQuantity(100);
	expect(history.getQuantity()).toBe(105);
})

test('Should Combine ActionHistory', () => {
	const history = new ActionHistory(uuidv4(), "test history", "test", "test", 100);
	const history2 = new ActionHistory(uuidv4(), "test history", "test", "test", 100);
	const combineResponse = history.combineHistory(history2);
	expect(combineResponse.isSuccessful()).toBe(true);
	expect(history.getQuantity()).toBe(200);
})

test('Should Not Combine ActionHistory With Different Names', () => {
	let history = new ActionHistory(uuidv4(), "test history", "test", "test", 100);
	let history2 = new ActionHistory(uuidv4(), "test history 2", "test", "test", 100);
	let combineResponse = history.combineHistory(history2);
	expect(combineResponse.isSuccessful()).toBe(false);
	expect(history.getQuantity()).toBe(100);
	expect(history2.getQuantity()).toBe(100);
	history = new ActionHistory(uuidv4(), "test history", "test", "test", 100);
	history2 = new ActionHistory(uuidv4(), "test history", "test 2", "test", 100);
	combineResponse = history.combineHistory(history2);
	expect(combineResponse.isSuccessful()).toBe(false);
	expect(history.getQuantity()).toBe(100);
	expect(history2.getQuantity()).toBe(100);
	history = new ActionHistory(uuidv4(), "test history", "test", "test", 100);
	history2 = new ActionHistory(uuidv4(), "test history", "test", "test 2", 100);
	combineResponse = history.combineHistory(history2);
	expect(combineResponse.isSuccessful()).toBe(false);
	expect(history.getQuantity()).toBe(100);
	expect(history2.getQuantity()).toBe(100);
})

test('Should Not Combine ActionHistory With Invalid Quantity', () => {
	let history = new ActionHistory(uuidv4(), "test history", "test", "test", 100);
	let history2 = new ActionHistory(uuidv4(), "test history 2", "test", "test", -100);
	let combineResponse = history.combineHistory(history2);
	expect(combineResponse.isSuccessful()).toBe(false);
	expect(history.getQuantity()).toBe(100);
	expect(history2.getQuantity()).toBe(-100);
})


test('Should Create ActionHistory Object From PlainObject', () => {
	const newActionHistory1 = actionHistoryFactory.createActionHistoryByName("Total Plants Harvested", 1);
	newActionHistory1?.setQuantity(10);
	const serializedHistory = JSON.stringify(newActionHistory1?.toPlainObject());
	const history = ActionHistory.fromPlainObject(JSON.parse(serializedHistory));
	expect(history).toBeTruthy();
	expect(history?.getName()).toBe("Total Plants Harvested");
	expect(history?.getQuantity()).toBe(10);
})

test('Should Create ActionHistory Object From PlainObject With Missing Data', () => {
	const newActionHistory1 = new ActionHistory(uuidv4(), "Total Plants Harvested", "The number of plants harvested by this user", "missing identifier", 1);
	newActionHistory1?.setQuantity(10);
	const serializedHistory = JSON.stringify(newActionHistory1?.toPlainObject());
	const history = ActionHistory.fromPlainObject(JSON.parse(serializedHistory));
	expect(history).toBeTruthy();
	expect(history?.getName()).toBe("Total Plants Harvested");
	expect(history?.getIdentifier()).toBe("plant:all:harvested");
	expect(history?.getQuantity()).toBe(10);

	const newActionHistory2 = new ActionHistory(uuidv4(), "missing name", "missing description", "plant:all:harvested", 1);
	newActionHistory2?.setQuantity(10);
	const serializedHistory2 = JSON.stringify(newActionHistory2?.toPlainObject());
	const history2 = ActionHistory.fromPlainObject(JSON.parse(serializedHistory2));
	expect(history2).toBeTruthy();
	expect(history2?.getName()).toBe("Total Plants Harvested");
	expect(history2?.getIdentifier()).toBe("plant:all:harvested");
	expect(history2?.getQuantity()).toBe(10);


	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const newActionHistory3 = new ActionHistory(uuidv4(), "missing name", "missing description", "missing identifier", 1);
	newActionHistory3?.setQuantity(10);
	const serializedHistory3 = JSON.stringify(newActionHistory3?.toPlainObject());
	const history3 = ActionHistory.fromPlainObject(JSON.parse(serializedHistory3));
	expect(history3).toBeTruthy();
	expect(history3?.getName()).toBe("missing name");
	expect(history3?.getIdentifier()).toBe("missing identifier");
	expect(history3?.getQuantity()).toBe(10);

	consoleErrorSpy.mockRestore();
})

test('Should Not Create Invalid ActionHistory Object From PlainObject', () => {	
	//Mute console error
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const corruptedHistory1 = ActionHistory.fromPlainObject(JSON.parse("{}"));
	expect(corruptedHistory1).toBe(null);
	const corruptedHistory2 = ActionHistory.fromPlainObject(123);
	expect(corruptedHistory2).toBe(null);
	const corruptedHistory3 = ActionHistory.fromPlainObject({
		name: 123,
		description: "test",
		identifier: "test",
		quantity: 10,
	});
	expect(corruptedHistory3).toBe(null);
	const corruptedHistory4 = ActionHistory.fromPlainObject({
		name: "test",
		description: 123,
		identifier: "test",
		quantity: 10,
	});
	expect(corruptedHistory4).toBe(null);
	const corruptedHistory5 = ActionHistory.fromPlainObject({
		name: "test",
		description: "test",
		identifier: 123,
		quantity: 10,
	});
	expect(corruptedHistory5).toBe(null);
	const corruptedHistory6 = ActionHistory.fromPlainObject({
		name: "test",
		description: "test",
		identifier: "test",
		quantity: "10",
	});
	expect(corruptedHistory6).toBe(null);
	consoleErrorSpy.mockRestore();
})