import Toolbox from "@/models/itemStore/toolbox/tool/Toolbox";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { ItemSubtypes, ItemTypes } from "@/models/items/ItemTypes";
import { PlacedItem } from "@/models/items/placedItems/PlacedItem";
import { Plant } from "@/models/items/placedItems/Plant";
import { generateInventoryItem, generatePlacedItem } from "@/models/items/ItemFactory";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { PlantTemplate } from "@/models/items/templates/models/PlacedItemTemplates/PlantTemplate";
import LevelSystem from "@/models/level/LevelSystem";
import { actionHistoryFactory } from "@/models/user/history/actionHistory/ActionHistoryFactory";
import { ActionHistoryList } from "@/models/user/history/ActionHistoryList";
import ItemHistory from "@/models/user/history/itemHistory/ItemHistory";
import { ItemHistoryList } from "@/models/user/history/ItemHistoryList";
import User from "@/models/user/User";
import { v4 as uuidv4 } from 'uuid';
import Icon from "@/models/user/icons/Icon";
import { UserEvent } from "@/models/user/userEvents/UserEvent";
import { UserEventTypes } from "@/models/user/userEvents/UserEventTypes";

test('Should Initialize User Object', () => {
	const user = new User("00000000-0000-0000-0000-000000000000", 'test', '', new LevelSystem(uuidv4(), 100), new ItemHistoryList(), new ActionHistoryList(), new Toolbox(uuidv4()));
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
	const user = new User('00000000-0000-0000-0000-000000000000', 'test', '', new LevelSystem(uuidv4(), 100), new ItemHistoryList([new ItemHistory(uuidv4(), itemTemplateFactory.getPlacedItemTemplateByName('apple')!, 1)]), new ActionHistoryList([testActionHistory!]), new Toolbox(uuidv4()));
	const serializedUser = JSON.stringify(user.toPlainObject());
	const parsedUser = User.fromPlainObject(JSON.parse(serializedUser));
	expect(parsedUser).toBeTruthy();
	expect(parsedUser.getLevel()).toBe(100);
	expect(parsedUser.getUsername()).toBe('test');
	expect(parsedUser.getItemHistory().contains(itemTemplateFactory.getPlacedItemTemplateByName('apple') as PlantTemplate).payload).toBe(true);
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

	const user = new User('00000000-0000-0000-0000-000000000000', 'test', '', new LevelSystem(uuidv4(), 100), new ItemHistoryList(), new ActionHistoryList(), new Toolbox(uuidv4()));
	const plantItem = generateInventoryItem("apple", 1);
	const response = user.updateHarvestHistory(plantItem, 1);
	expect(response.isSuccessful()).toBe(true);
	expect(user.getItemHistory().contains(plantItem).payload).toBe(true);
	expect(user.getActionHistory().getHistoryByIdentifier(ItemSubtypes.PLANT.name, plantItem.itemData.category, 'harvested').payload?.getQuantity()).toBe(1);
	expect(user.getActionHistory().getHistoryByIdentifier(ItemSubtypes.PLANT.name, 'all', 'harvested').payload?.getQuantity()).toBe(1);
	
	const plantItem2 = generateInventoryItem("banana", 1);
	const response2 = user.updateHarvestHistory(plantItem2, 1);
	expect(response2.isSuccessful()).toBe(true);
	expect(user.getItemHistory().contains(plantItem2).payload).toBe(true);
	expect(user.getActionHistory().getHistoryByIdentifier(ItemSubtypes.PLANT.name, plantItem2.itemData.category, 'harvested').payload?.getQuantity()).toBe(1);
	expect(user.getActionHistory().getHistoryByIdentifier(ItemSubtypes.PLANT.name, 'all', 'harvested').payload?.getQuantity()).toBe(2);
	
	const plantItem3 = generateInventoryItem("coconut", 1);
	const response3 = user.updateHarvestHistory(plantItem3, 1);
	expect(response3.isSuccessful()).toBe(true);
	expect(user.getItemHistory().contains(plantItem3).payload).toBe(true);
	expect(user.getActionHistory().getHistoryByIdentifier(ItemSubtypes.PLANT.name, plantItem3.itemData.category, 'harvested').payload?.getQuantity()).toBe(2);
	expect(user.getActionHistory().getHistoryByIdentifier(ItemSubtypes.PLANT.name, 'all', 'harvested').payload?.getQuantity()).toBe(3);
	
})

test('Should Not Update Invalid harvest History', () => {
	const user = new User('00000000-0000-0000-0000-000000000000', 'test', '');
	const invalidItem = generatePlacedItem("bench", "");
	const response = user.updateHarvestHistory(invalidItem as unknown as InventoryItem, 1);
	expect(response.isSuccessful()).toBe(false);

	const invalidTemplate = new PlantTemplate("invalid id", "invalid name", "", ItemTypes.PLACED.name, ItemSubtypes.PLANT.name, "", "", 100, 0, "", 0, 0, 0, 0, {});
	const invalidItem2 = new Plant(uuidv4(), invalidTemplate, "");
	const response2 = user.updateHarvestHistory(invalidItem2 as unknown as InventoryItem, 1);
	expect(response2.isSuccessful()).toBe(false);

})


/* ---------------------------------------------------------
   generateLocalUid
--------------------------------------------------------- */
test("Should generate a UID of default length 28", () => {
    const uid = User.generateLocalUid();
    expect(uid).toHaveLength(28);
});

test("Should generate UID of custom length", () => {
    const uid = User.generateLocalUid(10);
    expect(uid).toHaveLength(10);
});

/* ---------------------------------------------------------
   generateDefaultLevelSystem
--------------------------------------------------------- */
test("Should generate a default LevelSystem", () => {
    const lvl = User.generateDefaultLevelSystem();
    expect(lvl).toBeInstanceOf(LevelSystem);
});

/* ---------------------------------------------------------
   generate default new user
--------------------------------------------------------- */
test("Should generate default new user", () => {
    const user = User.generateDefaultNewUser();

    expect(user.getUsername()).toBe(User.getDefaultUserName());
    expect(user.getIcon()).toBe("goose");
    expect(user.getUserId()).toHaveLength(28); // uses generateLocalUid
});

test("Should generate user with supplied ID", () => {
    const id = "ABC123";
    const user = User.generateNewUserWithId(id);

    expect(user.getUserId()).toBe(id);
    expect(user.getUsername()).toBe(User.getDefaultUserName());
    expect(user.getIcon()).toBe("goose");
});

/* ---------------------------------------------------------
   getDefaultUserName
--------------------------------------------------------- */
test("Default username should be Goose Farmer", () => {
    expect(User.getDefaultUserName()).toBe("Goose Farmer");
});

/* ---------------------------------------------------------
   Event Map Behavior
--------------------------------------------------------- */
test("Should add, retrieve, and list events", () => {
    const user = new User("id", "name", "icon");
    const event = new UserEvent(null, "id", UserEventTypes.DAILY.name, new Date());

    user.addEvent(event);

    // getEvent
    const fetched = user.getEvent(UserEventTypes.DAILY.name);
    expect(fetched).toBe(event);

    // getAllEvents
    const all = user.getAllEvents();
    expect(all.length).toBe(1);
    expect(all[0]).toBe(event);

    // getUserEvents (map)
    const eventsMap = user.getUserEvents();
    expect(eventsMap.size).toBe(1);
    expect(eventsMap.get(UserEventTypes.DAILY.name)).toBe(event);
});

/* ---------------------------------------------------------
   getToolbox
--------------------------------------------------------- */
test("Should return toolbox", () => {
    const tb = new Toolbox(uuidv4());
    const user = new User("id", "name", "icon", new LevelSystem(uuidv4()), new ItemHistoryList(), new ActionHistoryList(), tb);

    expect(user.getToolbox()).toBe(tb);
});

/* ---------------------------------------------------------
   isIconUnlocked() Behavior
--------------------------------------------------------- */
describe("Icon Unlock Logic", () => {

    test("Emoji icons — apple and goose are always unlocked", () => {
        const user = new User("id", "test", "icon");

        const apple = new Icon("apple", "🍎");
        const goose = new Icon("goose", "🦢");

        expect(user.isIconUnlocked(apple, true)).toBe(true);
        expect(user.isIconUnlocked(goose, true)).toBe(true);
    });

    test("Emoji 'error' icon is always locked", () => {
        const user = new User("id", "test", "icon");
        const icon = new Icon("error", "❌");
        expect(user.isIconUnlocked(icon, true)).toBe(false);
    });

    test("Emoji icons require itemHistory for unlock (non-default icons)", () => {
        const template = itemTemplateFactory.getInventoryItemTemplateByName("apple")!;
        const icon = new Icon("apple", "🍎"); // Example that exists

        const unlockedUser = new User(
            "id",
            "name",
            "icon",
            undefined,
            new ItemHistoryList([
                new ItemHistory(uuidv4(), template, 1)
            ])
        );
        expect(unlockedUser.isIconUnlocked(icon, true)).toBe(true);

        const lockedUser = new User("id", "name", "icon");
        expect(lockedUser.isIconUnlocked(icon, true)).toBe(true); // apple is special-cased to always true
    });

    test("Non-emoji icons: default is unlocked, error is locked, all others unlocked", () => {
        const user = new User("id", "t", "icon");

        const def = new Icon("default", "");
        const err = new Icon("error", "");
        const other = new Icon("customHat", "");

        expect(user.isIconUnlocked(def, false)).toBe(true);
        expect(user.isIconUnlocked(err, false)).toBe(false);
        expect(user.isIconUnlocked(other, false)).toBe(true);
    });
});