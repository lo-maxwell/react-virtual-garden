import { Garden } from "@/models/Garden";
import { generateNewPlaceholderPlacedItem} from "@/models/items/PlaceholderItems";

test('getEmptyPlots generates new set of plots', () => {
	const plots1 = Garden.generateEmptyPlots(3, 3);
	expect(plots1).toBeTruthy();
	expect(plots1.length).toBe(3);
	expect(plots1[0].length).toBe(3);
	plots1[0][0].item.status = 'changed status';
	expect(plots1[0][0].item.status).toBe('changed status');
	expect(plots1[0][1].item.status).toBe('empty');
	expect(plots1[1][0].item.status).toBe('empty');
	
	const plots2 = Garden.generateEmptyPlots(5, 5);
	expect(plots2).toBeTruthy();
	expect(plots2.length).toBe(5);
	expect(plots2[0].length).toBe(5);
	plots2[1][1].item.status = 'changed status';
	expect(plots2[0][0].item.status).toBe('empty');
	expect(plots2[0][1].item.status).toBe('empty');
	expect(plots2[1][0].item.status).toBe('empty');
	expect(plots2[1][1].item.status).toBe('changed status');

	expect(plots1).not.toEqual(plots2);
	expect(plots1[0][0].item.itemData).toBe(plots2[0][0].item.itemData);
});

test('Should Initialize Default Garden Object', () => {
	const newGarden = new Garden();
	expect(newGarden).toBeTruthy();
	expect(newGarden.getRows()).toBe(10);
	expect(newGarden.getCols()).toBe(10);
	expect(newGarden.getUserId()).toBe("Dummy User");
	expect(newGarden.getPlots().length).toBe(10);
	expect(newGarden.getPlots()[0].length).toBe(10);
	expect(newGarden.getPlots()[0][0].item.itemData.name).toBe("ground");
	expect(newGarden.getPlots()[9][9].item.itemData.name).toBe("ground");
	expect(newGarden.getPlotByRowAndColumn(1,1)!.item.itemData.name).toBe("ground");
	expect(newGarden.size()).toBe(100);
});

test('Should Initialize Specified Garden Object', () => {
	const newGarden = new Garden("Test User", 15, 15, Garden.generateEmptyPlots(15, 15));
	expect(newGarden).toBeTruthy();
	expect(newGarden.getRows()).toBe(15);
	expect(newGarden.getCols()).toBe(15);
	expect(newGarden.getUserId()).toBe("Test User");
	expect(newGarden.getPlots().length).toBe(15);
	expect(newGarden.getPlots()[0].length).toBe(15);
	expect(newGarden.getPlots()[0][0].item.itemData.name).toBe("ground");
	expect(newGarden.getPlots()[14][14].item.itemData.name).toBe("ground");
	expect(newGarden.getPlotByRowAndColumn(1,1)!.item.itemData.name).toBe("ground");
});

test('Garden Generates Empty Plot', () => {
	const emptyPlot = Garden.generateEmptyPlot(0, 0);
	expect(emptyPlot.item.itemData.name).toBe("ground");
	expect(emptyPlot.item.itemData.subtype).toBe("Ground");
  });

test('Should Extend Garden Size', () => {
	const newGarden = new Garden();
	expect(newGarden.getRows()).toBe(10);
	expect(newGarden.getCols()).toBe(10);
	newGarden.addRow();
	newGarden.addRow();
	newGarden.addColumn();
	expect(newGarden.getPlotByRowAndColumn(1,1)!.item.itemData.name).toBe("ground");
	expect(newGarden.getRows()).toBe(12);
	expect(newGarden.getCols()).toBe(11);
	expect(newGarden.getPlots()[0][0].item.itemData.name).toBe("ground");
	expect(newGarden.getPlots()[11][10].item.itemData.name).toBe("ground");
	expect(newGarden.getPlots()[10][11]).toBeFalsy();
})

test('Should Shrink Garden Size', () => {
	const newGarden = new Garden();
	expect(newGarden.getRows()).toBe(10);
	expect(newGarden.getCols()).toBe(10);
	newGarden.setPlotItem(1,1,generateNewPlaceholderPlacedItem("apple", "newItem"));
	newGarden.setGardenSize(5,5);
	expect(newGarden.getPlots()[1][1].item.itemData.name).toBe("apple");
	expect(newGarden.getPlotByRowAndColumn(1,1)!.item.itemData.name).toBe("apple");
	expect(newGarden.getRows()).toBe(5);
	expect(newGarden.getCols()).toBe(5);
	expect(newGarden.getPlots()[0][0].item.itemData.name).toBe("ground");
	expect(newGarden.getPlots()[4][4].item.itemData.name).toBe("ground");
	expect(newGarden.getPlots()[9]).toBeFalsy();
	expect(newGarden.size()).toBe(25);
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