import { Garden } from "@/models/Garden";

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
	expect(newGarden.rows).toBe(10);
	expect(newGarden.cols).toBe(10);
	expect(newGarden.userId).toBe("Dummy User");
	expect(newGarden.plots.length).toBe(10);
	expect(newGarden.plots[0].length).toBe(10);
});

test('Should Initialize Specified Garden Object', () => {
	const newGarden = new Garden("Test User", 15, 15, Garden.generateEmptyPlots(15, 15));
	expect(newGarden).toBeTruthy();
	expect(newGarden.rows).toBe(15);
	expect(newGarden.cols).toBe(15);
	expect(newGarden.userId).toBe("Test User");
	expect(newGarden.plots.length).toBe(15);
	expect(newGarden.plots[0].length).toBe(15);
});

test('Garden Generates Empty Plot', () => {
	const emptyPlot = Garden.generateEmptyPlot(0, 0);
	expect(emptyPlot.item.itemData.name).toBe("ground");
	expect(emptyPlot.item.itemData.subtype).toBe("Ground");
  });