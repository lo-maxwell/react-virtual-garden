import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { Decoration } from "@/models/items/placedItems/Decoration";
import { EmptyItem } from "@/models/items/placedItems/EmptyItem";
import { Plant } from "@/models/items/placedItems/Plant";
import { generateNewPlaceholderPlacedItem } from "@/models/items/PlaceholderItems";
import { BlueprintTemplate } from "@/models/items/templates/models/BlueprintTemplate";
import { DecorationTemplate } from "@/models/items/templates/models/DecorationTemplate";
import { EmptyItemTemplate } from "@/models/items/templates/models/EmptyItemTemplate";
import { HarvestedItemTemplate } from "@/models/items/templates/models/HarvestedItemTemplate";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { PlantTemplate } from "@/models/items/templates/models/PlantTemplate";
import { SeedTemplate } from "@/models/items/templates/models/SeedTemplate";
import { v4 as uuidv4 } from 'uuid';

let seedItem: Seed;
let blueprintItem: Blueprint;
let harvestedItem: HarvestedItem;
let plantItem: Plant;
let decorationItem: Decoration;
let emptyItem: EmptyItem;
let seedTemplate: SeedTemplate;
let blueprintTemplate: BlueprintTemplate;
let harvestedTemplate: HarvestedItemTemplate;
let plantTemplate: PlantTemplate;
let decorationTemplate: DecorationTemplate;
let emptyTemplate: EmptyItemTemplate;


beforeEach(() => {
	seedTemplate = placeholderItemTemplates.getInventoryItemTemplateByName('apple seed') as SeedTemplate;
	seedItem = new Seed(uuidv4(), seedTemplate, 1);
	blueprintTemplate = placeholderItemTemplates.getInventoryItemTemplateByName('bench blueprint') as BlueprintTemplate;
	blueprintItem = new Blueprint(uuidv4(), blueprintTemplate, 1);
	harvestedTemplate = placeholderItemTemplates.getInventoryItemTemplateByName('apple') as HarvestedItemTemplate;
	harvestedItem = new HarvestedItem(uuidv4(), harvestedTemplate, 1);
	plantTemplate = placeholderItemTemplates.getPlacedItemTemplateByName('apple') as PlantTemplate;
	plantItem = new Plant(uuidv4(), plantTemplate, '');
	decorationTemplate = placeholderItemTemplates.getPlacedItemTemplateByName('bench') as DecorationTemplate;
	decorationItem = new Decoration(uuidv4(), decorationTemplate, '');
	emptyTemplate = placeholderItemTemplates.getPlacedItemTemplateByName('ground') as EmptyItemTemplate;
	emptyItem = new EmptyItem(uuidv4(), emptyTemplate, 'ground');
})

test('Should Create PlantTemplate Object From PlainObject', () => {
	const serializedItemTemplate = JSON.stringify(plantTemplate.toPlainObject());
	const item = PlantTemplate.fromPlainObject(JSON.parse(serializedItemTemplate));
	expect(item).toBeTruthy();
	expect(item.name).toBe(plantTemplate.name);
	expect(item.id).toBe(plantTemplate.id);
	expect(item.icon).toBe(plantTemplate.icon);
	expect(item.subtype).toBe(plantTemplate.subtype);
	expect(item.category).toBe(plantTemplate.category);
})


test('Should Not Create PlantTemplate Object From Corrupted Data', () => {
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const errorTemplate1 = PlantTemplate.fromPlainObject(123);
	expect(errorTemplate1.name).toBe('error');
	const errorTemplate2 = PlantTemplate.fromPlainObject({name: "a", icon: "abc", type: "PlacedItem", subtype: "Plant", value: 0, transformId: "1", baseExp: 1, growTime: 10});
	expect(errorTemplate2.name).toBe('error');
	const errorTemplate3 = PlantTemplate.fromPlainObject({id: "1", icon: "abc", type: "PlacedItem", subtype: "Plant", value: 0, transformId: "1", baseExp: 1, growTime: 10});
	expect(errorTemplate3.name).toBe('error');
	const errorTemplate4 = PlantTemplate.fromPlainObject({id: "1", name: "a", type: "PlacedItem", subtype: "Plant", value: 0, transformId: "1", baseExp: 1, growTime: 10});
	expect(errorTemplate4.name).toBe('error');
	const errorTemplate5 = PlantTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", subtype: "Plant", value: 0, transformId: "1", baseExp: 1, growTime: 10});
	expect(errorTemplate5.name).toBe('error');
	const errorTemplate6 = PlantTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "PlacedItem", value: 0, transformId: "1", baseExp: 1, growTime: 10});
	expect(errorTemplate6.name).toBe('error');
	const errorTemplate7 = PlantTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "PlacedItem", subtype: "Plant", transformId: "1", baseExp: 1, growTime: 10});
	expect(errorTemplate7.name).toBe('error');
	const errorTemplate8 = PlantTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "PlacedItem", subtype: "Plant", value: 0, baseExp: 1, growTime: 10});
	expect(errorTemplate8.name).toBe('error');
	const errorTemplate9 = PlantTemplate.fromPlainObject({id: 1, name: "a", icon: "abc", type: "PlacedItem", subtype: "Plant", value: 0, transformId: "1", baseExp: 1, growTime: 10});
	expect(errorTemplate9.name).toBe('error');
	const errorTemplate10 = PlantTemplate.fromPlainObject({id: "1", name: 1, icon: "abc", type: "PlacedItem", subtype: "Plant", value: 0, transformId: "1", baseExp: 1, growTime: 10});
	expect(errorTemplate10.name).toBe('error');
	const errorTemplate11 = PlantTemplate.fromPlainObject({id: "1", name: "a", icon: 1, type: "PlacedItem", subtype: "Plant", value: 0, transformId: "1", baseExp: 1, growTime: 10});
	expect(errorTemplate11.name).toBe('error');
	const errorTemplate12 = PlantTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "InventoryItem", subtype: "Plant", value: 0, transformId: "1", baseExp: 1, growTime: 10});
	expect(errorTemplate12.name).toBe('error');
	const errorTemplate13 = PlantTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "PlacedItem", subtype: "Seed", value: 0, transformId: "1", baseExp: 1, growTime: 10});
	expect(errorTemplate13.name).toBe('error');
	const errorTemplate14 = PlantTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "PlacedItem", subtype: "Plant", value: "0", transformId: "1", baseExp: 1, growTime: 10});
	expect(errorTemplate14.name).toBe('error');
	const errorTemplate15 = PlantTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "PlacedItem", subtype: "Plant", value: 0, transformId: 1, baseExp: 1, growTime: 10});
	expect(errorTemplate15.name).toBe('error');
	const errorTemplate16 = PlantTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "PlacedItem", subtype: "Plant", value: 0, transformId: "1", growTime: 10});
	expect(errorTemplate16.name).toBe('error');
	const errorTemplate17 = PlantTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "PlacedItem", subtype: "Plant", value: 0, transformId: "1", baseExp: "1", growTime: 10});
	expect(errorTemplate17.name).toBe('error');
	const errorTemplate18 = PlantTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "PlacedItem", subtype: "Plant", value: 0, transformId: "1", baseExp: 1});
	expect(errorTemplate18.name).toBe('error');
	const errorTemplate19 = PlantTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "PlacedItem", subtype: "Plant", value: 0, transformId: "1", baseExp: 1, growTime: "10"});
	expect(errorTemplate19.name).toBe('error');
	consoleErrorSpy.mockRestore();
})

test('Should Return Correct Grow Time String', () => {
	const apple = placeholderItemTemplates.getPlacedItemTemplateByName('apple');
	const banana = placeholderItemTemplates.getPlacedItemTemplateByName('banana');
	const yellow = placeholderItemTemplates.getPlacedItemTemplateByName('onion');
	const coconut = placeholderItemTemplates.getPlacedItemTemplateByName('coconut');
	const peach = placeholderItemTemplates.getPlacedItemTemplateByName('peach');
	const magic = placeholderItemTemplates.getPlacedItemTemplateByName('magic mango');
	expect((apple as PlantTemplate).getGrowTimeString()).toBe("Grow Time: 10 s");
	expect((banana as PlantTemplate).getGrowTimeString()).toBe("Grow Time: 3 min");
	expect((yellow as PlantTemplate).getGrowTimeString()).toBe("Grow Time: 15 min");
	expect((coconut as PlantTemplate).getGrowTimeString()).toBe("Grow Time: 6 hours");
	expect((peach as PlantTemplate).getGrowTimeString()).toBe("Grow Time: 2 hours");
	expect((magic as PlantTemplate).getGrowTimeString()).toBe("Grow Time: 1 day 6 hours");
	const testTemplate = new PlantTemplate("", "", "", "PlacedItem", "Plant", "", "", 0, 0, "", 0, 0, 0, 0);
	expect((testTemplate as PlantTemplate).getGrowTimeString()).toBe("Grow Time: Instant");
	const testTemplate2 = new PlantTemplate("", "", "", "PlacedItem", "Plant", "", "", 0, 0, "", 0, 1, 0, 0);
	expect((testTemplate2 as PlantTemplate).getGrowTimeString()).toBe("Grow Time: 1 s");
	const testTemplate3 = new PlantTemplate("", "", "", "PlacedItem", "Plant", "", "", 0, 0, "", 0, 10, 0, 0);
	expect((testTemplate3 as PlantTemplate).getGrowTimeString()).toBe("Grow Time: 10 s");
	const testTemplate4 = new PlantTemplate("", "", "", "PlacedItem", "Plant", "", "", 0, 0, "", 0, 100, 0, 0);
	expect((testTemplate4 as PlantTemplate).getGrowTimeString()).toBe("Grow Time: 1 min 40 s");
	const testTemplate5 = new PlantTemplate("", "", "", "PlacedItem", "Plant", "", "", 0, 0, "", 0, 1000, 0, 0);
	expect((testTemplate5 as PlantTemplate).getGrowTimeString()).toBe("Grow Time: 16 min 40 s");
	const testTemplate6 = new PlantTemplate("", "", "", "PlacedItem", "Plant", "", "", 0, 0, "", 0, 10000, 0, 0);
	expect((testTemplate6 as PlantTemplate).getGrowTimeString()).toBe("Grow Time: 2 hours 46 min");
	const testTemplate7 = new PlantTemplate("", "", "", "PlacedItem", "Plant", "", "", 0, 0, "", 0, 100000, 0, 0);
	expect((testTemplate7 as PlantTemplate).getGrowTimeString()).toBe("Grow Time: 1 day 3 hours");

	
})