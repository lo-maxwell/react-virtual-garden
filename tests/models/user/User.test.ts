import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { PlantTemplate } from "@/models/items/templates/models/PlantTemplate";
import LevelSystem from "@/models/level/LevelSystem";
import ActionHistory from "@/models/user/history/actionHistory/ActionHistory";
import { ActionHistoryList } from "@/models/user/history/ActionHistoryList";
import ItemHistory from "@/models/user/history/itemHistory/ItemHistory";
import { PlantHistory } from "@/models/user/history/itemHistory/PlantHistory";
import { ItemHistoryList } from "@/models/user/history/ItemHistoryList";
import User from "@/models/user/User";
import { parse } from "path";

test('Should Initialize User Object', () => {
	const user = new User('test', '', new LevelSystem(100));
	expect(user.getUsername()).toBe('test');
	expect(user.getIcon()).toBe('');
	expect(user.getLevel()).toBe(100);
	expect(user.getCurrentExp()).toBe(0);
	expect(user.getExpToLevelUp()).toBe(10100);
	user.setUsername('abc');
	expect(user.getUsername()).toBe('abc');
	user.setIcon('abc');
	expect(user.getIcon()).toBe('abc');
	expect(user.getGrowthRate()).toBe(1);
	user.addExp(10100);
	expect(user.getLevel()).toBe(101);
})


test('Should Create User Object From PlainObject', () => {
	const user = new User('test', '', new LevelSystem(100), new ItemHistoryList([new PlantHistory(placeholderItemTemplates.getPlacedItemTemplateByName('apple') as PlantTemplate, 1)]), new ActionHistoryList([new ActionHistory("test history", "", "", 1)]));
	const serializedUser = JSON.stringify(user.toPlainObject());
	const parsedUser = User.fromPlainObject(JSON.parse(serializedUser));
	expect(parsedUser).toBeTruthy();
	expect(parsedUser.getLevel()).toBe(100);
	expect(parsedUser.getUsername()).toBe('test');
	expect(parsedUser.getItemHistory().contains(placeholderItemTemplates.getPlacedItemTemplateByName('apple') as PlantTemplate).payload).toBe(true);
	expect(parsedUser.getActionHistory().contains("test history").payload).toBe(true);
})

test('Should Not Create Invalid User Object From PlainObject', () => {	
	//Mute console error
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const corruptedUser1 = User.fromPlainObject({username: 123});
	expect(corruptedUser1.getUsername()).toBe('Error User');
	const corruptedUser2 = User.fromPlainObject(123);
	expect(corruptedUser2.getUsername()).toBe('Error User');
	const corruptedUser3 = User.fromPlainObject({username: '123', icon: 123});
	expect(corruptedUser3.getUsername()).toBe('Error User');
	consoleErrorSpy.mockRestore();
})