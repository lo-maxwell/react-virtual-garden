
import { v4 as uuidv4 } from 'uuid';
import User from "@/models/user/User";
import Toolbox from '@/models/itemStore/toolbox/tool/Toolbox';
import { ToolTypes } from '@/models/itemStore/toolbox/tool/ToolTypes';
import { ToolList } from '@/models/itemStore/toolbox/toolList';
import { generateTool } from '@/models/items/ItemFactory';
import { itemTemplateFactory } from '@/models/items/templates/models/ItemTemplateFactory';


let testToolbox: Toolbox;

beforeEach(() => {
	const item1 = generateTool("basic axe");
	const testToolList = new ToolList([item1]);
	testToolbox = new Toolbox(uuidv4(), testToolList);
});

test('Should Initialize New Toolbox Object', () => {
	const toolbox = new Toolbox(uuidv4(), new ToolList());
	expect(toolbox).not.toBeUndefined();
	expect(toolbox).not.toBeNull();
	expect(toolbox.size()).toBe(0);
});

test('Should Initialize Default Toolbox Object', () => {
	const toolbox = Toolbox.generateDefaultToolbox();
	expect(toolbox).not.toBeUndefined();
	expect(toolbox).not.toBeNull();
	expect(toolbox.size()).toBe(1);
	expect(toolbox.contains('Basic Axe').payload).toBe(true);
});

test('Should Get All Tools', () => {
	const items = testToolbox.getAllTools();
	expect(items.length).toBe(1);
})


test('Should Get Tools By Type', () => {
	let items = testToolbox.getToolsByType(ToolTypes.SHOVEL.name);
	expect(items.length).toBe(1);
})

test('Should Find Tool', () => {
	const getResponse = testToolbox.getTool(itemTemplateFactory.getToolTemplateByName('Basic Axe')!);
	expect(getResponse.isSuccessful()).toBe(true);
	expect(getResponse.payload.itemData.name).toBe('Basic Axe');
	const containsResponse = testToolbox.contains(itemTemplateFactory.getToolTemplateByName('Basic Axe')!);
	expect(containsResponse.isSuccessful()).toBe(true);
	expect(containsResponse.payload).toBe(true);
})

test('Should Not Find Nonexistent Tool', () => {
	//Mute console warn
	const consoleErrorSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
	
	const getResponse = testToolbox.getTool(itemTemplateFactory.getToolTemplateByName('Pickaxe')!);
	expect(getResponse.isSuccessful()).toBe(false);
	const containsResponse = testToolbox.contains(itemTemplateFactory.getToolTemplateByName('Pickaxe')!);
	//Contains should never have error messages, just payload true/false
	expect(containsResponse.isSuccessful()).toBe(true);
	expect(containsResponse.payload).toBe(false);
	consoleErrorSpy.mockRestore();
})

test('Should Gain Tool To Toolbox', () => {
	const response = testToolbox.gainTool(itemTemplateFactory.getToolTemplateByName('Super Shovel')!);
	expect(response.isSuccessful()).toBe(true);
	expect(testToolbox.size()).toBe(2);
	expect(testToolbox.contains(itemTemplateFactory.getToolTemplateByName('Super Shovel')!).payload).toBe(true);
})

test('Should Not Gain Invalid Tool', () => {
	expect(testToolbox.size()).toBe(1);
	const response = testToolbox.gainTool(itemTemplateFactory.getToolTemplateByName('Ultra Shovel')!);
	expect(response.isSuccessful()).toBe(false);
	expect(testToolbox.size()).toBe(1); 
})

test('Should Trash Tool From Toolbox', () => {
	const response = testToolbox.trashTool(itemTemplateFactory.getToolTemplateByName('Basic Axe')!);
	expect(response.isSuccessful()).toBe(true);
	//Deletes item from the toolbox
	expect(testToolbox.size()).toBe(0);
})

test('Should Not Trash Nonexistent Tool From Toolbox', () => {
	const response = testToolbox.trashTool(itemTemplateFactory.getToolTemplateByName('Super Shovel')!);
	expect(response.isSuccessful()).toBe(false);
	expect(testToolbox.size()).toBe(1);
})

test('Should Create Toolbox Object From PlainObject', () => {
	const originalToolList = new ToolList([generateTool('Basic Axe')]);
	const originalToolbox = new Toolbox(uuidv4(), originalToolList);
	const serializedToolbox = JSON.stringify((originalToolbox).toPlainObject());
	const toolbox = Toolbox.fromPlainObject(JSON.parse(serializedToolbox));
	expect(toolbox.size()).toBe(1);
	expect(toolbox.contains('Basic Axe').payload).toBe(true);
})