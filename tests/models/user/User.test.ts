import Toolbox from "@/models/garden/tools/Toolbox";
import { ItemSubtypes, ItemTypes } from "@/models/items/ItemTypes";
import { Plant } from "@/models/items/placedItems/Plant";
import { generateNewPlaceholderPlacedItem } from "@/models/items/PlaceholderItems";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { PlantTemplate } from "@/models/items/templates/models/PlantTemplate";
import LevelSystem from "@/models/level/LevelSystem";
import { actionHistoryFactory } from "@/models/user/history/actionHistory/ActionHistoryFactory";
import { ActionHistoryList } from "@/models/user/history/ActionHistoryList";
import ItemHistory from "@/models/user/history/itemHistory/ItemHistory";
import { ItemHistoryList } from "@/models/user/history/ItemHistoryList";
import User from "@/models/user/User";
import { v4 as uuidv4 } from 'uuid';

test('Should Initialize User Object', () => {
	const user = new User("00000000-0000-0000-0000-000000000000", 'test', '', new LevelSystem(uuidv4(), 100), new ItemHistoryList(), new ActionHistoryList(), new Toolbox());
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
	const testActionHistory = actionHistoryFactory.createActionHistoryByName("Total Plants Harvested", 1);
	const user = new User('00000000-0000-0000-0000-000000000000', 'test', '', new LevelSystem(uuidv4(), 100), new ItemHistoryList([new ItemHistory(uuidv4(), placeholderItemTemplates.getPlacedItemTemplateByName('apple')!, 1)]), new ActionHistoryList([testActionHistory!]), new Toolbox());
	const serializedUser = JSON.stringify(user.toPlainObject());
	const parsedUser = User.fromPlainObject(JSON.parse(serializedUser));
	expect(parsedUser).toBeTruthy();
	expect(parsedUser.getLevel()).toBe(100);
	expect(parsedUser.getUsername()).toBe('test');
	expect(parsedUser.getItemHistory().contains(placeholderItemTemplates.getPlacedItemTemplateByName('apple') as PlantTemplate).payload).toBe(true);
	expect(parsedUser.getActionHistory().containsIdentifierString("plant:all:harvested").payload).toBe(true);
	parsedUser.getActionHistory().getHistoryByIdentifierString("plant:all:harvested").payload?.updateQuantity(100);
	expect(parsedUser.getActionHistory().getHistoryByIdentifierString("plant:all:harvested").payload?.getQuantity()).toBe(101);
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

test('Should Update Harvest History', () => {

	const user = new User('00000000-0000-0000-0000-000000000000', 'test', '', new LevelSystem(uuidv4(), 100), new ItemHistoryList(), new ActionHistoryList(), new Toolbox());
	const plantItem = generateNewPlaceholderPlacedItem("apple", "");
	const response = user.updateHarvestHistory(plantItem);
	expect(response.isSuccessful()).toBe(true);
	expect(user.getItemHistory().contains(plantItem).payload).toBe(true);
	expect(user.getActionHistory().getHistoryByIdentifier(plantItem.itemData.subtype, plantItem.itemData.category, 'harvested').payload?.getQuantity()).toBe(1);
	expect(user.getActionHistory().getHistoryByIdentifier(plantItem.itemData.subtype, 'all', 'harvested').payload?.getQuantity()).toBe(1);
	
	const plantItem2 = generateNewPlaceholderPlacedItem("banana", "");
	const response2 = user.updateHarvestHistory(plantItem2);
	expect(response2.isSuccessful()).toBe(true);
	expect(user.getItemHistory().contains(plantItem2).payload).toBe(true);
	expect(user.getActionHistory().getHistoryByIdentifier(plantItem2.itemData.subtype, plantItem2.itemData.category, 'harvested').payload?.getQuantity()).toBe(1);
	expect(user.getActionHistory().getHistoryByIdentifier(plantItem2.itemData.subtype, 'all', 'harvested').payload?.getQuantity()).toBe(2);
	
	const plantItem3 = generateNewPlaceholderPlacedItem("coconut", "");
	const response3 = user.updateHarvestHistory(plantItem3);
	expect(response3.isSuccessful()).toBe(true);
	expect(user.getItemHistory().contains(plantItem3).payload).toBe(true);
	expect(user.getActionHistory().getHistoryByIdentifier(plantItem3.itemData.subtype, plantItem3.itemData.category, 'harvested').payload?.getQuantity()).toBe(2);
	expect(user.getActionHistory().getHistoryByIdentifier(plantItem3.itemData.subtype, 'all', 'harvested').payload?.getQuantity()).toBe(3);
	
})

test('Should Not Update Invalid harvest History', () => {
	const user = new User('00000000-0000-0000-0000-000000000000', 'test', '', new LevelSystem(uuidv4(), 100), new ItemHistoryList(), new ActionHistoryList(), new Toolbox());
	const invalidItem = generateNewPlaceholderPlacedItem("bench", "");
	const response = user.updateHarvestHistory(invalidItem);
	expect(response.isSuccessful()).toBe(false);

	const invalidTemplate = new PlantTemplate("invalid id", "invalid name", "", ItemTypes.PLACED.name, ItemSubtypes.PLANT.name, "", "", 100, 0, "", 0, 0, 0, 0);
	const invalidItem2 = new Plant(uuidv4(), invalidTemplate, "");
	const response2 = user.updateHarvestHistory(invalidItem2);
	expect(response2.isSuccessful()).toBe(false);

})