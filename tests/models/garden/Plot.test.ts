import { Plot } from "@/models/garden/Plot";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import { generateInventoryItem, generatePlacedItem } from "@/models/items/ItemFactory";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { PlantTemplate } from "@/models/items/templates/models/PlacedItemTemplates/PlantTemplate";
import { v4 as uuidv4 } from 'uuid';
import User from "@/models/user/User";

let testPlot: Plot;
let testInventory: Inventory;

beforeEach(() => {
    testPlot = new Plot(uuidv4(), generatePlacedItem('apple', ''), 0, 1);
    testInventory = new Inventory(uuidv4(), User.getDefaultUserName());
});

describe('Plot Initialization', () => {
    test('Should Initialize Plot Object', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 1, 1);
        expect(newPlot).toBeTruthy();
        expect(newPlot.getItem().itemData.name).toBe("apple");
        expect(newPlot.getItemStatus()).toBe("newItem");

        newPlot.setItem(generatePlacedItem("banana", "new item"), 1);
        newPlot.setItemStatus("old item");
        expect(newPlot.getItem().itemData.name).toBe("banana");
        expect(newPlot.getItemStatus()).toBe("old item");

        expect(newPlot.getPlantTime()).toBe(1);
        expect(newPlot.getUsesRemaining()).toBe((itemTemplateFactory.getPlacedItemTemplateByName('banana')! as PlantTemplate).numHarvests);

        newPlot.setUsesRemaining(100);
        newPlot.setPlantTime(100);
        expect(newPlot.getPlantTime()).toBe(100);
        expect(newPlot.getUsesRemaining()).toBe(100);
    });
});

describe('Using Items', () => {
    test('Should Use Decoration Item And Replace', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("bench", "newItem"), 0, 1);
        const response = newPlot.useItem(generatePlacedItem("apple", "replaced"), 1);
        expect(response.isSuccessful()).toBe(true);
        expect(newPlot.getItem().itemData.name).toBe('apple');
        expect(newPlot.getItemStatus()).toBe('replaced');
        expect(response.payload.newTemplate.name).toBe('bench blueprint');
    });

    test('Should Use Plant Item And Replace', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
        const response = newPlot.useItem(generatePlacedItem("banana", "replaced"), 1);
        expect(response.isSuccessful()).toBe(true);
        expect(newPlot.getItem().itemData.name).toBe('banana');
        expect(newPlot.getItemStatus()).toBe('replaced');
        expect(response.payload.newTemplate.name).toBe('apple');
    });

    test('Should Use Plant Item And Not Replace', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 10);
        const response = newPlot.useItem(generatePlacedItem("banana", "replaced"), 1);
        expect(response.isSuccessful()).toBe(true);
        expect(newPlot.getItem().itemData.name).toBe('apple');
        expect(newPlot.getItemStatus()).toBe('newItem');
        expect(response.payload.newTemplate.name).toBe('apple');
        expect(newPlot.getUsesRemaining()).toBe(9);
    });

    test('Should Use And Replace With Ground', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
        const response = newPlot.useItem();
        expect(response.isSuccessful()).toBe(true);
        expect(newPlot.getItem().itemData.name).toBe('ground');
        expect(newPlot.getItemStatus()).toBe('');
        expect(response.payload.newTemplate.name).toBe('apple');
    });

    test('Should Change Time on Use', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 1, 1);
        const response = newPlot.useItem(generatePlacedItem("banana", "replaced"), 1);
        expect(response.isSuccessful()).toBe(true);
        expect(newPlot.getItem().itemData.name).toBe('banana');
        expect(newPlot.getItemStatus()).toBe('replaced');
        expect(response.payload.newTemplate.name).toBe('apple');
        expect(newPlot.getPlantTime()).not.toBe(1);
    });

    test('Should Use Not Plant Item With Missing UsesRemaining', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
        const response = newPlot.useItem(generatePlacedItem("banana", "replaced"), 10);
        expect(response.isSuccessful()).toBe(false);
    });

    test('Should Not Use EmptyItem Item', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("ground", "newItem"), 0, 1);
        const response = newPlot.useItem(generatePlacedItem("banana", "replaced"), 1);
        expect(response.isSuccessful()).toBe(false);
        expect(newPlot.getItem().itemData.name).toBe('ground');
        expect(newPlot.getItemStatus()).toBe('newItem');
    });
});

describe('Placing Items', () => {
    test('Should Place Apple Seed Item', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("ground", "newItem"), 0, 1);
        const inventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList([generateInventoryItem('apple seed', 1)]));
        const response = newPlot.placeItem(inventory, inventory.getItem('apple seed').payload);
        expect(response.isSuccessful()).toBe(true);
        expect(newPlot.getItem().itemData.name).toBe('apple');
        expect(response.payload.newItem.itemData.name).toBe('apple');
        expect(inventory.contains('apple seed').payload).toBe(false);
    });

    test('Should Place Bench Item', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("ground", "newItem"), 0, 1);
        const inventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList([generateInventoryItem('bench blueprint', 2)]));
        const response = newPlot.placeItem(inventory, inventory.getItem('bench blueprint').payload);
        expect(response.isSuccessful()).toBe(true);
        expect(newPlot.getItem().itemData.name).toBe('bench');
        expect(response.payload.newItem.itemData.name).toBe('bench');
        expect(inventory.contains('bench blueprint').payload).toBe(true);
        expect(inventory.getItem('bench blueprint').payload.quantity).toBe(1);
    });

    test('Should Not Place on Non Ground', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
        const inventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList([generateInventoryItem('bench blueprint', 2)]));
        const response = newPlot.placeItem(inventory, inventory.getItem('bench blueprint').payload);
        expect(response.isSuccessful()).toBe(false);
        expect(inventory.contains('bench blueprint').payload).toBe(true);
        expect(inventory.getItem('bench blueprint').payload.quantity).toBe(2);
    });

    test('Should Not Place Harvested Item', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("ground", "newItem"), 0, 1);
        const inventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList([generateInventoryItem('apple', 1)]));
        const response = newPlot.placeItem(inventory, inventory.getItem('apple').payload);
        expect(response.isSuccessful()).toBe(false);
    });

    test('Should Not Place Item With 0 Quantity', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("ground", "newItem"), 0, 1);
        const inventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList([generateInventoryItem('apple seed', 0)]));
        const response = newPlot.placeItem(inventory, inventory.getItem('apple seed').payload);
        expect(response.isSuccessful()).toBe(false);
    });
});

describe('Picking Up Items', () => {
    test('Should Pickup Apple Item', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
        const inventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList([generateInventoryItem('apple', 1)]));
        const response = newPlot.pickupItem(inventory, generatePlacedItem("ground", ""));
        expect(response.isSuccessful()).toBe(true);
        expect(newPlot.getItem().itemData.name).toBe('ground');
        expect(response.payload.newItem.itemData.name).toBe('apple');
        expect(inventory.contains('apple').payload).toBe(true);
        expect(inventory.getItem('apple').payload.quantity).toBe(2);
    });

    test('Should Pickup Bench Item', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("bench", "newItem"), 0, 1);
        const inventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList());
        const response = newPlot.pickupItem(inventory);
        expect(response.isSuccessful()).toBe(true);
        expect(newPlot.getItem().itemData.name).toBe('ground');
        expect(response.payload.newItem.itemData.name).toBe('bench blueprint');
        expect(inventory.contains('bench blueprint').payload).toBe(true);
        expect(inventory.getItem('bench blueprint').payload.quantity).toBe(1);
    });

    test('Should Not Pickup Non Plant/Decoration', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("ground", "newItem"), 0, 1);
        const inventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList([]));
        const response = newPlot.pickupItem(inventory);
        expect(response.isSuccessful()).toBe(false);
        expect(newPlot.getItem().itemData.name).toBe("ground");
        expect(inventory.size()).toBe(0);
    });
});

describe('Harvesting', () => {
    test('Should Harvest Apple', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
        const inventory = new Inventory(uuidv4(), "Dummy", 100);
        const response = newPlot.harvestItem(inventory, false, 1, generatePlacedItem('ground', ''), 1000000);
        expect(response.isSuccessful()).toBe(true);
        expect(newPlot.getItem().itemData.name).toBe('ground');
        expect(response.payload.newItem.itemData.name).toContain('apple');
        expect(inventory.contains(response.payload.newItem.itemData.name).payload).toBe(true);
        expect(inventory.getItem(response.payload.newItem.itemData.name).payload.quantity).toBe(1);
    });

    test('Should Not Harvest Ungrown Apple', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
        const inventory = new Inventory(uuidv4(), "Dummy", 100);
        const response = newPlot.harvestItem(inventory, false, 1, generatePlacedItem('ground', ''), 5000);
        expect(response.isSuccessful()).toBe(false);
    });

    test('Should Harvest Ungrown Apple If InstantGrow On', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
        const inventory = new Inventory(uuidv4(), "Dummy", 100);
        const response = newPlot.harvestItem(inventory, true, 1, generatePlacedItem('ground', ''), 5000);
        expect(response.isSuccessful()).toBe(true);
        expect(newPlot.getItem().itemData.name).toBe('ground');
        expect(response.payload.newItem.itemData.name).toContain('apple');
        expect(inventory.contains(response.payload.newItem.itemData.name).payload).toBe(true);
        expect(inventory.getItem(response.payload.newItem.itemData.name).payload.quantity).toBe(1);
    });

    test('Should Not Harvest Non Plant', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("bench", "newItem"), 0, 1);
        const inventory = new Inventory(uuidv4(), "Dummy", 100);
        const response = newPlot.harvestItem(inventory, true, 1, generatePlacedItem('ground', ''), 5000);
        expect(response.isSuccessful()).toBe(false);
    });
});

describe('Cloning', () => {
    test('Should Clone Plot Correctly', () => {
        const clone = testPlot.clone();
        expect(clone).not.toBe(testPlot); // different instance
        expect(clone.getPlotId()).toBe(testPlot.getPlotId());
        expect(clone.getItem().itemData.name).toBe(testPlot.getItem().itemData.name);
        expect(clone.getPlantTime()).toBe(testPlot.getPlantTime());
        expect(clone.getUsesRemaining()).toBe(testPlot.getUsesRemaining());
    });
});

describe('Serialization', () => {
    test('Should Create Plot Object From PlainObject', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const serializedPlot = JSON.stringify((new Plot(uuidv4(), generatePlacedItem('apple', 'abc'), 0, 1)).toPlainObject());
        const plot = Plot.fromPlainObject(JSON.parse(serializedPlot));
        expect(plot).toBeTruthy();
        expect(plot.getItem()).toBeTruthy();
        expect(plot.getItem().itemData.name).toBe('apple');
        expect(plot.getItemStatus()).toBe('abc');
        consoleErrorSpy.mockRestore();
    });

    test('Should Create Empty Plot Instead of Error Item On fromPlainObject', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const errorPlot = new Plot(uuidv4(), generatePlacedItem('error', ''), 0, 1);
        const serializedPlot = JSON.stringify(errorPlot.toPlainObject());
        const plot = Plot.fromPlainObject(JSON.parse(serializedPlot));
        expect(plot.getItem().itemData.name).toBe('ground');
        consoleErrorSpy.mockRestore();
    });

    test('Should Return Empty Plot For Invalid Plain Object', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const malformed = { plotId: '', item: null };
        const plot = Plot.fromPlainObject(malformed);
        expect(plot).toBeInstanceOf(Plot);
        expect(plot.getItem().itemData.name).toBe('ground');
        consoleErrorSpy.mockRestore();
    });
});

describe('EXP Calculation', () => {
    test('Should Get EXP Value', () => {
        const appleTemplate = itemTemplateFactory.getPlacedItemTemplateByName('apple') as PlantTemplate;
        expect(testPlot.getExpValue()).toBe(appleTemplate.baseExp);
    });

    test('Should Not Get EXP Value', () => {
        testPlot.pickupItem(testInventory);
        testInventory.gainItem(generateInventoryItem('bench blueprint', 1), 1);
        testPlot.placeItem(testInventory, testInventory.getItem('bench blueprint').payload);
        expect(testPlot.getExpValue()).toBe(0);
    });
});

describe('Random Seed', () => {
    test('Should Update Random Seed Deterministically', () => {
        const seedBefore = testPlot.getRandomSeed();
        testPlot.updateRandomSeed();
        const seedAfter = testPlot.getRandomSeed();
        expect(seedAfter).not.toBe(seedBefore);

        const nextSeed = Plot.getNextRandomSeed(seedBefore);
        const multiplier = 48271, increment = 1, modulus = 2147483647;
        const expectedNext = (multiplier * seedBefore + increment) % modulus;
        expect(nextSeed).toBe(expectedNext);
    });
});

describe('Edge / Error Cases', () => {
    test('Should Check Harvestable Correctly', () => {
        const plantTemplate = testPlot.getItem().itemData as PlantTemplate;
        expect(Plot.canHarvest(plantTemplate, Date.now(), plantTemplate.numHarvests, Date.now() - 1000)).toBe(false);
        expect(Plot.canHarvest(plantTemplate, Date.now() - plantTemplate.growTime * 1000, 0)).toBe(true);
        const groundTemplate = itemTemplateFactory.getPlacedItemTemplateByName('ground')!;
        expect(Plot.canHarvest(groundTemplate, Date.now(), 0)).toBe(false);
    });

    test('Should Return Regular Shiny Harvest If Chance Zero', () => {
        const plantTemplate = testPlot.getItem().itemData as PlantTemplate;
        const result = Plot.checkShinyHarvest(plantTemplate, 12345, 0.0);
        expect(result).toBe('Regular');
    });

    test('Should Destroy Item and Replace With Ground', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
        const response = newPlot.destroyItem();
        expect(response.isSuccessful()).toBe(true);
        expect(response.payload.originalItem.itemData.name).toBe('apple');
        expect(response.payload.replacementItem.itemData.name).toBe('ground');
        expect(newPlot.getItem().itemData.name).toBe('ground');
    });

    test('Should Return Error Message For Non-Plant Remaining Grow Time', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("bench", "status"), 0, 1);
        const result = newPlot.getRemainingGrowTime();
        expect(result).toContain('Error: Not a plant');
    });

    test('Should Set Item Non-Plant With Default UsesRemaining', () => {
        const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "status"), 0, 1);
        const newItem = generatePlacedItem("bench", "newStatus");
        newPlot.setItem(newItem, Date.now(), null);
        expect(newPlot.getItem().itemData.name).toBe("bench");
        expect(newPlot.getUsesRemaining()).toBe(0);
    });
});
