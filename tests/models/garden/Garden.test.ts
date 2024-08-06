import { Garden } from "@/models/garden/Garden";
import { Plot } from "@/models/garden/Plot";
import { generateNewPlaceholderPlacedItem} from "@/models/items/PlaceholderItems";
import LevelSystem from "@/models/level/LevelSystem";

test('getEmptyPlots generates new set of plots', () => {
	const plots1 = Garden.generateEmptyPlots(3, 3);
	expect(plots1).toBeTruthy();
	expect(plots1.length).toBe(3);
	expect(plots1[0].length).toBe(3);
	plots1[0][0].setItemStatus('changed status');
	expect(plots1[0][0].getItem().getStatus()).toBe('changed status');
	expect(plots1[0][1].getItem().getStatus()).toBe('empty');
	expect(plots1[1][0].getItem().getStatus()).toBe('empty');
	
	const plots2 = Garden.generateEmptyPlots(5, 5);
	expect(plots2).toBeTruthy();
	expect(plots2.length).toBe(5);
	expect(plots2[0].length).toBe(5);
	plots2[1][1].setItemStatus('changed status');
	expect(plots2[0][0].getItem().getStatus()).toBe('empty');
	expect(plots2[0][1].getItem().getStatus()).toBe('empty');
	expect(plots2[1][0].getItem().getStatus()).toBe('empty');
	expect(plots2[1][1].getItem().getStatus()).toBe('changed status');

	expect(plots1).not.toEqual(plots2);
	expect(plots1[0][0].getItem().itemData).toBe(plots2[0][0].getItem().itemData);
});

test('Should Initialize Default Garden Object', () => {
	const newGarden = new Garden();
	expect(newGarden).toBeTruthy();
	expect(newGarden.getRows()).toBe(Garden.getStartingRows());
	expect(newGarden.getCols()).toBe(Garden.getStartingCols());
	expect(newGarden.getUserId()).toBe("Dummy User");
	expect(newGarden.getPlots().length).toBe(Garden.getStartingRows());
	expect(newGarden.getPlots()[0].length).toBe(Garden.getStartingCols());
	expect(newGarden.getPlots()[0][0].getItem().itemData.name).toBe("ground");
	expect(newGarden.getPlots()[Garden.getStartingRows() - 1][Garden.getStartingCols() - 1].getItem().itemData.name).toBe("ground");
	expect(newGarden.getPlotByRowAndColumn(1,1)!.getItem().itemData.name).toBe("ground");
	expect(newGarden.size()).toBe(Garden.getStartingRows() * Garden.getStartingCols());
});

test('Should Initialize Specified Garden Object', () => {
	const newGarden = new Garden("Test User", 15, 15, Garden.generateEmptyPlots(15, 15), new LevelSystem(100, 500, 2));
	expect(newGarden).toBeTruthy();
	expect(newGarden.getRows()).toBe(15);
	expect(newGarden.getCols()).toBe(15);
	expect(newGarden.getUserId()).toBe("Test User");
	expect(newGarden.getPlots().length).toBe(15);
	expect(newGarden.getPlots()[0].length).toBe(15);
	expect(newGarden.getPlots()[0][0].getItem().itemData.name).toBe("ground");
	expect(newGarden.getPlots()[14][14].getItem().itemData.name).toBe("ground");
	expect(newGarden.getPlotByRowAndColumn(1,1)!.getItem().itemData.name).toBe("ground");
	expect(newGarden.getLevel()).toBe(100);
	expect(newGarden.getCurrentExp()).toBe(500);
	expect(newGarden.getExpToLevelUp()).toBe(5050);
	expect(newGarden.getGrowthRate()).toBe(2);
	newGarden.addExp(4550);
	expect(newGarden.getLevel()).toBe(101);
	expect(newGarden.getCurrentExp()).toBe(0);
});

test('Garden Generates Empty Plot', () => {
	const emptyPlot = Garden.generateEmptyPlot(0, 0);
	expect(emptyPlot.getItem().itemData.name).toBe("ground");
	expect(emptyPlot.getItem().itemData.subtype).toBe("Ground");
  });

test('Should Extend Garden Size', () => {
	const newGarden = new Garden();
	newGarden.addExp(100000000);
	expect(newGarden.getRows()).toBe(Garden.getStartingRows());
	expect(newGarden.getCols()).toBe(Garden.getStartingCols());
	newGarden.addRow();
	newGarden.addRow();
	newGarden.addColumn();
	expect(newGarden.getPlotByRowAndColumn(1,1)!.getItem().itemData.name).toBe("ground");
	expect(newGarden.getRows()).toBe(Garden.getStartingRows() + 2);
	expect(newGarden.getCols()).toBe(Garden.getStartingCols() + 1);
	expect(newGarden.getPlots()[0][0].getItem().itemData.name).toBe("ground");
	expect(newGarden.getPlots()[Garden.getStartingRows() + 1][Garden.getStartingCols()].getItem().itemData.name).toBe("ground");
	expect(newGarden.getPlots()[Garden.getStartingRows()][Garden.getStartingRows() + 1]).toBeFalsy();
})

test('Should Shrink Garden Size', () => {
	const newGarden = new Garden("Dummy User", Garden.getStartingRows() + 5, Garden.getStartingCols() + 5);
	expect(newGarden.getRows()).toBe(Garden.getStartingRows() + 5);
	expect(newGarden.getCols()).toBe(Garden.getStartingCols() + 5);
	newGarden.setPlotItem(1,1,generateNewPlaceholderPlacedItem("apple", "newItem"));
	newGarden.setGardenSize(5,5);
	expect(newGarden.getPlots()[1][1].getItem().itemData.name).toBe("apple");
	expect(newGarden.getPlotByRowAndColumn(1,1)!.getItem().itemData.name).toBe("apple");
	expect(newGarden.getRows()).toBe(5);
	expect(newGarden.getCols()).toBe(5);
	expect(newGarden.getPlots()[0][0].getItem().itemData.name).toBe("ground");
	expect(newGarden.getPlots()[4][4].getItem().itemData.name).toBe("ground");
	expect(newGarden.getPlots()[9]).toBeFalsy();
	expect(newGarden.size()).toBe(25);
	newGarden.removeRow();
	newGarden.removeRow();
	newGarden.removeColumn();
	expect(newGarden.getRows()).toBe(3);
	expect(newGarden.getCols()).toBe(4);
	newGarden.removeRow();
	newGarden.removeRow();
	newGarden.removeRow();
	expect(newGarden.removeRow()).toBe(false);
	expect(newGarden.getRows()).toBe(1);
	expect(newGarden.getCols()).toBe(4);
})

test('Should Get Plot Position', () => {
	const newGarden = new Garden();
	const plot = newGarden.setPlotItem(1,1,generateNewPlaceholderPlacedItem("apple", "newItem"));
	expect(newGarden.getPlotPosition(plot)).toStrictEqual([1,1])
})

test('Should Swap Plot Positions', () => {
	const newGarden = new Garden();
	const plot = newGarden.setPlotItem(1,1,generateNewPlaceholderPlacedItem("apple", "newItem"));
	const plot2 = newGarden.setPlotItem(2,2,generateNewPlaceholderPlacedItem("banana", "newItem"));
	expect(newGarden.getPlotPosition(plot)).toStrictEqual([1,1]);
	expect(newGarden.getPlotPosition(plot2)).toStrictEqual([2,2]);
	newGarden.swapPlots([1,1], [2,2]);
	expect(newGarden.getPlotPosition(plot)).toStrictEqual([2,2]);
	expect(newGarden.getPlotPosition(plot2)).toStrictEqual([1,1]);
	newGarden.swapPlots(plot, plot2);
	expect(newGarden.getPlotPosition(plot)).toStrictEqual([1,1]);
	expect(newGarden.getPlotPosition(plot2)).toStrictEqual([2,2]);
})

test('Should Harvest Plant In Plot', () => {
	const newGarden = new Garden();
	const plot = newGarden.setPlotItem(1,1,generateNewPlaceholderPlacedItem("apple", "newItem"));
	const plot2 = newGarden.setPlotItem(2,2,generateNewPlaceholderPlacedItem("banana", "newItem"));
	const plot1HarvestResponse = newGarden.harvestPlot({row: 1, col: 1});
	expect(plot1HarvestResponse.isSuccessful()).toBe(true);
	expect(plot1HarvestResponse.payload.originalItem.itemData.name).toBe('apple');
	expect(plot1HarvestResponse.payload.updatedPlot.getItem().itemData.name).toBe('ground');
	expect(plot1HarvestResponse.payload.updatedPlot.getItemStatus()).toBe('');
	expect(plot1HarvestResponse.payload.harvestedItemTemplate.name).toBe('harvested apple');
	expect(newGarden.getPlotByRowAndColumn(1, 1)?.getItem().itemData.name).toBe('ground');
	expect(newGarden.getPlotByRowAndColumn(2, 2)?.getItem().itemData.name).toBe('banana');
	const plot2HarvestResponse = newGarden.harvestPlot(plot2);
	expect(plot2HarvestResponse.isSuccessful()).toBe(true);
	expect(plot2HarvestResponse.payload.originalItem.itemData.name).toBe('banana');
	expect(plot2HarvestResponse.payload.updatedPlot.getItem().itemData.name).toBe('ground');
	expect(plot2HarvestResponse.payload.updatedPlot.getItemStatus()).toBe('');
	expect(plot2HarvestResponse.payload.harvestedItemTemplate.name).toBe('harvested banana');
	expect(newGarden.getPlotByRowAndColumn(2, 2)?.getItem().itemData.name).toBe('ground');
});

test('Should Not Harvest Non Plant', () => {
	const newGarden = new Garden();
	const plot = newGarden.setPlotItem(1,1,generateNewPlaceholderPlacedItem("bench", "newItem"));
	const plot2 = newGarden.setPlotItem(2,2,generateNewPlaceholderPlacedItem("banana", "newItem"));
	const plot1HarvestResponse = newGarden.harvestPlot({row: 1, col: 1});
	expect(plot1HarvestResponse.isSuccessful()).toBe(false);
	expect(newGarden.getPlotByRowAndColumn(1, 1)?.getItem().itemData.name).toBe('bench');
	expect(newGarden.getPlotByRowAndColumn(2, 2)?.getItem().itemData.name).toBe('banana');
})

test('Should Not Harvest Invalid Plot', () => {
	const newGarden = new Garden();
	const plot = newGarden.setPlotItem(1,1,generateNewPlaceholderPlacedItem("apple", "newItem"));
	const plot2 = newGarden.setPlotItem(2,2,generateNewPlaceholderPlacedItem("banana", "newItem"));
	const plot1HarvestResponse = newGarden.harvestPlot({row: 3, col: 3});
	expect(plot1HarvestResponse.isSuccessful()).toBe(false);
	expect(newGarden.getPlotByRowAndColumn(1, 1)?.getItem().itemData.name).toBe('apple');
	expect(newGarden.getPlotByRowAndColumn(2, 2)?.getItem().itemData.name).toBe('banana');
	const plot3 = new Plot(generateNewPlaceholderPlacedItem("banana", "newItem"), Date.now());
	const plot3HarvestResponse = newGarden.harvestPlot(plot3);
	expect(plot3HarvestResponse.isSuccessful()).toBe(false);
})

test('Should Repackage Decoration In Plot', () => {
	const newGarden = new Garden();
	const plot = newGarden.setPlotItem(1,1,generateNewPlaceholderPlacedItem("bench", "newItem"));
	const plot2 = newGarden.setPlotItem(2,2,generateNewPlaceholderPlacedItem("banana", "newItem"));
	const plot1HarvestResponse = newGarden.repackagePlot({row: 1, col: 1});
	expect(plot1HarvestResponse.isSuccessful()).toBe(true);
	expect(plot1HarvestResponse.payload.originalItem.itemData.name).toBe('bench');
	expect(plot1HarvestResponse.payload.updatedPlot.getItem().itemData.name).toBe('ground');
	expect(plot1HarvestResponse.payload.updatedPlot.getItemStatus()).toBe('');
	expect(plot1HarvestResponse.payload.blueprintItemTemplate.name).toBe('bench blueprint');
	expect(newGarden.getPlotByRowAndColumn(1, 1)?.getItem().itemData.name).toBe('ground');
	expect(newGarden.getPlotByRowAndColumn(2, 2)?.getItem().itemData.name).toBe('banana');
});

test('Should Not Repackage Non Decoration', () => {
	const newGarden = new Garden();
	const plot = newGarden.setPlotItem(1,1,generateNewPlaceholderPlacedItem("apple", "newItem"));
	const plot2 = newGarden.setPlotItem(2,2,generateNewPlaceholderPlacedItem("banana", "newItem"));
	const plot1HarvestResponse = newGarden.repackagePlot({row: 1, col: 1});
	expect(plot1HarvestResponse.isSuccessful()).toBe(false);
	expect(newGarden.getPlotByRowAndColumn(1, 1)?.getItem().itemData.name).toBe('apple');
	expect(newGarden.getPlotByRowAndColumn(2, 2)?.getItem().itemData.name).toBe('banana');
})

test('Should Not Repackage Invalid Plot', () => {
	const newGarden = new Garden();
	const plot = newGarden.setPlotItem(1,1,generateNewPlaceholderPlacedItem("bench", "newItem"));
	const plot2 = newGarden.setPlotItem(2,2,generateNewPlaceholderPlacedItem("banana", "newItem"));
	const plot1HarvestResponse = newGarden.harvestPlot({row: 3, col: 3});
	expect(plot1HarvestResponse.isSuccessful()).toBe(false);
	expect(newGarden.getPlotByRowAndColumn(1, 1)?.getItem().itemData.name).toBe('bench');
	expect(newGarden.getPlotByRowAndColumn(2, 2)?.getItem().itemData.name).toBe('banana');
	const plot3 = new Plot(generateNewPlaceholderPlacedItem("bench", "newItem"), Date.now());
	const plot3HarvestResponse = newGarden.harvestPlot(plot3);
	expect(plot3HarvestResponse.isSuccessful()).toBe(false);
})

test('Should Fill Null With Empty Plot', () => {
	const newGarden = new Garden("Dummy User", 10, 10, [[new Plot(generateNewPlaceholderPlacedItem('apple', ''), Date.now())], [], []]);
	
	expect(newGarden.getRows()).toBe(10);
	expect(newGarden.getCols()).toBe(10);
	expect(newGarden.size()).toBe(100);
	const plot = newGarden.getPlotByRowAndColumn(0, 0);
	expect(plot?.getItem().itemData.name).toBe('apple');
	expect(newGarden.getPlotByRowAndColumn(9, 9)?.getItem().itemData.name).toBe('ground');
	
})

test('Should Create Garden Object From PlainObject', () => {
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const serializedGarden = JSON.stringify((new Garden("Test", 10, 10, null, new LevelSystem(10))).toPlainObject());
	const garden = Garden.fromPlainObject(JSON.parse(serializedGarden));
	expect(garden.getUserId()).toBe("Test");
	expect(garden.getRows()).toBe(10);
	expect(garden.getCols()).toBe(10);
	expect(garden.getLevel()).toBe(10);
	expect(garden.size()).toBe(100);
	consoleErrorSpy.mockRestore();
})

test('Should Only Reset Corrupted Plot On Load', () => {
	//Mute console error
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const testGarden = new Garden('test', 10, 10, null, new LevelSystem(100, 0, 2));
	testGarden.setPlotItem(0, 0, generateNewPlaceholderPlacedItem('error', ''));
	const serializedGarden = JSON.stringify(testGarden.toPlainObject());
	const garden = Garden.fromPlainObject(JSON.parse(serializedGarden));
	expect(garden.getPlotByRowAndColumn(0, 0)?.getItem().itemData.name).not.toBe('error');
	expect(garden.getLevel()).toBe(100);
	expect(garden.getRows()).toBe(10);
	expect(garden.getCols()).toBe(10);
	// Restore console.error
	consoleErrorSpy.mockRestore();
})


test('Should Reset All Plots On Invalid Format Load', () => {
	//Mute console error
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const testGarden = new Garden('test', 10, 10, null, new LevelSystem(100, 0, 2));
	testGarden.setPlotItem(0, 0, generateNewPlaceholderPlacedItem('error', ''));
	testGarden.setPlotItem(1, 1, generateNewPlaceholderPlacedItem('apple', ''));
	const serializedGarden = JSON.stringify(testGarden.toPlainObject());
	const corruptedGarden = '{"userId":"test","plots":"asdf","level":{"level":100,"currentExp":0,"growthRate":2}}';
	const garden = Garden.fromPlainObject(JSON.parse(corruptedGarden));
	expect(garden.getPlotByRowAndColumn(0, 0)?.getItem().itemData.name).toBe('ground');
	expect(garden.getPlotByRowAndColumn(1, 1)?.getItem().itemData.name).toBe('ground');
	expect(garden.getLevel()).toBe(100);
	expect(garden.getRows()).toBe(Garden.getStartingRows());
	expect(garden.getCols()).toBe(Garden.getStartingCols());
	// Restore console.error
	consoleErrorSpy.mockRestore();
})