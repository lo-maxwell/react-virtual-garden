import ActionHistory from "@/models/user/history/actionHistory/ActionHistory";
import { actionHistoryFactory } from "@/models/user/history/actionHistory/ActionHistoryFactory";
import { ActionHistoryList } from "@/models/user/history/ActionHistoryList";

let allHistory: ActionHistory;
let onionHistory: ActionHistory;
let list: ActionHistoryList;

beforeEach(() => {
	allHistory = actionHistoryFactory.getActionHistoryByName("Total Plants Harvested")!;
	onionHistory = actionHistoryFactory.getActionHistoryByName("Onions Harvested")!;
	allHistory.setQuantity(10);
	onionHistory.setQuantity(10);
	list = new ActionHistoryList();
	list.addActionHistory(allHistory);

})

test('Should Initialize ActionHistoryList Object', () => {
	const newList = new ActionHistoryList([allHistory, onionHistory]);
	expect(newList.size()).toBe(2);
})


test('Should Create ActionHistoryList Object From PlainObject', () => {
	const list = new ActionHistoryList();
	list.addActionHistory(allHistory);
	list.addActionHistory(onionHistory);
	const serializedHistory = JSON.stringify(list.toPlainObject());
	const history = ActionHistoryList.fromPlainObject(JSON.parse(serializedHistory));
	expect(history).toBeTruthy();
	expect(history.containsIdentifierString("plant:all:harvested").payload).toBe(true);
	expect(history.containsIdentifierString("plant:onion:harvested").payload).toBe(true);
	expect(history.size()).toBe(2);
})

test('Should Not Create Invalid ActionHistoryList Object From PlainObject', () => {	
	//Mute console error
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const corruptedHistory1 = ActionHistoryList.fromPlainObject({});
	expect(corruptedHistory1.size()).toBe(0);
	const corruptedHistory2 = ActionHistoryList.fromPlainObject(123);
	expect(corruptedHistory2.size()).toBe(0);
	const corruptedHistory3 = ActionHistoryList.fromPlainObject({actionHistories: [allHistory]});
	expect(corruptedHistory3.size()).toBe(1);
	consoleErrorSpy.mockRestore();
})


test('Should Get History', () => {
	const getResponse = list.getHistoryByIdentifierString("plant:all:harvested");
	expect(getResponse.isSuccessful()).toBe(true);
	expect(getResponse.payload?.getName()).toBe("Total Plants Harvested");
	const getResponse2 = list.getHistoryByIdentifier("plant", "all", "HARVESTED");
	expect(getResponse2.isSuccessful()).toBe(true);
	expect(getResponse2.payload?.getName()).toBe("Total Plants Harvested");
	
})

test('Should Not Get Nonexistent History', () => {
	const getResponse = list.getHistoryByIdentifierString("plant");
	expect(getResponse.isSuccessful()).toBe(false);
	const getResponse2 = list.getHistoryByIdentifier("plant", "all", "HARVESTED item");
	expect(getResponse2.isSuccessful()).toBe(false);
})

test('Should Contain History', () => {
	const containsResponse = list.containsIdentifierString("plant:all:harvested");
	expect(containsResponse.payload).toBe(true);
	const containsResponse2 = list.containsIdentifier("plant", "all", "HARVESTED");
	expect(containsResponse2.payload).toBe(true);
})

test('Should Not Contain Nonexistent History', () => {
	const containsResponse = list.containsIdentifierString("plant");
	expect(containsResponse.payload).toBe(false);
	const containsResponse2 = list.containsIdentifier("plant", "all", "HARVESTED item");
	expect(containsResponse2.payload).toBe(false);
})

test('Should Add New History to ActionHistoryList', () => {
	//started with 1 in list
	const addResponse = list.addActionHistory(onionHistory);
	expect(addResponse.isSuccessful()).toBe(true);
	expect(list.size()).toBe(2);
})

test('Should Add Existing History to ActionHistoryList', () => {
	const addResponse = list.addActionHistory(allHistory);
	expect(addResponse.isSuccessful()).toBe(true);
	expect(list.size()).toBe(1);
	expect(list.getHistoryByIdentifierString("plant:all:harvested").payload?.getQuantity()).toBe(20);
})

test('Should Not Add Invalid History', () => {
	const invalidHistory = new ActionHistory("Total Plants Harvested", "The number of plants harvested by this user", "plant:all:harvested", -100);

	const addResponse = list.addActionHistory(invalidHistory);
	expect(addResponse.isSuccessful()).toBe(false);
	expect(list.size()).toBe(1);
	expect(list.getHistoryByIdentifierString("plant:all:harvested").payload?.getQuantity()).toBe(10);

})

test('Should Directly Update History to ActionHistoryList', () => {
	const updateResponse = list.updateActionHistory(new ActionHistory("Total Plants Harvested", "The number of plants harvested by this user", "plant:all:harvested", 15));
	expect(updateResponse.isSuccessful()).toBe(true);
	expect(updateResponse.payload?.getQuantity()).toBe(25);
	expect(list.getHistoryByIdentifierString("plant:all:harvested").payload?.getQuantity()).toBe(25);
})

test('Should Not Update Invalid History', () => {
	const updateResponse = list.updateActionHistory(new ActionHistory("Total Plants Harvested", "", "plant:all:harvested", 100));
	expect(updateResponse.isSuccessful()).toBe(false);
	expect(list.getHistoryByIdentifierString("plant:all:harvested").payload?.getQuantity()).toBe(10);
	const updateResponse2 = list.updateActionHistory(new ActionHistory("Total Plants Harvested", "", "", 100));
	expect(updateResponse2.isSuccessful()).toBe(false);
	expect(list.getHistoryByIdentifierString("plant:all:harvested").payload?.getQuantity()).toBe(10);
})

test('Should Delete History from ActionHistoryList', () => {
	const deleteResponse = list.deleteHistoryByIdentifierString(allHistory.getIdentifier());
	expect(deleteResponse.isSuccessful()).toBe(true);
	expect(list.size()).toBe(0);
	list.addActionHistory(allHistory);
	const deleteResponse2 = list.deleteHistoryByIdentifier("plant", "all", "harvested");
	expect(deleteResponse2.isSuccessful()).toBe(true);
	expect(list.size()).toBe(0);
})

test('Should Not Delete Nonexistent History from ActionHistoryList', () => {
	const deleteResponse = list.getHistoryByIdentifierString("invalid identifier");
	expect(deleteResponse.isSuccessful()).toBe(false);
	expect(list.size()).toBe(1);
	list.addActionHistory(allHistory);
	const deleteResponse2 = list.deleteHistoryByIdentifier("invalid", "identifier", "");
	expect(deleteResponse2.isSuccessful()).toBe(false);
	expect(list.size()).toBe(1);
})

test('Should Delete All Histories', () => {
	list.addActionHistory(onionHistory);
	expect(list.size()).toBe(2);
	const deleteResponse = list.deleteAll();
	expect(deleteResponse.isSuccessful()).toBe(true);
	expect(list.size()).toBe(0);
})